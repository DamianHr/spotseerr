// Shared utility functions for title cleaning and media detection

const TRAILER_KEYWORDS = [
  "official trailer",
  "teaser trailer",
  "trailer",
  "teaser",
  "clip",
  "featurette",
  "behind the scenes",
  "bloopers",
  "exclusive",
  "first look",
  "final trailer",
  "red band trailer",
  "green band trailer",
  "international trailer",
  "extended trailer",
  "movie clip",
  "movieclip",
  "scene",
  "tv spot",
  "super bowl spot",
  "official",
  "hd",
  "4k",
  "ultra hd",
  "title reveal",
  "concept",
  "fan-made",
  "fan made",
  "miniseries",
  "comic-con",
  "sdcc",
  "big game spot",
  "imax",
];

const TV_KEYWORDS = [
  "season",
  "episode",
  "series",
  "s\\d+",
  "e\\d+",
  "s\\d+e\\d+",
  "tv series",
  "miniseries",
  "tv show",
  "television",
];

export function cleanTitle(title: unknown): string {
  if (!title || typeof title !== "string") {
    return "";
  }

  let cleaned = title.toLowerCase();

  const pipeIndex = cleaned.indexOf("|");
  if (pipeIndex !== -1) {
    cleaned = cleaned.substring(0, pipeIndex);
  }

  let earliestIndex = cleaned.length;
  let cutAtKeyword = false;
  for (const keyword of TRAILER_KEYWORDS) {
    const index = cleaned.indexOf(keyword);
    if (index !== -1 && index < earliestIndex) {
      earliestIndex = index;
      cutAtKeyword = true;
    }
  }
  if (cutAtKeyword) {
    cleaned = cleaned.substring(0, earliestIndex);
  }

  const yearPattern = /\(\d{4}\)|\[\d{4}\]|\(\d{4}\s+[^)]+\)/gi;
  const channelPattern = /[|–—]\s*[^|–—]+$/;
  const resolutionPattern = /\b\d{3,4}p\b|\b4k\b|\bhd\b|\buhd\b/gi;
  const partPattern = /\bpart\s*\d+\b/gi;

  cleaned = cleaned
    .replace(yearPattern, "")
    .replace(channelPattern, "")
    .replace(resolutionPattern, "")
    .replace(partPattern, "")
    .replace(/[()[\]{}]/g, "")
    .replace(/\s*[^a-z0-9]+$/, "")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned;
}

export function detectMediaType(title: unknown, description: unknown = ""): "movie" | "tv" {
  const text = (String(title) + " " + String(description)).toLowerCase();

  for (const keyword of TV_KEYWORDS) {
    const regex = new RegExp(`\\b${keyword}\\b`, "i");
    if (regex.test(text)) {
      return "tv";
    }
  }

  return "movie";
}
