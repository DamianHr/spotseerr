// Background service worker for handling API requests and notifications
// Using classic Chrome extension pattern for Manifest V3 compatibility
// Version: 2025.02.04 - Fixed 404 error with media details pre-fetch

console.log("[Background] ========================================");
console.log("[Background] Service Worker Loaded - Version 2025.02.04");
console.log("[Background] ========================================");

const STORAGE_KEYS = {
  OVERSEERR_URL: "overseerrUrl",
  API_KEY: "apiKey",
  DEFAULT_PROFILE: "defaultProfile",
  NOTIFICATIONS_ENABLED: "notificationsEnabled",
  DEBUG_ENABLED: "debugEnabled"
};

const DEFAULT_SETTINGS = {
  [STORAGE_KEYS.OVERSEERR_URL]: "",
  [STORAGE_KEYS.API_KEY]: "",
  [STORAGE_KEYS.DEFAULT_PROFILE]: "1",
  [STORAGE_KEYS.NOTIFICATIONS_ENABLED]: true,
  [STORAGE_KEYS.DEBUG_ENABLED]: false
};

async function getStorage(key) {
  try {
    const result = await chrome.storage.sync.get(key);
    if (!result || typeof result !== "object") {
      return DEFAULT_SETTINGS[key];
    }
    return result[key] !== undefined ? result[key] : DEFAULT_SETTINGS[key];
  } catch (error) {
    console.error("Storage get error:", error);
    return DEFAULT_SETTINGS[key];
  }
}

async function getOverseerrUrl() {
  let url = await getStorage(STORAGE_KEYS.OVERSEERR_URL);
  url = url.trim();
  if (url?.endsWith("/")) {
    url = url.slice(0, -1);
  }
  return url;
}

async function getApiKey() {
  return await getStorage(STORAGE_KEYS.API_KEY);
}

