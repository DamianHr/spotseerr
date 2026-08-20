// IMDb-specific extractor.
// IMDb embeds JSON-LD structured data with canonical title and precise
// media type, so we read that directly instead of guessing from the title.

import type { SiteExtractor, StructuredMedia } from "./types";

const MOVIE_TYPES = ["Movie"];
const TV_TYPES = ["TVSeries", "TVEpisode", "TVSeason"];

// Pure core: given the raw text of JSON-LD <script> tags, return the first
// recognizable movie/tv media, or null. No DOM access — directly testable.
export function parseJsonLdMedia(jsonLdTexts: string[]): StructuredMedia | null {
  for (const text of jsonLdTexts) {
    if (!text) continue;

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      continue;
    }

    const candidates = Array.isArray(parsed) ? parsed : [parsed];
    for (const node of candidates) {
      if (!node || typeof node !== "object") continue;
      const obj = node as Record<string, unknown>;

      const rawType = obj["@type"];
      const type = Array.isArray(rawType) ? rawType[0] : rawType;
      const name = obj["name"];

      if (typeof type !== "string" || typeof name !== "string" || !name.trim()) {
        continue;
      }

      let mediaType: "movie" | "tv" | null = null;
      if (MOVIE_TYPES.includes(type)) mediaType = "movie";
      else if (TV_TYPES.includes(type)) mediaType = "tv";

      if (!mediaType) continue;

      return { cleanedTitle: name.trim(), mediaType };
    }
  }

  return null;
}

// DOM shell: collect JSON-LD script texts from the page, delegate to the
// pure core.
export const extractImdb: SiteExtractor = (): StructuredMedia | null => {
  try {
    const scripts = globalThis.document.querySelectorAll<HTMLScriptElement>(
      'script[type="application/ld+json"]',
    );
    const texts = Array.from(scripts).map((s) => s.textContent ?? "");
    return parseJsonLdMedia(texts);
  } catch {
    return null;
  }
};
