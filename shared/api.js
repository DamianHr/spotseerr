// Overseerr API client module

import { getStorage, STORAGE_KEYS } from "./storage.js";

/**
 * Make an authenticated request to the Overseerr API
 * @param {string} endpoint - API endpoint (without base URL)
 * @param {Object} options - Fetch options
 * @param {number} timeoutMs - Timeout in milliseconds (default: 10000ms = 10 seconds)
 * @returns {Promise<Object>} API response
 */
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

  // Create AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const defaultOptions = {
    headers: {
      "X-Api-Key": apiKey,
      "Content-Type": "application/json",
      "Accept": "application/json",
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

    // Return null for 204 No Content
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

/**
 * Get Overseerr URL from storage
 * @returns {Promise<string>} URL
 */
async function getOverseerrUrl() {
  let url = await getStorage(STORAGE_KEYS.OVERSEERR_URL);
  if (url && !url.endsWith("/")) {
    url = url + "/";
  }
  return url;
}

/**
 * Get API key from storage
 * @returns {Promise<string>} API key
 */
async function getApiKey() {
  return await getStorage(STORAGE_KEYS.API_KEY);
}

/**
 * Search for movies and TV shows
 * @param {string} query - Search query
 * @param {number} page - Page number (default: 1)
 * @returns {Promise<Object>} Search results
 */
export async function searchMedia(query, page = 1) {
  const encodedQuery = encodeURIComponent(query);
  return await apiRequest(`/search?query=${encodedQuery}&page=${page}`);
}

/**
 * Get movie details
 * @param {number} movieId - TMDB movie ID
 * @returns {Promise<Object>} Movie details
 */
export async function getMovieDetails(movieId) {
  return await apiRequest(`/movie/${movieId}`);
}

/**
 * Get TV show details
 * @param {number} tvId - TMDB TV ID
 * @returns {Promise<Object>} TV show details
 */
export async function getTvDetails(tvId) {
  return await apiRequest(`/tv/${tvId}`);
}

/**
 * Create a media request
 * @param {Object} requestData - Request data
 * @param {string} requestData.mediaType - 'movie' or 'tv'
 * @param {number} requestData.mediaId - TMDB ID
 * @param {number} [requestData.tvdbId] - TVDB ID (for TV shows)
 * @returns {Promise<Object>} Created request
 */
export async function createRequest(requestData) {
  return await apiRequest("/request", {
    method: "POST",
    body: JSON.stringify(requestData),
  });
}

/**
 * Test connection to Overseerr
 * Uses a 5-second timeout for quick feedback
 * @returns {Promise<Object>} Status information
 */
export async function testConnection() {
  try {
    const status = await apiRequest("/status", {}, 5000);
    return {
      success: true,
      version: status.version,
      message: chrome.i18n.getMessage("connectionSuccess", [status.version]),
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
}

/**
 * Get request status for a media item
 * @param {number} mediaId - Media ID
 * @param {string} mediaType - 'movie' or 'tv'
 * @returns {Promise<Object>} Status information
 */
export async function getRequestStatus(mediaId, mediaType) {
  try {
    if (mediaType === "movie") {
      const details = await getMovieDetails(mediaId);
      return {
        id: mediaId,
        mediaType: "movie",
        title: details.title,
        status: details.mediaInfo?.status || 1, // 1 = UNKNOWN
        requests: details.mediaInfo?.requests || [],
      };
    } else {
      const details = await getTvDetails(mediaId);
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
      error: error.message,
    };
  }
}

/**
 * Check if media is already available or requested
 * @param {number} mediaId - Media ID
 * @param {string} mediaType - 'movie' or 'tv'
 * @returns {Promise<Object>} Availability info
 */
export async function checkAvailability(mediaId, mediaType) {
  const status = await getRequestStatus(mediaId, mediaType);

  // Status codes: 1 = UNKNOWN, 2 = PENDING, 3 = PROCESSING, 4 = PARTIALLY_AVAILABLE, 5 = AVAILABLE
  const isAvailable = status.status >= 4;
  const isRequested = status.requests && status.requests.length > 0;

  return {
    isAvailable,
    isRequested,
    status: status.status,
    requests: status.requests,
  };
}
