# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Spicy vs Sweet** is a multiplayer party quiz game inspired by French TV quiz shows. Players join rooms, split into teams (Spicy vs Sweet), and compete through 5 chaotic, funny game phases.

**Core Features:**
- **Real-time Multiplayer**: 2-20 players per room via Firebase Realtime Database
- **Solo Mode**: Single-player practice mode with AI opponents
- **Team-based Gameplay**: Spicy (red) vs Sweet (pink) teams
- **5 Game Phases**: Tenders, Sucre Sale, La Carte, La Note, Burger Ultime
- **AI-Generated Questions**: Custom content via Google Gemini (Genkit) with fact-checking
- **Food Mascot Avatars**: 15 customizable food-themed avatars
- **PWA Support**: Installable app with offline capabilities
- **Leaderboard**: Global player rankings

**Tech Stack:**
- Frontend: React 19 + TypeScript + Vite + Tailwind CSS + Framer Motion
- Backend: Firebase Functions (Node 22) with Firebase Functions v2 API
- Database: Firebase Realtime Database (game state) + Firestore (user data)
- AI: Google Gemini via Genkit (`@genkit-ai/googleai`) with multi-language prompts
- Auth: Firebase Authentication (Google Sign-In)
- Payments: Stripe (for premium features)
- Email: Mailgun (transactional emails)
- Analytics: Firebase Analytics (production only)
- CI/CD: GitHub Actions with multi-stage pipeline

## Development Commands

### Local Development
```bash
# Start dev server + emulators together (recommended)
npm start

# Start dev server (frontend only, port 5173)
npm run dev

# Start Firebase emulators (Auth:9099, Functions:5001, Database:9000, UI:4000)
npm run emulators

# Start clean emulators (no saved data)
npm run emulators:clean

# Type checking
npm run type-check

# Linting
npm run lint

# Build production bundle
npm run build
```

### Functions Development
```bash
cd functions

# Build TypeScript to JavaScript
npm run build

# Start Functions emulator only
npm run serve

# View Functions logs (production)
npm run logs

# Question management scripts
npm run fetch-questions        # Fetch questions from database
npm run fetch-questions:stats  # Fetch with statistics
npm run fetch-questions:prod   # Fetch from production
npm run delete-questions       # Delete questions
npm run delete-questions:prod  # Delete from production
```

### Deployment
```bash
# Deploy everything
./scripts/deploy-all.sh

# Deploy via npm scripts
npm run deploy              # Hosting + Functions
npm run deploy:hosting      # Hosting only
npm run deploy:functions    # Functions only

# Deploy via Firebase CLI
firebase deploy --only hosting,functions,database
```

### Quality Checks (MANDATORY)
**IMPORTANT**: After completing ANY code changes, you MUST run these quality checks:

```bash
# 1. TypeScript type checking (REQUIRED)
npm run type-check

# 2. ESLint code quality (REQUIRED)
npm run lint
```

**Never consider a task complete without running both checks successfully.**

## Architecture

### Game Flow
1. **Create Room**: Host creates room → gets 4-character room code
2. **Join Room**: Players join with code → select avatar and name
3. **Lobby**: Host assigns teams (Spicy/Sweet) → starts game
4. **Game Phases 1-5**: Teams compete through 5 different game modes
5. **Victory**: Team with most points wins

### Solo Mode Flow
1. **Setup**: Player configures difficulty and options
2. **Play**: Player competes against AI with timed questions
3. **Results**: Score tracked and added to leaderboard

### Game Phases

| Phase | Name | Mechanics |
|-------|------|-----------|
| 1 | **Tenders** | Speed MCQ - First correct answer wins point |
| 2 | **Sucre Sale** | Binary choice (A/B/Both) - All players answer |
| 3 | **La Carte** | Team selects menu, answers themed questions |
| 4 | **La Note** | Buzzer round - Teams race to buzz and answer |
| 5 | **Burger Ultime** | 10-question sequence - Answer all after hearing all |

