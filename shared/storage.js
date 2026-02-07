// Storage module for managing extension settings

const STORAGE_KEYS = {
  OVERSEERR_URL: "overseerrUrl",
  API_KEY: "apiKey",
  DEFAULT_PROFILE: "defaultProfile",
  NOTIFICATIONS_ENABLED: "notificationsEnabled",
  DEBUG_ENABLED: "debugEnabled",
};

const DEFAULT_SETTINGS = {
  [STORAGE_KEYS.OVERSEERR_URL]: "",
  [STORAGE_KEYS.API_KEY]: "",
  [STORAGE_KEYS.DEFAULT_PROFILE]: "1",
  [STORAGE_KEYS.NOTIFICATIONS_ENABLED]: true,
  [STORAGE_KEYS.DEBUG_ENABLED]: false,
};

/**
 * Get a value from storage
 * @param {string} key - Storage key
 * @returns {Promise<any>} Stored value or default
 */
export async function getStorage(key) {
  try {
    const result = await chrome.storage.sync.get(key);
    // Handle case where a result is undefined (e.g., during the first installation)
    if (!result || typeof result !== "object") {
      return DEFAULT_SETTINGS[key];
    }
    return result[key] !== undefined ? result[key] : DEFAULT_SETTINGS[key];
  } catch (error) {
    console.error("Storage get error:", error);
    return DEFAULT_SETTINGS[key];
  }
}

/**
 * Get all settings
 * @returns {Promise<Object>} All settings
 */
export async function getAllSettings() {
  try {
    const result = await chrome.storage.sync.get(Object.values(STORAGE_KEYS));
    // Handle case where result is undefined (e.g., during first install)
    if (!result || typeof result !== "object") {
      return { ...DEFAULT_SETTINGS };
    }
    return { ...DEFAULT_SETTINGS, ...result };
  } catch (error) {
    console.error("Storage get all error:", error);
    return { ...DEFAULT_SETTINGS };
  }
}

/**
 * Save all settings
 * @param {Object} settings - Settings object
 * @returns {Promise<void>}
 */
export async function saveSettings(settings) {
  try {
    await chrome.storage.sync.set(settings);
  } catch (error) {
    console.error("Storage save error:", error);
    throw error;
  }
}

export { STORAGE_KEYS };
