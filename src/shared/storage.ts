// Storage module for managing extension settings

export const STORAGE_KEYS = {
  OVERSEERR_URL: "overseerrUrl",
  API_KEY: "apiKey",
  DEFAULT_PROFILE: "defaultProfile",
  NOTIFICATIONS_ENABLED: "notificationsEnabled",
  DEBUG_ENABLED: "debugEnabled",
  RESULT_COUNT: "resultCount",
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

export type SettingValue = string | number | boolean;

// Result-count bounds (rows shown in the search results list).
export const RESULT_COUNT_MIN = 1;
export const RESULT_COUNT_MAX = 20;
export const RESULT_COUNT_DEFAULT = 5;

const DEFAULT_SETTINGS: Record<string, SettingValue> = {
  [STORAGE_KEYS.OVERSEERR_URL]: "",
  [STORAGE_KEYS.API_KEY]: "",
  [STORAGE_KEYS.DEFAULT_PROFILE]: "1",
  [STORAGE_KEYS.NOTIFICATIONS_ENABLED]: true,
  [STORAGE_KEYS.DEBUG_ENABLED]: false,
  [STORAGE_KEYS.RESULT_COUNT]: RESULT_COUNT_DEFAULT,
};

export async function getStorage(key: string): Promise<SettingValue> {
  try {
    const result = await chrome.storage.sync.get(key) as Record<string, SettingValue>;
    if (!result || typeof result !== "object") {
      return DEFAULT_SETTINGS[key];
    }
    return result[key] !== undefined ? result[key] : DEFAULT_SETTINGS[key];
  } catch {
    return DEFAULT_SETTINGS[key];
  }
}

export async function getAllSettings(): Promise<Record<string, SettingValue>> {
  try {
    const result = await chrome.storage.sync.get(Object.values(STORAGE_KEYS)) as Record<
      string,
      SettingValue
    >;
    if (!result || typeof result !== "object") {
      return { ...DEFAULT_SETTINGS };
    }
    return { ...DEFAULT_SETTINGS, ...result };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function saveSettings(settings: Record<string, SettingValue>): Promise<void> {
  await chrome.storage.sync.set(settings);
}

export { DEFAULT_SETTINGS };
