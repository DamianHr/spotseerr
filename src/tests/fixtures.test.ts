// Real-world cleanTitle regression fixtures.
// Corpus of actual YouTube trailer titles (harvested from live search)
// paired with their expected cleaned output. Guards against regressions
// in cleanTitle() when TRAILER_KEYWORDS or the strip patterns change.
import { assertEquals } from "jsr:@std/assert@1";
import { cleanTitle } from "../shared/parser.ts";

// { rawTitle -> expectedClean }. Outputs are lowercase by design.
const FIXTURES: ReadonlyArray<readonly [string, string]> = [
  ["THE SUBSTANCE | Official Trailer | In Theaters & On MUBI Now", "the substance"],
  ["RED ONE | Official Trailer", "red one"],
  ["Civil War | Official Trailer HD | A24", "civil war"],
  ["Here - Official Trailer (HD)", "here"],
  ["Never Let Go (2024) Official Trailer – Halle Berry", "never let go"],
  ["Road House - Official Trailer | Prime Video", "road house"],
  ["A Quiet Place: Day One | Official Trailer (2024 Movie) - Lupita Nyong'o", "a quiet place: day one"],
  ["Joker: Folie À Deux | Official Trailer", "joker: folie à deux"],
  ["After The End (2024) - Official Movie Trailer (HD)", "after the end"],
  ["NOSFERATU - Official Trailer [HD] - Only In Theaters December 25", "nosferatu"],
  ["IF | Final Trailer (2024 Movie) - Ryan Reynolds", "if"],
  ["Armor (2024) Official Trailer - Jason Patric", "armor"],
  ["The Crow (2024) Official Trailer - Bill Skarsgård", "the crow"],
  ["TOGETHER - Official Trailer - In Theaters July 30", "together"],
  ["Long Gone Heroes (2024) Official Trailer", "long gone heroes"],
  ["Continue (2024) Official Trailer - Nadine Crocker", "continue"],
  ["Relay | Official Trailer | Bleecker Street", "relay"],
  ["LONGLEGS | Official Trailer | In Theaters July 12", "longlegs"],
  ["Trap | Official Trailer", "trap"],
];

Deno.test("cleanTitle real-world trailer fixtures", async (t) => {
  for (const [raw, expected] of FIXTURES) {
    await t.step(`${raw.slice(0, 48)} -> ${expected}`, () => {
      assertEquals(cleanTitle(raw), expected);
    });
  }
});
