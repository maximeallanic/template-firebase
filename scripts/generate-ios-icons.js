/**
 * Generate iOS App Icons
 *
 * This script generates the required iOS app icon from the source icon.
 * Usage: node scripts/generate-ios-icons.js
 */

import sharp from 'sharp';
import { mkdir } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

const SOURCE_ICON = join(projectRoot, 'public/icon-512.png');
const IOS_ICONS_DIR = join(projectRoot, 'ios/App/App/Assets.xcassets/AppIcon.appiconset');

async function generateIcons() {
  console.log('Generating iOS app icons...');

  // Ensure output directory exists
  await mkdir(IOS_ICONS_DIR, { recursive: true });

  // iOS 15+ requires a single 1024x1024 icon
  // We upscale from 512x512 (or ideally use a larger source)
  const iconSizes = [
    { name: 'AppIcon-512@2x.png', size: 1024 }
  ];

  for (const icon of iconSizes) {
    const outputPath = join(IOS_ICONS_DIR, icon.name);
    await sharp(SOURCE_ICON)
      .resize(icon.size, icon.size, {
        kernel: sharp.kernel.lanczos3,
        fit: 'contain'
      })
      .png()
      .toFile(outputPath);
    console.log(`  ✅ Generated ${icon.name} (${icon.size}x${icon.size})`);
  }

  console.log('\n✅ iOS icons generated successfully!');
}

generateIcons().catch(console.error);
