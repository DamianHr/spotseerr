// YouTube extractor tests - Deno format
import { assertEquals } from "jsr:@std/assert@1";
import { parseTitle } from "../content/sites/youtube.ts";

Deno.test("parseTitle", async (t) => {
  await t.step("returns og:title when present", () => {
    assertEquals(
      parseTitle(["Dune: Part Two | Official Trailer", "json-ld name"]),
      "Dune: Part Two | Official Trailer",
    );
  });

  await t.step("falls back to next candidate when first is null", () => {
    assertEquals(parseTitle([null, "Fallback Title"]), "Fallback Title");
  });

  await t.step("falls back when first is undefined", () => {
    assertEquals(parseTitle([undefined, "Video Name"]), "Video Name");
  });

  await t.step("skips empty string and uses next", () => {
    assertEquals(parseTitle(["", "Real Title"]), "Real Title");
  });

  await t.step("skips whitespace-only and uses next", () => {
    assertEquals(parseTitle(["   ", "Real Title"]), "Real Title");
  });

  await t.step("trims the returned value", () => {
    assertEquals(parseTitle(["  Spaced Title  "]), "Spaced Title");
  });

  await t.step("returns null when all candidates are empty", () => {
    assertEquals(parseTitle(["", "   ", null, undefined]), null);
  });

  await t.step("returns null for empty input", () => {
    assertEquals(parseTitle([]), null);
  });
});
