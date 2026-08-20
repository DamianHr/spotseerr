// Registry mapping site ids to their structured-media extractors.
// Sites absent from this map fall back to title cleaning in the background.

import type { ChannelExtractor, SiteExtractor } from "./types";
import { extractImdb } from "./imdb";
import { extractYoutubeChannel } from "./youtube";

const EXTRACTORS: Record<string, SiteExtractor> = {
  imdb: extractImdb,
};

const CHANNEL_EXTRACTORS: Record<string, ChannelExtractor> = {
  youtube: extractYoutubeChannel,
};

export function getExtractor(siteId: string): SiteExtractor | null {
  return EXTRACTORS[siteId] ?? null;
}

export function getChannelExtractor(siteId: string): ChannelExtractor | null {
  return CHANNEL_EXTRACTORS[siteId] ?? null;
}

export type { ChannelExtractor, SiteExtractor, StructuredMedia } from "./types";
