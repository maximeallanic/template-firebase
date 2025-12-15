#!/bin/bash

# ============================================
# Firebase + React SaaS Template Setup Script
# ============================================
# This script replaces all placeholders with your project configuration.
# Run this script once after cloning the template.

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo -e "${BLUE}========================================"
echo "  Firebase + React SaaS Template Setup  "
echo -e "========================================${NC}"
echo ""

# Check if already configured
if [ -f ".template-configured" ]; then
    echo -e "${YELLOW}Warning: This template appears to already be configured.${NC}"
    read -p "Do you want to reconfigure? (y/N): " RECONFIGURE
    if [[ ! "$RECONFIGURE" =~ ^[Yy]$ ]]; then
        echo "Setup cancelled."
        exit 0
    fi
fi

# Collect configuration
echo -e "${GREEN}Please enter your project configuration:${NC}"
echo ""

read -p "App Name (display name, e.g., 'MyApp'): " APP_NAME
while [ -z "$APP_NAME" ]; do
    echo -e "${RED}App name is required.${NC}"
    read -p "App Name: " APP_NAME
done

read -p "App Slug (URL-safe, e.g., 'my-app'): " APP_NAME_SLUG
if [ -z "$APP_NAME_SLUG" ]; then
    APP_NAME_SLUG=$(echo "$APP_NAME" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | tr -cd '[:alnum:]-')
    echo -e "${YELLOW}Using generated slug: $APP_NAME_SLUG${NC}"
fi

read -p "Domain (e.g., 'myapp.com'): " DOMAIN
while [ -z "$DOMAIN" ]; do
    echo -e "${RED}Domain is required.${NC}"
    read -p "Domain: " DOMAIN
done

read -p "Firebase Project ID: " PROJECT_ID
while [ -z "$PROJECT_ID" ]; do
    echo -e "${RED}Firebase Project ID is required.${NC}"
    read -p "Firebase Project ID: " PROJECT_ID
done

read -p "Company Name (for legal pages): " COMPANY_NAME
if [ -z "$COMPANY_NAME" ]; then
    COMPANY_NAME="$APP_NAME"
    echo -e "${YELLOW}Using app name as company name: $COMPANY_NAME${NC}"
fi

read -p "Company Address: " COMPANY_ADDRESS
read -p "Support Email (e.g., 'support@$DOMAIN'): " SUPPORT_EMAIL
if [ -z "$SUPPORT_EMAIL" ]; then
    SUPPORT_EMAIL="support@$DOMAIN"
    echo -e "${YELLOW}Using default: $SUPPORT_EMAIL${NC}"
fi

read -p "Twitter Handle (without @, optional): " TWITTER_HANDLE

# Generate derived values
APP_NAME_LOWER=$(echo "$APP_NAME" | tr '[:upper:]' '[:lower:]' | tr -d ' ')
COOKIE_PREFIX="${APP_NAME_LOWER}"
LANGUAGE_STORAGE_KEY="${APP_NAME_LOWER}_language"

echo ""
echo -e "${BLUE}Configuration Summary:${NC}"
echo "  App Name:        $APP_NAME"
echo "  App Slug:        $APP_NAME_SLUG"
echo "  Domain:          $DOMAIN"
echo "  Project ID:      $PROJECT_ID"
echo "  Company:         $COMPANY_NAME"
echo "  Support Email:   $SUPPORT_EMAIL"
echo "  Cookie Prefix:   $COOKIE_PREFIX"
echo ""

read -p "Proceed with this configuration? (Y/n): " CONFIRM
if [[ "$CONFIRM" =~ ^[Nn]$ ]]; then
    echo "Setup cancelled."
    exit 0
fi

echo ""
echo -e "${GREEN}Replacing placeholders...${NC}"

