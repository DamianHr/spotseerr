// Popup script for handling UI interactions with auto-search and debug logging

import { getAllSettings, STORAGE_KEYS } from "../shared/storage.js";
import { truncateText } from "../shared/utils.js";

// DOM Elements
const elements = {
  configWarning: document.getElementById("configWarning"),
  notYoutubeState: document.getElementById("notYoutubeState"),
  videoSection: document.getElementById("videoSection"),
  resultsSection: document.getElementById("resultsSection"),
  noResultsState: document.getElementById("noResultsState"),
  errorState: document.getElementById("errorState"),
  videoTitle: document.getElementById("videoTitle"),
  mediaType: document.getElementById("mediaType"),
  searchStatus: document.getElementById("searchStatus"),
  searchTitleInput: document.getElementById("searchTitleInput"),
  searchBtn: document.getElementById("searchBtn"),
  refreshVideoBtn: document.getElementById("refreshVideoBtn"),
  resultsList: document.getElementById("resultsList"),
  errorMessage: document.getElementById("errorMessage"),
  settingsBtn: document.getElementById("settingsBtn"),
  openSettingsBtn: document.getElementById("openSettingsBtn"),
  retryBtn: document.getElementById("retryBtn"),
  logSection: document.getElementById("logSection"),
  logContainer: document.getElementById("logContainer"),
  clearLogsBtn: document.getElementById("clearLogsBtn"),
  resultTemplate: document.getElementById("resultTemplate"),
};

// Verify all elements exist
function verifyElements() {
  const missing = [];
  for (const [key, value] of Object.entries(elements)) {
    if (!value) {
      missing.push(key);
      console.error(`Missing element: ${key}`);
    }
  }
  if (missing.length > 0) {
    console.error("Missing DOM elements:", missing);
  }
  return missing.length === 0;
}

// Initialize popup
document.addEventListener("DOMContentLoaded", async () => {
  if (!verifyElements()) {
    console.error(
      "Some DOM elements are missing. Please check the HTML structure.",
    );
  }
  addLog("Popup opened", "info");
  setupEventListeners();
  await initialize();
});

function setupEventListeners() {
  elements.settingsBtn.addEventListener("click", openSettings);
  elements.openSettingsBtn.addEventListener("click", openSettings);
  elements.retryBtn.addEventListener("click", initialize);
  elements.clearLogsBtn.addEventListener("click", clearLogs);

  // Manual search button
  if (elements.searchBtn) {
    elements.searchBtn.addEventListener("click", handleManualSearch);
  }

  // Allow re-search when user edits the title and presses Enter
  if (elements.searchTitleInput) {
    elements.searchTitleInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        handleManualSearch();
      }
    });
  }

  // Refresh video detection button
  if (elements.refreshVideoBtn) {
    elements.refreshVideoBtn.addEventListener("click", refreshVideoDetection);
  }
}

// Logging function
function addLog(message, type = "info") {
  const timestamp = new Date().toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    fractionalSecondDigits: 3,
  });

  const logEntry = document.createElement("div");
  logEntry.className = "log-entry";

  const typeClass = {
    info: "log-info",
    success: "log-success",
    error: "log-error",
    warn: "log-warn",
  }[type] || "log-info";

  logEntry.innerHTML = `
    <span class="log-time">[${timestamp}]</span>
    <span class="${typeClass}">${escapeHtml(message)}</span>
  `;

  elements.logContainer.appendChild(logEntry);
  elements.logContainer.scrollTop = elements.logContainer.scrollHeight;

  console.log(`[${type.toUpperCase()}] ${message}`);
}

