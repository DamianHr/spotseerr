// Options page script for managing settings

import { getAllSettings, saveSettings, STORAGE_KEYS } from "../shared/storage.js";
import { isValidUrl } from "../shared/utils.js";

// DOM Elements
const elements = {
  form: document.getElementById("settingsForm"),
  overseerrUrl: document.getElementById("overseerrUrl"),
  apiKey: document.getElementById("apiKey"),
  toggleApiKey: document.getElementById("toggleApiKey"),
  notificationsEnabled: document.getElementById("notificationsEnabled"),
  debugEnabled: document.getElementById("debugEnabled"),
  testConnection: document.getElementById("testConnection"),
  testBtnText: document.getElementById("testBtnText"),
  testBtnLoader: document.getElementById("testBtnLoader"),
  connectionStatus: document.getElementById("connectionStatus"),
  saveBtnText: document.getElementById("saveBtnText"),
  saveBtnLoader: document.getElementById("saveBtnLoader"),
  resetBtn: document.getElementById("resetBtn"),
  successMessage: document.getElementById("successMessage"),
  errorMessage: document.getElementById("errorMessage"),
  errorText: document.getElementById("errorText"),
};

// Initialize
document.addEventListener("DOMContentLoaded", async () => {
  // Check if chrome APIs are available
  if (typeof chrome === "undefined" || !chrome.storage) {
    console.error("Chrome APIs not available");
    showError("Extension APIs not available. Please reload the extension.");
    return;
  }

  await loadSettings();
  setupEventListeners();
});

function setupEventListeners() {
  // Form submission
  elements.form.addEventListener("submit", handleSubmit);

  // Test connection
  elements.testConnection.addEventListener("click", testConnection);

  // Toggle API key visibility
  elements.toggleApiKey.addEventListener("click", toggleApiKeyVisibility);

  // Reset button
  elements.resetBtn.addEventListener("click", resetSettings);

  // Hide alerts when form changes
  elements.form.addEventListener("input", hideAlerts);
}

async function loadSettings() {
  try {
    const settings = await getAllSettings();

    // Populate form
    elements.overseerrUrl.value = settings[STORAGE_KEYS.OVERSEERR_URL] || "";
    elements.apiKey.value = settings[STORAGE_KEYS.API_KEY] || "";
    elements.notificationsEnabled.checked = settings[STORAGE_KEYS.NOTIFICATIONS_ENABLED] !== false;
    elements.debugEnabled.checked = settings[STORAGE_KEYS.DEBUG_ENABLED] === true;
  } catch (error) {
    console.error("Error loading settings:", error);
    showError("Failed to load settings. Please try again.");
  }
}

async function handleSubmit(e) {
  e.preventDefault();

  hideAlerts();
  setSaveLoading(true);

  try {
    // Validate inputs
    const url = elements.overseerrUrl.value.trim();
    const apiKey = elements.apiKey.value.trim();

    if (!url) {
      throw new Error("Overseerr URL is required");
    }

    if (!isValidUrl(url)) {
      throw new Error("Please enter a valid URL (e.g., https://overseerr.example.com)");
    }

    if (!apiKey) {
      throw new Error("API key is required");
    }

    // Save settings
    const settings = {
      [STORAGE_KEYS.OVERSEERR_URL]: url,
      [STORAGE_KEYS.API_KEY]: apiKey,
      [STORAGE_KEYS.NOTIFICATIONS_ENABLED]: elements.notificationsEnabled.checked,
      [STORAGE_KEYS.DEBUG_ENABLED]: elements.debugEnabled.checked,
    };

    await saveSettings(settings);

    showSuccess();
  } catch (error) {
    console.error("Error saving settings:", error);
    showError(error.message);
  } finally {
    setSaveLoading(false);
  }
}

async function testConnection() {
  hideAlerts();
  setTestLoading(true);
  elements.connectionStatus.textContent = "";
  elements.connectionStatus.className = "connection-status";

  try {
    const url = elements.overseerrUrl.value.trim();
    const apiKey = elements.apiKey.value.trim();

    if (!url || !apiKey) {
      throw new Error("Please enter both URL and API key");
    }

    console.log("Saving test settings...");
    // Temporarily save to test
    const testSettings = {
      [STORAGE_KEYS.OVERSEERR_URL]: url,
      [STORAGE_KEYS.API_KEY]: apiKey,
      [STORAGE_KEYS.NOTIFICATIONS_ENABLED]: elements.notificationsEnabled.checked,
      [STORAGE_KEYS.DEBUG_ENABLED]: elements.debugEnabled.checked,
    };

    await saveSettings(testSettings);
    console.log("Settings saved, testing connection...");

    // Test connection with 10 second timeout
    const response = await Promise.race([
      chrome.runtime.sendMessage({ action: "testConnection" }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Request timed out after 10 seconds")), 10000)
      ),
    ]);

    console.log("Connection test response:", response);

    if (response && response.success) {
      elements.connectionStatus.textContent = `✓ ${response.message}`;
      elements.connectionStatus.classList.add("success");
    } else if (response) {
      throw new Error(response.message || "Connection test failed");
    } else {
      throw new Error("No response received from background script");
    }
  } catch (error) {
    console.error("Connection test error:", error);
    elements.connectionStatus.textContent = `✗ ${error.message}`;
    elements.connectionStatus.classList.add("error");
  } finally {
    setTestLoading(false);
  }
}

function toggleApiKeyVisibility() {
  const type = elements.apiKey.type === "password" ? "text" : "password";
  elements.apiKey.type = type;

  // Update icon
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

function resetSettings() {
  if (confirm("Are you sure you want to reset all settings to defaults?")) {
    hideAlerts();

    elements.overseerrUrl.value = "";
    elements.apiKey.value = "";
    elements.notificationsEnabled.checked = true;
    elements.debugEnabled.checked = false;
    elements.connectionStatus.textContent = "";
    elements.connectionStatus.className = "connection-status";

    showSuccess("Settings reset. Click Save to apply changes.");
  }
}

function setSaveLoading(loading) {
  elements.saveBtnText.classList.toggle("hidden", loading);
  elements.saveBtnLoader.classList.toggle("hidden", !loading);
  elements.form.querySelector('button[type="submit"]').disabled = loading;
}

function setTestLoading(loading) {
  elements.testBtnText.classList.toggle("hidden", loading);
  elements.testBtnLoader.classList.toggle("hidden", !loading);
  elements.testConnection.disabled = loading;
}

function showSuccess(message = "Settings saved successfully!") {
  elements.successMessage.querySelector("span").textContent = message;
  elements.successMessage.classList.remove("hidden");
  elements.errorMessage.classList.add("hidden");

  // Auto-hide after 5 seconds
  setTimeout(() => {
    elements.successMessage.classList.add("hidden");
  }, 5000);
}

function showError(message) {
  elements.errorText.textContent = message;
  elements.errorMessage.classList.remove("hidden");
  elements.successMessage.classList.add("hidden");
}

function hideAlerts() {
  elements.successMessage.classList.add("hidden");
  elements.errorMessage.classList.add("hidden");
}