# Function to replace placeholders in a file
replace_in_file() {
    local file=$1
    if [ -f "$file" ]; then
        # Use | as delimiter to avoid issues with URLs containing /
        sed -i "s|{{APP_NAME}}|$APP_NAME|g" "$file"
        sed -i "s|{{APP_NAME_SLUG}}|$APP_NAME_SLUG|g" "$file"
        sed -i "s|{{APP_NAME_LOWER}}|$APP_NAME_LOWER|g" "$file"
        sed -i "s|{{DOMAIN}}|$DOMAIN|g" "$file"
        sed -i "s|{{PROJECT_ID}}|$PROJECT_ID|g" "$file"
        sed -i "s|{{COMPANY_NAME}}|$COMPANY_NAME|g" "$file"
        sed -i "s|{{COMPANY_ADDRESS}}|$COMPANY_ADDRESS|g" "$file"
        sed -i "s|{{SUPPORT_EMAIL}}|$SUPPORT_EMAIL|g" "$file"
        sed -i "s|{{TWITTER_HANDLE}}|$TWITTER_HANDLE|g" "$file"
        sed -i "s|{{COOKIE_PREFIX}}|$COOKIE_PREFIX|g" "$file"
        sed -i "s|{{LANGUAGE_STORAGE_KEY}}|$LANGUAGE_STORAGE_KEY|g" "$file"
        echo "  Updated: $file"
    fi
}

# Configuration files
replace_in_file ".env.example"
replace_in_file "functions/.env.example"
replace_in_file ".firebaserc"
replace_in_file "package.json"

# HTML and SEO
replace_in_file "index.html"
replace_in_file "public/robots.txt"
replace_in_file "public/sitemap.xml"
replace_in_file "public/metadata.json"
replace_in_file "public/.well-known/ai-plugin.json"

# Frontend source
replace_in_file "src/services/firebase.ts"
replace_in_file "src/i18n/types.ts"
replace_in_file "src/components/Header.tsx"
replace_in_file "src/components/EmailActionHandler.tsx"

# Backend functions
replace_in_file "functions/src/index.ts"
replace_in_file "functions/src/createEmailSession.ts"
replace_in_file "functions/src/config/genkit.ts"

# Legal pages
replace_in_file "src/pages/TermsOfService.tsx"
replace_in_file "src/pages/TermsAndConditions.tsx"

# Translation files (all languages)
for lang in en fr es de pt; do
    replace_in_file "public/locales/$lang/translation.json"
done

# GitHub Actions
replace_in_file ".github/workflows/firebase-hosting-merge.yml"
replace_in_file ".github/workflows/firebase-hosting-pull-request.yml"

# Scripts
replace_in_file "scripts/deploy-all.sh"

# Documentation
replace_in_file "CLAUDE.md"
replace_in_file "README.md"
replace_in_file "QUICK-START.md"

# Find and replace in all docs
if [ -d "docs" ]; then
    find docs -name "*.md" -type f | while read -r file; do
        replace_in_file "$file"
    done
fi

# Copy example files to actual config files
echo ""
echo -e "${GREEN}Creating configuration files...${NC}"

if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "  Created: .env (from .env.example)"
else
    echo -e "${YELLOW}  Skipped: .env already exists${NC}"
fi

if [ ! -f "functions/.env.local" ]; then
    cp functions/.env.example functions/.env.local
    echo "  Created: functions/.env.local (from functions/.env.example)"
else
    echo -e "${YELLOW}  Skipped: functions/.env.local already exists${NC}"
fi

# Mark as configured
touch .template-configured
echo "$APP_NAME" > .template-configured

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Next steps:"
echo -e "  1. Edit ${BLUE}.env${NC} with your Firebase credentials"
echo -e "  2. Edit ${BLUE}functions/.env.local${NC} with your API keys"
echo -e "  3. Run: ${YELLOW}npm install${NC}"
echo -e "  4. Run: ${YELLOW}cd functions && npm install${NC}"
echo -e "  5. Run: ${YELLOW}npm run dev${NC} to start development"
echo ""
echo -e "For deployment, see ${BLUE}docs/deployment/README.md${NC}"
echo ""