// API helper function
async function apiRequest(endpoint, options = {}, timeoutMs = 10000) {
  const url = await getOverseerrUrl();
  const apiKey = await getApiKey();

  if (!url) {
    throw new Error("Overseerr URL not configured. Please check extension settings.");
  }

  if (!apiKey) {
    throw new Error("API key not configured. Please check extension settings.");
  }

  const fullUrl = `${url}/api/v1${endpoint}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const defaultOptions = {
    headers: {
      "X-Api-Key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    signal: controller.signal,
  };

  const fetchOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
    signal: controller.signal,
  };

  try {
    const response = await fetch(fullUrl, fetchOptions);
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error("[Background] Error response body:", errorText);
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    if (response.status === 204) {
      return null;
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === "AbortError") {
      throw new Error(
        `Connection timed out after ${timeoutMs / 1000} seconds. Please check your URL and network connection.`,
      );
    }

    if (error.message.includes("Failed to fetch")) {
      throw new Error("Cannot connect to Overseerr. Please check your URL and network connection.");
    }

    throw error;
  }
}

// API functions
async function searchMedia(query, page = 1) {
  const encodedQuery = encodeURIComponent(query);
  return await apiRequest(`/search?query=${encodedQuery}&page=${page}`);
}

async function getMediaDetails(mediaType, mediaId) {
  if (mediaType === "movie") {
    return await apiRequest(`/movie/${mediaId}`);
  } else if (mediaType === "tv") {
    return await apiRequest(`/tv/${mediaId}`);
  } else {
    throw new Error(`Unsupported media type: ${mediaType}`);
  }
}

async function createRequest(requestData) {
  // Validate required fields
  if (!requestData.mediaType || !requestData.mediaId) {
    console.error("[Background] Missing required fields:", requestData);
    return {
      success: false,
      error: "Missing required fields: mediaType and mediaId are required",
    };
  }

  try {
    // First, get media details to ensure it's added to Overseerr's database
    try {
      await getMediaDetails(requestData.mediaType, requestData.mediaId);
    } catch (mediaError) {
      // Continue anyway - maybe it's already in the DB
    }

    // Then create the request
    const response = await apiRequest("/request", {
      method: "POST",
      body: JSON.stringify(requestData),
    });
    console.log("[Background] Request created successfully");
    return {success: true, data: response};
  } catch (error) {
    console.error("[Background] Request creation failed:", error.message);
    return {success: false, error: error.message};
  }
}

async function testConnection() {
  try {
    const status = await apiRequest("/status", {}, 5000);
    console.log("[Background] Connection successful:", status.version);
    return {
      success: true,
      version: status.version,
      message: `Connected to Overseerr v${status.version}`,
    };
  } catch (error) {
    console.error("[Background] Connection test failed:", error.message);
    return {
      success: false,
      message: error.message,
    };
  }
}

// Utility functions
function cleanTitle(title) {
  if (!title || typeof title !== "string") {
    return "";
  }

  const trailerKeywords = [
    "official trailer",
    "teaser trailer",
    "trailer",
    "teaser",
    "clip",
    "featurette",
    "behind the scenes",
    "bloopers",
    "exclusive",
    "first look",
    "final trailer",
    "red band trailer",
    "green band trailer",
    "international trailer",
    "extended trailer",
    "movie clip",
    "scene",
    "tv spot",
    "super bowl spot",
    "official",
    "hd",
    "4k",
    "ultra hd",
  ];

  const yearPattern = /\(\d{4}\)|\[\d{4}\]|\b\d{4}\b/g;
  const channelPattern = /[|\-–]\s*[^|\-–]+$/;
  const resolutionPattern = /\b\d{3,4}p\b|\b4k\b|\bhd\b|\buhd\b/gi;

  let cleaned = title.toLowerCase();

  trailerKeywords.forEach((keyword) => {
    const regex = new RegExp(`\\b${keyword}\\b`, "gi");
    cleaned = cleaned.replace(regex, "");
  });

  cleaned = cleaned
    .replace(yearPattern, "")
    .replace(channelPattern, "")
    .replace(resolutionPattern, "")
    .replace(/[()[\]{}]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned;
}

function detectMediaType(title, description = "") {
  const text = (title + " " + description).toLowerCase();
  const tvKeywords = [
    "season",
    "episode",
    "series",
    "s\d+",
    "e\d+",
    "s\d+e\d+",
    "tv series",
    "miniseries",
    "tv show",
    "television",
  ];

  for (const keyword of tvKeywords) {
    const regex = new RegExp(`\\b${keyword}\\b`, "i");
    if (regex.test(text)) {
      return "tv";
    }
  }

  return "movie";
}

// Show browser notification
function showNotification(title, message, type = "info") {
  getStorage(STORAGE_KEYS.NOTIFICATIONS_ENABLED).then((enabled) => {
    if (!enabled) return;

    const icons = {
      success: "icons/icon48.png",
      error: "icons/icon48.png",
      info: "icons/icon48.png",
    };

    chrome.notifications.create({
      type: "basic",
      iconUrl: icons[type] || icons.info,
      title: title,
      message: message,
      priority: type === "error" ? 2 : 1,
    });
  });
}

// Message handler
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const handleAsync = async () => {
    try {
      switch (request.action) {
      case "getVideoInfo": {
        return {success: true, data: request.data};
      }
      case "searchMedia": {
        const searchResults = await searchMedia(request.query);
        return {success: true, data: searchResults};
      }
      case "createRequest": {
        const requestResult = await createRequest(request.requestData);
        return {success: true, data: requestResult};
      }
      case "testConnection": {
        return testConnection();
      }
      case "checkAvailability": {
        return {success: false, error: "Not implemented"};
      }
      case "showNotification": {
        showNotification(request.title, request.message, request.type);
        return {success: true};
      }
      case "cleanTitle": {
        const cleaned = cleanTitle(request.title);
        const mediaType = detectMediaType(request.title, request.description);
        return {success: true, data: {cleaned, mediaType}};
      }
      default:
        return {success: false, error: "Unknown action: " + request.action};
      }
    } catch (error) {
      console.error("Background script error:", error);
      return {success: false, error: error.message};
    }
  };

  handleAsync()
    .then((response) => {
      sendResponse(response);
    })
    .catch((error) => {
      console.error("[Background] Unhandled error in message handler:", error.message);
      sendResponse({success: false, error: error.message});
    });

  return true;
});

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    chrome.runtime.openOptionsPage();

    chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/icon48.png",
      title: "Overseerr YouTube Extension Installed",
      message: "Please configure your Overseerr settings to get started.",
      priority: 2,
    });
  }
});
