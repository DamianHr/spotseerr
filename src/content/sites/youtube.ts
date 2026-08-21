// YouTube-specific extractor.
// YouTube does not expose a clean canonical media title (the video title
// needs cleaning), but it does expose the uploading channel via stable
// schema.org microdata. The channel name is an extra match signal (e.g.
// "Warner Bros." hints at a studio-published trailer).

import type { ChannelExtractor, TitleExtractor } from "./types";

// Pure core: given the candidate channel strings (microdata author name,
// then fallback element text), return the first non-empty trimmed value.
// No DOM access — directly testable.
export function parseChannel(candidates: (string | null | undefined)[]): string | null {
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }
  return null;
}

// DOM shell: read channel from stable microdata first, then fall back to
// the (shady-DOM) channel-name element text.
export const extractYoutubeChannel: ChannelExtractor = (): string | null => {
  try {
    const doc = globalThis.document;

    // Primary: <span itemprop="author"><link itemprop="name" content="..."></span>
    const microdata = doc.querySelector<HTMLLinkElement>(
      'span[itemprop="author"] link[itemprop="name"]',
    );
    const microdataName = microdata?.getAttribute("content");

    // Fallback: rendered channel-name text.
    const fallbackEl = doc.querySelector<HTMLElement>(
      "ytd-channel-name #text",
    );
    const fallbackText = fallbackEl?.textContent;

    return parseChannel([microdataName, fallbackText]);
  } catch {
    return null;
  }
};

// Pure core: given candidate raw-title strings (og:title, JSON-LD name,
// document.title fallback), return the first non-empty trimmed value.
// No DOM access — directly testable.
export function parseTitle(candidates: (string | null | undefined)[]): string | null {
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }
  return null;
}

// DOM shell: read a cleaner raw title from structured metadata. YouTube's
// og:title / JSON-LD VideoObject.name omit the " - YouTube" suffix that
// document.title carries, giving title cleaning a better starting string.
// These come from server-rendered <meta>/<script> tags, so they are
// populated before JS hydration (unlike the visible <h1>).
export const extractYoutubeTitle: TitleExtractor = (): string | null => {
  try {
    const doc = globalThis.document;

    // Primary: Open Graph title.
    const ogTitle = doc
      .querySelector<HTMLMetaElement>('meta[property="og:title"]')
      ?.getAttribute("content");

    // Secondary: schema.org microdata name (itemprop on a meta element).
    const itempropTitle = doc
      .querySelector<HTMLMetaElement>('meta[itemprop="name"]')
      ?.getAttribute("content");

    // Tertiary: JSON-LD VideoObject.name.
    let jsonLdName: string | null = null;
    const scripts = doc.querySelectorAll<HTMLScriptElement>(
      'script[type="application/ld+json"]',
    );
    for (const script of Array.from(scripts)) {
      try {
        const parsed = JSON.parse(script.textContent ?? "");
        const candidates = Array.isArray(parsed) ? parsed : [parsed];
        for (const c of candidates) {
          if (c && typeof c.name === "string" && c.name.trim()) {
            jsonLdName = c.name;
            break;
          }
        }
      } catch {
        continue;
      }
      if (jsonLdName) break;
    }

    return parseTitle([ogTitle, itempropTitle, jsonLdName]);
  } catch {
    return null;
  }
};
