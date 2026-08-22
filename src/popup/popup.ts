// Popup script for handling UI interactions with auto-search and debug logging

import {
  getAllSettings,
  RESULT_COUNT_DEFAULT,
  RESULT_COUNT_MAX,
  RESULT_COUNT_MIN,
  STORAGE_KEYS,
} from "../shared/storage";
import { getSiteByDomain, isMediaPage } from "../shared/siteConfig";
import { truncateText } from "../shared/utils";
import { initI18n } from "../shared/localize";

// DOM Elements
const elements = {
  configWarning: document.getElementById("configWarning"),
  notYoutubeState: document.getElementById("notYoutubeState"),
  videoSection: document.getElementById("videoSection"),
  resultsSection: document.getElementById("resultsSection"),
  noResultsState: document.getElementById("noResultsState"),
  errorState: document.getElementById("errorState"),
  videoTitle: document.getElementById("videoTitle"),
  mediaType: document.getElementById("mediaType") as HTMLButtonElement | null,
  searchTitleInput: document.getElementById("searchTitleInput") as HTMLInputElement | null,
  searchBtn: document.getElementById("searchBtn") as HTMLButtonElement | null,
  refreshVideoBtn: document.getElementById("refreshVideoBtn") as HTMLButtonElement | null,
  resultsList: document.getElementById("resultsList"),
  errorMessage: document.getElementById("errorMessage"),
  settingsBtn: document.getElementById("settingsBtn"),
  openSettingsBtn: document.getElementById("openSettingsBtn"),
  retryBtn: document.getElementById("retryBtn"),
  logSection: document.getElementById("logSection"),
  logContainer: document.getElementById("logContainer"),
  clearLogsBtn: document.getElementById("clearLogsBtn"),
  resultTemplate: document.getElementById("resultTemplate") as HTMLTemplateElement | null,
};

interface MediaInfo {
  title: string;
  cleanedTitle: string;
  mediaType: string;
  url?: string;
  site?: string;
}

// Current media-type override for the active video (resets on popup reopen / re-detection)
let currentMediaType: "movie" | "tv" = "movie";

// Max rows shown in the results list; loaded from settings in initialize().
let resultCount: number = RESULT_COUNT_DEFAULT;

function clampResultCount(value: unknown): number {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return RESULT_COUNT_DEFAULT;
  return Math.min(RESULT_COUNT_MAX, Math.max(RESULT_COUNT_MIN, n));
}

// Sync the toggle button + override state to a given media type
function setMediaTypeToggle(type: string): void {
  currentMediaType = type === "tv" ? "tv" : "movie";
  if (elements.mediaType) {
    elements.mediaType.textContent = currentMediaType === "tv"
      ? chrome.i18n.getMessage("mediaTypeTv")
      : chrome.i18n.getMessage("mediaTypeMovie");
    elements.mediaType.dataset.type = currentMediaType;
    syncSearchInputPadding();
  }
}

// Reserve left padding on the search input equal to the badge width so text never overlaps it
function syncSearchInputPadding(): void {
  if (!elements.mediaType || !elements.searchTitleInput) return;
  const badgeWidth = elements.mediaType.offsetWidth;
  // Badge may be measured while its section is still hidden (offsetWidth === 0);
  // retry next frame so we apply the correct padding once it's laid out.
  if (badgeWidth === 0) {
    requestAnimationFrame(syncSearchInputPadding);
    return;
  }
  // badge left offset (8px) + measured badge width + gap (8px)
  elements.searchTitleInput.style.paddingLeft = `${8 + badgeWidth + 8}px`;
}

function verifyElements(): boolean {
  const missing: string[] = [];
  for (const [key, value] of Object.entries(elements)) {
    if (!value) {
      missing.push(key);
    }
  }
  return missing.length === 0;
}

