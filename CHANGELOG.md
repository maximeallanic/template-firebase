# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Fixed
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

### Tech Stack
- React 19 + TypeScript + Vite 7
- Firebase (Hosting, Functions Node 22, Firestore, Auth)
- Google Vertex AI (Gemini 2.5 Flash)
- Stripe for payments
- Mailgun for email input
- Tailwind CSS
- i18next for translations

### Documentation
- Complete setup and deployment guides
- GitHub Actions CI/CD workflows
- Firebase security rules
- Service account configuration guide

---

## Version Format

This project follows [Semantic Versioning](https://semver.org/):
- **MAJOR** version for incompatible API changes
- **MINOR** version for new functionality in a backwards compatible manner
- **PATCH** version for backwards compatible bug fixes
