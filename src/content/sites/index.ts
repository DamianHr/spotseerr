// Registry mapping site ids to their structured-media extractors.
// Sites absent from this map fall back to title cleaning in the background.

import type { ChannelExtractor, SiteExtractor, TitleExtractor } from "./types";
import { extractImdb } from "./imdb";
import { extractYoutubeChannel, extractYoutubeTitle } from "./youtube";

const EXTRACTORS: Record<string, SiteExtractor> = {
  imdb: extractImdb,
};

const CHANNEL_EXTRACTORS: Record<string, ChannelExtractor> = {
  youtube: extractYoutubeChannel,
};

const TITLE_EXTRACTORS: Record<string, TitleExtractor> = {
  youtube: extractYoutubeTitle,
};

export function getExtractor(siteId: string): SiteExtractor | null {
  return EXTRACTORS[siteId] ?? null;
}

export function getChannelExtractor(siteId: string): ChannelExtractor | null {
  return CHANNEL_EXTRACTORS[siteId] ?? null;
}

export function getTitleExtractor(siteId: string): TitleExtractor | null {
  return TITLE_EXTRACTORS[siteId] ?? null;
}

export type { ChannelExtractor, SiteExtractor, StructuredMedia, TitleExtractor } from "./types";
