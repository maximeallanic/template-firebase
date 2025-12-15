# Internationalization (i18n) Guide

## Overview

This template supports **5 languages**: English (EN), French (FR), Spanish (ES), German (DE), and Portuguese (PT).

The internationalization is implemented using:
- **i18next**: Core i18n framework
- **react-i18next**: React bindings for i18next
- **i18next-browser-languagedetector**: Automatic browser language detection
- **i18next-http-backend**: Dynamic translation file loading

## Supported Languages

| Code | Language   | Native Name | Status    |
|------|-----------|-------------|-----------|
| `en` | English   | English     | Complete  |
| `fr` | French    | Français    | Complete  |
| `es` | Spanish   | Español     | Basic     |
| `de` | German    | Deutsch     | Basic     |
| `pt` | Portuguese| Português   | Basic     |

## Project Structure

```
public/locales/
├── en/
│   ├── translation.json  # Main UI strings
│   ├── common.json        # Shared components
│   ├── analysis.json      # AI analysis terminology
│   └── errors.json        # Error messages
├── fr/
│   ├── translation.json
│   ├── common.json
│   ├── analysis.json
│   └── errors.json
├── es/
│   └── ... (same structure)
├── de/
│   └── ... (same structure)
└── pt/
    └── ... (same structure)

src/i18n/
├── config.ts             # i18next configuration
└── types.ts              # TypeScript types for languages
```

## How It Works

### 1. Language Detection

The system detects the user's preferred language in this order:
1. **localStorage** (`spicyvssweet_language` key) - Persisted user choice
2. **Browser navigator.language** - Browser/OS setting
3. **Default fallback** - English (en)

### 2. Language Selection

Users can change the language using the **LanguageSelector** component in the header:
- Click on the flag icon to open the dropdown
- Select from 5 available languages
- Selection is automatically saved to localStorage
- All UI updates instantly

### 3. Translation Loading

Translations are loaded **lazily** (on-demand) using the `i18next-http-backend`:
- Initial load: Only default language
- On language change: Fetch new translation files from `/locales/{lang}/{namespace}.json`
- Caching: Browser automatically caches translation files

## Using Translations in Components

### Basic Usage

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();

  return <h1>{t('hero.title')}</h1>;
}
```

### Multiple Namespaces

```tsx
const { t } = useTranslation(['translation', 'common', 'errors']);

// Access different namespaces
<p>{t('hero.title')}</p>              // translation namespace (default)
<p>{t('common:buttons.save')}</p>      // common namespace
<p>{t('errors:auth.unauthenticated')}</p> // errors namespace
```

### Interpolation

```tsx
// In translation.json:
// "usage": { "analyses": "{{used}} of {{limit}} analyses used" }

<p>{t('usage.analyses', { used: 3, limit: 5 })}</p>
// Output: "3 of 5 analyses used"
```

### Pluralization

```tsx
// In translation.json:
// "items": "{{count}} item",
// "items_other": "{{count}} items"

