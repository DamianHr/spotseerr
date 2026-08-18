// Overseerr API client module

import { getStorage, STORAGE_KEYS } from "./storage";

async function apiRequest(endpoint: string, options: RequestInit = {}, timeoutMs = 10000): Promise<unknown> {
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

  const defaultOptions: RequestInit = {
    headers: {
      "X-Api-Key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    signal: controller.signal,
  };

  const fetchOptions: RequestInit = {
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
      throw new Error((errorData as { message?: string }).message || `HTTP ${response.status}: ${response.statusText}`);
    }

    if (response.status === 204) {
      return null;
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);

    if ((error as Error).name === "AbortError") {
      throw new Error(
        `Connection timed out after ${timeoutMs / 1000} seconds. Please check your URL and network connection.`,
      );
    }

    if ((error as Error).message.includes("Failed to fetch")) {
      throw new Error("Cannot connect to Overseerr. Please check your URL and network connection.");
    }

    throw error;
  }
}

async function getOverseerrUrl(): Promise<string> {
  let url = String(await getStorage(STORAGE_KEYS.OVERSEERR_URL));
  if (url) {
    url = url.trim();
    if (url.endsWith("/")) {
      url = url.slice(0, -1);
    }
  }
  return url;
}

async function getApiKey(): Promise<string> {
  return String(await getStorage(STORAGE_KEYS.API_KEY));
}

export async function searchMedia(query: string, page = 1): Promise<unknown> {
  const encodedQuery = encodeURIComponent(query);
  return await apiRequest(`/search?query=${encodedQuery}&page=${page}`);
}

export async function getMediaDetails(mediaType: string, mediaId: number): Promise<unknown> {
  if (mediaType === "movie") {
    return await apiRequest(`/movie/${mediaId}`);
  } else if (mediaType === "tv") {
    return await apiRequest(`/tv/${mediaId}`);
  } else {
    throw new Error(`Unsupported media type: ${mediaType}`);
  }
}

export async function getMovieDetails(movieId: number): Promise<unknown> {
  return await getMediaDetails("movie", movieId);
}

export async function getTvDetails(tvId: number): Promise<unknown> {
  return await getMediaDetails("tv", tvId);
}

export async function createRequest(requestData: {
  mediaType: string;
  mediaId: number;
  tvdbId?: number;
}): Promise<unknown> {
  return await apiRequest("/request", {
    method: "POST",
    body: JSON.stringify(requestData),
  });
}

export async function testConnection(): Promise<{ success: boolean; message: string; version?: string }> {
  try {
    const status = await apiRequest("/status", {}, 5000) as { version: string };
    return {
      success: true,
      version: status.version,
      message: chrome.i18n.getMessage("connectionSuccess", [status.version]),
    };
  } catch (error) {
    return {
      success: false,
      message: (error as Error).message,
    };
  }
}

export async function getRequestStatus(
  mediaId: number,
  mediaType: string,
): Promise<{
  id: number;
  mediaType: string;
  title?: string;
  status: number;
  requests: unknown[];
  error?: string;
}> {
  try {
    if (mediaType === "movie") {
      const details = await getMovieDetails(mediaId) as {
        title?: string;
        mediaInfo?: { status?: number; requests?: unknown[] };
      };
      return {
        id: mediaId,
        mediaType: "movie",
        title: details.title,
        status: details.mediaInfo?.status || 1,
        requests: details.mediaInfo?.requests || [],
      };
    } else {
      const details = await getTvDetails(mediaId) as {
        name?: string;
        mediaInfo?: { status?: number; requests?: unknown[] };
      };
      return {
        id: mediaId,
        mediaType: "tv",
        title: details.name,
        status: details.mediaInfo?.status || 1,
        requests: details.mediaInfo?.requests || [],
      };
    }
  } catch (error) {
    return {
      id: mediaId,
      mediaType,
      status: 1,
      requests: [],
      error: (error as Error).message,
    };
  }
}

export async function checkAvailability(
  mediaId: number,
  mediaType: string,
): Promise<{ isAvailable: boolean; isRequested: boolean; status: number; requests: unknown[] }> {
  const statusInfo = await getRequestStatus(mediaId, mediaType);

  const isAvailable = statusInfo.status >= 4;
  const isRequested = statusInfo.requests && statusInfo.requests.length > 0;

  return {
    isAvailable,
    isRequested,
    status: statusInfo.status,
    requests: statusInfo.requests,
  };
}
