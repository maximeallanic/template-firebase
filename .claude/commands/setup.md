# Template Setup Workflow (BMad Method)

This skill configures a new Firebase SaaS project using the **BMad** methodology (Breakthrough Method for Agile AI-Driven Development).

## BMad Approach

BMad uses specialized agents and structured documents for professional project definition:

| Agent | Role | Outputs |
|-------|------|---------|
| **Product Manager** | Define problem, users, requirements | Product Brief, PRD |
| **Architect** | Design technical solution | Architecture Doc |
| **Scrum Master** | Organize work into sprints | Epics, Stories, Sprint Status |
| **Developer** | Implement stories | Code, Tests |

---

## Prerequisites Check

Before starting, verify these CLIs are authenticated:

```bash
gcloud auth list                    # Google Cloud
firebase login:list                 # Firebase
gh auth status                      # GitHub
stripe config --list                # Stripe (optional, for payments)
```

If any are missing, authenticate them first:
- `gcloud auth login`
- `firebase login`
- `gh auth login`
- `stripe login`

---

## Phase 1: Product Brief (BMad - PM Agent)

Create `_bmad-output/product-brief.md` by asking these questions using AskUserQuestion:

### A. Problem & Vision
1. "What problem does your application solve?"
2. "Why is this problem worth solving? What's the impact?"

### B. Target Users (Persona)
3. "Who is your primary user? Describe their role, pain points, and goals."
4. "Do you have a secondary user persona?"

### C. Value Proposition
5. "What is your unique value proposition? (What makes your solution better than alternatives?)"

### D. MVP Scope
6. "What are the 3-5 MUST HAVE features for your MVP (P0)?"
7. "What features would be nice to have but not essential (P1-P2)?"

### E. Success Metrics
8. "How will you measure success? (user signups, revenue, engagement metrics)"

### F. Constraints
9. "What is your target timeline for MVP?"
10. "What is your monetization strategy?" (Free / Freemium / Subscription / One-time)

After collecting answers, generate the Product Brief using this template:

```markdown
# Product Brief: {{APP_NAME}}

## Problem Statement
[What problem are you solving?]

## Target Users

### Primary Persona
- **Name**: [Persona name]
- **Role**: [Job title or description]
- **Pain Points**:
  - [Pain point 1]
  - [Pain point 2]
- **Goals**:
  - [Goal 1]
  - [Goal 2]

### Secondary Persona (if applicable)
[...]

## Value Proposition
[Your unique value proposition]

## MVP Scope

### Must Have (P0)
1. [Feature 1]
2. [Feature 2]
3. [Feature 3]

### Should Have (P1)
1. [Feature]

### Nice to Have (P2)
1. [Feature]

## Success Metrics
- [ ] [Metric 1]: [Target]
- [ ] [Metric 2]: [Target]

## Constraints
- **Timeline**: [Target date]
- **Monetization**: [Strategy]
- **Tech Stack**: Firebase, React 19, TypeScript (template standard)
```

---

## Phase 2: PRD - Product Requirements Document (BMad - PM Agent)

Create `_bmad-output/PRD.md` based on the Product Brief:

```markdown
# PRD: {{APP_NAME}}

## Overview

### Vision
[High-level vision statement]

### Goals
1. [Goal 1]
2. [Goal 2]

### Non-Goals (Out of Scope)
- [Explicitly excluded feature 1]
- [Explicitly excluded feature 2]

## User Stories

### Epic: Authentication
- [ ] As a user, I want to sign up with email so that I can create an account
- [ ] As a user, I want to sign in with Google so that I can access quickly

### Epic: [Core Feature 1]
- [ ] As a [user type], I want [feature] so that [benefit]
- [ ] As a [user type], I want [feature] so that [benefit]

### Epic: [Core Feature 2]
[...]

## Functional Requirements

### FR-001: [Feature Name]
- **Description**: [What it does]
- **User Flow**: [Step by step]
- **Acceptance Criteria**:
  - [ ] [Criterion 1]
  - [ ] [Criterion 2]

### FR-002: [Feature Name]
[...]

## Non-Functional Requirements

### Performance
- Page load: < 3 seconds
- API response: < 500ms

### Security
- Firebase Authentication required
- Firestore security rules enforced
- Input validation on all forms

### Scalability
- Firestore auto-scales
- Cloud Functions cold start < 2s

### Internationalization
- Support: EN, FR, ES, DE, PT (template standard)

## Technical Constraints
- Must use Firebase (Firestore, Functions, Auth)
- Must follow template patterns
- Must pass type-check and lint
```

---

## Phase 3: Architecture (BMad - Architect Agent)

Create `_bmad-output/architecture.md`:

