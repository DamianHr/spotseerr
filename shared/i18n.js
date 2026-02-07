// Simple i18n helper - translates elements with data-i18n attributes
// Usage:
//   data-i18n="key" - translates text content
//   data-i18n-title="key" - translates title attribute
//   data-i18n-placeholder="key" - translates placeholder attribute

function applyTranslations() {
  // Translate text content
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    const translated = chrome.i18n.getMessage(key);
    if (translated) {
      el.textContent = translated;
    }
  });

  // Translate title attributes
  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    const key = el.getAttribute("data-i18n-title");
    const translated = chrome.i18n.getMessage(key);
    if (translated) {
      el.setAttribute("title", translated);
    }
  });

  // Translate placeholder attributes
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    const translated = chrome.i18n.getMessage(key);
    if (translated) {
      el.setAttribute("placeholder", translated);
    }
  });

  // Translate document title
  const titleEl = document.querySelector("title[data-i18n]");
  if (titleEl) {
    const key = titleEl.getAttribute("data-i18n");
    const translated = chrome.i18n.getMessage(key);
    if (translated) {
      document.title = translated;
    }
  }
}

// Run when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", applyTranslations);
} else {
  applyTranslations();
}
