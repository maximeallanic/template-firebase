# Local Development Guide

This guide explains how to run the application locally for development and testing.

## Quick Start

### 1. Run Setup Script

If you haven't already, run the setup script:

```bash
./scripts/setup-template.sh
```

### 2. Install Dependencies

```bash
npm install
cd functions
npm install
cd ..
```

### 3. Set Up Environment Variables

Create a `.env` file in the root directory:

```env
VITE_FIREBASE_API_KEY=demo-api-key
VITE_FIREBASE_AUTH_DOMAIN=demo.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=demo-project
VITE_FIREBASE_STORAGE_BUCKET=demo.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

For functions, create `functions/.env.local`:

```env
GOOGLE_API_KEY=your-api-key-here
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 4. Run Development Server

```bash
npm run dev
```

This will start the Vite dev server at [http://localhost:5173](http://localhost:5173)

## Option A: Using Firebase Emulators (Recommended)

This option allows you to test the full stack locally without deploying.

### Install Java Runtime (Required for Firebase Emulators)

```bash
# Ubuntu/Debian
sudo apt install default-jre

# macOS
brew install java
```

### Start Emulators

```bash
# Start emulators (in a separate terminal)
npm run emulators
```

This will start:
- Functions Emulator at [http://localhost:5001](http://localhost:5001)
- Auth Emulator at [http://localhost:9099](http://localhost:9099)
- Firestore Emulator at [http://localhost:8080](http://localhost:8080)
- Emulator UI at [http://localhost:4000](http://localhost:4000)

### Update firebase.ts for Emulators

The code already checks for `import.meta.env.DEV` and connects to emulators automatically:

```typescript
if (import.meta.env.DEV) {
  connectFunctionsEmulator(functions, 'localhost', 5001);
}
```

## Option B: Mock Backend (Fastest for UI Development)

If you just want to work on the UI without setting up Firebase, the app can run in mock mode. Check `src/config.ts` for mock mode settings.

## Development Workflow

### File Watching

The Vite dev server automatically reloads when you change frontend files.

For functions:

```bash
cd functions
npm run build -- --watch
```

### Testing Changes

1. Make changes to components in `src/components/`
2. Save the file
3. Check [http://localhost:5173](http://localhost:5173)
4. Browser automatically reloads

### Useful Commands

```bash
# Start dev server
npm run dev

# Start emulators
npm run emulators

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Type check
npm run type-check
```

## Debugging

### Frontend Debugging

1. Open Chrome DevTools (F12)
2. Use React Developer Tools extension
3. Check Console for errors
4. Use Network tab to inspect API calls

### Functions Debugging

```bash
# View emulator logs
firebase emulators:start --inspect-functions

# Or check logs after calling
firebase functions:log
```

### Common Issues

**Issue**: `Module not found` errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Issue**: TypeScript errors
```bash
# Rebuild TypeScript
npm run build
```

**Issue**: Tailwind styles not applying
```bash
# Rebuild with cache clear
rm -rf node_modules/.vite
npm run dev
```

**Issue**: Firebase emulators not starting
```bash
# Kill any process using the port
lsof -ti:5001 | xargs kill -9
lsof -ti:5173 | xargs kill -9

# Restart emulators
firebase emulators:start
```

## Hot Reload Tips

- Component changes reload instantly
- CSS changes reload without page refresh
- Type changes require full reload

## Performance Tips

- Use `React.memo()` for expensive components
- Lazy load routes if you add more pages
- Use production build for performance testing: `npm run build && npm run preview`

## Next Steps

Once you're ready to deploy, see [Deployment Guide](../deployment/ci-cd.md)

---

Happy coding! 💻
