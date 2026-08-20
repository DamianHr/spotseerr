// YouTube extractor tests - Deno format
import { assertEquals } from "jsr:@std/assert@1";
import { parseChannel } from "../content/sites/youtube.ts";

Deno.test("parseChannel", async (t) => {
  await t.step("returns microdata name when present", () => {
    assertEquals(parseChannel(["Warner Bros.", "fallback"]), "Warner Bros.");
  });

  await t.step("falls back to second candidate when first is null", () => {
    assertEquals(parseChannel([null, "A24"]), "A24");
  });

  await t.step("falls back when first is undefined", () => {
    assertEquals(parseChannel([undefined, "Netflix"]), "Netflix");
  });

  await t.step("skips empty string and uses next", () => {
    assertEquals(parseChannel(["", "Marvel Entertainment"]), "Marvel Entertainment");
  });

  await t.step("skips whitespace-only and uses next", () => {
    assertEquals(parseChannel(["   ", "HBO"]), "HBO");
  });

  await t.step("trims the returned value", () => {
    assertEquals(parseChannel(["  Warner Bros.  "]), "Warner Bros.");
  });

  await t.step("returns null when all candidates are empty", () => {
    assertEquals(parseChannel(["", "   ", null, undefined]), null);
  });

  await t.step("returns null for empty input", () => {
    assertEquals(parseChannel([]), null);
  });
});