document.addEventListener("DOMContentLoaded", async () => {
  initI18n();

  verifyElements();
  addLog(chrome.i18n.getMessage("logPopupOpened"), "info");
  setupEventListeners();
  setupResizeAnimation();
  await initialize();
});

// Animate the popup's height when content (visible sections) changes.
// Chrome sizes the popup to the body; we drive body height from the container's
// natural height so the CSS `transition: height` produces a smooth grow/shrink.
function setupResizeAnimation(): void {
  const container = document.querySelector<HTMLElement>(".container");
  if (!container || typeof ResizeObserver === "undefined") return;

  const applyHeight = () => {
    document.body.style.height = `${container.offsetHeight}px`;
  };

  // Set the initial height without animating (avoids a grow-from-0 flash on open).
  document.body.style.transition = "none";
  applyHeight();
  requestAnimationFrame(() => {
    document.body.style.transition = "";
  });

  new ResizeObserver(applyHeight).observe(container);
}

function setupEventListeners(): void {
  elements.settingsBtn?.addEventListener("click", openSettings);
  elements.openSettingsBtn?.addEventListener("click", openSettings);
  elements.retryBtn?.addEventListener("click", initialize);
  elements.clearLogsBtn?.addEventListener("click", clearLogs);

  elements.searchBtn?.addEventListener("click", handleManualSearch);

  elements.mediaType?.addEventListener("click", async () => {
    if (elements.mediaType?.disabled) return;
    setMediaTypeToggle(currentMediaType === "tv" ? "movie" : "tv");
    if (elements.mediaType) elements.mediaType.disabled = true;
    try {
      await handleManualSearch();
    } finally {
      if (elements.mediaType) elements.mediaType.disabled = false;
    }
  });

  elements.searchTitleInput?.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      handleManualSearch();
    }
  });

  elements.refreshVideoBtn?.addEventListener("click", refreshMediaDetection);
}

function addLog(message: string, type: "info" | "success" | "error" | "warn" = "info"): void {
  const timestamp = new Date().toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    fractionalSecondDigits: 3,
  });

  const logEntry = document.createElement("div");
  logEntry.className = "log-entry";

  const typeClass: Record<string, string> = {
    info: "log-info",
    success: "log-success",
    error: "log-error",
    warn: "log-warn",
  };

  logEntry.innerHTML = `
    <span class="log-time">[${timestamp}]</span>
    <span class="${typeClass[type] || "log-info"}">${escapeHtml(message)}</span>
  `;

  elements.logContainer?.appendChild(logEntry);
  elements.logContainer!.scrollTop = elements.logContainer!.scrollHeight;
}

function clearLogs(): void {
  elements.logContainer!.innerHTML = "";
  addLog(chrome.i18n.getMessage("logsCleared"), "info");
}

function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

async function initialize(): Promise<void> {
  hideAllStates();

  try {
    const settings = await getAllSettings();

    if (!settings) {
      addLog(chrome.i18n.getMessage("logSettingsFailed"), "error");
      showConfigWarning();
      return;
    }

    const debugEnabled = settings[STORAGE_KEYS.DEBUG_ENABLED] === true;
    resultCount = clampResultCount(settings[STORAGE_KEYS.RESULT_COUNT]);
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
      addLog(chrome.i18n.getMessage("logMissingConfig"), "warn");
      showConfigWarning();
      return;
    }

    const mediaInfo = await getCurrentMediaInfo();

    if (!mediaInfo || !mediaInfo.title) {
      // No media detected (unsupported domain OR supported homepage): still
      // let the user search manually instead of dead-ending.
      addLog(chrome.i18n.getMessage("logNoMedia"), "info");
      showManualSearchOnly();
      return;
    }

    addLog(chrome.i18n.getMessage("logMediaDetected", [mediaInfo.title]), "success");

    showMediaInfo(mediaInfo);

    await handleManualSearch();
  } catch (error) {
    addLog(chrome.i18n.getMessage("logInitializationError", [(error as Error).message]), "error");
    showError((error as Error).message);
  }
}

