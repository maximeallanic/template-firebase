# 📚 Documentation - Firebase + React SaaS Template

Complete documentation index for the Firebase + React SaaS Template.

> 📝 **Contributing to documentation?** Check the **[Contributing Guide](CONTRIBUTING.md)** for guidelines.

## 🚀 Quick Start

New to the project? Start here:

1. **[Quick Start](setup/quick-start.md)** - Get started in 5 minutes
2. **[Setup Guide](setup/setup-guide.md)** - Complete installation guide
3. **[Local Development](setup/local-development.md)** - Development environment setup

## 📖 Table of Contents

### 🏗️ Deployment

Documentation for deploying the template to production.

- **[Deployment Todo](deployment/todo-deployment.md)** ⭐ - Checklist for deployment
- **[CI/CD Guide](deployment/ci-cd.md)** - GitHub Actions and automatic deployment
- **[Service Account Setup](deployment/service-account.md)** - Service account permissions
- **[Deployment Summary](deployment/deployment-summary.md)** - Deployment process summary

### ⚙️ Configuration & Setup

Guides for installing and configuring the application.

- **[Quick Start](setup/quick-start.md)** - Quick start guide
- **[Setup Guide](setup/setup-guide.md)** - Complete installation
- **[Local Development](setup/local-development.md)** - Local development with emulators
- **[Firebase Analytics](setup/firebase-analytics.md)** - Firebase Analytics setup
- **[Stripe Setup](setup/stripe-setup.md)** - Stripe payment configuration
- **[Firebase App Check](setup/firebase-app-check-setup.md)** - reCAPTCHA Enterprise setup

### 🌍 Internationalization

- **[i18n Overview](i18n/README.md)** - Internationalization setup
- **[Translation Guide](i18n/TRANSLATION_GUIDE.md)** - How to add translations

### 📘 User Guides

Documentation for developers and users.

- **[Commands](guides/commands.md)** - Available commands
- **[Interface Guide](guides/interface-guide.md)** - User interface guide
- **[Example Content](guides/example-emails.md)** - Examples for testing

### 🧪 Testing & QA

- **[PR Preview Testing](pr-preview-testing.md)** ⭐ - Guide for testing pull requests with Firebase Preview Channels

### 🔒 Security

- **[Firestore Rules](security/FIRESTORE-RULES-SUMMARY.md)** - Security rules documentation

## 🎯 Guides by Scenario

### I want to deploy to production

1. Run `./scripts/setup-template.sh` to configure placeholders
2. Read **[Deployment Todo](deployment/todo-deployment.md)** for the checklist
3. Configure GitHub Secrets (see [CI/CD Guide](deployment/ci-cd.md))
4. Configure service account (see [Service Account Setup](deployment/service-account.md))
5. Push to `master` to trigger deployment

### I want to develop locally

1. Follow the **[Quick Start](setup/quick-start.md)**
2. Read **[Local Development](setup/local-development.md)**
3. See **[Commands](guides/commands.md)** for available commands

### I want to configure Stripe

1. Follow **[Stripe Setup](setup/stripe-setup.md)**
2. Configure webhooks (see [CI/CD Guide](deployment/ci-cd.md) Stripe section)

### I want to add Firebase Analytics

1. Follow **[Firebase Analytics](setup/firebase-analytics.md)**
2. Make sure `VITE_FIREBASE_MEASUREMENT_ID` is configured

### I want to test a pull request

1. Check **[PR Preview Testing](pr-preview-testing.md)** for preview URLs
2. Test frontend via the automatic preview URL
3. Test Functions locally with Firebase emulators

### I want to add a new language

1. See **[i18n Overview](i18n/README.md)**
2. Follow **[Translation Guide](i18n/TRANSLATION_GUIDE.md)**
3. Add translation files in `public/locales/{lang}/`

## 🔗 Useful Links

- **[README](../README.md)** - Project entry point
- **[CLAUDE.md](../CLAUDE.md)** - Claude Code instructions

## 📞 Support

For questions or support:
- GitHub Issues: Create an issue in the repository
- Email: {{SUPPORT_EMAIL}}
