// Background service worker for handling API requests and notifications

import { getStorage, STORAGE_KEYS } from "../shared/storage";
import { cleanTitle, detectMediaType } from "../shared/parser";
import { checkAvailability, createRequest as apiCreateRequest, getMediaDetails, searchMedia } from "../shared/api";

async function createRequest(
  requestData: { mediaType: string; mediaId: number; tvdbId?: number },
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  if (!requestData.mediaType || !requestData.mediaId) {
    return {
      success: false,
      error: "Missing required fields: mediaType and mediaId are required",
    };
  }

  try {
    try {
      await getMediaDetails(requestData.mediaType, requestData.mediaId);
    } catch {
      // Continue anyway - maybe it's already in the DB
    }

    const response = await apiCreateRequest(requestData);
    return { success: true, data: response };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

function showNotification(title: string, message: string, type: string = "info"): void {
  getStorage(STORAGE_KEYS.NOTIFICATIONS_ENABLED).then((enabled) => {
    if (!enabled) return;

    const icons: Record<string, string> = {
      success: "icons/icon48.png",
      error: "icons/icon48.png",
      info: "icons/icon48.png",
    };

    chrome.notifications.create({
      type: "basic",
      iconUrl: icons[type] || icons.info,
      title,
      message,
      priority: type === "error" ? 2 : 1,
    });
  });
}

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
            const availability = await checkAvailability(request.mediaId, request.mediaType);
            return { success: true, data: availability };
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
        return { success: false, error: (error as Error).message };
      }
    };

    handleAsync()
      .then((response) => {
        sendResponse(response);
      })
      .catch((error) => {
        sendResponse({ success: false, error: (error as Error).message });
      });

    return true;
  });

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