### Key Design Patterns

**Real-time State with Firebase RTDB:**
- All game state lives in `rooms/{roomId}` in Realtime Database
- Frontend subscribes via `onValue()` for real-time updates
- Disconnect handlers track player online status

**Modular Phase Services:**
- Phase logic is split into individual service files in `src/services/game/phases/`
- Each phase has its own service (phase1Service.ts, phase2Service.ts, etc.)
- Shared utilities in `src/services/game/sharedUtils.ts`

**Data Access Priority:**
- **Game state**: Direct Firebase RTDB calls from frontend
- **User data**: Firestore for persistent user profiles
- **Cloud Functions**: Only for AI generation, Stripe, and protected operations

**Firebase Functions v2 API:**
```typescript
export const functionName = onCall(async ({ data, auth }) => {
  // auth.uid, auth.token available
  // data contains client payload
});
```

**Animations (Framer Motion):**
- Use `src/animations/index.ts` for shared animation variants
- Use `src/animations/phaseTransitions.ts` for phase-specific transitions
- `useReducedMotion()` hook respects user's `prefers-reduced-motion` setting
- Apply `shouldReduceMotion` flag to disable animations for accessibility

**Context-based State:**
- `SoloGameContext` - Solo game state management
- `MockPlayerContext` - Debug mock player management
- `ToastContext` - Toast notification system

### Data Model

All TypeScript types are centralized in `src/types/`:
- `gameTypes.ts` - Core game types (Avatar, Player, Room, GameState, etc.)
- `soloTypes.ts` - Solo game mode types
- `cursorTypes.ts` - Multiplayer cursor types
- `languageTypes.ts` - Language/i18n types

**Firebase Realtime Database:**
```
rooms/{roomCode}
  - code: string (4-char room code)
  - hostId: string (player ID of host)
  - createdAt: number (timestamp)
  - players: {
      {playerId}: {
        id: string
        name: string
        avatar: Avatar (burger, pizza, taco, etc.)
        team: 'spicy' | 'sweet' | null
        isHost: boolean
        score: number
        joinedAt: number
        isOnline: boolean
      }
    }
  - state: {
      status: 'lobby' | 'phase1' | 'phase2' | 'phase3' | 'phase4' | 'phase5'
      phaseState: 'idle' | 'reading' | 'answering' | 'result' | 'menu_selection' | 'questioning' | 'buzzed'
      currentQuestionIndex?: number
      roundWinner?: { playerId, name, team }
      // Phase-specific state...
    }
  - customQuestions?: {
      phase1?: Question[]
      phase2?: SimplePhase2Set[]
      phase5?: Phase5Data
    }

userHistory/{playerId}
  - seenQuestions: string[] (hashes to avoid repeats)
```

**Firestore:**
```
users/{userId}
  - email, subscriptionStatus, stripeCustomerId, etc.

leaderboard/{userId}
  - score, gamesPlayed, etc.
```

### Cloud Functions

**Exported Functions:**
- `generateGameQuestions` - AI generation for all phases (requires auth, uses Genkit)
- `getUserSubscription` - Fetches user subscription data
- `createCheckoutSession` - Creates Stripe checkout
- `createPortalSession` - Opens Stripe billing portal
- `cancelSubscription` - Cancels Stripe subscription
- `stripeWebhook` - Handles Stripe events

**AI Integration (Genkit + Gemini):**
- Model: `gemini-2.0-flash` via Genkit
- Multi-language prompts: `functions/src/prompts/{en,fr}/`
- Generation services: `functions/src/services/generation/`
- Answer validation: `functions/src/services/answerValidator.ts`
- Fact-checking: `functions/src/services/generation/factChecker.ts`

## Project Structure

