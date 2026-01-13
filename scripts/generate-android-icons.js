/**
 * Generate Android App Icons (Adaptive Icons)
 *
 * This script generates the required Android app icons from the source icon.
 * Usage: node scripts/generate-android-icons.js
 */

import sharp from 'sharp';
import { mkdir } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

const SOURCE_ICON = join(projectRoot, 'public/icon-512.png');
const ANDROID_RES_DIR = join(projectRoot, 'android/app/src/main/res');

const BACKGROUND_COLOR = { r: 15, g: 23, b: 42 }; // #0f172a

// Android density configurations
const DENSITIES = [
  { name: 'mdpi', size: 48, foreground: 108 },
  { name: 'hdpi', size: 72, foreground: 162 },
  { name: 'xhdpi', size: 96, foreground: 216 },
  { name: 'xxhdpi', size: 144, foreground: 324 },
  { name: 'xxxhdpi', size: 192, foreground: 432 }
];

async function generateIcons() {
  console.log('Generating Android app icons...\n');

  for (const density of DENSITIES) {
    const mipmapDir = join(ANDROID_RES_DIR, `mipmap-${density.name}`);
    await mkdir(mipmapDir, { recursive: true });

    // Generate standard icon (ic_launcher.png)
    const iconPath = join(mipmapDir, 'ic_launcher.png');
    await sharp(SOURCE_ICON)
      .resize(density.size, density.size, {
        kernel: sharp.kernel.lanczos3,
        fit: 'contain',
        background: BACKGROUND_COLOR
      })
      .flatten({ background: BACKGROUND_COLOR })
      .png()
      .toFile(iconPath);
    console.log(`  ✅ Generated mipmap-${density.name}/ic_launcher.png (${density.size}x${density.size})`);

    // Generate round icon (ic_launcher_round.png)
    const roundIconPath = join(mipmapDir, 'ic_launcher_round.png');
    const roundMask = Buffer.from(
      `<svg width="${density.size}" height="${density.size}">
        <circle cx="${density.size / 2}" cy="${density.size / 2}" r="${density.size / 2}" fill="white"/>
      </svg>`
    );
    await sharp(SOURCE_ICON)
      .resize(density.size, density.size, {
        kernel: sharp.kernel.lanczos3,
        fit: 'contain',
        background: BACKGROUND_COLOR
      })
      .flatten({ background: BACKGROUND_COLOR })
      .composite([
        {
          input: roundMask,
          blend: 'dest-in'
        }
      ])
      .png()
      .toFile(roundIconPath);
    console.log(`  ✅ Generated mipmap-${density.name}/ic_launcher_round.png (${density.size}x${density.size})`);

    // Generate foreground layer for adaptive icons (ic_launcher_foreground.png)
    const foregroundPath = join(mipmapDir, 'ic_launcher_foreground.png');
    const logoSize = Math.floor(density.foreground * 0.5); // Logo at 50% of foreground
    const padding = Math.floor((density.foreground - logoSize) / 2);

    const logo = await sharp(SOURCE_ICON)
      .resize(logoSize, logoSize, { kernel: sharp.kernel.lanczos3 })
      .toBuffer();

    await sharp({
      create: {
        width: density.foreground,
        height: density.foreground,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    })
      .composite([
        {
          input: logo,
          left: padding,
          top: padding
        }
      ])
      .png()
      .toFile(foregroundPath);
    console.log(`  ✅ Generated mipmap-${density.name}/ic_launcher_foreground.png (${density.foreground}x${density.foreground})`);
  }

  console.log('\n✅ Android icons generated successfully!');
}

generateIcons().catch(console.error);
