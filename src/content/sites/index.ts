// Registry mapping site ids to their structured-media extractors.
// Sites absent from this map fall back to title cleaning in the background.

import type { SiteExtractor, TitleExtractor } from "./types";
import { extractImdb } from "./imdb";
import { extractYoutubeTitle } from "./youtube";

const EXTRACTORS: Record<string, SiteExtractor> = {
  imdb: extractImdb,
};

const TITLE_EXTRACTORS: Record<string, TitleExtractor> = {
  youtube: extractYoutubeTitle,
};

export function getExtractor(siteId: string): SiteExtractor | null {
  return EXTRACTORS[siteId] ?? null;
}

export function getTitleExtractor(siteId: string): TitleExtractor | null {
  return TITLE_EXTRACTORS[siteId] ?? null;
}

export type { SiteExtractor, StructuredMedia, TitleExtractor } from "./types";
