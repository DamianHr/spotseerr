// Utility functions

export function truncateText(text: string, maxLength = 50): string {
  if (!text || text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength - 3) + "...";
}

export function isValidUrl(url: string): boolean {
  if (!url) return false;

  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}
