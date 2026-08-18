// Storage module for managing extension settings

export const STORAGE_KEYS = {
  OVERSEERR_URL: "overseerrUrl",
  API_KEY: "apiKey",
  DEFAULT_PROFILE: "defaultProfile",
  NOTIFICATIONS_ENABLED: "notificationsEnabled",
  DEBUG_ENABLED: "debugEnabled",
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

const DEFAULT_SETTINGS: Record<string, string | boolean> = {
  [STORAGE_KEYS.OVERSEERR_URL]: "",
  [STORAGE_KEYS.API_KEY]: "",
  [STORAGE_KEYS.DEFAULT_PROFILE]: "1",
  [STORAGE_KEYS.NOTIFICATIONS_ENABLED]: true,
  [STORAGE_KEYS.DEBUG_ENABLED]: false,
};

export async function getStorage(key: string): Promise<string | boolean> {
  try {
    const result = await chrome.storage.sync.get(key) as Record<string, string | boolean>;
    if (!result || typeof result !== "object") {
      return DEFAULT_SETTINGS[key];
    }
    return result[key] !== undefined ? result[key] : DEFAULT_SETTINGS[key];
  } catch {
    return DEFAULT_SETTINGS[key];
  }
}

export async function getAllSettings(): Promise<Record<string, string | boolean>> {
  try {
    const result = await chrome.storage.sync.get(Object.values(STORAGE_KEYS)) as Record<
      string,
      string | boolean
    >;
    if (!result || typeof result !== "object") {
      return { ...DEFAULT_SETTINGS };
    }
    return { ...DEFAULT_SETTINGS, ...result };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function saveSettings(settings: Record<string, string | boolean>): Promise<void> {
  await chrome.storage.sync.set(settings);
}

export { DEFAULT_SETTINGS };