```
src/
├── components/
│   ├── ai/                   # AI features
│   │   └── AIGeneratorModal.tsx
│   ├── auth/                 # Authentication & user
│   │   ├── AuthModal.tsx, AuthRequired.tsx
│   │   ├── UserBar.tsx, ProfileEditModal.tsx
│   │   ├── MandatoryProfileSetupModal.tsx, ProfileGate.tsx
│   │   └── EmailVerification.tsx, EmailActionHandler.tsx
│   ├── game/                 # Core game components
│   │   ├── PhaseRouter.tsx   # Routes to correct phase component
│   │   ├── GameHeader.tsx    # In-game header with scores
│   │   ├── TeamScores.tsx    # Team score display
│   │   ├── PhaseTransition.tsx, QuestionTransition.tsx
│   │   ├── PhaseResults.tsx, PhaseIcon.tsx
│   │   ├── DebugPanel.tsx    # Debug panel (DEV ONLY)
│   │   ├── GameErrorBoundary.tsx
│   │   ├── TeamIndicator.tsx, TeammateRoster.tsx
│   │   ├── TeammateCursors.tsx, TeammatePointer.tsx
│   │   └── victory/PlayerLeaderboard.tsx
│   ├── layout/               # Layout components
│   │   └── PersistentHeader.tsx
│   ├── onboarding/           # Onboarding flow
│   │   └── OnboardingIntro.tsx
│   ├── phases/               # Phase-specific player views
│   │   ├── Phase1Player.tsx  # Tenders (Speed MCQ)
│   │   ├── phase1/           # Phase 1 sub-components
│   │   │   ├── Phase1Intro.tsx, Phase1BorderTimer.tsx
│   │   ├── Phase2Player.tsx  # Sucre Sale (Binary choice)
│   │   ├── phase2/           # Phase 2 sub-components
│   │   │   ├── Phase2Intro.tsx, Phase2Transition.tsx
│   │   │   ├── Phase2Timer.tsx, Phase2Zones.tsx
│   │   │   └── Phase2KeyboardControls.tsx
│   │   ├── Phase3Player.tsx  # La Carte (Menu selection)
│   │   ├── Phase3Spectator.tsx, Phase3ThemeSelection.tsx
│   │   ├── Phase3QuestionInput.tsx
│   │   ├── phase3/Phase3Intro.tsx, Phase3Transition.tsx
│   │   ├── Phase4Player.tsx  # La Note (Buzzer round)
│   │   ├── phase4/           # Phase 4 sub-components
│   │   │   ├── Phase4Intro.tsx, Phase4Transition.tsx
│   │   │   ├── Phase4Question.tsx, Phase4Options.tsx
│   │   │   ├── Phase4Timer.tsx, Phase4Result.tsx
│   │   ├── Phase5Player.tsx  # Burger Ultime (Final)
│   │   └── phase5/           # Phase 5 sub-components
│   │       ├── Phase5Intro.tsx, Phase5Memorizing.tsx
│   │       ├── Phase5Answering.tsx, Phase5Validating.tsx
│   │       ├── Phase5Voting.tsx, Phase5Results.tsx
│   │       └── Phase5Spectator.tsx
│   ├── pwa/                  # Progressive Web App components
│   │   ├── PWAHomePage.tsx   # PWA-optimized home
│   │   ├── PWABackground.tsx, PWABackButton.tsx
│   │   ├── PWAActionButtons.tsx, PWAActionMenu.tsx
│   │   ├── PWAPlayerProfile.tsx
│   │   ├── PlayButton.tsx, FloatingMascots.tsx
│   │   └── QuickSettings.tsx
│   ├── solo/                 # Solo game components
│   │   └── SoloGameHeader.tsx
│   ├── subscription/         # Payment & subscription
│   │   ├── Header.tsx, UsageBanner.tsx
│   │   ├── FreeTrialBanner.tsx, UpgradeModal.tsx
│   ├── ui/                   # Shared UI components
│   │   ├── Logo.tsx, SharedBackground.tsx, PageTransition.tsx
│   │   ├── SimpleConfetti.tsx, GenerationLoadingCard.tsx
│   │   ├── FoodLoader.tsx, LoadingMessages.tsx
│   │   ├── DifficultySelector.tsx, RoomLanguageSelector.tsx
│   │   ├── LandscapeWarning.tsx
│   │   ├── SkipLink.tsx, VisuallyHidden.tsx  # Accessibility
│   │   └── avatars/          # Food mascot avatar SVGs (15 types)
│   ├── AvatarIcon.tsx        # Avatar selector/display
│   └── LanguageSelector.tsx  # i18n language picker
├── pages/
│   ├── HomePage.tsx          # Landing + Create/Join
│   ├── HostLobby.tsx         # Room creation + team management
│   ├── GameRoom.tsx          # Main game view (uses PhaseRouter)
│   ├── LoginPage.tsx         # Authentication
│   ├── SoloSetup.tsx         # Solo game setup
│   ├── SoloGame.tsx          # Solo game view
│   ├── Leaderboard.tsx       # Global rankings
│   ├── TermsOfService.tsx    # Legal
│   ├── TermsAndConditions.tsx
│   └── TestAvatars.tsx       # Avatar testing (dev)
├── services/
│   ├── firebase.ts           # Firebase initialization + callable functions
│   ├── gameService.ts        # Game state management (RTDB)
│   ├── game/                 # Modular game services
│   │   ├── index.ts          # Main exports
│   │   ├── roomService.ts    # Room management
│   │   ├── sharedUtils.ts    # Shared utilities
│   │   └── phases/           # Phase-specific services
│   │       ├── phase1Service.ts, phase2Service.ts
│   │       ├── phase3Service.ts, phase4Service.ts
│   │       └── phase5Service.ts
│   ├── aiClient.ts           # AI question generation client
│   ├── audioService.ts       # Sound effects
│   ├── currencyService.ts    # Currency formatting
│   ├── cursorService.ts      # Multiplayer cursor tracking
│   ├── debugService.ts       # Debug utilities (DEV ONLY)
│   ├── hapticService.ts      # Haptic feedback
│   ├── historyService.ts     # Question deduplication
│   ├── leaderboardService.ts # Leaderboard management
│   ├── lockService.ts        # Screen orientation lock
│   ├── mockAnswerService.ts  # Mock player answers
│   ├── onboardingService.ts  # Onboarding flow
│   ├── profileService.ts     # User profile management
│   ├── questionStorageService.ts # Question caching
│   └── data/phase3.ts        # Phase 3 data
├── hooks/
│   ├── useAuthUser.ts        # Firebase auth state
│   ├── useGameRoom.ts        # Room subscription & player state
│   ├── useGameTranslation.ts # Game-specific i18n
│   ├── useQuestionGeneration.ts # AI question generation flow
│   ├── useReducedMotion.ts   # Accessibility (prefers-reduced-motion)
│   ├── useClipboard.ts       # Clipboard utilities
│   ├── useAppInstall.ts      # PWA install detection
│   ├── useCurrency.ts        # Currency formatting
│   ├── useHaptic.ts          # Haptic feedback
│   ├── useHostSubscription.ts # Host subscription management
│   ├── useMockPlayer.ts      # Mock player management
│   ├── useOnboarding.ts      # Onboarding flow
│   ├── useOrientationLock.ts # Screen orientation lock
│   ├── usePhaseTransition.ts # Phase transition management
│   ├── useProfileComplete.ts # Profile completion state
│   ├── useSoloGame.ts        # Solo game state
│   ├── useSoundSettings.ts   # Sound/audio settings
│   ├── useTeammateCursors.ts # Multiplayer cursor tracking
│   └── useToast.ts           # Toast notifications
├── contexts/
│   ├── SoloGameContext.tsx   # Solo game state
│   ├── MockPlayerContext.tsx # Mock player management
│   ├── mockPlayerContextDef.ts
│   ├── ToastContext.tsx      # Toast notifications
│   └── toastContextDef.ts
├── types/
│   ├── gameTypes.ts          # Core game types
│   ├── soloTypes.ts          # Solo mode types
│   ├── cursorTypes.ts        # Cursor types
│   └── languageTypes.ts      # Language types
├── animations/
│   ├── index.ts              # Shared animation variants
│   └── phaseTransitions.ts   # Phase transition animations
├── i18n/
│   ├── config.ts             # i18next configuration
│   └── types.ts              # Translation key types
├── utils/
│   ├── hash.ts               # Hashing utilities
│   ├── questionCache.ts      # Question caching
│   ├── retry.ts              # Retry logic
│   ├── storage.ts            # Local storage utilities
│   ├── teamColors.ts         # Team color constants
│   └── textNormalization.ts  # Text normalization
├── config/
│   └── pricing.ts            # Subscription pricing
├── data/
│   ├── questions.ts          # Default Phase 1 questions
│   ├── phase2.ts             # Default Phase 2 sets
│   ├── phase4.ts             # Default Phase 4 questions
│   └── phase5.ts             # Default Phase 5 questions

functions/src/
├── index.ts                  # Function exports
├── prompts.ts                # Legacy prompts (fallback)
├── prompts/                  # Multi-language prompt system
│   ├── index.ts              # Prompt exports
│   ├── en/                   # English prompts
│   │   ├── index.ts, system.ts, difficulty.ts
│   │   ├── phase1.ts, phase2.ts, phase3.ts, phase4.ts, phase5.ts
│   │   ├── topic.ts, factcheck.ts
│   └── fr/                   # French prompts (same structure)
├── config/
│   ├── firebase.ts           # Admin SDK setup
│   ├── genkit.ts             # Genkit + Gemini setup
│   └── logger.ts             # Logging configuration
├── services/
│   ├── gameGenerator.ts      # Main generation orchestrator
│   ├── answerValidator.ts    # Answer validation
│   ├── subjectAngleService.ts # Subject angle generation
│   └── generation/           # Modular generation services
│       ├── index.ts, types.ts
│       ├── geminiBridge.ts   # Gemini API bridge
│       ├── jsonUtils.ts      # JSON extraction
│       ├── phase1Generator.ts, phase2Generator.ts
│       ├── phase3Generator.ts, phase4Generator.ts
│       ├── phase5Generator.ts
│       ├── topicGenerator.ts # Topic generation
│       ├── factChecker.ts    # Fact-checking service
│       ├── questionValidator.ts
│       ├── subjectAngle.ts
│       └── targetedRegen.ts  # Targeted regeneration
├── tools/
│   └── searchTool.ts         # AI search tool
├── utils/
│   ├── costCalculator.ts     # Token cost estimation
│   ├── embeddingService.ts   # Embedding service
│   └── textNormalization.ts
└── scripts/
    ├── fetch-questions.ts    # Fetch questions from DB
    └── delete-questions.ts   # Delete questions from DB

scripts/                      # Root-level scripts
├── deploy-all.sh             # Deploy all services
├── bump-version.cjs          # Version bump utility (Node.js)
└── bump-version.sh           # Version bump (bash alternative)
```

