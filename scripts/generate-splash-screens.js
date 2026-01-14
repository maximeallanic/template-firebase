/**
 * Generate Splash Screen Images for iOS and Android
 *
 * Creates splash screens with the logo centered on a dark background.
 * Usage: node scripts/generate-splash-screens.js
 */

import sharp from 'sharp';
import { mkdir } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

const SOURCE_LOGO = join(projectRoot, 'public/icon-512.png');
const IOS_SPLASH_DIR = join(projectRoot, 'ios/App/App/Assets.xcassets/Splash.imageset');
const ANDROID_SPLASH_DIR = join(projectRoot, 'android/app/src/main/res');

const BACKGROUND_COLOR = { r: 15, g: 23, b: 42 }; // #0f172a

/**
 * Create a splash screen image with centered logo
 */
async function createSplashScreen(outputPath, width, height, logoSize) {
  const logo = await sharp(SOURCE_LOGO)
    .resize(logoSize, logoSize, { kernel: sharp.kernel.lanczos3 })
    .toBuffer();

  const logoX = Math.floor((width - logoSize) / 2);
  const logoY = Math.floor((height - logoSize) / 2);

  await sharp({
    create: {
      width,
      height,
      channels: 3,
      background: BACKGROUND_COLOR
    }
  })
    .composite([
      {
        input: logo,
        left: logoX,
        top: logoY
      }
    ])
    .png()
    .toFile(outputPath);
}

async function generateIOSSplashScreens() {
  console.log('Generating iOS splash screens...');
  await mkdir(IOS_SPLASH_DIR, { recursive: true });

  // iOS uses 2732x2732 for universal splash
  const configs = [
    { name: 'splash-2732x2732-2.png', size: 2732, logo: 400 }, // 1x
    { name: 'splash-2732x2732-1.png', size: 2732, logo: 400 }, // 2x
    { name: 'splash-2732x2732.png', size: 2732, logo: 400 }    // 3x
  ];

  for (const config of configs) {
    const outputPath = join(IOS_SPLASH_DIR, config.name);
    await createSplashScreen(outputPath, config.size, config.size, config.logo);
    console.log(`  ✅ Generated ${config.name}`);
  }
}

async function generateAndroidSplashScreens() {
  console.log('\nGenerating Android splash screens...');

  // Android uses drawable folders with different densities
  const configs = [
    { folder: 'drawable', width: 480, height: 800, logo: 200 },
    { folder: 'drawable-land-hdpi', width: 800, height: 480, logo: 150 },
    { folder: 'drawable-land-mdpi', width: 480, height: 320, logo: 100 },
    { folder: 'drawable-land-xhdpi', width: 1280, height: 720, logo: 200 },
    { folder: 'drawable-land-xxhdpi', width: 1600, height: 960, logo: 250 },
    { folder: 'drawable-land-xxxhdpi', width: 1920, height: 1280, logo: 300 },
    { folder: 'drawable-port-hdpi', width: 480, height: 800, logo: 150 },
    { folder: 'drawable-port-mdpi', width: 320, height: 480, logo: 100 },
    { folder: 'drawable-port-xhdpi', width: 720, height: 1280, logo: 200 },
    { folder: 'drawable-port-xxhdpi', width: 960, height: 1600, logo: 250 },
    { folder: 'drawable-port-xxxhdpi', width: 1280, height: 1920, logo: 300 }
  ];

  for (const config of configs) {
    const folderPath = join(ANDROID_SPLASH_DIR, config.folder);
    await mkdir(folderPath, { recursive: true });
    const outputPath = join(folderPath, 'splash.png');
    await createSplashScreen(outputPath, config.width, config.height, config.logo);
    console.log(`  ✅ Generated ${config.folder}/splash.png`);
  }
}

async function main() {
  console.log('🎨 Generating splash screens...\n');

  await generateIOSSplashScreens();
  await generateAndroidSplashScreens();

  console.log('\n✅ All splash screens generated successfully!');
}

main().catch(console.error);
