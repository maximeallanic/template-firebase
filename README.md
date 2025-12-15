# Firebase + React SaaS Template 🚀

A production-ready template for building AI-powered SaaS applications with Firebase, React, and Stripe.

## ✨ Features

- **🔐 Authentication**: Firebase Auth with Google Sign-In
- **💳 Payments**: Stripe subscriptions with customer portal
- **🤖 AI Integration**: Google Vertex AI (Gemini) ready to use
- **📧 Email Input**: Mailgun integration for receiving content via email
- **🌍 Internationalization**: 5 languages (EN, FR, ES, DE, PT)
- **🔒 Security**: Firebase App Check with reCAPTCHA Enterprise
- **⚡ Performance**: Code splitting, lazy loading, optimized caching
- **🚀 CI/CD**: GitHub Actions with preview deployments

### Subscription Plans

- **Free Trial**: 1 action without sign-up (IP fingerprinting prevents abuse)
- **Free Plan**: 5 actions/month (requires sign-up)
- **Pro Plan**: 250 actions/month at $5/month

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS |
| Backend | Firebase Functions (Node.js 22) |
| Database | Firestore |
| AI | Google Vertex AI (Gemini 2.5 Flash) |
| Auth | Firebase Authentication |
| Payments | Stripe |
| Email | Mailgun |
| CI/CD | GitHub Actions |

## 🚀 Getting Started

### Prerequisites

- **Node.js 22+** installed
- **Firebase account** with Blaze plan
- **Google Cloud project** with Vertex AI enabled
- **Stripe account** for payments

### Quick Start

1. **Clone and install:**
   ```bash
   git clone https://github.com/yourusername/firebase-react-template.git
   cd firebase-react-template
   npm install
   cd functions && npm install && cd ..
   ```

2. **Run the setup script:**
   ```bash
   ./scripts/setup-template.sh
   ```

   This will configure all placeholders with your project details.

3. **Start development:**
   ```bash
   npm run dev
   ```

4. **Open browser:**
   Visit [http://localhost:5173](http://localhost:5173)

## 📁 Project Structure

```
├── src/
│   ├── components/       # React components
│   ├── pages/            # Route pages
│   ├── services/         # Firebase services
│   ├── hooks/            # Custom hooks
│   ├── i18n/             # Internationalization config
│   └── types/            # TypeScript types
├── functions/
│   └── src/
│       ├── index.ts      # Cloud Functions
│       └── prompts.ts    # AI prompts
├── public/
│   └── locales/          # Translation files
├── docs/                 # Documentation
├── scripts/              # Deployment scripts
├── firebase.json         # Firebase config
└── firestore.rules       # Security rules
```

## 📖 Configuration

### Environment Variables

Create `.env` from the template:
```bash
cp .env.example .env
```

Required variables:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-domain.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_RECAPTCHA_ENTERPRISE_SITE_KEY=your_recaptcha_key
```

### Functions Environment

Create `functions/.env.local`:
```bash
cp functions/.env.example functions/.env.local
```

## 🚢 Deployment

### Manual Deployment

```bash
# Full deployment
./scripts/deploy-all.sh

# Or via npm
npm run deploy
```

### CI/CD (GitHub Actions)

Configure these GitHub Secrets:
- `FIREBASE_SERVICE_ACCOUNT` - Service account JSON
- `FIREBASE_PROJECT_ID` - Your project ID
- `DOMAIN` - Your production domain
- All `VITE_*` environment variables

Then push to `master` to trigger deployment.

## 📚 Documentation

- **[Quick Start](docs/setup/quick-start.md)** - Get started in 5 minutes
- **[Setup Guide](docs/setup/setup-guide.md)** - Complete installation
- **[Deployment](docs/deployment/todo-deployment.md)** - Production deployment
- **[CI/CD](docs/deployment/ci-cd.md)** - GitHub Actions setup
- **[Stripe Setup](docs/setup/stripe-setup.md)** - Payment configuration
- **[i18n Guide](docs/i18n/README.md)** - Internationalization

👉 **[View Full Documentation](docs/README.md)**

## 🔧 Development Commands

```bash
# Development
npm run dev              # Start dev server
npm run emulators        # Start Firebase emulators

# Quality checks
npm run type-check       # TypeScript check
npm run lint             # ESLint

# Build & Deploy
npm run build            # Production build
npm run deploy           # Deploy to Firebase
```

## 🌍 Internationalization

The template supports 5 languages out of the box:
- 🇬🇧 English (EN)
- 🇫🇷 French (FR)
- 🇪🇸 Spanish (ES)
- 🇩🇪 German (DE)
- 🇵🇹 Portuguese (PT)

See [i18n documentation](docs/i18n/README.md) for adding more languages.

## 📄 License

MIT License - feel free to use this template for personal or commercial projects.

## 🙏 Credits

- [Firebase](https://firebase.google.com/) - Backend infrastructure
- [React](https://react.dev/) - UI framework
- [Vite](https://vitejs.dev/) - Build tool
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Stripe](https://stripe.com/) - Payments
- [Google Vertex AI](https://cloud.google.com/vertex-ai) - AI integration

---

Made with ❤️ for the developer community
