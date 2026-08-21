// Content script for media page detection (multi-site)

import { getSiteByDomain, type SiteConfig } from "../shared/siteConfig";
import { getChannelExtractor, getExtractor, getTitleExtractor, type StructuredMedia } from "./sites";

interface MediaInfo {
  title: string;
  description: string;
  cleanedTitle: string;
  mediaType: string;
  url: string;
  site: string | null;
  channel: string | null;
}

interface ChromeMessageResponse {
  success: boolean;
  data?: {
    cleaned: string;
    mediaType: string;
  };
}

let currentMediaInfo: MediaInfo = {
  title: "",
  description: "",
  cleanedTitle: "",
  mediaType: "movie",
  url: "",
  site: null,
  channel: null,
};

function detectSite(): SiteConfig | null {
  const hostname = globalThis.location.hostname;
  return getSiteByDomain(hostname);
}

function extractMediaInfo(): {
  title: string;
  url: string;
  site: string;
  structured: StructuredMedia | null;
  channel: string | null;
} | null {
  const site = detectSite();
  if (!site) {
    return null;
  }

  try {
    const titleExtractor = getTitleExtractor(site.id);
    const structuredTitle = titleExtractor ? titleExtractor() : null;
    const title = structuredTitle ?? globalThis.document.title;
    const extractor = getExtractor(site.id);
    const structured = extractor ? extractor() : null;
    const channelExtractor = getChannelExtractor(site.id);
    const channel = channelExtractor ? channelExtractor() : null;

    return {
      title,
      url: globalThis.location.href,
      site: site.id,
      structured,
      channel,
    };
  } catch {
    return null;
  }
}

async function processMediaInfo(): Promise<void> {
  const extracted = extractMediaInfo();

  if (!extracted || !extracted.title) {
    currentMediaInfo = {
      title: "",
      description: "",
      cleanedTitle: "",
      mediaType: "movie",
      url: globalThis.location.href,
      site: null,
      channel: null,
    };
    return;
  }

  const { structured, ...mediaInfo } = extracted;

  try {
    if (structured) {
      currentMediaInfo = {
        ...mediaInfo,
        description: "",
        cleanedTitle: structured.cleanedTitle,
        mediaType: structured.mediaType,
      };
      return;
    }

    const response = await chrome.runtime.sendMessage({
      action: "cleanTitle",
      title: mediaInfo.title,
    }) as ChromeMessageResponse;

    if (response.success && response.data) {
      currentMediaInfo = {
        ...mediaInfo,
        description: "",
        cleanedTitle: response.data.cleaned,
        mediaType: response.data.mediaType,
      };
    } else {
      currentMediaInfo = {
        ...mediaInfo,
        description: "",
        cleanedTitle: mediaInfo.title,
        mediaType: "movie",
      };
    }
  } catch {
    currentMediaInfo = {
      ...mediaInfo,
      description: "",
      cleanedTitle: mediaInfo.title,
      mediaType: "movie",
    };
  }
}

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === "getCurrentMedia") {
    processMediaInfo().then(() => {
      sendResponse({
        success: currentMediaInfo.title !== "",
        data: currentMediaInfo,
      });
    });
    return true;
  }

  return false;
});

let lastUrl = location.href;

new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    setTimeout(processMediaInfo, 1500);
  }
}).observe(document, { subtree: true, childList: true });

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    setTimeout(processMediaInfo, 1500);
  });
} else {
  setTimeout(processMediaInfo, 1500);
}

const observer = new MutationObserver((mutations) => {
  const site = detectSite();
  if (!site || !site.titleSelector) return;

  for (const mutation of mutations) {
    if (mutation.type === "childList") {
      const titleElement = document.querySelector(site.titleSelector);
      if (titleElement && titleElement.textContent?.trim() !== currentMediaInfo.title) {
        setTimeout(processMediaInfo, 500);
        break;
      }
    }
  }
});

observer.observe(document.body, { childList: true, subtree: true });
