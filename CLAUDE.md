# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Spicy vs Sweet** is a multiplayer party quiz game inspired by French TV quiz shows. Players join rooms, split into teams (Spicy vs Sweet), and compete through 5 chaotic, funny game phases.

**Core Features:**
- **Real-time Multiplayer**: 2-20 players per room via Firebase Realtime Database
- **Team-based Gameplay**: Spicy (red) vs Sweet (pink) teams
- **5 Game Phases**: Tenders, Sucré Salé, La Carte, La Note, Burger Ultime
- **AI-Generated Questions**: Custom content via Google Gemini (Genkit)
- **Food Mascot Avatars**: 15 customizable food-themed avatars

**Tech Stack:**
- Frontend: React 19 + TypeScript + Vite + Tailwind CSS + Framer Motion
- Backend: Firebase Functions (Node 22) with Firebase Functions v2 API
- Database: Firebase Realtime Database (game state) + Firestore (user data)
- AI: Google Gemini via Genkit (`@genkit-ai/googleai`)
- Auth: Firebase Authentication (Google Sign-In)
- Payments: Stripe (for premium features)
- Analytics: Firebase Analytics (production only)
- CI/CD: GitHub Actions with multi-stage pipeline

## Development Commands

### Local Development
```bash
# Start dev server (frontend only, port 5173)
npm run dev

# Start Firebase emulators (Auth:9099, Functions:5001, Database:9000, UI:4000)
npm run emulators

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

### Game Phases

| Phase | Name | Mechanics |
|-------|------|-----------|
| 1 | **Tenders** | Speed MCQ - First correct answer wins point |
| 2 | **Sucré Salé** | Binary choice (A/B/Both) - All players answer |
| 3 | **La Carte** | Team selects menu, answers themed questions |
| 4 | **La Note** | Buzzer round - Teams race to buzz and answer |
| 5 | **Burger Ultime** | 10-question sequence - Answer all after hearing all |

### Key Design Patterns

**Real-time State with Firebase RTDB:**
- All game state lives in `rooms/{roomId}` in Realtime Database
- Frontend subscribes via `onValue()` for real-time updates
- Disconnect handlers track player online status

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
- `useReducedMotion()` hook respects user's `prefers-reduced-motion` setting
- Apply `shouldReduceMotion` flag to disable animations for accessibility

### Data Model

All TypeScript types are centralized in `src/types/gameTypes.ts`.

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

**Firestore (unchanged from template):**
```
users/{userId}
  - email, subscriptionStatus, stripeCustomerId, etc.
```

### Cloud Functions

**Exported Functions:**
- `generateGameQuestions` - AI generation for phases 1, 2, 5 (requires auth, uses Genkit)
- `getUserSubscription` - Fetches user subscription data
- `createCheckoutSession` - Creates Stripe checkout
- `createPortalSession` - Opens Stripe billing portal
- `cancelSubscription` - Cancels Stripe subscription
- `stripeWebhook` - Handles Stripe events

**AI Integration (Genkit + Gemini):**
- Model: `gemini-2.0-flash` via Genkit
- Prompts: See `functions/src/prompts.ts`
- Flow: See `functions/src/services/gameGenerator.ts`

## Project Structure

```
src/
├── components/
│   ├── ai/                   # AI features
│   │   └── AIGeneratorModal.tsx
│   ├── auth/                 # Authentication & user
│   │   ├── AuthModal.tsx, AuthRequired.tsx
│   │   ├── UserBar.tsx, ProfileEditModal.tsx
│   │   └── EmailVerification.tsx, EmailActionHandler.tsx
│   ├── game/                 # Core game components
│   │   ├── PhaseRouter.tsx   # Routes to correct phase component
│   │   ├── GameHeader.tsx    # In-game header with scores
│   │   ├── TeamScores.tsx    # Team score display
│   │   ├── PhaseTransition.tsx, QuestionTransition.tsx
│   │   ├── DebugPanel.tsx    # Debug panel (DEV ONLY)
│   │   └── TeammateRoster.tsx
│   ├── phases/               # Phase-specific player views
│   │   ├── Phase1Player.tsx  # Tenders (Speed MCQ)
│   │   ├── Phase2Player.tsx  # Sucré Salé (Binary choice)
│   │   ├── Phase3Player.tsx  # La Carte (Menu selection)
│   │   ├── Phase4Player.tsx  # La Note (Buzzer round)
│   │   └── Phase5Player.tsx  # Burger Ultime (Final)
│   ├── subscription/         # Payment & subscription
│   │   ├── Header.tsx, UsageBanner.tsx, FreeTrialBanner.tsx
│   ├── ui/                   # Shared UI components
│   │   ├── Logo.tsx, SharedBackground.tsx, PageTransition.tsx
│   │   ├── SimpleConfetti.tsx, GenerationLoadingCard.tsx
│   │   └── avatars/          # Food mascot avatar SVGs (15 types)
│   ├── AvatarIcon.tsx        # Avatar selector/display
│   └── LanguageSelector.tsx  # i18n language picker
├── pages/
│   ├── HomePage.tsx          # Landing + Create/Join
│   ├── HostLobby.tsx         # Room creation + team management
│   ├── JoinGame.tsx          # Join room with code
│   ├── GameRoom.tsx          # Main game view (uses PhaseRouter)
│   └── LoginPage.tsx         # Authentication
├── services/
│   ├── firebase.ts           # Firebase initialization + callable functions
│   ├── gameService.ts        # Game state management (RTDB)
│   ├── debugService.ts       # Debug utilities (DEV ONLY)
│   ├── audioService.ts       # Sound effects
│   └── historyService.ts     # Question deduplication
├── hooks/
│   ├── useAuthUser.ts        # Firebase auth state
│   ├── useGameRoom.ts        # Room subscription & player state
│   ├── useGameTranslation.ts # Game-specific i18n
│   ├── useQuestionGeneration.ts # AI question generation flow
│   ├── useReducedMotion.ts   # Accessibility (respects prefers-reduced-motion)
│   └── useClipboard.ts       # Clipboard utilities
├── types/
│   └── gameTypes.ts          # All game types (Avatar, Player, Room, etc.)
├── i18n/
│   ├── config.ts             # i18next configuration
│   └── types.ts              # Translation key types
├── data/
│   ├── questions.ts          # Default Phase 1 questions
│   ├── phase2.ts             # Default Phase 2 sets
│   ├── phase4.ts             # Default Phase 4 questions
│   └── phase5.ts             # Default Phase 5 questions

