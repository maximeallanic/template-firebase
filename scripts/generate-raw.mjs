#!/usr/bin/env node
/**
 * Raw Question Generation Script
 * Generates game questions via Firebase emulator and outputs raw JSON.
 *
 * Usage:
 *   node scripts/generate-raw.mjs --phase phase1
 *   node scripts/generate-raw.mjs -p phase2 -d hard -l fr
 *   node scripts/generate-raw.mjs -p phase3 -t "Cinema" -l fr
 *
 * Options:
 *   -p, --phase      Phase to generate (phase1-5) [required]
 *   -d, --difficulty Difficulty level (easy/normal/hard/wtf) [default: normal]
 *   -l, --language   Language (fr/en) [default: fr]
 *   -t, --topic      Custom topic (optional, AI generates if not provided)
 *   -h, --help       Show help
 */

import { initializeApp } from 'firebase/app';
import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';
import { getAuth, signInAnonymously, connectAuthEmulator } from 'firebase/auth';

// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyBvMQBLGxZEfYRDOL8gWRnFQx0d8RxLl5c",
    authDomain: "spicy-vs-sweety.firebaseapp.com",
    projectId: "spicy-vs-sweety",
    storageBucket: "spicy-vs-sweety.firebasestorage.app",
    messagingSenderId: "1007177012226",
    appId: "1:1007177012226:web:a82d55b5c2d714481e9f67"
};

// Parse command line arguments
function parseArgs(args) {
    const result = {
        phase: null,
        difficulty: 'normal',
        language: 'fr',
        topic: null,
        help: false
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        const nextArg = args[i + 1];

        switch (arg) {
            case '-p':
            case '--phase':
                result.phase = nextArg;
                i++;
                break;
            case '-d':
            case '--difficulty':
                result.difficulty = nextArg;
                i++;
                break;
            case '-l':
            case '--language':
                result.language = nextArg;
                i++;
                break;
            case '-t':
            case '--topic':
                result.topic = nextArg;
                i++;
                break;
            case '-h':
            case '--help':
                result.help = true;
                break;
        }
    }

    return result;
}

function showHelp() {
    console.log(`
Raw Question Generation Script

Usage:
  node scripts/generate-raw.mjs --phase <phase> [options]

Options:
  -p, --phase      Phase to generate (phase1, phase2, phase3, phase4, phase5) [required]
  -d, --difficulty Difficulty level (easy, normal, hard, wtf) [default: normal]
  -l, --language   Language code (fr, en) [default: fr]
  -t, --topic      Custom topic (optional, AI generates one if not provided)
  -h, --help       Show this help message

Examples:
  node scripts/generate-raw.mjs -p phase1
  node scripts/generate-raw.mjs -p phase2 -d hard -l fr
  node scripts/generate-raw.mjs -p phase3 -t "French Cinema" -l fr

Note: Firebase emulators must be running (npm run emulators)
`);
}

async function main() {
    const args = parseArgs(process.argv.slice(2));

    if (args.help) {
        showHelp();
        process.exit(0);
    }

    // Validate required arguments
    if (!args.phase) {
        console.error('Error: --phase is required');
        console.error('Use --help for usage information');
        process.exit(1);
    }

    const validPhases = ['phase1', 'phase2', 'phase3', 'phase4', 'phase5'];
    if (!validPhases.includes(args.phase)) {
        console.error(`Error: Invalid phase "${args.phase}". Must be one of: ${validPhases.join(', ')}`);
        process.exit(1);
    }

    const validDifficulties = ['easy', 'normal', 'hard', 'wtf'];
    if (!validDifficulties.includes(args.difficulty)) {
        console.error(`Error: Invalid difficulty "${args.difficulty}". Must be one of: ${validDifficulties.join(', ')}`);
        process.exit(1);
    }

    const validLanguages = ['fr', 'en'];
    if (!validLanguages.includes(args.language)) {
        console.error(`Error: Invalid language "${args.language}". Must be one of: ${validLanguages.join(', ')}`);
        process.exit(1);
    }

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const functions = getFunctions(app, 'us-central1');
    const auth = getAuth(app);

    // Connect to emulators
    connectFunctionsEmulator(functions, '127.0.0.1', 5001);
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });

    // Sign in anonymously
    try {
        await signInAnonymously(auth);
    } catch (error) {
        console.error(JSON.stringify({
            error: 'Authentication failed',
            message: error.message
        }, null, 2));
        process.exit(1);
    }

    // Call the function
    const generateFn = httpsCallable(functions, 'generateGameQuestions', { timeout: 310000 });

    try {
        const startTime = Date.now();

        const input = {
            phase: args.phase,
            difficulty: args.difficulty,
            language: args.language
        };

        if (args.topic) {
            input.topic = args.topic;
        }

        const result = await generateFn(input);
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);

        // Output raw JSON with metadata
        const output = {
            phase: args.phase,
            topic: result.data.topic,
            language: result.data.language || args.language,
            difficulty: args.difficulty,
            data: result.data.data,
            usage: result.data.usage,
            generationTime: `${duration}s`
        };

        console.log(JSON.stringify(output, null, 2));

    } catch (error) {
        console.error(JSON.stringify({
            error: 'Generation failed',
            code: error.code,
            message: error.message,
            details: error.details
        }, null, 2));
        process.exit(1);
    }

    process.exit(0);
}

main().catch(error => {
    console.error(JSON.stringify({
        error: 'Unexpected error',
        message: error.message
    }, null, 2));
    process.exit(1);
});
