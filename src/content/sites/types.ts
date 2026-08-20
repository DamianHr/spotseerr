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