## Common Tasks

### Adding a New Game Phase
1. Create `Phase{N}Player.tsx` component in `src/components/phases/`
2. Create phase sub-components in `src/components/phases/phase{n}/`
3. Add phase data in `src/data/phase{n}.ts`
4. Update types in `src/types/gameTypes.ts` (PhaseStatus, GameState, PHASE_NAMES)
5. Create phase service in `src/services/game/phases/phase{n}Service.ts`
6. Update `PhaseRouter.tsx` to route to new phase
7. Add prompts in `functions/src/prompts/{en,fr}/phase{n}.ts`
8. Add generator in `functions/src/services/generation/phase{n}Generator.ts`

### Adding New Avatars
1. Add avatar name to `Avatar` type in `src/types/gameTypes.ts`
2. Add to `AVATAR_LIST` array in `src/types/gameTypes.ts`
3. Create SVG component in `src/components/ui/avatars/{Name}Avatar.tsx`
4. Register in `src/components/AvatarIcon.tsx`

### Modifying AI Prompts
Edit prompts in `functions/src/prompts/{lang}/`:
- `system.ts` - Base persona and instructions
- `difficulty.ts` - Difficulty level descriptions
- `phase{1-5}.ts` - Phase-specific prompt formats
- `topic.ts` - Topic generation prompts
- `factcheck.ts` - Fact-checking prompts

