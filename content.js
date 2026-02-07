// Content script for YouTube page interaction

// Store current video info
let currentVideoInfo = {
  title: "",
  description: "",
  cleanedTitle: "",
  mediaType: "movie",
  url: "",
  videoId: "",
};

// Extract video information from YouTube page
function extractVideoInfo() {
  try {
    // Get video title
    const titleElement = document.querySelector("h1.ytd-watch-metadata") ||
      document.querySelector("h1.title") ||
      document.querySelector("h1");

    const title = titleElement ? titleElement.textContent.trim() : "";

    // Get video description
    const descriptionElement = document.querySelector("#description-inline-expander") ||
      document.querySelector("#description") ||
      document.querySelector(".ytd-video-secondary-info-renderer");

    const description = descriptionElement ? descriptionElement.textContent.trim() : "";

    // Get video ID from URL
    const urlParams = new URLSearchParams(globalThis.location.search);
    const videoId = urlParams.get("v") || "";

    // Get channel name
    const channelElement = document.querySelector("ytd-channel-name a") ||
      document.querySelector(".ytd-channel-name a");
    const channelName = channelElement ? channelElement.textContent.trim() : "";

    return {
      title,
      description,
      url: globalThis.location.href,
      videoId,
      channelName,
    };
  } catch {
    return null;
  }
}

// Send video info to background script for cleaning
async function processVideoInfo() {
  const videoInfo = extractVideoInfo();

  if (!videoInfo || !videoInfo.title) {
    currentVideoInfo = {
      title: "",
      description: "",
      cleanedTitle: "",
      mediaType: "movie",
      url: globalThis.location.href,
      videoId: "",
    };
    return;
  }

  try {
    // Send to background script for title cleaning and media type detection
    const response = await chrome.runtime.sendMessage({
      action: "cleanTitle",
      title: videoInfo.title,
      description: videoInfo.description,
    });

    if (response.success) {
      currentVideoInfo = {
        ...videoInfo,
        cleanedTitle: response.data.cleaned,
        mediaType: response.data.mediaType,
      };
    } else {
      currentVideoInfo = {
        ...videoInfo,
        cleanedTitle: videoInfo.title,
        mediaType: "movie",
      };
    }
  } catch {
    currentVideoInfo = {
      ...videoInfo,
      cleanedTitle: videoInfo.title,
      mediaType: "movie",
    };
  }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === "getCurrentVideo") {
    // Re-extract to ensure we have latest data
    processVideoInfo().then(() => {
      sendResponse({
        success: true,
        data: currentVideoInfo,
      });
    });
    return true; // Async response
  }

  return false;
});

// Watch for URL changes (YouTube SPA navigation)
let lastUrl = location.href;

new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    // Wait a bit for page to load
    setTimeout(processVideoInfo, 1500);
  }
}).observe(document, { subtree: true, childList: true });

// Initial processing
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    setTimeout(processVideoInfo, 1500);
  });
} else {
  setTimeout(processVideoInfo, 1500);
}

// Also reprocess when video metadata might have changed
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.type === "childList") {
      const titleElement = document.querySelector("h1.ytd-watch-metadata");
      if (titleElement && titleElement.textContent.trim() !== currentVideoInfo.title) {
        setTimeout(processVideoInfo, 500);
        break;
      }
    }
  }
});

// Observe the title area for changes
const titleContainer = document.querySelector("ytd-watch-metadata") || document.body;
if (titleContainer) {
  observer.observe(titleContainer, { childList: true, subtree: true });
}
