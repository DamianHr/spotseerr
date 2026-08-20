// YouTube-specific extractor.
// YouTube does not expose a clean canonical media title (the video title
// needs cleaning), but it does expose the uploading channel via stable
// schema.org microdata. The channel name is an extra match signal (e.g.
// "Warner Bros." hints at a studio-published trailer).

import type { ChannelExtractor } from "./types";

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