### Adding a New Cloud Function
1. Add function in `functions/src/index.ts` using v2 syntax
2. Build: `cd functions && npm run build`
3. Export in frontend: `src/services/firebase.ts`
4. Call from frontend: `await myFunction({ param: value })`

### Adding a New Hook
1. Create hook in `src/hooks/use{Name}.ts`
2. Follow existing patterns for Firebase subscriptions or state management
3. Export from hook file

### Adding a New Service
1. Create service in `src/services/{name}Service.ts`
2. For game-related services, add to `src/services/game/`
3. Export functions for use in components/hooks

## Internationalization (i18n)

The app uses i18next with 5 supported languages: EN, FR, ES, DE, PT.

**Translation Namespaces:**
- `translation.json` - Main translations
- `common.json` - Common UI strings
- `home.json` - Homepage content
- `lobby.json` - Lobby content
- `game-content.json` - Game content
- `game-loading.json` - Loading messages
- `game-phases.json` - Phase-specific strings
- `game-ui.json` - Game UI elements
- `onboarding.json` - Onboarding flow
- `analysis.json` - Analysis content
- `errors.json` - Error messages

**Key Files:**
- `src/i18n/config.ts` - i18next setup
- `public/locales/{lang}/*.json` - Translation files
- `src/hooks/useGameTranslation.ts` - Game-specific translation hook

