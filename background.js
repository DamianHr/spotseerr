// Background service worker for handling API requests and notifications
// Version: 2025.02.04 - Fixed 404 error with media details pre-fetch

import { getStorage, STORAGE_KEYS } from "./shared/storage.js";
import { cleanTitle, detectMediaType } from "./shared/parser.js";

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
    return {
      success: false,
      error: "Missing required fields: mediaType and mediaId are required",
    };
  }

  try {
    // First, get media details to ensure it's added to Overseerr's database
    try {
      await getMediaDetails(requestData.mediaType, requestData.mediaId);
    } catch {
      // Continue anyway - maybe it's already in the DB
    }

    // Then create the request
    const response = await apiRequest("/request", {
      method: "POST",
      body: JSON.stringify(requestData),
    });
    return { success: true, data: response };
  } catch (error) {
    return { success: false, error: error.message };
  }
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
if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    const handleAsync = async () => {
      try {
        switch (request.action) {
          case "getVideoInfo": {
            return { success: true, data: request.data };
          }
          case "searchMedia": {
            const searchResults = await searchMedia(request.query);
            return { success: true, data: searchResults };
          }
          case "getMediaDetails": {
            const details = await getMediaDetails(request.mediaType, request.mediaId);
            return { success: true, data: details };
          }
          case "createRequest": {
            const requestResult = await createRequest(request.requestData);
            return { success: true, data: requestResult };
          }
          case "checkAvailability": {
            return { success: false, error: "Not implemented" };
          }
          case "showNotification": {
            showNotification(request.title, request.message, request.type);
            return { success: true };
          }
          case "cleanTitle": {
            const cleaned = cleanTitle(request.title);
            const mediaType = detectMediaType(request.title, request.description);
            return { success: true, data: { cleaned, mediaType } };
          }
          default:
            return { success: false, error: "Unknown action: " + request.action };
        }
      } catch (error) {
        return { success: false, error: error.message };
      }
    };

    handleAsync()
      .then((response) => {
        sendResponse(response);
      })
      .catch((error) => {
        sendResponse({ success: false, error: error.message });
      });

    return true;
  });

  // Handle extension installation
  if (chrome.runtime?.onInstalled) {
    chrome.runtime.onInstalled.addListener((details) => {
      if (details.reason === "install") {
        chrome.runtime.openOptionsPage();

        chrome.notifications.create({
          type: "basic",
          iconUrl: "icons/icon48.png",
          title: chrome.i18n.getMessage("notificationInstallTitle"),
          message: chrome.i18n.getMessage("notificationInstallMessage"),
          priority: 2,
        });
      }
    });
  }
}
