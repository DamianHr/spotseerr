// Registry mapping site ids to their structured-media extractors.
// Sites absent from this map fall back to title cleaning in the background.

import type { SiteExtractor } from "./types";
import { extractImdb } from "./imdb";

const EXTRACTORS: Record<string, SiteExtractor> = {
  imdb: extractImdb,
};

export function getExtractor(siteId: string): SiteExtractor | null {
  return EXTRACTORS[siteId] ?? null;
}

export type { SiteExtractor, StructuredMedia } from "./types";