**Adding Translations:**
1. Add keys to all namespace files in `public/locales/{lang}/`
2. Use `useTranslation(namespace)` from react-i18next
3. Use `useGameTranslation()` for game-specific strings
4. For phase names/descriptions, use `PHASE_NAMES` constants in `src/types/gameTypes.ts`

## Debug Tools (Dev Mode Only)

### Debug Panel
A floating debug panel (`src/components/game/DebugPanel.tsx`) appears automatically in development mode in the bottom-right corner of the game room. It provides:

- **Mock Players**: Add/remove fake players to teams for single-window testing
- **Phase Skip**: Jump directly to any game phase (lobby, phase1-5)
- **Reset Scores**: Reset all player scores to 0

### Debug Service (`src/services/debugService.ts`)
```typescript
// Add a mock player to a team
addMockPlayer(code: string, team: 'spicy' | 'sweet'): Promise<string>

// Remove all mock players from room
clearMockPlayers(code: string): Promise<number>

// Skip directly to any phase (initializes correct state)
skipToPhase(code: string, phase: 'lobby' | 'phase1' | ... | 'phase5'): Promise<void>

// Reset all player scores
resetAllScores(code: string): Promise<void>
```

### Mock Player Context
The `MockPlayerContext` provides state management for mock players:
```typescript
const { addMockPlayer, clearMockPlayers, mockPlayerIds } = useMockPlayer();
```

### Mock Player Convention
- **ID prefix**: All mock players have IDs starting with `mock_` (e.g., `mock_001`)
- **Passive**: Mock players don't auto-respond - they just fill team slots
- **Excluded from completion checks**: Phase completion only counts real players
- **Food-themed names**: "Chef Pepper", "Princess Honey", etc.

### Usage Example
1. Run `npm start` (starts dev + emulators)
2. Create a room and join as host
3. Use Debug Panel to add mock players to both teams
4. Skip to any phase to test it directly

### Important for Phase Logic
When implementing phase completion logic that depends on "all players answered":
```typescript
// CORRECT: Exclude mock players from count
const realPlayers = Object.values(players).filter(p => p.isOnline && !p.id.startsWith('mock_'));

// WRONG: This would wait for mock players who never answer
const allPlayers = Object.values(players).filter(p => p.isOnline);
```

