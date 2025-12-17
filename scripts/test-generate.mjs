#!/usr/bin/env node
/**
 * Test script to generate game questions via Firebase emulator
 * Usage: node scripts/test-generate.mjs [phase] [difficulty]
 * Example: node scripts/test-generate.mjs phase1 normal
 *          node scripts/test-generate.mjs phase2 hard
 */

import { initializeApp } from 'firebase/app';
import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';
import { getAuth, signInAnonymously, connectAuthEmulator } from 'firebase/auth';

// Firebase config (same as frontend)
const firebaseConfig = {
    apiKey: "AIzaSyBvMQBLGxZEfYRDOL8gWRnFQx0d8RxLl5c",
    authDomain: "spicy-vs-sweety.firebaseapp.com",
    projectId: "spicy-vs-sweety",
    storageBucket: "spicy-vs-sweety.firebasestorage.app",
    messagingSenderId: "1007177012226",
    appId: "1:1007177012226:web:a82d55b5c2d714481e9f67"
};

// Parse args
const phase = process.argv[2] || 'phase1';
const difficulty = process.argv[3] || 'normal';

console.log('🎲 Test de génération de questions IA');
console.log('━'.repeat(60));
console.log(`Phase: ${phase}`);
console.log(`Difficulty: ${difficulty}`);
console.log('');

async function main() {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const functions = getFunctions(app, 'us-central1');
    const auth = getAuth(app);

    // Connect to emulators
    connectFunctionsEmulator(functions, '127.0.0.1', 5001);
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });

    console.log('📡 Connexion aux émulateurs Firebase...');

    // Sign in anonymously to get auth context
    try {
        await signInAnonymously(auth);
        console.log('✅ Authentification anonyme réussie');
        console.log(`   UID: ${auth.currentUser?.uid}`);
    } catch (error) {
        console.error('❌ Erreur auth:', error.message);
        process.exit(1);
    }

    console.log('');
    console.log('🤖 Génération des questions en cours...');
    console.log('   (Cela peut prendre 30-60 secondes)');
    console.log('');

    // Call the function with extended timeout (server allows 300s)
    const generateFn = httpsCallable(functions, 'generateGameQuestions', { timeout: 310000 });

    try {
        const startTime = Date.now();
        const result = await generateFn({ phase, difficulty });
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);

        console.log(`✅ Génération réussie en ${duration}s !`);
        console.log('');

        const { data, topic, usage } = result.data;
        console.log(`🎯 Topic IA généré: "${topic}"`);
        console.log('');

        // Display based on phase
        if (phase === 'phase1') {
            console.log('📝 Questions Phase 1 (MCQ):');
            console.log('━'.repeat(60));
            for (let i = 0; i < data.length; i++) {
                const q = data[i];
                console.log(`\nQ${i + 1}: ${q.text}`);
                q.options.forEach((opt, idx) => {
                    const marker = idx === q.correctIndex ? '✓' : ' ';
                    console.log(`   ${marker} ${String.fromCharCode(65 + idx)}) ${opt}`);
                });
                if (q.anecdote) {
                    console.log(`   💡 ${q.anecdote}`);
                }
            }
        } else if (phase === 'phase2') {
            console.log('📝 Set Phase 2 (Sel ou Poivre):');
            console.log('━'.repeat(60));
            console.log(`\n🎭 Jeu de mots:`);
            const optionAWords = data.optionA.split(/\s+/).length;
            const optionBWords = data.optionB.split(/\s+/).length;
            console.log(`   A: ${data.optionA} (${optionAWords} mots)`);
            console.log(`   B: ${data.optionB} (${optionBWords} mots)`);

            // Validate option length
            console.log(`\n📏 Validation longueur options:`);
            if (optionAWords <= 4 && optionBWords <= 4) {
                console.log(`   ✅ Options courtes (≤4 mots) - OK!`);
            } else {
                console.log(`   ❌ Options trop longues!`);
                if (optionAWords > 4) console.log(`      optionA: ${optionAWords} mots (max 4)`);
                if (optionBWords > 4) console.log(`      optionB: ${optionBWords} mots (max 4)`);
            }

            console.log(`\n📋 Items (${data.items.length}):`);
            data.items.forEach((item, idx) => {
                const emoji = item.answer === 'A' ? '🅰️ ' : item.answer === 'B' ? '🅱️ ' : '🔁';
                console.log(`   ${idx + 1}. ${item.text} → ${emoji} ${item.answer}`);
                if (item.justification) {
                    console.log(`      📝 ${item.justification}`);
                }
            });
        } else if (phase === 'phase4') {
            console.log('📝 Questions Phase 4 (Buzzer):');
            console.log('━'.repeat(60));
            data.forEach((q, idx) => {
                console.log(`\nQ${idx + 1}: ${q.question}`);
                console.log(`   → ${q.answer}`);
            });
        } else if (phase === 'phase5') {
            console.log('📝 Questions Phase 5 (Burger Final):');
            console.log('━'.repeat(60));
            data.forEach((q, idx) => {
                console.log(`\nQ${idx + 1}: ${q.question}`);
                console.log(`   → ${q.answer}`);
            });
        } else {
            console.log('📝 Réponse brute:');
            console.log(JSON.stringify(data, null, 2));
        }

        console.log('');
        console.log('━'.repeat(60));
        console.log('📊 Usage:');
        console.log(`   Tokens: ${usage.totalTokens}`);
        console.log(`   Coût estimé: $${usage.estimatedCost.toFixed(4)}`);
        console.log('');
        console.log('✨ Questions sauvegardées dans Firestore!');

    } catch (error) {
        console.error('❌ Erreur de génération:', error.message);
        if (error.code) console.error('   Code:', error.code);
        if (error.details) console.error('   Details:', error.details);
        process.exit(1);
    }

    process.exit(0);
}

main().catch(console.error);
