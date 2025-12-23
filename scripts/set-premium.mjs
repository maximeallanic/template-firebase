#!/usr/bin/env node
/**
 * Script to set a user as premium (or remove premium status)
 *
 * Usage:
 *   node scripts/set-premium.mjs <userId> [--remove] [--prod]
 *
 * Examples:
 *   # Set user as premium (local emulator)
 *   node scripts/set-premium.mjs abc123xyz
 *
 *   # Set user as premium (production)
 *   node scripts/set-premium.mjs abc123xyz --prod
 *
 *   # Remove premium status (local emulator)
 *   node scripts/set-premium.mjs abc123xyz --remove
 *
 *   # Remove premium status (production)
 *   node scripts/set-premium.mjs abc123xyz --remove --prod
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Parse arguments
const args = process.argv.slice(2);
const userId = args.find(arg => !arg.startsWith('--'));
const isProduction = args.includes('--prod');
const shouldRemove = args.includes('--remove');

if (!userId) {
  console.error('❌ Error: userId is required');
  console.log('\nUsage: node scripts/set-premium.mjs <userId> [--remove] [--prod]');
  console.log('\nOptions:');
  console.log('  --prod     Use production Firebase (requires service account)');
  console.log('  --remove   Remove premium status instead of adding it');
  console.log('\nExamples:');
  console.log('  node scripts/set-premium.mjs abc123xyz           # Local: set premium');
  console.log('  node scripts/set-premium.mjs abc123xyz --prod    # Prod: set premium');
  console.log('  node scripts/set-premium.mjs abc123xyz --remove  # Local: remove premium');
  process.exit(1);
}

// Initialize Firebase
let app;

if (isProduction) {
  // Production: use service account
  const serviceAccountPath = resolve(__dirname, '../functions/service-account.json');

  if (!existsSync(serviceAccountPath)) {
    console.error('❌ Error: Service account file not found at:');
    console.error(`   ${serviceAccountPath}`);
    console.log('\nTo use production mode:');
    console.log('1. Go to Firebase Console > Project Settings > Service Accounts');
    console.log('2. Generate a new private key');
    console.log('3. Save it as functions/service-account.json');
    process.exit(1);
  }

  const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

  app = initializeApp({
    credential: cert(serviceAccount),
  });

  console.log('🔥 Connected to PRODUCTION Firebase');
} else {
  // Local: use emulator
  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';

  app = initializeApp({
    projectId: 'spicy-vs-sweet',
  });

  console.log('🔧 Connected to LOCAL Firebase Emulator (localhost:8080)');
}

const db = getFirestore(app);

async function setPremiumStatus() {
  const userRef = db.collection('users').doc(userId);
  const userDoc = await userRef.get();

  const newStatus = shouldRemove ? 'free' : 'active';
  const action = shouldRemove ? 'Removing premium from' : 'Setting premium for';

  if (!userDoc.exists) {
    console.log(`⚠️  User document doesn't exist. Creating new document...`);

    await userRef.set({
      subscriptionStatus: newStatus,
      createdAt: new Date().toISOString(),
      updatedByScript: true,
    });

    console.log(`✅ Created user document with subscriptionStatus: '${newStatus}'`);
  } else {
    const currentData = userDoc.data();
    console.log(`📋 Current subscriptionStatus: '${currentData?.subscriptionStatus || 'undefined'}'`);

    await userRef.update({
      subscriptionStatus: newStatus,
      updatedAt: new Date().toISOString(),
      updatedByScript: true,
    });

    console.log(`✅ Updated subscriptionStatus to: '${newStatus}'`);
  }

  // Verify the change
  const verifyDoc = await userRef.get();
  const verifyData = verifyDoc.data();

  console.log('\n📊 Final user document:');
  console.log(JSON.stringify(verifyData, null, 2));

  if (verifyData?.subscriptionStatus === newStatus) {
    console.log(`\n🎉 Success! User ${userId} is now ${shouldRemove ? 'FREE' : 'PREMIUM'}`);
  } else {
    console.error('\n❌ Verification failed - status may not have been updated correctly');
    process.exit(1);
  }
}

setPremiumStatus()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
