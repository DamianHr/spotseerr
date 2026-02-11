// Shared utility functions for title cleaning and media detection

export function cleanTitle(title) {
  if (!title || typeof title !== "string") {
    return "";
  }

  let cleaned = title.toLowerCase();

  // Split on pipe and keep only the left part (the actual title)
  const pipeIndex = cleaned.indexOf("|");
  if (pipeIndex !== -1) {
    cleaned = cleaned.substring(0, pipeIndex);
  }

  const trailerKeywords = [
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

  // Find earliest trailer keyword and cut there (everything after is metadata)
  let earliestIndex = cleaned.length;
  let cutAtKeyword = false;
  for (const keyword of trailerKeywords) {
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

export function detectMediaType(title, description = "") {
  const text = (title + " " + description).toLowerCase();
  const tvKeywords = [
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

  for (const keyword of tvKeywords) {
    const regex = new RegExp(`\\b${keyword}\\b`, "i");
    if (regex.test(text)) {
      return "tv";
    }
  }

  return "movie";
}