function clearLogs() {
  elements.logContainer.innerHTML = "";
  addLog("Logs cleared", "info");
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

async function initialize() {
  hideAllStates();

  try {
    // Check if settings are configured
    const settings = await getAllSettings();

    if (!settings) {
      addLog("Failed to load settings", "error");
      showConfigWarning();
      return;
    }

    // Check debug setting and show/hide log section
    const debugEnabled = settings[STORAGE_KEYS.DEBUG_ENABLED] === true;
    if (elements.logSection) {
      if (debugEnabled) {
        elements.logSection.classList.remove("hidden");
      } else {
        elements.logSection.classList.add("hidden");
      }
    }

    const hasUrl = settings[STORAGE_KEYS.OVERSEERR_URL];
    const hasApiKey = settings[STORAGE_KEYS.API_KEY];

    if (!hasUrl || !hasApiKey) {
      addLog("Missing configuration - showing config warning", "warn");
      showConfigWarning();
      return;
    }

    // Get current tab info
    const videoInfo = await getCurrentVideoInfo();

    if (!videoInfo || !videoInfo.title) {
      addLog("No YouTube video detected", "warn");
      showNotYoutube();
      return;
    }

    addLog(`Video detected: "${videoInfo.title}"`, "success");

    showVideoInfo(videoInfo);

    // Auto-trigger search
    await handleManualSearch();
  } catch (error) {
    addLog(`Initialization error: ${error.message}`, "error");
    console.error("Initialization error:", error);
    showError(error.message);
  }
}

async function handleManualSearch() {
  const searchTitle = elements.searchTitleInput ? elements.searchTitleInput.value.trim() : "";

  if (!searchTitle) {
    addLog("Please enter a title to search", "error");
    return;
  }

  // Update button state
  if (elements.searchBtn) {
    elements.searchBtn.disabled = true;
    elements.searchBtn.innerHTML = `
      <div class="spinner" style="width: 14px; height: 14px; border-width: 2px; display: inline-block; margin-right: 6px;"></div>
      Searching...
    `;
  }

  // Update status
  if (elements.searchStatus) {
    elements.searchStatus.textContent = "Searching...";
    elements.searchStatus.className = "search-status searching";
  }

  // Clear previous results
  if (elements.resultsSection) elements.resultsSection.classList.add("hidden");
  if (elements.noResultsState) elements.noResultsState.classList.add("hidden");
  if (elements.resultsList) elements.resultsList.innerHTML = "";

  try {
    await searchOverseerr(searchTitle);

    // Update status to complete
    if (elements.searchStatus) {
      elements.searchStatus.textContent = "Search complete";
      elements.searchStatus.className = "search-status complete";
    }
  } catch (error) {
    addLog(`Search failed: ${error.message}`, "error");

    // Update status to error
    if (elements.searchStatus) {
      elements.searchStatus.textContent = "Search failed";
      elements.searchStatus.className = "search-status error";
    }
  } finally {
    // Restore button
    if (elements.searchBtn) {
      elements.searchBtn.disabled = false;
      elements.searchBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 6px;">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
        </svg>
        Search on Overseerr
      `;
    }
  }
}

async function refreshVideoDetection() {
  // Update button state
  if (elements.refreshVideoBtn) {
    elements.refreshVideoBtn.disabled = true;
    elements.refreshVideoBtn.innerHTML = `
      <div class="spinner" style="width: 12px; height: 12px; border-width: 2px; display: inline-block; margin-right: 6px;"></div>
      Detecting...
    `;
  }

  try {
    // Clear previous results
    if (elements.resultsSection) {
      elements.resultsSection.classList.add("hidden");
    }
    if (elements.noResultsState) {
      elements.noResultsState.classList.add("hidden");
    }
    if (elements.resultsList) elements.resultsList.innerHTML = "";
    if (elements.searchStatus) {
      elements.searchStatus.textContent = "";
      elements.searchStatus.className = "search-status";
    }

    // Get fresh video info from content script
    const videoInfo = await getCurrentVideoInfo();

    if (!videoInfo || !videoInfo.title) {
      addLog("No YouTube video detected on current page", "warn");
      return;
    }

    addLog(`Video re-detected: "${videoInfo.title}"`, "success");

    // Update UI with new video info
    if (elements.videoTitle) {
      elements.videoTitle.textContent = truncateText(videoInfo.title, 80);
    }
    if (elements.mediaType) {
      elements.mediaType.textContent = videoInfo.mediaType === "tv" ? "TV Show" : "Movie";
    }
    if (elements.searchTitleInput) {
      elements.searchTitleInput.value = videoInfo.cleanedTitle;
    }
  } catch (error) {
    addLog(`Error refreshing video: ${error.message}`, "error");
    console.error("Error refreshing video detection:", error);
  } finally {
    // Restore button
    if (elements.refreshVideoBtn) {
      elements.refreshVideoBtn.disabled = false;
      elements.refreshVideoBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 6px;">
          <path d="M23 4v6h-6"></path>
          <path d="M1 20v-6h6"></path>
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
        </svg>
      `;
    }
  }
}

function showConfigWarning() {
  hideAllStates();
  if (elements.configWarning) elements.configWarning.classList.remove("hidden");
}

function showNotYoutube() {
  hideAllStates();
  if (elements.notYoutubeState) {
    elements.notYoutubeState.classList.remove("hidden");
  }
}

function showVideoInfo(videoInfo) {
  if (elements.videoTitle) {
    elements.videoTitle.textContent = truncateText(videoInfo.title, 80);
  }
  if (elements.mediaType) {
    elements.mediaType.textContent = videoInfo.mediaType === "tv" ? "TV Show" : "Movie";
  }
  if (elements.searchTitleInput) {
    elements.searchTitleInput.value = videoInfo.cleanedTitle;
  }
  if (elements.videoSection) elements.videoSection.classList.remove("hidden");
}

async function showResults(results) {
  // Sort results by year (newest to oldest)
  const sortedResults = results.sort((a, b) => {
    const yearA = a.releaseDate || a.firstAirDate
      ? new Date(a.releaseDate || a.firstAirDate).getFullYear()
      : 0;
    const yearB = b.releaseDate || b.firstAirDate
      ? new Date(b.releaseDate || b.firstAirDate).getFullYear()
      : 0;
    return yearB - yearA; // Newest first
  });

  if (elements.resultsList) elements.resultsList.innerHTML = "";

  if (sortedResults.length === 0) {
    addLog("No results found on Overseerr", "warn");
    if (elements.resultsSection) {
      elements.resultsSection.classList.add("hidden");
    }
    if (elements.noResultsState) {
      elements.noResultsState.classList.remove("hidden");
    }
    return;
  }

  addLog(`Found ${sortedResults.length} results, checking status...`, "info");

  // Fetch detailed information for each result to get correct request status
  const resultsWithDetails = await Promise.all(
    sortedResults.map(async (result) => {
      try {
        const response = await chrome.runtime.sendMessage({
          action: "getMediaDetails",
          mediaType: result.mediaType,
          mediaId: result.id,
        });

        if (response && response.success && response.data) {
          // Merge the detailed info with the search result
          return {
            ...result,
            mediaInfo: response.data.mediaInfo || result.mediaInfo,
          };
        }
        return result;
      } catch (error) {
        console.warn(`Failed to get details for ${result.title || result.name}:`, error);
        return result;
      }
    }),
  );

  resultsWithDetails.forEach((result) => {
    const resultElement = createResultElement(result);
    if (resultElement && elements.resultsList) {
      elements.resultsList.appendChild(resultElement);
    }
  });

  if (elements.resultsSection) {
    elements.resultsSection.classList.remove("hidden");
  }
  if (elements.noResultsState) elements.noResultsState.classList.add("hidden");
}

function createResultElement(result) {
  if (!elements.resultTemplate) {
    console.error("Result template not found");
    return null;
  }

  const clone = elements.resultTemplate.content.cloneNode(true);
  const item = clone.querySelector(".result-item");
  const poster = clone.querySelector(".result-poster");
  const title = clone.querySelector(".result-title");
  const year = clone.querySelector(".result-year");
  const status = clone.querySelector(".result-status");
  const requestBtn = clone.querySelector(".btn-request");

  if (!item) {
    console.error("Could not find result-item in template");
    return null;
  }

  item.dataset.id = result.id;
  item.dataset.type = result.mediaType;

  if (poster) {
    const posterUrl = result.posterPath
      ? `https://image.tmdb.org/t/p/w92${result.posterPath}`
      : "../icons/icon48.png";
    poster.src = posterUrl;
    poster.onerror = () => {
      poster.src = "../icons/icon48.png";
    };
  }

  if (title) title.textContent = result.title || result.name;
  if (year) {
    year.textContent = result.releaseDate || result.firstAirDate
      ? new Date(result.releaseDate || result.firstAirDate).getFullYear()
      : "N/A";
  }

  if (status && requestBtn) {
    updateResultStatus(result, status, requestBtn);
  }

  if (requestBtn) {
    requestBtn.addEventListener("click", () => handleRequest(result, requestBtn));
  }

  return item;
}

function updateResultStatus(result, statusElement, buttonElement) {
  if (!statusElement || !buttonElement) {
    console.error("updateResultStatus: Missing status or button element");
    return;
  }

  const mediaInfo = result.mediaInfo;

  if (mediaInfo) {
    const status = mediaInfo.status;
    const hasRequests = mediaInfo.requests && mediaInfo.requests.length > 0;

    if (status >= 4) {
      statusElement.textContent = "Available";
      statusElement.classList.add("available");
      buttonElement.textContent = "Available";
      buttonElement.classList.add("available");
      buttonElement.disabled = true;
    } else if (hasRequests) {
      statusElement.textContent = "Requested";
      statusElement.classList.add("requested");
      buttonElement.textContent = "Requested";
      buttonElement.classList.add("requested");
      buttonElement.disabled = true;
    } else {
      statusElement.textContent = "Not Requested";
      buttonElement.textContent = "Request";
    }
  } else {
    statusElement.textContent = "Not Requested";
    buttonElement.textContent = "Request";
  }
}

async function handleRequest(result, button) {
  if (!button) {
    addLog("Error: Button element is null", "error");
    return;
  }

  const btnText = button.querySelector(".btn-text");
  const btnLoader = button.querySelector(".btn-loader");

  if (btnText) btnText.classList.add("hidden");
  if (btnLoader) btnLoader.classList.remove("hidden");
  button.disabled = true;

  const title = result.title || result.name;

  try {
    // Build request data
    const requestData = {
      mediaType: result.mediaType,
      mediaId: result.id,
    };

    if (result.mediaType === "tv" && result.externalIds?.tvdbId) {
      requestData.tvdbId = result.externalIds.tvdbId;
    }

    const response = await chrome.runtime.sendMessage({
      action: "createRequest",
      requestData,
    });

    if (response.success) {
      button.textContent = "Requested";
      button.classList.add("success");
      button.disabled = true;

      // Update the status element to show "Requested"
      const resultItem = button.closest(".result-item");
      if (resultItem) {
        const statusElement = resultItem.querySelector(".result-status");
        if (statusElement) {
          statusElement.textContent = "Requested";
          statusElement.classList.remove("available");
          statusElement.classList.add("requested");
        }
      }

      addLog(`Request created successfully: "${title}"`, "success");

      await chrome.runtime.sendMessage({
        action: "showNotification",
        title: "Request Successful",
        message: `"${title}" has been requested on Overseerr`,
        type: "success",
      });
    } else {
      throw new Error(response.error || "Failed to create request");
    }
  } catch (error) {
    addLog(`Request failed: ${error.message}`, "error");
    button.disabled = false;
    const btnText = button.querySelector(".btn-text");
    const btnLoader = button.querySelector(".btn-loader");
    if (btnText) {
      btnText.classList.remove("hidden");
      btnText.textContent = "Retry";
    }
    if (btnLoader) btnLoader.classList.add("hidden");

    await chrome.runtime.sendMessage({
      action: "showNotification",
      title: "Request Failed",
      message: error.message,
      type: "error",
    });
  } finally {
    const btnLoader = button.querySelector(".btn-loader");
    if (btnLoader) btnLoader.classList.add("hidden");
  }
}

async function getCurrentVideoInfo() {
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 500;

  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tab.url || !tab.url.includes("youtube.com/watch")) {
      addLog("Not on YouTube watch page", "warn");
      return null;
    }

    // Try to get video info with retries
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await chrome.tabs.sendMessage(tab.id, {
          action: "getCurrentVideo",
        });

        if (response && response.success) {
          addLog("Content script responded successfully", "success");
          return response.data;
        } else {
          addLog(
            `Content script error: ${response?.error || "No response"}`,
            "error",
          );
        }
      } catch (error) {
        // If it's the last retry and the error is "Receiving end does not exist", try to inject the script
        if (
          attempt === MAX_RETRIES &&
          error.message.includes("Receiving end does not exist")
        ) {
          try {
            await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              files: ["content.js"],
            });

            // Wait a bit for the script to initialize
            await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));

            const response = await chrome.tabs.sendMessage(tab.id, {
              action: "getCurrentVideo",
            });

            if (response && response.success) {
              addLog("Content script responded after injection", "success");
              return response.data;
            }
          } catch (injectionError) {
            addLog(
              `Failed to inject content script: ${injectionError.message}`,
              "error",
            );
          }
        }

        // Wait before next retry
        if (attempt < MAX_RETRIES) {
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
        }
      }
    }

    return null;
  } catch (error) {
    addLog(`Error getting video info: ${error.message}`, "error");
    return null;
  }
}