async function handleManualSearch(): Promise<void> {
  const searchTitle = elements.searchTitleInput?.value.trim() || "";

  if (!searchTitle) {
    addLog(chrome.i18n.getMessage("logEnterTitle"), "error");
    return;
  }

  if (elements.searchBtn) {
    elements.searchBtn.disabled = true;
    elements.searchBtn.innerHTML = `
      <div class="spinner" style="width: 14px; height: 14px; border-width: 2px; display: inline-block; margin-right: 6px;"></div>
      ${chrome.i18n.getMessage("statusParsing")}
    `;
  }

  if (elements.resultsSection) elements.resultsSection.classList.add("hidden");
  if (elements.noResultsState) elements.noResultsState.classList.add("hidden");
  if (elements.resultsList) elements.resultsList.innerHTML = "";

  try {
    await searchOverseerr(searchTitle);
  } catch (error) {
    addLog(chrome.i18n.getMessage("logSearchFailed", [(error as Error).message]), "error");
  } finally {
    if (elements.searchBtn) {
      elements.searchBtn.disabled = false;
      elements.searchBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 6px;">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
        </svg>
        ${chrome.i18n.getMessage("searchButton")}
      `;
    }
  }
}

async function refreshMediaDetection(): Promise<void> {
  if (elements.refreshVideoBtn) {
    elements.refreshVideoBtn.disabled = true;
    elements.refreshVideoBtn.innerHTML = `
      <div class="spinner" style="width: 12px; height: 12px; border-width: 2px; display: inline-block; margin-right: 6px;"></div>
      ${chrome.i18n.getMessage("statusDetecting")}
    `;
  }

  try {
    if (elements.resultsSection) elements.resultsSection.classList.add("hidden");
    if (elements.noResultsState) elements.noResultsState.classList.add("hidden");
    if (elements.resultsList) elements.resultsList.innerHTML = "";

    const mediaInfo = await getCurrentMediaInfo();

    if (!mediaInfo || !mediaInfo.title) {
      addLog(chrome.i18n.getMessage("logNoMediaOnPage"), "warn");
      return;
    }

    addLog(chrome.i18n.getMessage("logMediaRedetected", [mediaInfo.title]), "success");

    if (elements.videoTitle) {
      elements.videoTitle.textContent = truncateText(mediaInfo.title, 80);
    }
    if (elements.mediaType) {
      setMediaTypeToggle(mediaInfo.mediaType);
    }
    if (elements.searchTitleInput) {
      elements.searchTitleInput.value = mediaInfo.cleanedTitle;
    }
  } catch (error) {
    addLog(chrome.i18n.getMessage("logErrorRefreshing", [(error as Error).message]), "error");
  } finally {
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

function showConfigWarning(): void {
  hideAllStates();
  elements.configWarning?.classList.remove("hidden");
}

// Reveal the search UI with no detected media: empty title, default media
// type, focused input, no auto-search. Used on unsupported domains and on
// supported-site homepages so manual search is always available.
function showManualSearchOnly(): void {
  hideAllStates();
  if (elements.videoTitle) {
    elements.videoTitle.textContent = chrome.i18n.getMessage("noMediaDetectedTitle");
  }
  if (elements.mediaType) {
    setMediaTypeToggle("movie");
  }
  if (elements.searchTitleInput) {
    elements.searchTitleInput.value = "";
  }
  elements.videoSection?.classList.remove("hidden");
  elements.searchTitleInput?.focus();
}

function showMediaInfo(mediaInfo: { title: string; cleanedTitle: string; mediaType: string }): void {
  if (elements.videoTitle) {
    elements.videoTitle.textContent = truncateText(mediaInfo.title, 80);
  }
  if (elements.mediaType) {
    setMediaTypeToggle(mediaInfo.mediaType);
  }
  if (elements.searchTitleInput) {
    elements.searchTitleInput.value = mediaInfo.cleanedTitle;
  }
  elements.videoSection?.classList.remove("hidden");
}

async function showResults(results: unknown[]): Promise<void> {
  const sortedResults = (results as {
    releaseDate?: string;
    firstAirDate?: string;
    mediaType: string;
    id: number;
  }[]).sort((a, b) => {
    const yearA = a.releaseDate || a.firstAirDate ? new Date(a.releaseDate || a.firstAirDate || "").getFullYear() : 0;
    const yearB = b.releaseDate || b.firstAirDate ? new Date(b.releaseDate || b.firstAirDate || "").getFullYear() : 0;
    return yearB - yearA;
  });

  if (elements.resultsList) elements.resultsList.innerHTML = "";

  if (sortedResults.length === 0) {
    addLog(chrome.i18n.getMessage("logNoResults"), "warn");
    if (elements.resultsSection) elements.resultsSection.classList.add("hidden");
    if (elements.noResultsState) elements.noResultsState.classList.remove("hidden");
    return;
  }

  addLog(chrome.i18n.getMessage("logCheckingStatus", [sortedResults.length.toString()]), "info");

  const resultsWithDetails = await Promise.all(
    sortedResults.map(async (result) => {
      try {
        const response = await chrome.runtime.sendMessage({
          action: "getMediaDetails",
          mediaType: result.mediaType,
          mediaId: result.id,
        }) as { success: boolean; data?: unknown };

        if (response && response.success && response.data) {
          return { ...result, mediaInfo: (response.data as { mediaInfo?: unknown }).mediaInfo || result };
        }
        return result;
      } catch {
        return result;
      }
    }),
  );

  addLog(
    chrome.i18n.getMessage("logResultsFound", [resultsWithDetails.length.toString()]),
    "success",
  );

  resultsWithDetails.forEach((result) => {
    const resultElement = createResultElement(result);
    if (resultElement && elements.resultsList) {
      elements.resultsList.appendChild(resultElement);
    }
  });

  if (elements.resultsSection) elements.resultsSection.classList.remove("hidden");
  if (elements.noResultsState) elements.noResultsState.classList.add("hidden");
}

function createResultElement(result: {
  mediaType: string;
  id: number;
  posterPath?: string;
  title?: string;
  name?: string;
  releaseDate?: string;
  firstAirDate?: string;
  mediaInfo?: unknown;
}): HTMLElement | null {
  if (!elements.resultTemplate) return null;

  const clone = elements.resultTemplate.content.cloneNode(true) as DocumentFragment;
  const item = clone.querySelector<HTMLElement>(".result-item");
  const poster = clone.querySelector<HTMLImageElement>(".result-poster");
  const posterPreview = clone.querySelector<HTMLImageElement>(".result-poster-preview");
  const title = clone.querySelector<HTMLElement>(".result-title");
  const year = clone.querySelector<HTMLElement>(".result-year");
  const requestBtn = clone.querySelector<HTMLButtonElement>(".btn-request");

  if (!item) return null;

  item.dataset.id = String(result.id);
  item.dataset.type = result.mediaType;

  if (poster) {
    const fallbackPoster = "../../icons/broken.png";
    const posterUrl = result.posterPath ? `https://image.tmdb.org/t/p/w92${result.posterPath}` : fallbackPoster;
    poster.src = posterUrl;
    poster.onerror = () => {
      // Avoid an infinite loop if the fallback itself fails to load.
      poster.onerror = null;
      poster.src = fallbackPoster;
    };

    // Hover zoom: lazy-load a higher-res poster into the floating preview on
    // first hover. Only for real posters (skip fallback icons).
    if (posterPreview && result.posterPath) {
      const previewUrl = `https://image.tmdb.org/t/p/w342${result.posterPath}`;
      poster.parentElement?.addEventListener("mouseenter", () => {
        // Note: img.src property resolves to an absolute URL even when the
        // attribute is empty, so check the attribute, not the property.
        if (!posterPreview.getAttribute("src")) {
          posterPreview.src = previewUrl;
          addLog(`Hover-zoom preview loaded: ${result.title || result.name}`, "info");
        }
      });
    }
  }

  if (title) title.textContent = result.title || result.name || "";
  if (year) {
    const dateStr = result.releaseDate || result.firstAirDate;
    year.textContent = dateStr ? String(new Date(dateStr).getFullYear()) : chrome.i18n.getMessage("yearNotAvailable");
  }

  if (requestBtn) {
    updateResultStatus(result.mediaInfo, requestBtn);
  }

  requestBtn?.addEventListener("click", () => handleRequest(result, requestBtn));

  return item;
}

function updateResultStatus(
  mediaInfo: unknown,
  buttonElement: HTMLButtonElement,
): void {
  if (!mediaInfo) {
    buttonElement.textContent = chrome.i18n.getMessage("requestButton");
    return;
  }

  const info = mediaInfo as { status: number; requests?: unknown[] };
  const hasRequests = info.requests && info.requests.length > 0;

  if (info.status >= 4) {
    buttonElement.textContent = chrome.i18n.getMessage("statusAvailable");
    buttonElement.classList.add("available");
    buttonElement.disabled = true;
  } else if (hasRequests) {
    buttonElement.textContent = chrome.i18n.getMessage("statusRequested");
    buttonElement.classList.add("requested");
    buttonElement.disabled = true;
  } else {
    buttonElement.textContent = chrome.i18n.getMessage("requestButton");
  }
}

async function handleRequest(
  result: {
    mediaType: string;
    id: number;
    title?: string;
    name?: string;
    externalIds?: { tvdbId?: number };
  },
  button: HTMLButtonElement,
): Promise<void> {
  const btnText = button.querySelector(".btn-text");
  const btnLoader = button.querySelector(".btn-loader");

  if (btnText) btnText.classList.add("hidden");
  if (btnLoader) btnLoader.classList.remove("hidden");
  button.disabled = true;

  const title = result.title || result.name || "";

  try {
    const requestData: { mediaType: string; mediaId: number; tvdbId?: number } = {
      mediaType: result.mediaType,
      mediaId: result.id,
    };

    if (result.mediaType === "tv" && result.externalIds?.tvdbId) {
      requestData.tvdbId = result.externalIds.tvdbId;
    }

    const response = await chrome.runtime.sendMessage({
      action: "createRequest",
      requestData,
    }) as { success: boolean; error?: string };

    if (response.success) {
      button.textContent = chrome.i18n.getMessage("statusRequested");
      button.classList.add("success");
      button.disabled = true;

      addLog(chrome.i18n.getMessage("logRequestSuccess", [title]), "success");

      await chrome.runtime.sendMessage({
        action: "showNotification",
        title: chrome.i18n.getMessage("notificationRequestSuccess"),
        message: chrome.i18n.getMessage("notificationRequestSuccessMessage", [title]),
        type: "success",
      });
    } else {
      throw new Error(response.error || chrome.i18n.getMessage("requestFailed"));
    }
  } catch (error) {
    addLog(chrome.i18n.getMessage("logRequestFailed", [(error as Error).message]), "error");
    button.disabled = false;
    const btnText = button.querySelector(".btn-text");
    const btnLoader = button.querySelector(".btn-loader");
    if (btnText) {
      btnText.classList.remove("hidden");
      btnText.textContent = chrome.i18n.getMessage("retryRequestButton");
    }
    if (btnLoader) btnLoader.classList.add("hidden");

    await chrome.runtime.sendMessage({
      action: "showNotification",
      title: chrome.i18n.getMessage("notificationRequestFailed"),
      message: (error as Error).message,
      type: "error",
    });
  } finally {
    const btnLoader = button.querySelector(".btn-loader");
    if (btnLoader) btnLoader.classList.add("hidden");
  }
}

async function getCurrentMediaInfo(): Promise<MediaInfo | null> {
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 500;

  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tab.url) {
      addLog(chrome.i18n.getMessage("logNoUrl"), "warn");
      return null;
    }

    const url = new URL(tab.url);
    const site = getSiteByDomain(url.hostname);
    if (!site) {
      addLog(chrome.i18n.getMessage("logSiteNotSupported"), "warn");
      return null;
    }

    // Supported domain, but not a media page (e.g. YouTube/IMDb homepage):
    // skip auto-detection silently so the user can still search manually.
    if (!isMediaPage(url.pathname, site)) {
      addLog(chrome.i18n.getMessage("logNotMediaPage"), "info");
      return null;
    }

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await chrome.tabs.sendMessage(tab.id!, {
          action: "getCurrentMedia",
        }) as { success: boolean; data?: MediaInfo; error?: string };

        if (response && response.success) {
          addLog(chrome.i18n.getMessage("logContentScriptSuccess"), "success");
          return response.data ?? null;
        } else {
          addLog(
            chrome.i18n.getMessage("logContentScriptError", [response?.error || "No response"]),
            "error",
          );
        }
      } catch (error) {
        if (attempt === MAX_RETRIES && (error as Error).message.includes("Receiving end does not exist")) {
          try {
            await chrome.scripting.executeScript({
              target: { tabId: tab.id! },
              files: ["content/content.js"],
            });

            await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));

            const response = await chrome.tabs.sendMessage(tab.id!, {
              action: "getCurrentMedia",
            }) as { success: boolean; data?: MediaInfo };

            if (response && response.success) {
              addLog(chrome.i18n.getMessage("logContentScriptInjected"), "success");
              return response.data ?? null;
            }
          } catch (injectionError) {
            addLog(chrome.i18n.getMessage("logInjectionFailed", [(injectionError as Error).message]), "error");
          }
        }

        if (attempt < MAX_RETRIES) {
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
        }
      }
    }

    return null;
  } catch (error) {
    addLog(chrome.i18n.getMessage("logErrorGettingMedia", [(error as Error).message]), "error");
    return null;
  }
}

