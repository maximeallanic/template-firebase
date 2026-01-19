# Changelog

All notable changes to Spicy vs Sweet will be documented in this file.

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

## [Unreleased]

Initial development version.

---

## Version Format

This project uses [Semantic Versioning](https://semver.org/):
- **MAJOR** version for incompatible changes
- **MINOR** version for new features (backwards-compatible)
- **PATCH** version for bug fixes (backwards-compatible)