async function searchOverseerr(query) {
  try {
    const response = await chrome.runtime.sendMessage({
      action: "searchMedia",
      query: query,
    });

    if (response && response.success) {
      const results = response.data.results || [];
      const mediaResults = results.filter(
        (r) => r.mediaType === "movie" || r.mediaType === "tv",
      );
      await showResults(mediaResults.slice(0, 5));
    } else {
      const errorMsg = response?.error || "Search failed - no response from background script";
      addLog(`Search error: ${errorMsg}`, "error");
      throw new Error(errorMsg);
    }
  } catch (error) {
    addLog(`Search failed: ${error.message}`, "error");
    throw error;
  }
}

function showError(message) {
  hideAllStates();
  if (elements.errorMessage) elements.errorMessage.textContent = message;
  if (elements.errorState) elements.errorState.classList.remove("hidden");
}

function hideAllStates() {
  if (elements.configWarning) elements.configWarning.classList.add("hidden");
  if (elements.notYoutubeState) {
    elements.notYoutubeState.classList.add("hidden");
  }
  if (elements.videoSection) elements.videoSection.classList.add("hidden");
  if (elements.resultsSection) elements.resultsSection.classList.add("hidden");
  if (elements.noResultsState) elements.noResultsState.classList.add("hidden");
  if (elements.errorState) elements.errorState.classList.add("hidden");
}

function openSettings() {
  chrome.runtime.openOptionsPage();
}
