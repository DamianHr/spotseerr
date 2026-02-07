// deno-lint-ignore-file no-console
//
const BASE_LOCALE = "en";
const LOCALES_DIR = "./_locales";

async function checkTranslations(): Promise<void> {
  const baseContent = await Deno.readTextFile(
    `${LOCALES_DIR}/${BASE_LOCALE}/messages.json`,
  );
  const baseKeys = Object.keys(JSON.parse(baseContent));
  let hasError = false;

  for await (const entry of Deno.readDir(LOCALES_DIR)) {
    if (entry.isDirectory && entry.name !== BASE_LOCALE) {
      const localePath = `${LOCALES_DIR}/${entry.name}/messages.json`;

      try {
        const content = await Deno.readTextFile(localePath);
        const keys = Object.keys(JSON.parse(content));
        const missing = baseKeys.filter((key) => !keys.includes(key));

        if (missing.length > 0) {
          console.error(
            `❌ Locale '${entry.name}' is missing keys: ${missing.join(", ")}`,
          );
          hasError = true;
        } else {
          console.log(`✅ Locale '${entry.name}' is fully synced.`);
        }
      } catch {
        console.error(
          `⚠️ Could not find or read messages.json for locale: ${entry.name}`,
        );
      }
    } else {
      console.log(`✅ No other Locale to sync.`);
    }
  }

  if (hasError) Deno.exit(1);
}

checkTranslations();
