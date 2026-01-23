# Changelog

All notable changes to Spicy vs Sweet will be documented in this file.

---

## [v1.0.1] - 2026-01-23

### New Features
- feat(ci): add automatic App Store and Play Store deployment (af6a26b)
- feat: add difficulty score multipliers and improve loading state (d5f7693)
- feat: implement server-side game orchestration for multiplayer (f13172d)
- feat(cleanup): remove fallback data and deprecated CFs (#84) (a5fd74a)
- feat(#89): implement nextPhase Cloud Function (0907fe5)
- feat(#81): implement submitAnswer Cloud Function (7e64c14)
- feat(#88): implement startGame Cloud Function (1e31bcd)
- feat(#90): implement generatePhaseQuestions Pub/Sub Cloud Function (1073ed7)
- feat(security): implement secure RTDB structure (#79) (7a3b198)
- feat(backend): implement server-side game orchestration with submitAnswer CF (3e7698f)
- Add delete account button in profile edit modal (f24d81a)
- Add account deletion feature with GDPR compliance (309dde9)
- Add service worker for PWA installability (56a1d8d)
- Add logging and proper async handling for PWA install button (22b51ed)
- feat: simplify Konami code and add visual feedback (c83242a)
- feat(assets): update monochrome icon for Android and iOS (fe9c949)
- feat: add Konami code to activate debug mode on preview environments (b0b6381)
- feat(assets): update background music and add team icons (c4e9a4c)
- feat(ci): add iOS support to Firebase App Distribution PR workflow (82c3ad5)
- feat(ios): update iOS configuration and services (8202f9c)
- feat(lobby): split mobile lobby into 2-step navigation (4ebbb7d)
- feat(lobby): replace team icons with custom SVG mascots (f026aef)
- feat(icons): add adaptive icons for Android and iOS (b415a3d)
- feat(ios): configure Google Sign-In for iOS native app (406817a)
- feat(auth): add native Google Sign-In for Capacitor apps (d8e3589)
- feat(debug): add DebugPanel support for solo mode (2fdd7ea)
- feat(ci): add mobile PR preview with Firebase App Distribution (1666818)
- feat: add Capacitor support for native iOS and Android apps (38df2de)
- feat(i18n): add Spanish, German, and Portuguese prompt translations (0615b3e)
- feat(generation): serious themes with funny question formulations (32f10d8)
- feat: add sound toggle button in UserBar dropdown (ffea63e)
- feat: implement custom sound design assets throughout the game (6d54f66)
- feat: add cross-env for Windows/Linux compatibility (a8ed3cb)
- feat: add randomized feedback messages with translation variants (a280ee9)
- feat: add Burger Quiz style humor to all translations (FR, EN, ES, DE, PT) (895df11)
- feat: add multilingual AI question generation (FR, EN, ES, DE, PT) (691eaee)
- feat: add language selector to UserBar and fix non-PWA alignment (aa8372e)
- feat: add cross-phase deduplication, theme blacklist, and solo mode i18n (c256cc8)
- feat: restructure i18n with new namespace files and add PWA back button (460c382)
- feat: add phase intros, server-side score validation, and centralized phase transitions (88f8202)
- feat: add myth and urban legend detection to fact-checking prompts (9cc927d)
- feat: internationalize ProfileEditModal and fix Phase2 issues (0709785)
- feat: add multi-currency pricing based on user location (f97ed4e)
- feat: migrate onboarding progress storage to Firebase (8a2c58c)
- feat: display user rank on leaderboard page (ab82f90)
- feat: add comprehensive onboarding system for first-time users (606f6ef)
- feat: update logo, favicon and PWA icons with new design (fd17f34)
- feat: add mandatory profile setup modal for new users (5e5f9a9)
- feat: add Phase 2 timer and improve question generation (caa69a2)
- feat: refactor AI generation system and improve game prompts (d5521c9)
- feat: add PWA home page, optimize AI prompts, and enhance solo mode (1b296ce)
- feat: add multi-language support and optimize AI prompts (e4c3144)
- feat: add AI generation improvements and solo mode enhancements (c330c80)
- feat: add error i18n, phase4 progress ring, and solo leaderboard (c0f2df2)
- feat: add phase4 winner tracking in solo mode and i18n updates (1de5150)
- feat: add unified FoodLoader component and replace all spinners (080ca90)
- feat: add trap menu to phase 3 and improve solo mode (73413bd)
- feat: add solo arcade mode with leaderboard (5bc67b1)
- feat: add PWA install prompt, refactor mock player context and improve question generation (44f30c2)
- feat: add cursor tracking, answer validation, premium features and restructure phase components (2299862)
- feat(phase2): improve homonym display and capitalization (2a6c50b)
- feat: integrate complete i18n translation system (011b7e6)
- feat: add PWA support, update SEO/branding, improve AI prompts (c13ae7a)
- feat: major refactor - remove email features, add game UI polish and debug tools (b3a8e6d)
- feat: add Firebase Realtime Database configuration (0a0400f)
- feat: complete game phases 1-5, add e2e debug mode, and polish UI/audio (af841ea)

### Bug Fixes
- fix(ci): use PAT to bypass branch protection rules (0306b3a)
- fix(ios): use SSH for Match git URL (059228d)
- fix(ios): simplify Matchfile configuration (3f7cc35)
- fix: address Copilot review comments (20a55d0)
- fix: remove console.log debug statements from Phase4 and Phase5 (5eace34)
- fix: remove console.log/warn from frontend code (6a8cefa)
- fix(multiplayer): update room state when Phase 1 winner found (eab9baf)
- fix(solo): show correct answer and anecdote in Phase 1 (a3acec4)
- fix(phase1): reveal correct answer after round ends (4547698)
- fix(security): address Critical/High issues from automated review (54b8051)
- fix(pricing): replace hardcoded prices with dynamic currency system (6bd253f)
- fix(functions): remove App Check from deleteAccount to fix CORS 403 (baff28c)
- Fix install banner z-index to appear above header (082346d)
- Fix chrome-extension cache error by adding protocol validation (ae7f32c)
- Fix URL validation security issue in service worker (0812111)
- fix(ui): move TeamIndicator to right side under player's team score (3d991ee)
- fix(ui): swap score positions based on player's team (63d37f9)
- fix(ui): remove redundant team score indicator from GameHeader (f2f676b)
- fix: remove import.meta.env.DEV conditions from DebugPanel rendering (9efba06)
- fix: sync dev mode state across hook instances via CustomEvent (e60ffc0)
- fix: enable Konami code on localhost and preview environments (990cd08)
- fix(ci): correct iOS unsigned build output path (c535289)
- fix: add global Konami code listener in App.tsx (546e00b)
- fix(ci): add npm install and cap sync to Android/iOS build jobs (042aab9)
- fix: address Copilot PR review feedback for native app integration (523e2f6)
- fix(lint): remove unused catch variables (f3826e4)
- fix(firestore): add composite index for questions phase+createdAt query (02bced7)
- fix(ios): improve app icons for iOS adaptive icon support (4da1f38)
- fix(security): address Copilot review feedback on answer validation (c0fba93)
- fix(scores): improve score display clarity and persistence (58a1ea0)
- fix(mobile): resolve Google Sign-In error code 10 on Android (df1b2a5)
- fix(mobile): replace capacitor-firebase-auth with google-auth plugin (6840ff1)
- fix(phase4): improve result screen gradient and handle timeout answers (2a1dcec)
- fix(mobile): resolve Firebase initialization error with dynamic import (9a64bfe)
- fix(mobile): fix safe area and scroll issues on native apps (64e0734)
- fix(ci): use Java 21 for Capacitor Android builds (d816f25)
- fix(ci): fix secrets access in workflow job condition (b99b4e2)
- fix(phase1): use amber-500 instead of yellow-500 for consistent white text (db2e1b7)
- fix: remove applause from round wins, keep only for final victory (c177026)
- fix(prompts): remove forced hilarious formulations and improve quality (fd7d911)
- fix(phase3): add real-time typing sync, recovery mechanism, and security hardening (6650160)
- fix: improve UI feedback and accessibility (826e9ef)
- fix: update Firebase preview workflow with new service account (7afec28)
- fix: prevent old source's onended from removing new source (c723618)
- fix: use version counter to handle React Strict Mode double-mount (544183d)
- fix: correct race condition in audio cancellation logic (a3c9690)
- fix: stop sounds that are still loading when component unmounts (3eb6215)
- fix(prompts): add Q/A semantic coherence validation for Phase 5 (4756745)
- fix: improve JSON-LD WebSite schema for Google Search site name (ff9a0aa)
- fix: add PNG favicons for Google Search compatibility (3e8f39c)
- fix: add isTimeout flag and restore French accents in translations (420c5b8)
- fix: prevent profile modal flash on login with existing localStorage profile (1182db9)
- fix: add profileSetup translations to common namespace (9005de5)
- fix: replace hardcoded French strings with i18n in SoloGameHeader (f6323d9)
- fix: use PWABackButton in Leaderboard for consistent PWA navigation (aae5b05)
- fix: limit score to one per player (db5776a)
- fix: improve solo mode mobile UX and consolidate progress display (04ba9a4)
- fix: z-index stacking for settings sidebar background (52c2b69)
- fix: use standalone mode and add background to settings sidebar (f89c5e3)
- fix: revert to fullscreen display mode (0e9cb66)
- fix: use standalone display mode for better Android compatibility (650701a)
- fix: PWA fullscreen detection and status bar styling (518b4f1)
- fix: add phase 3 timer, fix animation restarts, and prevent race conditions (6c37994)
- fix: improve game state transitions and prevent race conditions (d21b065)
- fix: prioritize array extraction when parsing AI JSON responses (52f4d5d)
- fix: deploy RTDB rules in CI/CD and improve join room error messages (6a507bd)
- fix: improve premium subscription detection and add debugging (23708d1)
- fix: add missing secrets for Genkit/Gemini in production (c0f5135)
- fix: return to origin page when canceling Stripe checkout (43f891f)
- fix: prevent profile data leaking between different user accounts (635d3e3)
- fix: trigger AI generation when not enough unseen questions (4afd184)
- fix: resolve createContext error by bundling React with Router (a177bf7)
- fix: merge all node_modules into single vendor chunk (10fd33e)
- fix: resolve createContext error by fixing chunk loading order (e3913a6)

### Improvements
- refactor: migrate audio to Web Audio API and improve phase rules (accb3a2)
- refactor: extract phase logos into separate components (6bb26f2)
- refactor: remove client-side question generation in multiplayer (1b643fb)
- Update CHANGELOG with PWA install button fix (0fcd498)
- Improve service worker with better caching strategy and error handling (cd63a82)
- refactor: simplify Konami code with global window flag (ac6ca33)
- refactor: remove Konami code toast notification (3c31d02)
- refactor(phase1): simplify TEXT_COLORS array to single constant (3a27a2e)
- refactor: normalize audio files - convert to MP3 and clean names (59b7408)
- refactor: standardize team names to Spicy/Sweet across all languages (1bea6e9)
- refactor: compress Phase 2 generator prompt by 68% (485e516)
- refactor: restructure components and enhance game features (69cab4c)

### Documentation
- docs: add GitHub Copilot instructions for PR reviews (b880aad)
- docs: comprehensive CLAUDE.md update with new features and structure (e59ace8)

### CI/CD
- ci: add automated release workflow with version bumping and AI changelog (cc2980f)
- ci: trigger workflow with Firebase App Distribution secrets (d28bb0d)
- ci(mobile): add label-based build triggering for PR previews (f9d3fa9)

### Other Changes
- Revert "feat(security): implement server-side game orchestration with submitAnswer CF" (e6495f6)
- Initial plan (df4e95c)
- Co-authored-by: maximeallanic <7780671+maximeallanic@users.noreply.github.com> (e066c80)
- Initial plan (e6d5afb)
- debug: add console logs to Konami code and require it even in dev (7a51fcb)
- chore: add google-services.json for Android Firebase (789aac6)
- chore: init branch for scores display fixes (21a6c4c)
- chore: init branch for Phase 3 bug fixes (95eb441)
- chore: init branch for UI feedback messages fixes (844b095)
- debug: add more logging to track activeSounds state (b6690c2)
- style: improve homepage texts with more punch and humor (a9d995d)
- chore: update branding and metadata for relaunch (182e17d)
- security: fix 10 vulnerabilities from security audit (14e635c)
- chore: fix lint errors in components, pages, and services (ac14b37)
- chore: add company legal information (f6de33f)
- chore: configure project for spicy-vs-sweet.com (8e7b191)



---

- **PWA Install Button**: Fixed the PWA install button that wasn't triggering the native install prompt
  - Added missing service worker (`public/sw.js`) required for PWA installability
  - Registered service worker in `main.tsx` with proper error handling
  - Implemented smart caching strategy (network-first, cache static assets only)
  - Added secure URL validation to prevent bypass attacks
  - Enhanced logging for debugging the install flow
  - Added haptic feedback on button click
  - Browser support: Chrome, Edge, Samsung Internet (Safari iOS has limited PWA support)

## [1.0.0] - Template Release

### Features
- **Email Analysis**: Analyze cold emails on 7 key criteria
  - Subject Line Effectiveness
  - Personalization Quality
  - Value Proposition Clarity
  - Call-to-Action Strength
  - Length Optimization
  - Tone and Language
  - Overall Professionalism
- **AI-Powered**: Uses Google Gemini 2.5 Flash via Vertex AI
- **Free Trial**: 1 analysis without sign-up (IP+fingerprint tracking)
- **Subscription Plans**: Free (5/month) and Pro ($5/month for 250)
- **Email Input**: Receive content via email using Mailgun webhooks
- **Internationalization**: 5 languages (EN, FR, ES, DE, PT)
- **Responsive Design**: Works on desktop, tablet, and mobile

## [Unreleased]

Initial development version.

---

## Version Format

This project uses [Semantic Versioning](https://semver.org/):
- **MAJOR** version for incompatible changes
- **MINOR** version for new features (backwards-compatible)
- **PATCH** version for bug fixes (backwards-compatible)
