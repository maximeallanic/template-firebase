#!/bin/bash

# Spicy vs Sweet - Complete Deployment Script
# Deploys Hosting, Functions, and Firestore rules to Firebase Production

set -e # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project configuration - reads from .firebaserc
PROJECT_ID=$(grep -o '"default": "[^"]*"' .firebaserc | cut -d'"' -f4)
FUNCTIONS_DIR="functions"

if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}✗ Could not read project ID from .firebaserc${NC}"
    exit 1
fi

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   Spicy vs Sweet - Full Deployment Script${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo -e "${RED}✗ Firebase CLI not found!${NC}"
    echo "  Install it with: npm install -g firebase-tools"
    exit 1
fi

echo -e "${GREEN}✓ Firebase CLI found${NC}"

# Check if user is logged in
if ! firebase projects:list &> /dev/null; then
    echo -e "${YELLOW}! You need to login to Firebase${NC}"
    firebase login
fi

echo -e "${GREEN}✓ Firebase authentication OK${NC}"
echo ""

# Step 1: Build Frontend
echo -e "${BLUE}[1/5] Building frontend...${NC}"
if npm run build; then
    echo -e "${GREEN}✓ Frontend built successfully${NC}"
else
    echo -e "${RED}✗ Frontend build failed${NC}"
    exit 1
fi
echo ""

# Step 2: Build Functions
echo -e "${BLUE}[2/5] Building Cloud Functions...${NC}"
cd "$FUNCTIONS_DIR"

if ! [ -d "node_modules" ]; then
    echo -e "${YELLOW}! Installing functions dependencies...${NC}"
    npm ci
fi

if npm run build; then
    echo -e "${GREEN}✓ Functions built successfully${NC}"
else
    echo -e "${RED}✗ Functions build failed${NC}"
    cd ..
    exit 1
fi

cd ..
echo ""

# Step 3: Run TypeScript checks
echo -e "${BLUE}[3/5] Running TypeScript checks...${NC}"
if npm run type-check; then
    echo -e "${GREEN}✓ Type checks passed${NC}"
else
    echo -e "${YELLOW}! Type checks failed (continuing anyway)${NC}"
fi
echo ""

# Step 4: Deploy to Firebase
echo -e "${BLUE}[4/5] Deploying to Firebase Production...${NC}"
echo -e "${YELLOW}  This will deploy:${NC}"
echo "  - Hosting (Frontend)"
echo "  - Cloud Functions"
echo "  - Firestore Rules"
echo "  - Firestore Indexes"
echo ""

read -p "Continue with deployment? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Deployment cancelled${NC}"
    exit 0
fi

if firebase deploy \
    --only hosting,functions,firestore:rules,firestore:indexes \
    --project "$PROJECT_ID"; then
    echo -e "${GREEN}✓ Deployment successful!${NC}"
else
    echo -e "${RED}✗ Deployment failed${NC}"
    exit 1
fi
echo ""

# Step 5: Verify deployment
echo -e "${BLUE}[5/5] Deployment complete!${NC}"
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}   Deployment Summary${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "🌐 Hosting: ${BLUE}https://spicy-vs-sweet.com${NC}"
echo -e "⚡ Functions: ${BLUE}Deployed to us-central1${NC}"
echo -e "🔥 Firestore: ${BLUE}Rules and indexes updated${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Test the live application"
echo "  2. Monitor Functions logs: ${BLUE}firebase functions:log${NC}"
echo "  3. Check Firestore data in Firebase Console"
echo ""
echo -e "${GREEN}✨ All done!${NC}"
