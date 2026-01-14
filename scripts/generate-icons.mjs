#!/usr/bin/env node
import sharp from 'sharp';
import { readFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '../public');
const svgPath = join(publicDir, 'favicon.svg'); // Full icon with background rays (for favicons)
const svgNoRaysPath = join(publicDir, 'icon-no-triangles.svg'); // Clean logo without rays or colored triangles (for adaptive icons)
const svgMonochromePath = join(publicDir, 'icon-monochrome.svg'); // Monochrome version for themed icons
const svgBackgroundPath = join(publicDir, 'icon-background.svg'); // Background with colored triangles for adaptive icons
const splashDir = join(publicDir, 'splashscreens');
const iosAssetsDir = join(__dirname, '../ios/App/App/Assets.xcassets');
const androidResDir = join(__dirname, '../android/app/src/main/res');

// Ensure directories exist
if (!existsSync(splashDir)) {
  mkdirSync(splashDir, { recursive: true });
}

const svgBuffer = readFileSync(svgPath);
const svgNoRaysBuffer = readFileSync(svgNoRaysPath);
const svgMonochromeBuffer = readFileSync(svgMonochromePath);
const svgBackgroundBuffer = readFileSync(svgBackgroundPath);

// Helper function to create rounded corners mask
function createRoundedMask(width, height, radius) {
  return Buffer.from(
    `<svg width="${width}" height="${height}">
      <rect x="0" y="0" width="${width}" height="${height}" rx="${radius}" ry="${radius}" fill="white"/>
    </svg>`
  );
}

// Icon sizes to generate
const iconSizes = [
  { name: 'favicon-32.png', size: 32 },
  { name: 'favicon-48.png', size: 48 },
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 }, // iOS web app icon
];

// Splash screen sizes (iOS devices)
const splashSizes = [
  // iPhone SE, 5s, 5c, 5
  { width: 640, height: 1136, name: 'splash-640x1136.png' },
  // iPhone 8, 7, 6s, 6
  { width: 750, height: 1334, name: 'splash-750x1334.png' },
  // iPhone 8+, 7+, 6s+, 6+
  { width: 1242, height: 2208, name: 'splash-1242x2208.png' },
  // iPhone X, XS, 11 Pro
  { width: 1125, height: 2436, name: 'splash-1125x2436.png' },
  // iPhone XR, 11
  { width: 828, height: 1792, name: 'splash-828x1792.png' },
  // iPhone XS Max, 11 Pro Max
  { width: 1242, height: 2688, name: 'splash-1242x2688.png' },
  // iPhone 12 mini
  { width: 1080, height: 2340, name: 'splash-1080x2340.png' },
  // iPhone 12, 12 Pro
  { width: 1170, height: 2532, name: 'splash-1170x2532.png' },
  // iPhone 12 Pro Max
  { width: 1284, height: 2778, name: 'splash-1284x2778.png' },
  // iPhone 14 Pro
  { width: 1179, height: 2556, name: 'splash-1179x2556.png' },
  // iPhone 14 Pro Max
  { width: 1290, height: 2796, name: 'splash-1290x2796.png' },
  // iPad (768x1024)
  { width: 1536, height: 2048, name: 'splash-1536x2048.png' },
  // iPad Pro 11"
  { width: 1668, height: 2388, name: 'splash-1668x2388.png' },
  // iPad Pro 12.9"
  { width: 2048, height: 2732, name: 'splash-2048x2732.png' },
];

async function generateIcons() {
  console.log('Generating icons...');

  for (const icon of iconSizes) {
    await sharp(svgBuffer, { density: 300 })
      .resize(icon.size, icon.size)
      .png()
      .toFile(join(publicDir, icon.name));
    console.log(`  ✓ ${icon.name}`);
  }
}

