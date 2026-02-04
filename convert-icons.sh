#!/bin/bash

# Script to convert SVG icons to PNG format using ImageMagick or Inkscape
# Run this script from the project root directory

echo "Converting SVG icons to PNG..."

# Check if ImageMagick is installed
if command -v convert &> /dev/null; then
    echo "Using ImageMagick..."
    convert -background none icons/icon16.svg -resize 16x16 icons/icon16.png
    convert -background none icons/icon32.svg -resize 32x32 icons/icon32.png
    convert -background none icons/icon48.svg -resize 48x48 icons/icon48.png
    convert -background none icons/icon128.svg -resize 128x128 icons/icon128.png
    echo "✓ Icons converted successfully!"
    
# Check if Inkscape is installed
elif command -v inkscape &> /dev/null; then
    echo "Using Inkscape..."
    inkscape -w 16 -h 16 icons/icon16.svg -o icons/icon16.png
    inkscape -w 32 -h 32 icons/icon32.svg -o icons/icon32.png
    inkscape -w 48 -h 48 icons/icon48.svg -o icons/icon48.png
    inkscape -w 128 -h 128 icons/icon128.svg -o icons/icon128.png
    echo "✓ Icons converted successfully!"
    
else
    echo "✗ Error: Neither ImageMagick nor Inkscape is installed."
    echo ""
    echo "Please install one of the following:"
    echo "  - ImageMagick: https://imagemagick.org/script/download.php"
    echo "  - Inkscape: https://inkscape.org/release/"
    echo ""
    echo "Or manually convert the SVG files to PNG using an online converter:"
    echo "  - https://convertio.co/svg-png/"
    echo "  - https://cloudconvert.com/svg-to-png"
    exit 1
fi

echo ""
echo "Icon files created:"
ls -lh icons/*.png