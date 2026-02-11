// Parser utility function tests
// Run with: deno test tests/parser.test.js

import { cleanTitle, detectMediaType } from "../shared/parser.js";
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

// Tests for cleanTitle
Deno.test("cleanTitle - handles empty input", () => {
  const result = cleanTitle("");
  assertEquals(result, "");
});

Deno.test("cleanTitle - handles null input", () => {
  const result = cleanTitle(null);
  assertEquals(result, "");
});

Deno.test("cleanTitle - handles non-string input", () => {
  const result = cleanTitle(123);
  assertEquals(result, "");
});

Deno.test("cleanTitle - removes trailer keywords", () => {
  const result = cleanTitle("Dune: Part Two Official Trailer (2024)");
  assertEquals(result, "dune: part two");
});

Deno.test("cleanTitle - removes years in parentheses", () => {
  const result = cleanTitle("The Matrix (1999)");
  assertEquals(result, "the matrix");
});

Deno.test("cleanTitle - removes years in brackets", () => {
  const result = cleanTitle("Inception [2010]");
  assertEquals(result, "inception");
});

Deno.test("cleanTitle - removes resolution indicators", () => {
  const result = cleanTitle("Avatar 4K HDR");
  assertEquals(result, "avatar");
});

Deno.test("cleanTitle - removes channel suffixes", () => {
  const result = cleanTitle("Interstellar - MovieClip");
  assertEquals(result, "interstellar");
});

Deno.test("cleanTitle - removes multiple keywords", () => {
  const result = cleanTitle("Spider-Man No Way Home Final Extended Trailer 4K (2021)");
  assertEquals(result, "spider-man no way home final");
});

Deno.test("cleanTitle - removes hd keyword", () => {
  const result = cleanTitle("Breaking Bad HD");
  assertEquals(result, "breaking bad");
});

Deno.test("cleanTitle - removes 4k keyword", () => {
  const result = cleanTitle("The Last of Us 4K");
  assertEquals(result, "the last of us");
});

Deno.test("cleanTitle - handles em dash", () => {
  const result = cleanTitle("Top Gun – Maverick");
  assertEquals(result, "top gun");
});

Deno.test("cleanTitle - removes tv spot keyword", () => {
  const result = cleanTitle("Oppenheimer TV Spot");
  assertEquals(result, "oppenheimer");
});

Deno.test("cleanTitle - removes teaser keyword", () => {
  const result = cleanTitle("Dune Teaser");
  assertEquals(result, "dune");
});

Deno.test("cleanTitle - removes official keyword", () => {
  const result = cleanTitle("Video Official");
  assertEquals(result, "video");
});

Deno.test("cleanTitle - removes super bowl spot", () => {
  const result = cleanTitle("Movie Super Bowl Spot");
  assertEquals(result, "movie");
});

Deno.test("cleanTitle - handles pipe separators", () => {
  const result = cleanTitle("Dune: Part Two | Official Trailer");
  assertEquals(result, "dune: part two");
});

Deno.test("cleanTitle - handles ampersand in title", () => {
  const result = cleanTitle("Deadpool & Wolverine Official Trailer");
  assertEquals(result, "deadpool & wolverine");
});

Deno.test("cleanTitle - preserves foreign characters", () => {
  const result = cleanTitle("Joker: Folie à Deux Official Trailer");
  assertEquals(result, "joker: folie à deux");
});

Deno.test("cleanTitle - handles en dash separator", () => {
  const result = cleanTitle("The Batman – DC FanDome Teaser");
  assertEquals(result, "the batman");
});

Deno.test("cleanTitle - removes multiple pipes", () => {
  const result = cleanTitle("Stranger Things 5 | Title Reveal | Netflix");
  assertEquals(result, "stranger things 5");
});

Deno.test("cleanTitle - removes final trailer keyword", () => {
  const result = cleanTitle("Gladiator II | Official Final Trailer (2024)");
  assertEquals(result, "gladiator ii");
});

Deno.test("cleanTitle - removes super bowl trailer keyword", () => {
  const result = cleanTitle("Twisters | Super Bowl Trailer");
  assertEquals(result, "twisters");
});

Deno.test("cleanTitle - handles multiple year patterns", () => {
  const result = cleanTitle("Sonic the Hedgehog 3 (2024) - Official Trailer");
  assertEquals(result, "sonic the hedgehog 3");
});

Deno.test("cleanTitle - removes comic-con trailer keyword", () => {
  const result = cleanTitle("Guardians of the Galaxy Vol. 3 | Comic-Con Trailer");
  assertEquals(result, "guardians of the galaxy vol. 3");
});

Deno.test("cleanTitle - removes sdcc trailer keyword", () => {
  const result = cleanTitle("The Lord of the Rings: The Rings of Power – SDCC Trailer");
  assertEquals(result, "the lord of the rings: the rings of power");
});

Deno.test("cleanTitle - removes big game spot keyword", () => {
  const result = cleanTitle("Kingdom of the Planet of the Apes | Big Game Spot");
  assertEquals(result, "kingdom of the planet of the apes");
});

Deno.test("cleanTitle - removes celebration trailer keyword", () => {
  const result = cleanTitle("Star Wars: The Acolyte | Celebration Trailer");
  assertEquals(result, "star wars: the acolyte");
});

Deno.test("cleanTitle - handles all caps title", () => {
  const result = cleanTitle("THOR Trailer of 2024");
  assertEquals(result, "thor");
});

