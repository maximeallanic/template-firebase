# Quick Start Guide

Get the Firebase + React SaaS Template running locally in **5 minutes**!

## 🚀 Fastest Way to Start

### 1. Run Setup Script

```bash
./scripts/setup-template.sh
```

This will configure all placeholders with your project details.

### 2. Install Dependencies

```bash
npm install
cd functions && npm install && cd ..
```

### 3. Start Development Server

```bash
npm run dev
```

### 4. Open in Browser

Visit [http://localhost:5173](http://localhost:5173)

**That's it!** 🎉

## 🎮 Test the Application

The app will run in **mock mode** by default if Firebase is not configured, so you can test the UI without any API keys.

## 🔧 Connecting to Firebase

When you're ready to use real Firebase services:

### 1. Get API Keys

- **Firebase**: [console.firebase.google.com](https://console.firebase.google.com)
- **Google Cloud**: Enable Vertex AI in your project

### 2. Configure Environment

Create `.env` file:

```bash
cp .env.example .env
```

Edit `.env` with your Firebase config.

Create `functions/.env.local`:

```bash
cp functions/.env.example functions/.env.local
```

Edit `functions/.env.local` with your configuration.

### 3. Install Functions Dependencies

```bash
cd functions
npm install
cd ..
```

### 4. Start Firebase Emulators

```bash
firebase login
firebase emulators:start
```

### 5. Restart Dev Server

```bash
npm run dev
```

Now the app will use real Firebase services!

## 📚 Next Steps

- [Setup Guide](setup-guide.md) - Complete installation guide
- [Local Development](local-development.md) - Detailed development guide
- [Deployment Guide](../deployment/todo-deployment.md) - How to deploy to production
- [Commands Reference](../guides/commands.md) - Available commands

## ❓ Common Issues

### Port already in use

```bash
# Kill process using port 5173
lsof -ti:5173 | xargs kill -9

# Try again
npm run dev
```

### Tailwind styles not working

```bash
# Clear cache and restart
rm -rf node_modules/.vite
npm run dev
```

### TypeScript errors

```bash
# Rebuild
npm run build
```

## 🆘 Need Help?

Open an issue on GitHub or check the documentation files listed above.

---

Happy building! 🚀✨