## Configuration Files

### Environment Files
- `.env` - Frontend Firebase config (VITE_* variables)
- `functions/.env.local` - Functions local config (Stripe secrets, APP_NAME, APP_URL)
- `.env.example` - Template for required variables

### Firebase Configuration
- `firebase.json` - Defines hosting, functions, database rules, emulator ports
- `database.rules.json` - Realtime Database security rules
- `firestore.rules` - Firestore security rules
- `firestore.indexes.json` - Firestore composite indexes
- `.firebaserc` - Project configuration

### PWA Configuration
- `public/manifest.webmanifest` - PWA manifest
- `public/icon-192.png`, `public/icon-512.png` - PWA icons

## Known Issues & Gotchas

### Firebase Functions v2 Specifics
- Must use `.env.local` not `.env` for local development
- Cannot use variables starting with `FIREBASE_` prefix
- Do NOT call `dotenv.config()` manually - Functions v2 auto-loads `.env.local`

### Realtime Database vs Firestore
- **RTDB**: Used for game state (rooms, players, phases) - optimized for real-time sync
- **Firestore**: Used for user profiles, subscriptions, leaderboard - optimized for queries

### Genkit/Gemini
- Use modular generators in `functions/src/services/generation/`
- JSON extraction via `jsonUtils.ts`
- Model config in `functions/src/config/genkit.ts`
- Multi-language support via `functions/src/prompts/{lang}/`

### Player Disconnect Handling
- `onDisconnect()` sets `isOnline: false` when player disconnects
- `markPlayerOnline()` for reconnection scenarios
- UI should show offline players differently

### PWA Considerations
- Use `useAppInstall()` hook to detect install state
- `useOrientationLock()` for screen orientation
- `useHaptic()` for haptic feedback on supported devices

## Deployment Checklist

Before deploying to production:
1. Configure GitHub Secrets (VITE_* variables, FIREBASE_SERVICE_ACCOUNT)
2. Ensure service account has Firebase Admin role
3. Set Stripe keys via `firebase functions:secrets:set`
4. Configure Stripe webhook with production URL
5. Add domain to Firebase Auth authorized domains
6. Test in emulators first: `npm run emulators`
7. Run quality checks: `npm run type-check && npm run lint`

## CI/CD Pipeline

### Create Release (`.github/workflows/create-release.yml`)
**Triggers:** Manual workflow dispatch only

**Inputs:**
| Input | Description | Options |
|-------|-------------|---------|
| `bump_type` | Version increment type | `patch`, `minor`, `major` |
| `generate_ai_summary` | Generate AI changelog summary | `true` (default), `false` |
| `prerelease` | Mark as pre-release | `true`, `false` (default) |

**What it does:**
1. Bumps version in `package.json`, Android, and iOS configs
2. Generates categorized changelog from commits
3. Creates AI summary of changes (via Gemini API)
4. Updates `CHANGELOG.md`
5. Commits changes and creates git tag
6. Creates GitHub Release with full changelog

**Usage:**
1. Go to Actions → "Create Release"
2. Click "Run workflow"
3. Select bump type (patch/minor/major)
4. Optionally disable AI summary or mark as pre-release
5. Click "Run workflow"

**Required Secrets:**
| Secret | Description |
|--------|-------------|
| `GEMINI_API_KEY` | Google Gemini API key (optional, for AI summaries) |

### Production Deployment (`.github/workflows/firebase-hosting-merge.yml`)
**Triggers:**
- Push of version tags (`v*`, e.g., `v1.0.0`, `v2.1.3`)
- Manual workflow dispatch (requires typing "deploy" to confirm)

**Stages:**
1. Quality Checks - ESLint, TypeScript type-check
2. Build - Frontend + Functions builds
3. Deploy - Deploy to Firebase Hosting + Functions

