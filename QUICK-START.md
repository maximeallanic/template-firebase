# Quick Start Guide

## First Time Setup

Run the setup script to configure your project:

```bash
./scripts/setup-template.sh
```

This will replace all placeholders with your project configuration.

## Local Development

1. **Install dependencies:**
   ```bash
   npm install
   cd functions && npm install
   ```

2. **Create environment files:**
   ```bash
   cp .env.example .env
   cp functions/.env.example functions/.env.local
   # Edit these files with your Firebase config
   ```

3. **Start development:**
   ```bash
   npm run dev  # Frontend on http://localhost:5173
   npm run emulators  # Firebase emulators
   ```

## Documentation

- **[README.md](README.md)** - Project overview
- **[CLAUDE.md](CLAUDE.md)** - Complete technical documentation
- **[docs/](docs/)** - Detailed guides

## Tech Stack

- React 19 + TypeScript + Vite 7
- Firebase (Hosting, Functions Node 22, Firestore, Auth)
- Google Vertex AI (Gemini 2.5 Flash)
- Stripe (Payments)
- Tailwind CSS
- i18next (5 languages)

---

**Need help?** See [docs/setup/quick-start.md](docs/setup/quick-start.md)
