// Options page script for managing settings

import { getAllSettings, saveSettings, STORAGE_KEYS } from "../shared/storage";
import { isValidUrl } from "../shared/utils";
import { testConnection as apiTestConnection } from "../shared/api";
import { initI18n } from "../shared/localize";

const elements = {
  form: document.getElementById("settingsForm") as HTMLFormElement,
  overseerrUrl: document.getElementById("overseerrUrl") as HTMLInputElement,
  apiKey: document.getElementById("apiKey") as HTMLInputElement,
  toggleApiKey: document.getElementById("toggleApiKey") as HTMLButtonElement,
  notificationsEnabled: document.getElementById("notificationsEnabled") as HTMLInputElement,
  debugEnabled: document.getElementById("debugEnabled") as HTMLInputElement,
  testConnection: document.getElementById("testConnection") as HTMLButtonElement,
  testBtnText: document.getElementById("testBtnText") as HTMLSpanElement,
  testBtnLoader: document.getElementById("testBtnLoader") as HTMLElement,
  connectionStatus: document.getElementById("connectionStatus") as HTMLParagraphElement,
  saveBtnText: document.getElementById("saveBtnText") as HTMLSpanElement,
  saveBtnLoader: document.getElementById("saveBtnLoader") as HTMLElement,
  resetBtn: document.getElementById("resetBtn") as HTMLButtonElement,
  successMessage: document.getElementById("successMessage") as HTMLDivElement,
  errorMessage: document.getElementById("errorMessage") as HTMLDivElement,
  errorText: document.getElementById("errorText") as HTMLParagraphElement,
};

document.addEventListener("DOMContentLoaded", async () => {
  initI18n();

  if (typeof chrome === "undefined" || !chrome.storage) {
    showError(chrome.i18n.getMessage("errorExtensionApis"));
    return;
  }

  await loadSettings();
  setupEventListeners();
});

function setupEventListeners(): void {
  elements.form.addEventListener("submit", handleSubmit);
  elements.testConnection.addEventListener("click", testConnection);
  elements.toggleApiKey.addEventListener("click", toggleApiKeyVisibility);
  elements.resetBtn.addEventListener("click", resetSettings);
  elements.form.addEventListener("input", hideAlerts);
}

async function loadSettings(): Promise<void> {
  try {
    const settings = await getAllSettings();

    elements.overseerrUrl.value = String(settings[STORAGE_KEYS.OVERSEERR_URL] || "");
    elements.apiKey.value = String(settings[STORAGE_KEYS.API_KEY] || "");
    elements.notificationsEnabled.checked = settings[STORAGE_KEYS.NOTIFICATIONS_ENABLED] !== false;
    elements.debugEnabled.checked = settings[STORAGE_KEYS.DEBUG_ENABLED] === true;
  } catch {
    showError(chrome.i18n.getMessage("errorLoadSettings"));
  }
}

async function handleSubmit(e: Event): Promise<void> {
  e.preventDefault();

  hideAlerts();
  setSaveLoading(true);

  try {
    const url = elements.overseerrUrl.value.trim();
    const apiKey = elements.apiKey.value.trim();

    if (!url) {
      throw new Error(chrome.i18n.getMessage("validationUrlRequired"));
    }

    if (!isValidUrl(url)) {
      throw new Error(chrome.i18n.getMessage("validationUrlInvalid"));
    }

    if (!apiKey) {
      throw new Error(chrome.i18n.getMessage("validationApiKeyRequired"));
    }

    const settings = {
      [STORAGE_KEYS.OVERSEERR_URL]: url,
      [STORAGE_KEYS.API_KEY]: apiKey,
      [STORAGE_KEYS.NOTIFICATIONS_ENABLED]: elements.notificationsEnabled.checked,
      [STORAGE_KEYS.DEBUG_ENABLED]: elements.debugEnabled.checked,
    };

    await saveSettings(settings);

    showSuccess();
  } catch (error) {
    showError((error as Error).message);
  } finally {
    setSaveLoading(false);
  }
}

async function testConnection(): Promise<void> {
  hideAlerts();
  setTestLoading(true);
  elements.connectionStatus.textContent = "";
  elements.connectionStatus.className = "connection-status";

  try {
    const url = elements.overseerrUrl.value.trim();
    const apiKey = elements.apiKey.value.trim();

    if (!url || !apiKey) {
      throw new Error(chrome.i18n.getMessage("validationBothRequired"));
    }

    await saveSettings({
      [STORAGE_KEYS.OVERSEERR_URL]: url,
      [STORAGE_KEYS.API_KEY]: apiKey,
      [STORAGE_KEYS.NOTIFICATIONS_ENABLED]: elements.notificationsEnabled.checked,
      [STORAGE_KEYS.DEBUG_ENABLED]: elements.debugEnabled.checked,
    });

    const response = await apiTestConnection();

    if (response.success) {
      elements.connectionStatus.textContent = `✓ ${response.message}`;
      elements.connectionStatus.classList.add("success");
    } else {
      throw new Error(response.message || chrome.i18n.getMessage("connectionFailed"));
    }
  } catch (error) {
    elements.connectionStatus.textContent = `✗ ${(error as Error).message}`;
    elements.connectionStatus.classList.add("error");
  } finally {
    setTestLoading(false);
  }
}

function toggleApiKeyVisibility(): void {
  const type = elements.apiKey.type === "password" ? "text" : "password";
  elements.apiKey.type = type;

  elements.toggleApiKey.innerHTML = type === "password"
    ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
       </svg>`
    : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
        <line x1="1" y1="1" x2="23" y2="23"></line>
       </svg>`;
}

function resetSettings(): void {
  if (confirm(chrome.i18n.getMessage("confirmReset"))) {
    hideAlerts();

    elements.overseerrUrl.value = "";
    elements.apiKey.value = "";
    elements.notificationsEnabled.checked = true;
    elements.debugEnabled.checked = false;
    elements.connectionStatus.textContent = "";
    elements.connectionStatus.className = "connection-status";

    showSuccess(chrome.i18n.getMessage("settingsReset"));
  }
}

function setSaveLoading(loading: boolean): void {
  elements.saveBtnText.classList.toggle("hidden", loading);
  elements.saveBtnLoader.classList.toggle("hidden", !loading);
  elements.form.querySelector('button[type="submit"]')!.toggleAttribute("disabled", loading);
}

function setTestLoading(loading: boolean): void {
  elements.testBtnText.classList.toggle("hidden", loading);
  elements.testBtnLoader.classList.toggle("hidden", !loading);
  elements.testConnection.disabled = loading;
}

function showSuccess(message = chrome.i18n.getMessage("settingsSaved")): void {
  const span = elements.successMessage.querySelector("span");
  if (span) span.textContent = message;
  elements.successMessage.classList.remove("hidden");
  elements.errorMessage.classList.add("hidden");

  setTimeout(() => {
    elements.successMessage.classList.add("hidden");
  }, 5000);
}

function showError(message: string): void {
  elements.errorText.textContent = message;
  elements.errorMessage.classList.remove("hidden");
  elements.successMessage.classList.add("hidden");
}

function hideAlerts(): void {
  elements.successMessage.classList.add("hidden");
  elements.errorMessage.classList.add("hidden");
}
