// Alternative Node.js script to convert SVG icons to PNG
// Requires: npm install sharp

const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

const icons = [
  { input: 'icon16.svg', output: 'icon16.png', size: 16 },
  { input: 'icon32.svg', output: 'icon32.png', size: 32 },
  { input: 'icon48.svg', output: 'icon48.png', size: 48 },
  { input: 'icon128.svg', output: 'icon128.png', size: 128 }
];

async function convertIcons() {
  console.log('Converting SVG icons to PNG...\n');
  
  for (const icon of icons) {
    try {
      const inputPath = path.join(__dirname, 'icons', icon.input);
      const outputPath = path.join(__dirname, 'icons', icon.output);
      
      await sharp(inputPath)
        .resize(icon.size, icon.size)
        .png()
        .toFile(outputPath);
        
      console.log(`✓ ${icon.input} → ${icon.output} (${icon.size}x${icon.size})`);
    } catch (error) {
      console.error(`✗ Error converting ${icon.input}:`, error.message);
    }
  }
  
  console.log('\nDone!');
}

// Check if sharp is installed
async function checkDependencies() {
  try {
    require('sharp');
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const hasSharp = await checkDependencies();
  
  if (!hasSharp) {
    console.log('Installing sharp...');
    const { execSync } = require('child_process');
    try {
      execSync('npm install sharp', { stdio: 'inherit' });
    } catch (error) {
      console.error('Failed to install sharp. Please run: npm install sharp');
      process.exit(1);
    }
  }
  
  await convertIcons();
}

main().catch(console.error);