functions/src/
├── index.ts                  # Function exports
├── prompts.ts                # AI prompts for game generation
├── config/
│   ├── firebase.ts           # Admin SDK setup
│   └── genkit.ts             # Genkit + Gemini setup
├── services/
│   └── gameGenerator.ts      # Genkit flow for AI questions
└── utils/
    └── costCalculator.ts     # Token cost estimation
```

## Common Tasks

### Adding a New Game Phase
1. Create `Phase{N}Player.tsx` component in `src/components/phases/`
2. Add phase data in `src/data/phase{n}.ts`
3. Update types in `src/types/gameTypes.ts` (PhaseStatus, GameState, PHASE_NAMES)
4. Add phase logic functions (start, submit, next) in `gameService.ts`
5. Update `PhaseRouter.tsx` to route to new phase
6. Update `setGameStatus()` to initialize phase state

### Adding New Avatars
1. Add avatar name to `Avatar` type in `src/types/gameTypes.ts`
2. Add to `AVATAR_LIST` array in `src/types/gameTypes.ts`
3. Create SVG component in `src/components/ui/avatars/{Name}Avatar.tsx`
4. Register in `src/components/AvatarIcon.tsx`

### Modifying AI Prompts
Edit `functions/src/prompts.ts`:
- `GAME_GENERATION_SYSTEM_PROMPT` - Base persona
- `PHASE1_PROMPT` - Tenders (Speed MCQ) format
- `PHASE2_PROMPT` - Sucré Salé (Binary choice) format
- `PHASE5_PROMPT` - Burger Ultime format

### Adding a New Cloud Function
1. Add function in `functions/src/index.ts` using v2 syntax
2. Build: `cd functions && npm run build`
3. Export in frontend: `src/services/firebase.ts`
4. Call from frontend: `await myFunction({ param: value })`

## Internationalization (i18n)

The app uses i18next with 5 supported languages: EN, FR, ES, DE, PT.

**Key Files:**
- `src/i18n/config.ts` - i18next setup
- `public/locales/{lang}/translation.json` - Translation files
- `src/hooks/useGameTranslation.ts` - Game-specific translation hook

**Adding Translations:**
1. Add keys to all `public/locales/{lang}/translation.json` files
2. Use `useTranslation()` from react-i18next or `useGameTranslation()` for game-specific strings
3. For phase names/descriptions, use `PHASE_NAMES` constants in `src/types/gameTypes.ts`

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

### Mock Player Convention
- **ID prefix**: All mock players have IDs starting with `mock_` (e.g., `mock_001`)
- **Passive**: Mock players don't auto-respond - they just fill team slots
- **Excluded from completion checks**: Phase 2 round completion only counts real players
- **Food-themed names**: "Chef Pepper", "Princess Honey", etc.

### Usage Example
1. Run `npm run dev`
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
- `.firebaserc` - Project configuration

## Known Issues & Gotchas

### Firebase Functions v2 Specifics
- Must use `.env.local` not `.env` for local development
- Cannot use variables starting with `FIREBASE_` prefix
- Do NOT call `dotenv.config()` manually - Functions v2 auto-loads `.env.local`

### Realtime Database vs Firestore
- **RTDB**: Used for game state (rooms, players, phases) - optimized for real-time sync
- **Firestore**: Used for user profiles, subscriptions - optimized for queries

### Genkit/Gemini
- Use `ai.defineFlow()` for structured AI operations
- JSON extraction from response: `text.match(/\{[\s\S]*\}|\[[\s\S]*\]/)`
- Model config in `functions/src/config/genkit.ts`

### Player Disconnect Handling
- `onDisconnect()` sets `isOnline: false` when player disconnects
- `markPlayerOnline()` for reconnection scenarios
- UI should show offline players differently

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

### Production Deployment (`.github/workflows/firebase-hosting-merge.yml`)
**Triggers:** Push to `master` branch

**Stages:**
1. Quality Checks - ESLint, TypeScript type-check
2. Build - Frontend + Functions builds
3. Deploy - Deploy to Firebase Hosting + Functions

### PR Preview (`.github/workflows/firebase-hosting-pull-request.yml`)
**Triggers:** Pull request creation or update
- Automatic preview deployment
- Quality checks validation
- Temporary preview URLs (expire after 7 days)