async function searchOverseerr(query: string): Promise<void> {
  try {
    const response = await chrome.runtime.sendMessage({
      action: "searchMedia",
      query,
    }) as { success: boolean; data?: { results?: unknown[] }; error?: string };

    if (response && response.success) {
      const results = (response.data as { results?: unknown[] }).results || [];
      const mediaResults = (results as { mediaType: string }[]).filter(
        (r) => r.mediaType === currentMediaType,
      );
      await showResults(mediaResults.slice(0, resultCount));
    } else {
      const errorMsg = response?.error || chrome.i18n.getMessage("noResponse");
      addLog(chrome.i18n.getMessage("logSearchError", [errorMsg]), "error");
      throw new Error(errorMsg);
    }
  } catch (error) {
    addLog(chrome.i18n.getMessage("logSearchFailed", [(error as Error).message]), "error");
    throw error;
  }
}

function showError(message: string): void {
  hideAllStates();
  if (elements.errorMessage) elements.errorMessage.textContent = message;
  if (elements.errorState) elements.errorState.classList.remove("hidden");
}

function hideAllStates(): void {
  if (elements.configWarning) elements.configWarning.classList.add("hidden");
  if (elements.notYoutubeState) elements.notYoutubeState.classList.add("hidden");
  if (elements.videoSection) elements.videoSection.classList.add("hidden");
  if (elements.resultsSection) elements.resultsSection.classList.add("hidden");
  if (elements.noResultsState) elements.noResultsState.classList.add("hidden");
  if (elements.errorState) elements.errorState.classList.add("hidden");
}

function openSettings(): void {
  chrome.runtime.openOptionsPage();
}
