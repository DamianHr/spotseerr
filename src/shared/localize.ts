export function initI18n(): void {
  const elements = document.querySelectorAll<HTMLElement>("[data-i18n]");

  elements.forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (key) {
      const translation = chrome.i18n.getMessage(key);
      if (translation) {
        el.textContent = translation;
      }
    }

    const placeholderKey = el.getAttribute("data-i18n-placeholder");
    if (placeholderKey) {
      const placeholderTranslation = chrome.i18n.getMessage(placeholderKey);
      if (placeholderTranslation && el instanceof HTMLInputElement) {
        el.placeholder = placeholderTranslation;
      }
    }

    const titleKey = el.getAttribute("data-i18n-title");
    if (titleKey) {
      const titleTranslation = chrome.i18n.getMessage(titleKey);
      if (titleTranslation) {
        el.title = titleTranslation;
      }
    }
  });
}
