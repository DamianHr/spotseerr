#!/usr/bin/env -S deno run --allow-read --allow-write --allow-net --allow-run

/**
 * Convert SVG icons to PNG using Deno
 * This script uses resvg-wasm for SVG to PNG conversion
 */
interface IconConfig {
  input: string;
  output: string;
  size: number;
}

const icons: IconConfig[] = [
  { input: "icon16.svg", output: "icon16.png", size: 16 },
  { input: "icon32.svg", output: "icon32.png", size: 32 },
  { input: "icon48.svg", output: "icon48.png", size: 48 },
  { input: "icon128.svg", output: "icon128.png", size: 128 },
];

/**
 * Convert SVG to PNG using ImageMagick if available, or provide instructions
 */
async function convertIcon(icon: IconConfig): Promise<void> {
  try {
    const inputPath = `./icons/${icon.input}`;
    const outputPath = `./icons/${icon.output}`;

    // Check if input file exists
    try {
      await Deno.stat(inputPath);
    } catch {
      console.error(`✗ Input file not found: ${icon.input}`);
      return;
    }

    // Try to use ImageMagick convert command
    const command = new Deno.Command("convert", {
      args: [
        inputPath,
        "-resize",
        `${icon.size}x${icon.size}`,
        "-background",
        "none",
        outputPath,
      ],
      stdout: "piped",
      stderr: "piped",
    });

    const { success, stderr } = await command.output();

    if (success) {
      console.log(
        `✓ ${icon.input} → ${icon.output} (${icon.size}x${icon.size})`,
      );
    } else {
      const errorMessage = new TextDecoder().decode(stderr);
      throw new Error(`ImageMagick failed: ${errorMessage}`);
    }
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      console.error(`✗ Error converting ${icon.input}: ImageMagick not found`);
      console.log(
        "  Please install ImageMagick: https://imagemagick.org/script/download.php",
      );
    } else {
      console.error(
        `✗ Error converting ${icon.input}:`,
        (error as Error).message,
      );
    }
  }
}

/**
 * Alternative: Use rsvg-convert if available (usually comes with librsvg)
 */
async function convertIconWithRsvg(icon: IconConfig): Promise<boolean> {
  try {
    const inputPath = `./icons/${icon.input}`;
    const outputPath = `./icons/${icon.output}`;

    const command = new Deno.Command("rsvg-convert", {
      args: [
        "-w",
        icon.size.toString(),
        "-h",
        icon.size.toString(),
        "-o",
        outputPath,
        inputPath,
      ],
      stdout: "piped",
      stderr: "piped",
    });

    const { success } = await command.output();

    if (success) {
      console.log(
        `✓ ${icon.input} → ${icon.output} (${icon.size}x${icon.size})`,
      );
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Check which conversion tool is available
 */
async function checkAvailableTools(): Promise<"imagemagick" | "rsvg" | "none"> {
  try {
    const command = new Deno.Command("convert", { args: ["--version"] });
    const { success } = await command.output();
    if (success) return "imagemagick";
  } catch {
    // ImageMagick not found, try rsvg
  }

  try {
    const command = new Deno.Command("rsvg-convert", { args: ["--version"] });
    const { success } = await command.output();
    if (success) return "rsvg";
  } catch {
    // rsvg not found either
  }

  return "none";
}

async function main(): Promise<void> {
  console.log("Converting SVG icons to PNG...\n");

  const tool = await checkAvailableTools();

  if (tool === "none") {
    console.error("No SVG conversion tool found!");
    console.log("\nPlease install one of the following:");
    console.log("  • ImageMagick: https://imagemagick.org/script/download.php");
    console.log(
      "  • librsvg (provides rsvg-convert): https://wiki.gnome.org/Projects/LibRsvg",
    );
    console.log("\nOn macOS with Homebrew:");
    console.log("  brew install imagemagick");
    console.log("  or");
    console.log("  brew install librsvg");
    console.log("\nOn Ubuntu/Debian:");
    console.log("  sudo apt-get install imagemagick");
    console.log("  or");
    console.log("  sudo apt-get install librsvg2-bin");
    Deno.exit(1);
  }

  console.log(
    `Using ${tool === "imagemagick" ? "ImageMagick" : "rsvg-convert"} for conversion\n`,
  );

  for (const icon of icons) {
    if (tool === "rsvg") {
      const success = await convertIconWithRsvg(icon);
      if (!success) {
        await convertIcon(icon); // Fallback to ImageMagick
      }
    } else {
      await convertIcon(icon);
    }
  }

  console.log("\nDone!");
}

// Run main if this is the main module
if (import.meta.main) {
  main().catch((error) => {
    console.error("Fatal error:", error);
    Deno.exit(1);
  });
}
