# Command Reference

Quick reference for all important commands.

## 📦 Installation

```bash
# Clone repository (if from git)
git clone https://github.com/yourusername/spicy-vs-sweet.git
cd spicy-vs-sweet

# Install frontend dependencies
npm install

# Install functions dependencies
cd functions
npm install
cd ..
```

## 🚀 Development

```bash
# Start development server (http://localhost:5173)
npm run dev

# Type check without building
npm run type-check

# Lint code
npm run lint

# Build for production
npm run build

# Preview production build locally
npm run preview
```

## 🔧 Configuration

```bash
# Copy environment files
cp .env.example .env
cp functions/.env.example functions/.env

# Edit environment files
nano .env
nano functions/.env
```

## 🔥 Firebase Commands

### Initial Setup

```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in project
firebase init

# Add Firebase project
firebase use --add
```

### Configuration

```bash
# Set Stripe API keys
firebase functions:config:set stripe.secret_key="sk_live_..."

# Get current config
firebase functions:config:get

# Clone config from another environment
firebase functions:config:clone --from=production
```

### Deployment

```bash
# Deploy everything (hosting + functions)
npm run deploy
# or
firebase deploy

# Deploy only hosting
npm run deploy:hosting
# or
firebase deploy --only hosting

# Deploy only functions
npm run deploy:functions
# or
firebase deploy --only functions

# Deploy specific function
firebase deploy --only functions:analyzeEmail
```

### Testing & Debugging

```bash
# Start emulators
npm run emulators
# or
firebase emulators:start

# Start emulators with specific ports
firebase emulators:start --only functions,hosting

# View function logs (production)
npm run logs
# or
firebase functions:log

# View real-time logs
firebase functions:log --only analyzeEmail
```

### Project Management

```bash
# List Firebase projects
firebase projects:list

# Switch project
firebase use production
firebase use development

# Get current project
firebase use
```

## 🧪 Testing Commands

```bash
# Test with mock data (no API needed)
# Edit src/config.ts: USE_MOCK_API = true
npm run dev

# Test with real API
# Edit src/config.ts: USE_MOCK_API = false
# Make sure Firebase emulators are running
firebase emulators:start
npm run dev
```

## 📦 Build Commands

```bash
# Production build
npm run build

# Build with clean cache
rm -rf node_modules/.vite dist
npm run build

# Build functions only
cd functions
npm run build
cd ..
```

## 🐛 Debugging Commands

```bash
# Clear all caches
rm -rf node_modules/.vite
rm -rf dist
rm -rf functions/lib

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check for port conflicts
lsof -ti:5173 | xargs kill -9  # Kill Vite
lsof -ti:5001 | xargs kill -9  # Kill Functions emulator
lsof -ti:4000 | xargs kill -9  # Kill Emulator UI

# View all Node processes
ps aux | grep node
```

## 📊 Monitoring Commands

```bash
# View Firebase usage
firebase usage

# View hosting deployment history
firebase hosting:channel:list

# View function details
firebase functions:list

# Open Firebase Console
open https://console.firebase.google.com/project/your-project-id
```

## 🔄 Update Commands

```bash
# Update all dependencies
npm update

# Update Firebase tools
npm update -g firebase-tools

# Check for outdated packages
npm outdated

# Update specific package
npm update react react-dom
```

## 🏗️ Build Analysis

```bash
# Analyze bundle size
npm run build -- --mode development

# Preview with custom port
npm run preview -- --port 8080

# Build with source maps
npm run build -- --sourcemap
```

## 🔐 Environment Management

```bash
# List environment variables (frontend)
env | grep VITE_

# List Firebase function config
firebase functions:config:get

# Delete config
firebase functions:config:unset anthropic.key
```

## 📝 Git Commands (if using)

```bash
# Initial commit
git init
git add .
git commit -m "Initial commit: Spicy vs Sweet MVP"

# Create GitHub repo and push
git remote add origin https://github.com/yourusername/spicy-vs-sweet.git
git branch -M main
git push -u origin main

# Create new feature branch
git checkout -b feature/new-feature

# Deploy from main branch
git checkout main
git pull
npm run deploy
```

## 🚨 Emergency Commands

```bash
# Rollback deployment (restore from git)
git checkout HEAD~1
npm run build
firebase deploy

# Kill all Node processes (use with caution!)
pkill -f node

# Clear Firebase cache
firebase functions:config:unset
firebase deploy --only functions --force

# Reset to clean state
git reset --hard HEAD
rm -rf node_modules dist functions/lib
npm install
cd functions && npm install && cd ..
```

## 📋 Useful Aliases (add to ~/.bashrc or ~/.zshrc)

```bash
# Project aliases (customize prefix as needed)
alias app-dev="npm run dev"
alias app-build="npm run build"
alias app-deploy="npm run deploy"
alias app-logs="firebase functions:log"
alias app-emulators="firebase emulators:start"
alias app-test="npm run dev"
```

## 🔗 Quick Links Commands

```bash
# Open Firebase Console
open "https://console.firebase.google.com/project/$(firebase use | grep active | awk '{print $4}')"

# Open Google Cloud Console
open "https://console.cloud.google.com/"

# Open local dev server
open "http://localhost:5173"

# Open production site
open "https://spicy-vs-sweet.com"
```

## 📖 Documentation Commands

```bash
# View all documentation
ls -la *.md

# Read specific docs
cat README.md
cat QUICK_START.md
cat DEPLOYMENT.md
```

## 🎯 Common Workflows

### Start Development
```bash
npm run dev
```

### Deploy to Production
```bash
npm run build
npm run deploy
```

### Test Locally with Emulators
```bash
# Terminal 1
firebase emulators:start

# Terminal 2
npm run dev
```

### Debug Production Issues
```bash
npm run logs
# or
firebase functions:log --only analyzeEmail
```

---

Keep this file bookmarked for quick reference! 🚀
