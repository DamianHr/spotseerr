// Shared types for site-specific content extractors.
// Each supported site provides an extractor that pulls structured media
// info directly from the page (e.g. JSON-LD), bypassing title cleaning.

export interface StructuredMedia {
  cleanedTitle: string;
  mediaType: "movie" | "tv";
}

// A site extractor inspects the current document and returns structured
// media info when available, or null to fall back to title cleaning.
export type SiteExtractor = () => StructuredMedia | null;

// A title extractor pulls a cleaner raw title from structured page
// metadata (e.g. og:title, JSON-LD VideoObject.name) instead of the noisy
// document.title. The result still passes through title cleaning; this
// just provides a better starting string. Returns null when unavailable.
export type TitleExtractor = () => string | null;
