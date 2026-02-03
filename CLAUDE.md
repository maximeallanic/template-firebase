# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## TEMPLATE SETUP - Use `/setup` Command (BMad Method)

> **IMPORTANT**: This is a template repository. To configure it for a new project, run the `/setup` command.
>
> The setup uses the **BMad methodology** (Breakthrough Method for Agile AI-Driven Development) for professional project definition with structured documents and specialized agents.

### BMad Workflow Overview

| Phase | Agent | Output |
|-------|-------|--------|
| 1. Product Brief | PM | Problem, users, MVP scope |
| 2. PRD | PM | Full requirements, user stories |
| 3. Architecture | Architect | Tech design, data model |
| 4. Domain Search | - | Available domains |
| 5. Resources | - | GCloud, Firebase, GitHub, Stripe |
| 6. Configuration | - | Placeholders, env files |
| 7. Epics & Stories | PM + Architect | Implementable units |
| 8. Sprint Planning | Scrum Master | Organized sprints |
| 9. Implementation | Developer | Code per story |
| 10. Deployment | - | Production deploy |

### Prerequisites

Before running `/setup`, ensure these CLIs are installed and authenticated:

```bash
# Required
gcloud auth list                    # Google Cloud CLI
firebase login:list                 # Firebase CLI
gh auth status                      # GitHub CLI

# Optional (for payments)
stripe config --list                # Stripe CLI
```

If not authenticated, run:
```bash
gcloud auth login
firebase login
gh auth login
stripe login  # if using payments
```

### Running Setup

Simply type `/setup` in Claude Code. The BMad workflow will:

1. **Product Brief** - Define problem, target users, value proposition, MVP scope
2. **PRD** - Document full requirements, user stories, acceptance criteria
3. **Architecture** - Design data model, API endpoints, security strategy
4. **Find Domain** - Generate variations and check availability
5. **Create Resources** - GCloud project, Firebase app, GitHub repo, Stripe products
6. **Configure Template** - Replace placeholders and set up environment files
7. **Create Epics & Stories** - Break down features into implementable units
8. **Sprint Planning** - Organize stories into prioritized sprints
9. **Implement** - Execute story-by-story development cycle
10. **Deploy** - Validate and deploy to Firebase Hosting

Progress is saved to `.setup-checkpoint.json` - if interrupted, resume by running `/setup` again.

### BMad Output Structure

After setup, you'll have professional documentation in `_bmad-output/`:

```
_bmad-output/
├── product-brief.md      # Problem, users, MVP scope
├── PRD.md                 # Full requirements
├── architecture.md        # Technical design
├── epics/                 # Feature groupings
├── stories/               # Implementable tasks
└── sprint-status.yaml     # Progress tracking
```

### Post-Setup

After setup completes, Claude will:
1. Delete this TEMPLATE SETUP section
2. Update Project Overview with info from product-brief.md
3. Document implemented features from PRD
4. Commit changes

---

## Project Overview

**Firebase SaaS Template** - A production-ready template for quickly bootstrapping Firebase-based SaaS applications with authentication, payments, internationalization, and mobile support.

This is a **template repository**. When creating a new project from this template, Claude will guide you through the setup process using the "TEMPLATE SETUP" section above.

**What's included:**
- Complete authentication flow (Email + Google Sign-In)
- Stripe subscription billing with multi-currency support
- 5-language internationalization (EN, FR, ES, DE, PT)
- Mobile apps via Capacitor (iOS + Android)
- PWA support with offline capabilities
- CI/CD pipelines for automated deployments
- PR preview environments

<!--
INSTRUCTIONS FOR CLAUDE (when setting up a new project):
After template setup, replace this section with actual project info. Example:

**TaskMaster Pro** is a productivity SaaS application that helps freelancers and small teams manage tasks, track time, and generate invoices. Built with Firebase, React, and TypeScript.

**Target Users:** Freelancers, small agencies, remote teams
**Business Model:** Freemium with Pro subscription ($9/month)
-->

## Project Features

<!--
INSTRUCTIONS FOR CLAUDE:
After template setup, analyze the codebase and document all features.
Break down into logical categories. Example:

### User Management
- **Authentication**: Email/password + Google Sign-In
- **Profile**: Avatar, display name, preferences
- **Account Deletion**: GDPR-compliant data removal

### Core Features
- **Task Board**: Kanban-style task management
- **Time Tracking**: Start/stop timer per task
- **Projects**: Organize tasks by project
- **Tags**: Color-coded task categorization

### Collaboration
- **Team Invites**: Invite members via email
- **Shared Projects**: Real-time collaboration
- **Activity Feed**: Track team actions

