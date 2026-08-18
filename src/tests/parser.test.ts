// Parser utility function tests - Deno format
import { assertEquals } from "jsr:@std/assert@1";
import { cleanTitle, detectMediaType } from "../shared/parser.ts";

Deno.test("cleanTitle", async (t) => {
  await t.step("handles empty input", () => {
    assertEquals(cleanTitle(""), "");
  });

  await t.step("handles null input", () => {
    assertEquals(cleanTitle(null), "");
  });

  await t.step("handles non-string input", () => {
    assertEquals(cleanTitle(123), "");
  });

  await t.step("removes trailer keywords", () => {
    assertEquals(cleanTitle("Dune: Part Two Official Trailer (2024)"), "dune: part two");
  });

  await t.step("removes years in parentheses", () => {
    assertEquals(cleanTitle("The Matrix (1999)"), "the matrix");
  });

  await t.step("removes years in brackets", () => {
    assertEquals(cleanTitle("Inception [2010]"), "inception");
  });

  await t.step("removes resolution indicators", () => {
    assertEquals(cleanTitle("Avatar 4K HDR"), "avatar");
  });

  await t.step("removes channel suffixes", () => {
    assertEquals(cleanTitle("Interstellar - MovieClip"), "interstellar");
  });

  await t.step("removes multiple keywords", () => {
    assertEquals(
      cleanTitle("Spider-Man No Way Home Final Extended Trailer 4K (2021)"),
      "spider-man no way home final",
    );
  });

  await t.step("removes hd keyword", () => {
    assertEquals(cleanTitle("Breaking Bad HD"), "breaking bad");
  });

  await t.step("removes 4k keyword", () => {
    assertEquals(cleanTitle("The Last of Us 4K"), "the last of us");
  });

  await t.step("handles em dash", () => {
    assertEquals(cleanTitle("Top Gun – Maverick"), "top gun");
  });

  await t.step("removes tv spot keyword", () => {
    assertEquals(cleanTitle("Oppenheimer TV Spot"), "oppenheimer");
  });

  await t.step("removes teaser keyword", () => {
    assertEquals(cleanTitle("Dune Teaser"), "dune");
  });

  await t.step("removes official keyword", () => {
    assertEquals(cleanTitle("Video Official"), "video");
  });

  await t.step("removes super bowl spot", () => {
    assertEquals(cleanTitle("Movie Super Bowl Spot"), "movie");
  });

  await t.step("handles pipe separators", () => {
    assertEquals(cleanTitle("Dune: Part Two | Official Trailer"), "dune: part two");
  });

  await t.step("handles ampersand in title", () => {
    assertEquals(cleanTitle("Deadpool & Wolverine Official Trailer"), "deadpool & wolverine");
  });

  await t.step("preserves foreign characters", () => {
    assertEquals(cleanTitle("Joker: Folie à Deux Official Trailer"), "joker: folie à deux");
  });

  await t.step("handles en dash separator", () => {
    assertEquals(cleanTitle("The Batman – DC FanDome Teaser"), "the batman");
  });

  await t.step("removes multiple pipes", () => {
    assertEquals(cleanTitle("Stranger Things 5 | Title Reveal | Netflix"), "stranger things 5");
  });

  await t.step("removes final trailer keyword", () => {
    assertEquals(cleanTitle("Gladiator II | Official Final Trailer (2024)"), "gladiator ii");
  });

  await t.step("removes super bowl trailer keyword", () => {
    assertEquals(cleanTitle("Twisters | Super Bowl Trailer"), "twisters");
  });

  await t.step("handles multiple year patterns", () => {
    assertEquals(cleanTitle("Sonic the Hedgehog 3 (2024) - Official Trailer"), "sonic the hedgehog 3");
  });

  await t.step("removes comic-con trailer keyword", () => {
    assertEquals(
      cleanTitle("Guardians of the Galaxy Vol. 3 | Comic-Con Trailer"),
      "guardians of the galaxy vol. 3",
    );
  });

  await t.step("removes sdcc trailer keyword", () => {
    assertEquals(
      cleanTitle("The Lord of the Rings: The Rings of Power – SDCC Trailer"),
      "the lord of the rings: the rings of power",
    );
  });

  await t.step("removes big game spot keyword", () => {
    assertEquals(
      cleanTitle("Kingdom of the Planet of the Apes | Big Game Spot"),
      "kingdom of the planet of the apes",
    );
  });

  await t.step("removes celebration trailer keyword", () => {
    assertEquals(cleanTitle("Star Wars: The Acolyte | Celebration Trailer"), "star wars: the acolyte");
  });

  await t.step("handles all caps title", () => {
    assertEquals(cleanTitle("THOR Trailer of 2024"), "thor");
  });

  await t.step("removes first look teaser", () => {
    assertEquals(cleanTitle("Superman (2025) | Official First Look Teaser"), "superman");
  });

  await t.step("handles imax keyword", () => {
    assertEquals(
      cleanTitle("James Bond 007: No Time To Die | IMAX Trailer"),
      "james bond 007: no time to die",
    );
  });

  await t.step("removes launch trailer keyword", () => {
    assertEquals(cleanTitle("Mortal Kombat 1 - Official Launch Trailer"), "mortal kombat 1");
  });

  await t.step("removes red band trailer", () => {
    assertEquals(cleanTitle("The Boys Season 4 - Official Red Band Trailer"), "the boys season 4");
  });

  await t.step("handles part patterns", () => {
    assertEquals(cleanTitle("The Crown Season 6 | Part 1 Official Trailer"), "the crown season 6");
  });

  await t.step("removes concept trailer keyword", () => {
    assertEquals(cleanTitle("Beyond the Spider-Verse | Concept Trailer Fan-Made"), "beyond the spider-verse");
  });

  await t.step("removes final season keyword", () => {
    assertEquals(
      cleanTitle("The Umbrella Academy | The Final Season | Official Trailer"),
      "the umbrella academy",
    );
  });
});