```markdown
# Architecture: {{APP_NAME}}

## Tech Stack

| Layer | Technology | Justification |
|-------|------------|---------------|
| Frontend | React 19 + TypeScript + Vite | Template standard, fast builds |
| Styling | Tailwind CSS + Framer Motion | Utility-first, smooth animations |
| Backend | Firebase Functions v2 (Node 22) | Serverless, auto-scaling |
| Database | Firestore | NoSQL, real-time sync |
| Auth | Firebase Authentication | Email + Google Sign-In |
| Payments | Stripe | Multi-currency subscriptions |
| Hosting | Firebase Hosting | CDN, SSL included |
| Mobile | Capacitor | iOS + Android from same codebase |

## System Design

### High-Level Architecture
```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Client    │────▶│   Firebase   │────▶│   Stripe    │
│  (React)    │     │  Functions   │     │   (Payments)│
└─────────────┘     └──────────────┘     └─────────────┘
       │                   │
       ▼                   ▼
┌─────────────┐     ┌──────────────┐
│  Firebase   │     │  Firestore   │
│    Auth     │     │  (Database)  │
└─────────────┘     └──────────────┘
```

## Data Model (Firestore)

### Collection: users
```typescript
interface User {
  email: string;
  emailVerified: boolean;
  profileName: string;
  avatarUrl?: string;
  subscriptionStatus: 'free' | 'active' | 'cancelled';
  stripeCustomerId?: string;
  hasPremiumAccess: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Collection: [custom collection]
```typescript
interface [EntityName] {
  // Define based on features
}
```

## API Design (Cloud Functions)

### Existing (Template)
| Function | Trigger | Purpose |
|----------|---------|---------|
| getUserSubscription | onCall | Fetch user subscription status |
| createCheckoutSession | onCall | Create Stripe checkout |
| createPortalSession | onCall | Open Stripe billing portal |
| cancelSubscription | onCall | Cancel subscription |
| stripeWebhook | onRequest | Handle Stripe events |
| deleteAccount | onCall | GDPR account deletion |

### New Functions (Custom)
| Function | Trigger | Purpose |
|----------|---------|---------|
| [functionName] | [onCall/onRequest] | [Purpose] |

## Security

### Authentication
- All protected routes require Firebase Auth
- AuthRequired component wraps protected pages

### Firestore Rules
- Users can only read/write their own data
- Premium features check `hasPremiumAccess`

### Input Validation
- Zod schemas for all API inputs
- Client-side and server-side validation

## Scalability Strategy
- Firestore handles auto-scaling
- Cloud Functions scale to 0 when idle
- CDN caching for static assets
```

---

## Phase 4: Domain Search

Generate domain variations from the app name:
- Direct: `myapp`
- Prefixes: `getmyapp`, `trymyapp`, `usemyapp`
- Suffixes: `myapphq`, `myappapp`

Use the configured MCP domain search tool to check availability.

Extensions priority: .com > .app > .io > .co

Present available domains with prices to user. They can purchase through the registrar.

If no MCP configured, ask user: "Do you have a domain already, or should we skip domain search?"

---

## Phase 5: Resource Creation (CLI Automation)

### 5.1 Google Cloud Project
```bash
# Create project
gcloud projects create {{PROJECT_ID}} --name="{{APP_NAME}}"

# Link billing (get billing account first)
gcloud billing accounts list
gcloud billing projects link {{PROJECT_ID}} --billing-account={{BILLING_ID}}

# Enable APIs
gcloud services enable \
  firebase.googleapis.com \
  firestore.googleapis.com \
  cloudfunctions.googleapis.com \
  identitytoolkit.googleapis.com \
  --project={{PROJECT_ID}}
```

### 5.2 Firebase Setup
```bash
# Add Firebase to GCloud project
firebase projects:addfirebase {{PROJECT_ID}}

# Create web app
firebase apps:create web "{{APP_NAME}}" --project={{PROJECT_ID}}

# Get config
firebase apps:sdkconfig web --project={{PROJECT_ID}}

# Create Firestore database
firebase firestore:databases:create default --location=eur3 --project={{PROJECT_ID}}

# Set as current project
firebase use {{PROJECT_ID}}
```

### 5.3 GitHub Repository
```bash
# Create repo
gh repo create {{REPO_NAME}} --private --description="{{APP_DESCRIPTION}}"

# Initialize git and push
git remote add origin git@github.com:{{USER}}/{{REPO_NAME}}.git
git push -u origin main
```

### 5.4 Service Account for CI/CD
```bash
# Create service account
gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions" \
  --project={{PROJECT_ID}}

# Grant roles
gcloud projects add-iam-policy-binding {{PROJECT_ID}} \
  --member="serviceAccount:github-actions@{{PROJECT_ID}}.iam.gserviceaccount.com" \
  --role="roles/firebase.admin"

gcloud projects add-iam-policy-binding {{PROJECT_ID}} \
  --member="serviceAccount:github-actions@{{PROJECT_ID}}.iam.gserviceaccount.com" \
  --role="roles/cloudfunctions.admin"

gcloud projects add-iam-policy-binding {{PROJECT_ID}} \
  --member="serviceAccount:github-actions@{{PROJECT_ID}}.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

# Create key
gcloud iam service-accounts keys create service-account.json \
  --iam-account=github-actions@{{PROJECT_ID}}.iam.gserviceaccount.com

# Add to GitHub secrets
gh secret set FIREBASE_SERVICE_ACCOUNT < service-account.json
rm service-account.json  # Don't keep the key locally
```

### 5.5 Stripe (if monetized)
```bash
# Create product
stripe products create --name="{{APP_NAME}} Premium" -d "metadata[app]={{PROJECT_ID}}"

# Create prices (get product ID from above)
stripe prices create \
  --product={{PRODUCT_ID}} \
  --currency=eur \
  --unit-amount=999 \
  --recurring[interval]=month

stripe prices create \
  --product={{PRODUCT_ID}} \
  --currency=usd \
  --unit-amount=999 \
  --recurring[interval]=month

# Set Firebase secrets
firebase functions:secrets:set STRIPE_SECRET_KEY --project={{PROJECT_ID}}
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET --project={{PROJECT_ID}}
```

---

## Phase 6: Configuration

### Placeholder Replacement

Replace these placeholders in all files:
- `{{APP_NAME}}` → App display name
- `{{APP_ID}}` → Bundle ID (com.company.appname)
- `{{APP_DESCRIPTION}}` → SEO description
- `{{DOMAIN}}` → Production domain
- `{{PROJECT_ID}}` → Firebase project ID
- `{{GOOGLE_WEB_CLIENT_ID}}` → OAuth Web Client ID
- `{{GOOGLE_ANDROID_CLIENT_ID}}` → OAuth Android Client ID
- `{{GOOGLE_IOS_CLIENT_ID}}` → OAuth iOS Client ID

Files to update:
- `.firebaserc`
- `capacitor.config.ts`
- `index.html`
- `public/manifest.webmanifest`
- `public/metadata.json`
- `public/robots.txt`
- `public/sitemap.xml`
- `functions/src/index.ts` (ALLOWED_ORIGINS)
- `android/app/build.gradle`
- `ios/App/App/Info.plist`
- `public/locales/*/home.json` (all 5 languages)

### Environment Files

#### Frontend (.env)
```bash
cp .env.example .env
```
Fill with Firebase config from `firebase apps:sdkconfig`.

#### Functions (functions/.env.local)
```bash
cp functions/.env.example functions/.env.local
```
Set APP_NAME and APP_URL.

---

## Phase 7: Epics & Stories (BMad - PM + Architect Agents)

Based on the PRD, create stories in `_bmad-output/stories/`:

### Epic Structure
Create `_bmad-output/epics/epic-XXX-[name].md`:

```markdown
# Epic: [Epic Name]

## Description
[What this epic accomplishes]

## User Stories
- STORY-001: [Title]
- STORY-002: [Title]
- STORY-003: [Title]

## Dependencies
- Requires: [Other epics or setup]
- Enables: [What this unlocks]

## Acceptance Criteria
- [ ] [Overall epic criterion]
```

### Story Template
Create `_bmad-output/stories/STORY-XXX.md`:

```markdown
# STORY-XXX: [Title]

## Epic
[Parent epic name]

## Description
As a [user type], I want [feature] so that [benefit].

## Acceptance Criteria
- [ ] Given [context], when [action], then [result]
- [ ] Given [context], when [action], then [result]

## Technical Notes

### Files to Create
- `src/types/[feature].ts` - TypeScript interfaces
- `src/services/[feature]Service.ts` - Firestore operations
- `src/hooks/use[Feature].ts` - React hook
- `src/components/[feature]/` - UI components
- `src/pages/[Feature].tsx` - Page component
- `public/locales/*/[namespace].json` - Translations (5 languages)

### Files to Modify
- `src/App.tsx` - Add route
- `functions/src/index.ts` - Add Cloud Functions (if needed)

### Patterns to Follow
- Firestore: See `src/services/profileService.ts`
- Hooks: See `src/hooks/useProfileComplete.ts`
- Auth: See `src/components/auth/AuthRequired.tsx`
- i18n: See `src/i18n/config.ts`

## Story Points
Estimation: [1 | 2 | 3 | 5 | 8]

## Dependencies
- Blocked by: [STORY-XXX] or none
- Blocks: [STORY-XXX] or none
```

---

## Phase 8: Sprint Planning (BMad - Scrum Master Agent)

Create `_bmad-output/sprint-status.yaml`:

```yaml
project: "{{APP_NAME}}"
current_sprint: 1

sprints:
  - number: 1
    goal: "Core MVP Features"
    stories:
      - id: STORY-001
        title: "[Title]"
        status: pending  # pending | in_progress | review | completed
        points: 3
      - id: STORY-002
        title: "[Title]"
        status: pending
        points: 2

  - number: 2
    goal: "Polish & Launch"
    stories:
      - id: STORY-003
        title: "[Title]"
        status: pending
        points: 5

metrics:
  total_points: 10
  completed_points: 0
  velocity: null  # Set after first sprint
```

---

## Phase 9: Implementation Cycle (BMad - Developer Agent)

For each story in sprint order, execute this cycle:

### 9.1 Story Kickoff
1. Read the story file: `_bmad-output/stories/STORY-XXX.md`
2. Verify dependencies are completed
3. Update status to `in_progress` in sprint-status.yaml

### 9.2 Development
Launch a Task agent with this prompt:

```
## Implement: STORY-XXX - [Title]

### Story
[Paste full story content]

### Implementation Guidelines
1. Follow existing patterns in the codebase
2. Add translations to ALL 5 languages (en, fr, es, de, pt)
3. Use TypeScript strict mode
4. Add proper error handling
5. Ensure mobile responsiveness (Tailwind)

### Validation
After implementation:
- npm run type-check
- npm run lint
- Test manually with npm start
```

### 9.3 Code Review
After implementation, verify:
- [ ] All acceptance criteria met
- [ ] Type-check passes
- [ ] Lint passes
- [ ] Translations in all 5 languages
- [ ] Mobile responsive
- [ ] No security vulnerabilities

### 9.4 Story Completion
1. Update status to `completed` in sprint-status.yaml
2. Increment `completed_points`
3. Move to next story

---

## Phase 10: Validation & Deployment

```bash
# Install dependencies
npm install
cd functions && npm install && cd ..

# Type check and lint (MANDATORY)
npm run type-check
npm run lint

# Build
npm run build

# Test locally
npm start

# Deploy
firebase deploy
```

---

## Checkpoint System

Save progress to `.setup-checkpoint.json` after each major phase:

```json
{
  "currentPhase": 7,
  "currentStep": "story-implementation",
  "completedPhases": [1, 2, 3, 4, 5, 6],
  "configuration": {
    "appName": "My App",
    "projectId": "my-app-12345",
    "domain": "myapp.com"
  },
  "bmadOutputs": {
    "productBrief": "_bmad-output/product-brief.md",
    "prd": "_bmad-output/PRD.md",
    "architecture": "_bmad-output/architecture.md"
  },
  "currentStory": "STORY-003",
  "completedStories": ["STORY-001", "STORY-002"]
}
```

If setup is interrupted, read checkpoint and resume from last completed step.

---

## Output Structure

After setup completes, you'll have:

```
_bmad-output/
├── product-brief.md          # Phase 1 - Problem, users, MVP scope
├── PRD.md                     # Phase 2 - Full requirements
├── architecture.md            # Phase 3 - Technical design
├── epics/
│   ├── epic-001-auth.md       # Template auth epic
│   ├── epic-002-[feature].md  # Custom feature epic
│   └── epic-003-[feature].md
├── stories/
│   ├── STORY-001.md
│   ├── STORY-002.md
│   └── ...
└── sprint-status.yaml         # Sprint tracking

PROJECT_DEFINITION.md          # Summary for CLAUDE.md
.setup-checkpoint.json         # Progress tracking
```

---

## Finalization

After setup is complete:

1. **Delete** the TEMPLATE SETUP section from CLAUDE.md
2. **Update** Project Overview with project info from product-brief.md
3. **Document** implemented features in Project Features section
4. **Remove** `.setup-checkpoint.json`
5. **Commit** all changes with message: "chore: initial project setup via BMad"

---

## Quick Reference: BMad Workflow

```
Phase 1: Product Brief    → Define problem, users, MVP
Phase 2: PRD              → Detail requirements, user stories
Phase 3: Architecture     → Tech stack, data model, APIs
Phase 4: Domain Search    → Find available domain
Phase 5: Resources        → Create GCloud, Firebase, GitHub, Stripe
Phase 6: Configuration    → Replace placeholders, env files
Phase 7: Epics & Stories  → Break down into implementable units
Phase 8: Sprint Planning  → Organize stories into sprints
Phase 9: Implementation   → Dev cycle per story
Phase 10: Deployment      → Validate and deploy
```