**Note:** Use the "Create Release" workflow to create tags, which will automatically trigger this deployment.

### PR Preview (`.github/workflows/firebase-hosting-pull-request.yml`)
**Triggers:** Pull request creation or update
- Automatic preview deployment
- Quality checks validation
- Temporary preview URLs (expire after 7 days)

### Mobile PR Preview (`.github/workflows/mobile-pr-preview.yml`)
**Triggers:** Pull request to `master` branch with platform labels

**Label-based Build Triggering:**
| Label | Effect |
|-------|--------|
| `mobile:android` | Build Android APK and distribute to Firebase |
| `mobile:ios` | Build iOS IPA and distribute to Firebase |

- Builds only run when corresponding labels are present
- Add both labels to build for both platforms
- Distributes to Firebase App Distribution (when configured)
- Comments PR with download links and build status

**Required Secrets for Mobile Distribution:**

| Secret | Description |
|--------|-------------|
| `FIREBASE_ANDROID_APP_ID` | Firebase Android App ID |
| `FIREBASE_IOS_APP_ID` | Firebase iOS App ID |
| `FIREBASE_SERVICE_ACCOUNT` | Service account JSON for Firebase |
| `IOS_P12_BASE64` | Distribution certificate (.p12) in base64 |
| `IOS_P12_PASSWORD` | Password for the .p12 certificate |
| `IOS_PROVISIONING_PROFILE_BASE64` | Ad-Hoc provisioning profile in base64 |
| `IOS_CODE_SIGN_IDENTITY` | e.g., "Apple Distribution: Your Name (TEAMID)" |
| `IOS_TEAM_ID` | Apple Developer Team ID |

### Mobile Store Release (`.github/workflows/mobile-release.yml`)
**Triggers:**
- Push of version tags (`v*`) - automatically triggered after "Create Release"
- Manual workflow dispatch

**Automatic Deployment:** When you create a release using "Create Release" workflow, mobile apps are automatically:
- Built with the new version
- Signed with release certificates
- Uploaded to TestFlight (iOS) and Play Store Internal Track (Android)

**Manual Workflow Inputs:**
| Input | Description | Options |
|-------|-------------|---------|
| `platform` | Platform to build | `ios`, `android`, `both` |
| `track` | Release track | `internal`, `beta`, `production` |

**Track Mapping:**
| Track | iOS | Android |
|-------|-----|---------|
| `internal` | TestFlight | Internal Testing |
| `beta` | External TestFlight | Open Testing |
| `production` | App Store Review | Production |

**Required Secrets for App Store (iOS):**

| Secret | Description |
|--------|-------------|
| `APP_STORE_CONNECT_API_KEY_ID` | App Store Connect API Key ID |
| `APP_STORE_CONNECT_API_KEY_ISSUER_ID` | App Store Connect Issuer ID |
| `APP_STORE_CONNECT_API_KEY_CONTENT` | API Key content (base64-encoded .p8 file) |
| `APPLE_ID` | Apple Developer account email |
| `APPLE_TEAM_ID` | Apple Developer Team ID |
| `ITC_TEAM_ID` | App Store Connect Team ID |
| `MATCH_GIT_URL` | Git repo URL for certificates (Fastlane Match) |
| `MATCH_GIT_BASIC_AUTHORIZATION` | Base64-encoded `username:token` for Git repo |
| `MATCH_PASSWORD` | Encryption password for Match certificates |

**Required Secrets for Play Store (Android):**

| Secret | Description |
|--------|-------------|
| `ANDROID_KEYSTORE_BASE64` | Base64-encoded release keystore file |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore password |
| `ANDROID_KEY_ALIAS` | Signing key alias |
| `ANDROID_KEY_PASSWORD` | Signing key password |
| `FIREBASE_SERVICE_ACCOUNT` | Reuses existing Firebase service account (must have Play Console permissions) |

**Setup Guide:** See `docs/MOBILE_DEPLOYMENT_SETUP.md` for detailed setup instructions