async function generateSplashScreens() {
  console.log('Generating splash screens...');

  // Background color from the app (#0f172a - dark slate)
  const bgColor = { r: 15, g: 23, b: 42 };

  for (const splash of splashSizes) {
    // Logo size is ~45% of the smaller dimension (increased from 30%)
    const logoSize = Math.round(Math.min(splash.width, splash.height) * 0.45);
    // Rounded corners radius (~12% of logo size for nice rounded look)
    const borderRadius = Math.round(logoSize * 0.12);

    // Generate the resized logo (use no-rays version for clean logo on dark background)
    const logoRaw = await sharp(svgNoRaysBuffer, { density: 300 })
      .resize(logoSize, logoSize)
      .png()
      .toBuffer();

    // Apply rounded corners mask to logo
    const roundedMask = createRoundedMask(logoSize, logoSize, borderRadius);
    const logo = await sharp(logoRaw)
      .composite([{
        input: roundedMask,
        blend: 'dest-in'
      }])
      .png()
      .toBuffer();

    // Create splash screen with logo centered
    await sharp({
      create: {
        width: splash.width,
        height: splash.height,
        channels: 4,
        background: bgColor
      }
    })
      .composite([{
        input: logo,
        gravity: 'center'
      }])
      .png()
      .toFile(join(splashDir, splash.name));

    console.log(`  ✓ ${splash.name}`);
  }
}

async function generateiOSNativeAssets() {
  if (!existsSync(iosAssetsDir)) {
    console.log('iOS assets directory not found, skipping native assets...');
    return;
  }

  console.log('Generating iOS native assets...');

  // Background color from the app (#0f172a - dark slate)
  const bgColor = { r: 15, g: 23, b: 42 };

  const appIconDir = join(iosAssetsDir, 'AppIcon.appiconset');

  // iOS App Icon - Light mode (1024x1024)
  await sharp(svgBuffer, { density: 300 })
    .resize(1024, 1024)
    .png()
    .toFile(join(appIconDir, 'AppIcon-512@2x.png'));
  console.log('  ✓ AppIcon-512@2x.png (1024x1024) - Light mode');

  // iOS App Icon - Dark mode (1024x1024)
  // Use the same icon as light mode (it works well on dark backgrounds)
  await sharp(svgBuffer, { density: 300 })
    .resize(1024, 1024)
    .png()
    .toFile(join(appIconDir, 'AppIcon-Dark.png'));
  console.log('  ✓ AppIcon-Dark.png (1024x1024) - Dark mode');

  // iOS App Icon - Tinted/Monochrome (1024x1024)
  // Use the monochrome SVG for tinted icons (iOS 18+)
  await sharp(svgMonochromeBuffer, { density: 300 })
    .resize(1024, 1024)
    .png()
    .toFile(join(appIconDir, 'AppIcon-Tinted.png'));
  console.log('  ✓ AppIcon-Tinted.png (1024x1024) - Tinted mode');

  // Update Contents.json for iOS 18+ adaptive icons
  const contentsJson = {
    "images": [
      {
        "filename": "AppIcon-512@2x.png",
        "idiom": "universal",
        "platform": "ios",
        "size": "1024x1024"
      },
      {
        "appearances": [
          {
            "appearance": "luminosity",
            "value": "dark"
          }
        ],
        "filename": "AppIcon-Dark.png",
        "idiom": "universal",
        "platform": "ios",
        "size": "1024x1024"
      },
      {
        "appearances": [
          {
            "appearance": "luminosity",
            "value": "tinted"
          }
        ],
        "filename": "AppIcon-Tinted.png",
        "idiom": "universal",
        "platform": "ios",
        "size": "1024x1024"
      }
    ],
    "info": {
      "author": "xcode",
      "version": 1
    }
  };

  const { writeFileSync } = await import('fs');
  writeFileSync(join(appIconDir, 'Contents.json'), JSON.stringify(contentsJson, null, 2));
  console.log('  ✓ Contents.json updated for iOS 18+ adaptive icons');

  // iOS Splash Screen (2732x2732 - universal)
  // Use no-rays version for clean logo on dark background
  const splashLogoSize = Math.round(2732 * 0.40); // 40% of the screen (increased from 25%)
  const borderRadius = Math.round(splashLogoSize * 0.12);

  const splashLogoRaw = await sharp(svgNoRaysBuffer, { density: 300 })
    .resize(splashLogoSize, splashLogoSize)
    .png()
    .toBuffer();

  // Apply rounded corners
  const roundedMask = createRoundedMask(splashLogoSize, splashLogoSize, borderRadius);
  const splashLogo = await sharp(splashLogoRaw)
    .composite([{
      input: roundedMask,
      blend: 'dest-in'
    }])
    .png()
    .toBuffer();

  const splashNames = ['splash-2732x2732.png', 'splash-2732x2732-1.png', 'splash-2732x2732-2.png'];
  for (const name of splashNames) {
    await sharp({
      create: {
        width: 2732,
        height: 2732,
        channels: 4,
        background: bgColor
      }
    })
      .composite([{
        input: splashLogo,
        gravity: 'center'
      }])
      .png()
      .toFile(join(iosAssetsDir, 'Splash.imageset', name));
    console.log(`  ✓ ${name}`);
  }
}