Deno.test("cleanTitle - removes first look teaser", () => {
  const result = cleanTitle("Superman (2025) | Official First Look Teaser");
  assertEquals(result, "superman");
});

Deno.test("cleanTitle - handles imax keyword", () => {
  const result = cleanTitle("James Bond 007: No Time To Die | IMAX Trailer");
  assertEquals(result, "james bond 007: no time to die");
});

Deno.test("cleanTitle - removes launch trailer keyword", () => {
  const result = cleanTitle("Mortal Kombat 1 - Official Launch Trailer");
  assertEquals(result, "mortal kombat 1");
});

Deno.test("cleanTitle - removes red band trailer", () => {
  const result = cleanTitle("The Boys Season 4 - Official Red Band Trailer");
  assertEquals(result, "the boys season 4");
});

Deno.test("cleanTitle - handles part patterns", () => {
  const result = cleanTitle("The Crown Season 6 | Part 1 Official Trailer");
  assertEquals(result, "the crown season 6");
});

Deno.test("cleanTitle - removes concept trailer keyword", () => {
  const result = cleanTitle("Beyond the Spider-Verse | Concept Trailer Fan-Made");
  assertEquals(result, "beyond the spider-verse");
});

Deno.test("cleanTitle - removes final season keyword", () => {
  const result = cleanTitle("The Umbrella Academy | The Final Season | Official Trailer");
  assertEquals(result, "the umbrella academy");
});

// Tests for detectMediaType
Deno.test("detectMediaType - returns tv for season", () => {
  const result = detectMediaType("Stranger Things Season 1 Trailer");
  assertEquals(result, "tv");
});

Deno.test("detectMediaType - returns tv for episode", () => {
  const result = detectMediaType("Episode 5: The Beginning");
  assertEquals(result, "tv");
});

Deno.test("detectMediaType - returns tv for series", () => {
  const result = detectMediaType("The Walking Dead Series Premiere");
  assertEquals(result, "tv");
});

Deno.test("detectMediaType - returns tv for tv show keyword", () => {
  const result = detectMediaType("This TV Show Review");
  assertEquals(result, "tv");
});

Deno.test("detectMediaType - returns tv for miniseries", () => {
  const result = detectMediaType("Chernobyl MiniSeries");
  assertEquals(result, "tv");
});

Deno.test("detectMediaType - returns tv for S01E01 pattern", () => {
  const result = detectMediaType("Game of Thrones S01E01 Winter Is Coming");
  assertEquals(result, "tv");
});

Deno.test("detectMediaType - returns movie by default", () => {
  const result = detectMediaType("The Dark Knight");
  assertEquals(result, "movie");
});

Deno.test("detectMediaType - returns movie for movie title", () => {
  const result = detectMediaType("Inception Official Movie Trailer");
  assertEquals(result, "movie");
});

Deno.test("detectMediaType - checks description when title is ambiguous", () => {
  const result = detectMediaType("The Crown", "This episode covers season 2");
  assertEquals(result, "tv");
});

Deno.test("detectMediaType - returns movie for film keyword", () => {
  const result = detectMediaType("Dune Film Review");
  assertEquals(result, "movie");
});

Deno.test("detectMediaType - handles empty strings", () => {
  const result = detectMediaType("", "");
  assertEquals(result, "movie");
});

Deno.test("detectMediaType - returns tv for television", () => {
  const result = detectMediaType("Documentary about television history");
  assertEquals(result, "tv");
});

Deno.test("detectMediaType - returns tv for tv series", () => {
  const result = detectMediaType("New tv series announcement");
  assertEquals(result, "tv");
});

Deno.test("detectMediaType - returns tv for season number", () => {
  const result = detectMediaType("House of the Dragon Season 2 Trailer");
  assertEquals(result, "tv");
});

Deno.test("detectMediaType - returns tv for part pattern", () => {
  const result = detectMediaType("The Crown Season 6 Part 1 Trailer");
  assertEquals(result, "tv");
});

Deno.test("detectMediaType - returns tv for first look teaser", () => {
  const result = detectMediaType("Severance Season 2 First Look Teaser");
  assertEquals(result, "tv");
});

Deno.test("detectMediaType - returns tv for official teaser", () => {
  const result = detectMediaType("The Bear Season 3 Official Teaser");
  assertEquals(result, "tv");
});

Deno.test("detectMediaType - returns tv for season 3", () => {
  const result = detectMediaType("The Mandalorian Season 3 Official Trailer");
  assertEquals(result, "tv");
});

Deno.test("detectMediaType - returns tv for part 2", () => {
  const result = detectMediaType("Yellowstone Season 5 Part 2 Teaser");
  assertEquals(result, "tv");
});

Deno.test("detectMediaType - returns tv for season 4", () => {
  const result = detectMediaType("Succession Season 4 Official Trailer");
  assertEquals(result, "tv");
});

Deno.test("detectMediaType - returns tv for season 4 teaser", () => {
  const result = detectMediaType("The Witcher Season 4 Teaser");
  assertEquals(result, "tv");
});

Deno.test("detectMediaType - returns tv for season 3 teaser", () => {
  const result = detectMediaType("Euphoria Season 3 Official Teaser");
  assertEquals(result, "tv");
});

Deno.test("detectMediaType - returns tv for season 2", () => {
  const result = detectMediaType("Squid Game Season 2 Official Teaser");
  assertEquals(result, "tv");
});
