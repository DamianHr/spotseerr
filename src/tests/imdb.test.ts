// IMDb extractor tests - Deno format
import { assertEquals } from "jsr:@std/assert@1";
import { parseJsonLdMedia } from "../content/sites/imdb.ts";

// Realistic fixture trimmed from live IMDb tt15239678 (Dune: Part Two).
// Includes nested @type noise (review.itemReviewed, trailer) that the
// parser must ignore in favor of the top-level @type.
const IMDB_MOVIE_REAL = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "Movie",
  "url": "https://www.imdb.com/title/tt15239678/",
  "name": "Dune: Part Two",
  "review": {
    "@type": "Review",
    "itemReviewed": { "@type": "Movie", "url": "https://www.imdb.com/title/tt15239678/" },
    "name": "The Dark Knight and Empire Strikes Back of our generation...",
  },
  "trailer": { "@type": "VideoObject", "name": "Final Trailer" },
  "datePublished": "2024-03-01",
  "duration": "PT2H46M",
});

Deno.test("parseJsonLdMedia", async (t) => {
  await t.step("extracts movie from real IMDb JSON-LD", () => {
    assertEquals(parseJsonLdMedia([IMDB_MOVIE_REAL]), {
      cleanedTitle: "Dune: Part Two",
      mediaType: "movie",
    });
  });

  await t.step("maps Movie type to movie", () => {
    assertEquals(
      parseJsonLdMedia(['{"@type":"Movie","name":"The Matrix"}']),
      { cleanedTitle: "The Matrix", mediaType: "movie" },
    );
  });

  await t.step("maps TVSeries type to tv", () => {
    assertEquals(
      parseJsonLdMedia(['{"@type":"TVSeries","name":"Breaking Bad"}']),
      { cleanedTitle: "Breaking Bad", mediaType: "tv" },
    );
  });

  await t.step("maps TVEpisode type to tv", () => {
    assertEquals(
      parseJsonLdMedia(['{"@type":"TVEpisode","name":"Ozymandias"}']),
      { cleanedTitle: "Ozymandias", mediaType: "tv" },
    );
  });

  await t.step("maps TVSeason type to tv", () => {
    assertEquals(
      parseJsonLdMedia(['{"@type":"TVSeason","name":"Stranger Things Season 4"}']),
      { cleanedTitle: "Stranger Things Season 4", mediaType: "tv" },
    );
  });

  await t.step("takes first element when @type is an array", () => {
    assertEquals(
      parseJsonLdMedia(['{"@type":["Movie","CreativeWork"],"name":"Inception"}']),
      { cleanedTitle: "Inception", mediaType: "movie" },
    );
  });

  await t.step("finds media in an array-wrapped payload", () => {
    assertEquals(
      parseJsonLdMedia(['[{"@type":"Person","name":"Nolan"},{"@type":"Movie","name":"Tenet"}]']),
      { cleanedTitle: "Tenet", mediaType: "movie" },
    );
  });

  await t.step("skips malformed JSON and continues to next script", () => {
    assertEquals(
      parseJsonLdMedia(["{not valid json", '{"@type":"Movie","name":"Dune"}']),
      { cleanedTitle: "Dune", mediaType: "movie" },
    );
  });

  await t.step("returns first valid match across multiple scripts", () => {
    assertEquals(
      parseJsonLdMedia([
        '{"@type":"BreadcrumbList"}',
        '{"@type":"TVSeries","name":"Andor"}',
        '{"@type":"Movie","name":"Skyfall"}',
      ]),
      { cleanedTitle: "Andor", mediaType: "tv" },
    );
  });

  await t.step("trims whitespace from name", () => {
    assertEquals(
      parseJsonLdMedia(['{"@type":"Movie","name":"  Arrival  "}']),
      { cleanedTitle: "Arrival", mediaType: "movie" },
    );
  });

  await t.step("returns null for unknown @type", () => {
    assertEquals(parseJsonLdMedia(['{"@type":"Person","name":"Zendaya"}']), null);
  });

  await t.step("returns null when name is empty", () => {
    assertEquals(parseJsonLdMedia(['{"@type":"Movie","name":""}']), null);
  });

  await t.step("returns null when name is whitespace only", () => {
    assertEquals(parseJsonLdMedia(['{"@type":"Movie","name":"   "}']), null);
  });

  await t.step("returns null when name is missing", () => {
    assertEquals(parseJsonLdMedia(['{"@type":"Movie"}']), null);
  });

  await t.step("returns null for empty input array", () => {
    assertEquals(parseJsonLdMedia([]), null);
  });

  await t.step("returns null for empty-string scripts", () => {
    assertEquals(parseJsonLdMedia(["", ""]), null);
  });

  await t.step("ignores nested @type, reads top-level only", () => {
    // Top-level is Person (invalid) even though a nested Movie exists.
    assertEquals(
      parseJsonLdMedia(['{"@type":"Person","name":"Director","knowsAbout":{"@type":"Movie","name":"Dune"}}']),
      null,
    );
  });
});
