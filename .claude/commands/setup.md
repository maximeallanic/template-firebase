# Template Setup Workflow

This skill configures a new Firebase SaaS project from this template. It guides you through:
1. Defining your project (Q&A)
2. Finding an available domain
3. Creating cloud resources via CLI
4. Implementing custom features

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

## Phase 1: Project Definition

Ask these questions using AskUserQuestion tool (one group at a time):

### A. Project Identity
1. "What is the name of your application?"
2. "In one sentence, what does your app do?"
3. "What are 3-5 keywords that describe your app?"
4. "Who are your target users?" (freelancers, businesses, consumers, etc.)

### B. Business Model
5. "What's your monetization strategy?" (Free / Freemium / Subscription / One-time)
6. If monetized: "What features will be free vs premium?"
7. If monetized: "What's your target price point?"

### C. Core Features
8. "What are the 3-5 main features your users need?"
9. "Do you need real-time features?" (live updates, collaboration, chat)
10. "Do you need file uploads/storage?"

### D. Technical Scope
11. "Which platforms do you need?" (Web only / Web + Mobile / Web + PWA)
12. "Which languages should be supported?" (default: EN, FR, ES, DE, PT)

After collecting answers, create `PROJECT_DEFINITION.md` with all information.

---

## Phase 2: Domain Search

Generate domain variations from the app name:
- Direct: `myapp`
- Prefixes: `getmyapp`, `trymyapp`, `usemyapp`
- Suffixes: `myapphq`, `myappapp`

Use the configured MCP domain search tool to check availability.

Extensions priority: .com > .app > .io > .co

Present available domains with prices to user. They can purchase through the registrar.

If no MCP configured, ask user: "Do you have a domain already, or should we skip domain search?"

---

## Phase 3: Resource Creation (CLI Automation)

### 3.1 Google Cloud Project
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

### 3.2 Firebase Setup
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

### 3.3 GitHub Repository
```bash
# Create repo
gh repo create {{REPO_NAME}} --private --description="{{APP_DESCRIPTION}}"

# Initialize git and push
git remote add origin git@github.com:{{USER}}/{{REPO_NAME}}.git
git push -u origin main
```

### 3.4 Service Account for CI/CD
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

### 3.5 Stripe (if monetized)
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

## Phase 4: Placeholder Replacement

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

---

## Phase 5: Environment Configuration

### Frontend (.env)
```bash
cp .env.example .env
```
Fill with Firebase config from `firebase apps:sdkconfig`.

### Functions (functions/.env.local)
```bash
cp functions/.env.example functions/.env.local
```
Set APP_NAME and APP_URL.

---

## Phase 6: Feature Implementation

For each custom feature from Phase 1, launch an agent sequentially:

### Feature Classification
| Pattern | Category | Complexity |
|---------|----------|------------|
| login, auth | Authentication | Template included |
| payment, billing | Payments | Template included |
| chat, live, sync | Real-time | Medium |
| upload, file, image | Storage | Medium |
| dashboard, list, CRUD | Data Management | Simple |
| notification, email | Notifications | Medium |

### Agent Prompt Template
```
## Implement: {{FEATURE_NAME}}

### Description
{{FEATURE_DESCRIPTION}}

### Files to create/modify
- src/types/{{feature}}.ts
- src/services/{{feature}}Service.ts
- src/hooks/use{{Feature}}.ts
- src/components/{{feature}}/
- src/pages/{{Feature}}.tsx

### Patterns to follow
- See src/services/profileService.ts for Firestore pattern
- See src/hooks/useProfileComplete.ts for hook pattern
- Add translations to all 5 languages
```

Wait for each agent to complete before starting the next.
Ask user for confirmation between features.

---

## Phase 7: Validation & Deployment

```bash
# Install dependencies
npm install
cd functions && npm install && cd ..

# Type check and lint
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

Save progress to `.setup-checkpoint.json` after each major step:

```json
{
  "phase": 3,
  "step": "firebase-setup",
  "completedSteps": ["questions", "domain-search", "gcloud-project"],
  "configuration": {
    "appName": "My App",
    "projectId": "my-app-12345",
    "domain": "myapp.com"
  }
}
```

If setup is interrupted, read checkpoint and resume from last completed step.

---

## Finalization

After setup is complete:

1. **Delete** the TEMPLATE SETUP section from CLAUDE.md
2. **Update** Project Overview with actual project info
3. **Document** implemented features in Project Features section
4. **Remove** `.setup-checkpoint.json`
5. **Commit** all changes with message: "chore: initial project setup"