### Billing
- **Free Tier**: 3 projects, 50 tasks
- **Pro Tier**: Unlimited projects, priority support
- **Stripe Integration**: Secure payment processing
-->

**Template Base Features (update after customization):**
- **Authentication**: Firebase Auth (Email + Google Sign-In)
- **Payments**: Stripe subscriptions with multi-currency (EUR, USD, GBP, BRL)
- **Internationalization**: 5 languages (EN, FR, ES, DE, PT)
- **Mobile**: Capacitor for iOS & Android native apps
- **PWA**: Installable Progressive Web App
- **CI/CD**: GitHub Actions with preview deployments

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS + Framer Motion
- **Backend**: Firebase Functions (Node 22) with v2 API
- **Database**: Firestore (user data) + Realtime Database (real-time features)
- **Auth**: Firebase Authentication
- **Payments**: Stripe
- **CI/CD**: GitHub Actions

## Development Commands

### Local Development
```bash
npm start                 # Dev server + emulators (recommended)
npm run dev              # Frontend only (port 5173)
npm run emulators        # Firebase emulators only (Auth:9099, Functions:5001, Firestore:8080)
```

### Quality Checks (MANDATORY)
```bash
npm run type-check       # TypeScript checking
npm run lint             # ESLint
```
**Never consider a task complete without running both checks successfully.**

### Build & Deploy
```bash
npm run build            # Production build
./scripts/deploy-all.sh  # Deploy everything
npm run deploy           # Hosting + Functions
```

### Functions
```bash
cd functions
npm run build            # Build TypeScript
npm run serve            # Functions emulator
npm run logs             # View production logs
```

## Architecture

### Firebase Functions v2 Pattern
```typescript
export const functionName = onCall(async ({ data, auth }) => {
  // auth.uid, auth.token available
  // data contains client payload
});
```

### Data Model (Firestore)
```
users/{userId}
  - email: string
  - emailVerified: boolean
  - profileName: string
  - subscriptionStatus: 'free' | 'active' | 'cancelled'
  - stripeCustomerId?: string
  - hasPremiumAccess: boolean
  - createdAt, updatedAt: Timestamp

processedWebhooks/{eventId}
  - eventType: string
  - processedAt: Timestamp
```

### Cloud Functions
- `getUserSubscription` - Fetch user subscription
- `createCheckoutSession` - Stripe checkout
- `createPortalSession` - Stripe billing portal
- `cancelSubscription` - Cancel subscription
- `stripeWebhook` - Handle Stripe events
- `deleteAccount` - GDPR account deletion

## Project Structure

```
src/
├── components/
│   ├── auth/           # Authentication (AuthModal, AuthRequired, ProfileEdit...)
│   ├── layout/         # Layout (PersistentHeader)
│   ├── pwa/            # PWA (PWAHomePage, QuickSettings...)
│   ├── subscription/   # Payments (UpgradeModal, UsageBanner...)
│   └── ui/             # Shared UI (Logo, Spinner, PageTransition...)
├── pages/              # Route pages (HomePage, Dashboard, Login...)
├── services/           # Firebase, API, platform services
├── hooks/              # Custom React hooks
├── contexts/           # React contexts (Toast)
├── types/              # TypeScript types
├── animations/         # Framer Motion variants
├── i18n/               # Internationalization config
├── utils/              # Utility functions
└── config/             # App configuration (pricing)

functions/src/
├── index.ts            # Function exports
└── config/             # Firebase Admin setup

public/locales/         # Translation files (en, fr, es, de, pt)
```

## Common Tasks

### Adding a Cloud Function
1. Add in `functions/src/index.ts` using v2 syntax
2. Build: `cd functions && npm run build`
3. Export in `src/services/firebase.ts`
4. Call: `await myFunction({ param: value })`

### Adding a Page
1. Create in `src/pages/{PageName}.tsx`
2. Add route in `src/App.tsx`
3. Wrap with `<AuthRequired>` if protected

### Adding Translations
1. Add keys to `public/locales/{lang}/*.json` (all 5 languages)
2. Use `useTranslation(namespace)` from react-i18next

## Known Issues & Gotchas

- **Firebase Functions v2**: Use `.env.local` not `.env`, no `FIREBASE_` prefix variables
- **Stripe secrets**: Use `firebase functions:secrets:set`, never commit keys
- **PWA hooks**: `useAppInstall()`, `useOrientationLock()`, `useHaptic()`

## CI/CD

- **Production**: Push version tag (`v*`) → Deploy to Firebase
- **PR Preview**: Create PR → Automatic preview URL (7 days)
- **Mobile**: Version tag → iOS TestFlight + Android Play Store