<p>{t('items', { count: 1 })}</p>  // "1 item"
<p>{t('items', { count: 5 })}</p>  // "5 items"
```

## Adding a New Language

### Step 1: Create Translation Files

```bash
mkdir -p public/locales/ja  # Example: Japanese
cd public/locales/ja
touch translation.json common.json analysis.json errors.json
```

### Step 2: Add to Configuration

**File:** `src/i18n/types.ts`

```typescript
export type SupportedLanguage = 'en' | 'fr' | 'es' | 'de' | 'pt' | 'ja'; // Add 'ja'

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  // ... existing languages
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' }, // Add Japanese
];
```

### Step 3: Translate Content

Copy the structure from `/public/locales/en/` and translate all keys to the new language.

### Step 4: Test

1. Build the project: `npm run build`
2. Select the new language from the LanguageSelector
3. Navigate through the app to verify all translations

## Translation Key Structure

### `translation.json` - Main UI Strings

```json
{
  "nav": {                    // Navigation
    "home": "Home",
    "history": "History",
    "signIn": "Sign In"
  },
  "hero": {                   // Hero section
    "title": "Your Main Headline",
    "subtitle": "Your subtitle..."
  },
  "features": {               // Features section
    "title": "Everything You Need..."
  },
  "pricing": {                // Pricing section
    "free": { ... },
    "pro": { ... }
  }
}
```

### `common.json` - Shared Components

```json
{
  "buttons": {                // Button labels
    "continue": "Continue",
    "save": "Save"
  },
  "labels": {                 // Form labels
    "email": "Email",
    "password": "Password"
  },
  "time": {                   // Time units
    "seconds": "seconds",
    "minutes": "minutes"
  },
  "plans": {                  // Subscription plans
    "free": "Free Plan",
    "pro": "Pro Plan"
  }
}
```

### `analysis.json` - AI Analysis Terminology

```json
{
  "criteria": {               // Analysis criteria names
    "clarity": "Clarity",
    "tone": "Tone",
    "cta": "Call-to-Action"
  },
  "results": {                // Results page
    "title": "Analysis Results",
    "overallScore": "Overall Score"
  },
  "suggestions": {            // Suggestions section
    "title": "Suggestions for Improvement",
    "types": {
      "critical": "Critical",
      "important": "Important"
    }
  }
}
```

### `errors.json` - Error Messages

```json
{
  "auth": {                   // Authentication errors
    "unauthenticated": "You must be signed in...",
    "unauthorized": "You don't have permission..."
  },
  "analysis": {               // Analysis-specific errors
    "quotaExceeded": "You have reached your monthly limit...",
    "contentTooShort": "Content is too short..."
  },
  "general": {                // Generic errors
    "somethingWrong": "Something went wrong...",
    "serverError": "Server error..."
  }
}
```

## Best Practices

### 1. Key Naming Convention

- Use **camelCase** for keys: `emailInput.tryExample`
- Group related keys: `nav.*`, `hero.*`, `pricing.*`
- Be descriptive: `buttons.analyzeWithAI` not `buttons.btn1`

### 2. Keep It DRY

- Reuse common translations via `common.json`
- Example: `t('common:buttons.save')` instead of duplicating "Save" everywhere

### 3. Context Matters

- Add context in nested keys: `analysis.suggestions.types.critical`
- This helps translators understand where the text appears

### 4. Handle Plurals

- Always provide plural forms: `item` and `item_other`
- Use `{{ count }}` interpolation

### 5. Avoid Hardcoded Text

- ❌ Bad: `<h1>Your Hardcoded Title</h1>`
- ✅ Good: `<h1>{t('hero.title')}</h1>`

### 6. Translation Strings Should Be Complete

- Include punctuation in translations
- Don't concatenate translations: `t('greeting') + ' ' + t('name')`
- Instead: `t('greeting', { name })`

## Testing Translations

### Manual Testing

1. Start dev server: `npm run dev`
2. Click language selector in header
3. Switch between languages
4. Navigate all pages
5. Verify:
   - All text is translated
   - No missing keys (shows key name instead)
   - Layout doesn't break with longer text
   - Right-to-left languages (future) work correctly

## Translation Management Tools

For managing translations at scale, consider:

1. **[Crowdin](https://crowdin.com/)** - Translation management platform
2. **[Lokalise](https://lokalise.com/)** - Localization platform
3. **[i18n-ally](https://github.com/lokalise/i18n-ally)** - VS Code extension for inline translation editing

## Troubleshooting

### Translation Not Showing

1. **Check key exists**: Verify key is in translation file
2. **Check namespace**: Ensure correct namespace is loaded
3. **Check language code**: Verify language file exists
4. **Check browser console**: Look for i18next warnings

### Layout Breaking

1. **Test with longer text**: German/French translations are often 30% longer
2. **Use responsive design**: Don't fix widths
3. **Use text-overflow**: Handle very long words

### Language Not Persisting

1. **Check localStorage**: Ensure language key is set
2. **Check browser permissions**: localStorage might be disabled
3. **Check config**: Verify `detection.caches` includes `localStorage`

## Performance Considerations

1. **Lazy Loading**: Translations load only when needed
2. **Caching**: Browser caches translation files (1 year)
3. **Code Splitting**: Each language is a separate file
4. **Bundle Size**: ~2-3 KB per language (gzipped)

## Resources

- [i18next Documentation](https://www.i18next.com/)
- [react-i18next Documentation](https://react.i18next.com/)
- [Translation Best Practices](https://www.i18next.com/principles/fallback)
- [Pluralization Rules](https://www.i18next.com/translation-function/plurals)