async function generateAndroidAssets() {
  if (!existsSync(androidResDir)) {
    console.log('Android res directory not found, skipping Android assets...');
    return;
  }

  console.log('Generating Android assets...');

  // Background color from the app (#0f172a - dark slate)
  const bgColor = { r: 15, g: 23, b: 42 };

  // Android launcher icon sizes (square icons)
  const launcherSizes = [
    { folder: 'mipmap-mdpi', size: 48 },
    { folder: 'mipmap-hdpi', size: 72 },
    { folder: 'mipmap-xhdpi', size: 96 },
    { folder: 'mipmap-xxhdpi', size: 144 },
    { folder: 'mipmap-xxxhdpi', size: 192 },
  ];

  // Foreground icon sizes for adaptive icons (108dp with 72dp icon area centered)
  const foregroundSizes = [
    { folder: 'mipmap-mdpi', size: 108 },
    { folder: 'mipmap-hdpi', size: 162 },
    { folder: 'mipmap-xhdpi', size: 216 },
    { folder: 'mipmap-xxhdpi', size: 324 },
    { folder: 'mipmap-xxxhdpi', size: 432 },
  ];

  // Generate launcher icons
  for (const icon of launcherSizes) {
    const iconBuffer = await sharp(svgBuffer, { density: 300 })
      .resize(icon.size, icon.size)
      .png()
      .toBuffer();

    // ic_launcher.png (standard)
    await sharp(iconBuffer)
      .toFile(join(androidResDir, icon.folder, 'ic_launcher.png'));

    // ic_launcher_round.png (circular mask)
    const halfSize = Math.floor(icon.size / 2);
    const circleBuffer = Buffer.from(
      `<svg width="${icon.size}" height="${icon.size}">
        <circle cx="${halfSize}" cy="${halfSize}" r="${halfSize}" fill="white"/>
      </svg>`
    );
    await sharp(iconBuffer)
      .composite([{
        input: circleBuffer,
        blend: 'dest-in'
      }])
      .toFile(join(androidResDir, icon.folder, 'ic_launcher_round.png'));

    console.log(`  ✓ ${icon.folder}/ic_launcher.png & ic_launcher_round.png`);
  }

  // Generate foreground icons for adaptive icons (icon centered on transparent background)
  // For adaptive icons: total canvas is 108dp, safe zone is 66dp (61%)
  // Logo should fill ~90% of the safe zone to look good = 66/108 * 0.9 = ~55% of total
  // Use no-rays version for clean logo on system-provided background
  for (const icon of foregroundSizes) {
    const iconInnerSize = Math.round(icon.size * 0.55);
    const logoBuffer = await sharp(svgNoRaysBuffer, { density: 300 })
      .resize(iconInnerSize, iconInnerSize)
      .png()
      .toBuffer();

    await sharp({
      create: {
        width: icon.size,
        height: icon.size,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    })
      .composite([{
        input: logoBuffer,
        gravity: 'center'
      }])
      .png()
      .toFile(join(androidResDir, icon.folder, 'ic_launcher_foreground.png'));

    console.log(`  ✓ ${icon.folder}/ic_launcher_foreground.png`);
  }

  // Generate monochrome icons for themed adaptive icons (Android 13+)
  for (const icon of foregroundSizes) {
    const iconInnerSize = Math.round(icon.size * 0.55);
    const logoBuffer = await sharp(svgMonochromeBuffer, { density: 300 })
      .resize(iconInnerSize, iconInnerSize)
      .png()
      .toBuffer();

    await sharp({
      create: {
        width: icon.size,
        height: icon.size,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    })
      .composite([{
        input: logoBuffer,
        gravity: 'center'
      }])
      .png()
      .toFile(join(androidResDir, icon.folder, 'ic_launcher_monochrome.png'));

    console.log(`  ✓ ${icon.folder}/ic_launcher_monochrome.png`);
  }

  // Generate background icons for adaptive icons (colored triangles)
  for (const icon of foregroundSizes) {
    await sharp(svgBackgroundBuffer, { density: 300 })
      .resize(icon.size, icon.size)
      .png()
      .toFile(join(androidResDir, icon.folder, 'ic_launcher_background.png'));

    console.log(`  ✓ ${icon.folder}/ic_launcher_background.png`);
  }

  // Android splash screen sizes
  const splashSizes = [
    // Portrait
    { folder: 'drawable-port-mdpi', width: 320, height: 480 },
    { folder: 'drawable-port-hdpi', width: 480, height: 800 },
    { folder: 'drawable-port-xhdpi', width: 720, height: 1280 },
    { folder: 'drawable-port-xxhdpi', width: 960, height: 1600 },
    { folder: 'drawable-port-xxxhdpi', width: 1280, height: 1920 },
    // Landscape
    { folder: 'drawable-land-mdpi', width: 480, height: 320 },
    { folder: 'drawable-land-hdpi', width: 800, height: 480 },
    { folder: 'drawable-land-xhdpi', width: 1280, height: 720 },
    { folder: 'drawable-land-xxhdpi', width: 1600, height: 960 },
    { folder: 'drawable-land-xxxhdpi', width: 1920, height: 1280 },
  ];

  // Also update the default drawable/splash.png
  // Use no-rays version for clean logo on dark background
  const defaultSplashLogoSize = Math.round(Math.min(480, 800) * 0.45);
  const defaultBorderRadius = Math.round(defaultSplashLogoSize * 0.12);
  const defaultSplashLogoRaw = await sharp(svgNoRaysBuffer, { density: 300 })
    .resize(defaultSplashLogoSize, defaultSplashLogoSize)
    .png()
    .toBuffer();

  const defaultRoundedMask = createRoundedMask(defaultSplashLogoSize, defaultSplashLogoSize, defaultBorderRadius);
  const defaultSplashLogo = await sharp(defaultSplashLogoRaw)
    .composite([{
      input: defaultRoundedMask,
      blend: 'dest-in'
    }])
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: 480,
      height: 800,
      channels: 4,
      background: bgColor
    }
  })
    .composite([{
      input: defaultSplashLogo,
      gravity: 'center'
    }])
    .png()
    .toFile(join(androidResDir, 'drawable', 'splash.png'));
  console.log('  ✓ drawable/splash.png');

  // Generate all splash screens
  // Use no-rays version for clean logo on dark background
  for (const splash of splashSizes) {
    const logoSize = Math.round(Math.min(splash.width, splash.height) * 0.45);
    const borderRadius = Math.round(logoSize * 0.12);

    const logoRaw = await sharp(svgNoRaysBuffer, { density: 300 })
      .resize(logoSize, logoSize)
      .png()
      .toBuffer();

    const roundedMask = createRoundedMask(logoSize, logoSize, borderRadius);
    const logo = await sharp(logoRaw)
      .composite([{
        input: roundedMask,
        blend: 'dest-in'
      }])
      .png()
      .toBuffer();

    await sharp({
      create: {
        width: splash.width,
        height: splash.height,
        channels: 4,
        background: bgColor
      }
    })
      .composite([{
        input: logo,
        gravity: 'center'
      }])
      .png()
      .toFile(join(androidResDir, splash.folder, 'splash.png'));

    console.log(`  ✓ ${splash.folder}/splash.png`);
  }
}

async function main() {
  try {
    await generateIcons();
    await generateSplashScreens();
    await generateiOSNativeAssets();
    await generateAndroidAssets();
    console.log('\n✅ All icons and splash screens generated successfully!');
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

main();