Deno.test("detectMediaType", async (t) => {
  await t.step("returns tv for season", () => {
    assertEquals(detectMediaType("Stranger Things Season 1 Trailer"), "tv");
  });

  await t.step("returns tv for episode", () => {
    assertEquals(detectMediaType("Episode 5: The Beginning"), "tv");
  });

  await t.step("returns tv for series", () => {
    assertEquals(detectMediaType("The Walking Dead Series Premiere"), "tv");
  });

  await t.step("returns tv for tv show keyword", () => {
    assertEquals(detectMediaType("This TV Show Review"), "tv");
  });

  await t.step("returns tv for miniseries", () => {
    assertEquals(detectMediaType("Chernobyl MiniSeries"), "tv");
  });

  await t.step("returns tv for S01E01 pattern", () => {
    assertEquals(detectMediaType("Game of Thrones S01E01 Winter Is Coming"), "tv");
  });

  await t.step("returns movie by default", () => {
    assertEquals(detectMediaType("The Dark Knight"), "movie");
  });

  await t.step("returns movie for movie title", () => {
    assertEquals(detectMediaType("Inception Official Movie Trailer"), "movie");
  });

  await t.step("checks description when title is ambiguous", () => {
    assertEquals(detectMediaType("The Crown", "This episode covers season 2"), "tv");
  });

  await t.step("returns movie for film keyword", () => {
    assertEquals(detectMediaType("Dune Film Review"), "movie");
  });

  await t.step("handles empty strings", () => {
    assertEquals(detectMediaType("", ""), "movie");
  });

  await t.step("returns tv for television", () => {
    assertEquals(detectMediaType("Documentary about television history"), "tv");
  });

  await t.step("returns tv for tv series", () => {
    assertEquals(detectMediaType("New tv series announcement"), "tv");
  });

  await t.step("returns tv for season number", () => {
    assertEquals(detectMediaType("House of the Dragon Season 2 Trailer"), "tv");
  });

  await t.step("returns tv for part pattern", () => {
    assertEquals(detectMediaType("The Crown Season 6 Part 1 Trailer"), "tv");
  });

  await t.step("returns tv for first look teaser", () => {
    assertEquals(detectMediaType("Severance Season 2 First Look Teaser"), "tv");
  });

  await t.step("returns tv for official teaser", () => {
    assertEquals(detectMediaType("The Bear Season 3 Official Teaser"), "tv");
  });

  await t.step("returns tv for season 3", () => {
    assertEquals(detectMediaType("The Mandalorian Season 3 Official Trailer"), "tv");
  });

  await t.step("returns tv for part 2", () => {
    assertEquals(detectMediaType("Yellowstone Season 5 Part 2 Teaser"), "tv");
  });

  await t.step("returns tv for season 4", () => {
    assertEquals(detectMediaType("Succession Season 4 Official Trailer"), "tv");
  });

  await t.step("returns tv for season 4 teaser", () => {
    assertEquals(detectMediaType("The Witcher Season 4 Teaser"), "tv");
  });

  await t.step("returns tv for season 3 teaser", () => {
    assertEquals(detectMediaType("Euphoria Season 3 Official Teaser"), "tv");
  });

  await t.step("returns tv for season 2", () => {
    assertEquals(detectMediaType("Squid Game Season 2 Official Teaser"), "tv");
  });
});
