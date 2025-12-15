# Translation Guide for Contributors

## Quick Start

Thank you for helping translate this application! This guide will help you add or improve translations.

## Translation Status

| Language   | Code | Translation | Analysis | Common | Errors | Status    |
|-----------|------|-------------|----------|--------|--------|-----------|
| English   | en   | ✅ 100%     | ✅ 100%  | ✅ 100%| ✅ 100%| Complete  |
| French    | fr   | ✅ 100%     | ✅ 100%  | ✅ 100%| ✅ 100%| Complete  |
| Spanish   | es   | 🟡 30%      | ✅ 100%  | 🟡 50% | 🟡 20% | In Progress |
| German    | de   | 🟡 30%      | ✅ 100%  | 🟡 30% | 🟡 20% | In Progress |
| Portuguese| pt   | 🟡 30%      | ✅ 100%  | 🟡 30% | 🟡 20% | In Progress |

**Legend:** ✅ Complete | 🟡 Partial | ❌ Missing

## How to Contribute

### 1. Choose a Language

Pick a language from the table above that needs work (marked with 🟡 or ❌).

### 2. Find Translation Files

Navigate to: `/public/locales/{language_code}/`

Example for Spanish:
```
/public/locales/es/
├── translation.json  # Main UI strings
├── common.json       # Shared components
├── analysis.json     # AI analysis terms
└── errors.json       # Error messages
```

### 3. Use English as Reference

Always use `/public/locales/en/` as the source of truth.

**Example:**

English (`/public/locales/en/translation.json`):
```json
{
  "hero": {
    "title": "Turn Cold Emails Into",
    "titleHighlight": "Hot Responses"
  }
}
```

Your translation (`/public/locales/es/translation.json`):
```json
{
  "hero": {
    "title": "Convierte Emails Fríos en",
    "titleHighlight": "Respuestas Calientes"
  }
}
```

### 4. Translation Guidelines

#### ✅ DO:

1. **Keep the JSON structure identical** to English
2. **Translate the values**, not the keys
3. **Preserve placeholders**: `{{used}}`, `{{limit}}`, `<1>text</1>`
4. **Match the tone**: Professional but friendly
5. **Consider length**: Translations may be 20-40% longer
6. **Use native punctuation**: French uses « », Spanish uses ¿ ?, etc.
7. **Test your translation**: Build and verify in browser

#### ❌ DON'T:

1. **Don't change key names**: `"hero.title"` must stay `"hero.title"`
2. **Don't remove placeholders**: `{{count}}` must appear in translation
3. **Don't use machine translation alone**: Always review AI-generated text
4. **Don't add new keys**: Follow English structure exactly
5. **Don't mix languages**: One file = one language
6. **Don't translate brand names**: "{{APP_NAME}}", "Gemini AI" stay as-is
7. **Don't translate technical terms unnecessarily**: "email", "AI" can stay

### 5. Special Cases

#### Interpolation Variables

Must be preserved exactly:

```json
// ✅ Correct
"greeting": "Hello {{name}}, welcome!"
"greeting": "Hola {{name}}, bienvenido!"

// ❌ Wrong
"greeting": "Hola {name}, bienvenido!"  // Wrong brackets
"greeting": "Hola nombre, bienvenido!"  // Missing variable
```

#### HTML Tags in Trans Component

Keep tags intact:

```json
// ✅ Correct
"analyses": "<1>5 email analyses</1> per month"
"analyses": "<1>5 analyses d'emails</1> par mois"

// ❌ Wrong
"analyses": "5 analyses d'emails par mois"  // Missing tags
"analyses": "<1>5</1> analyses d'emails par mois"  // Wrong tag placement
```

#### Pluralization

Include both singular and plural forms:

```json
{
  "item": "{{count}} item",
  "item_other": "{{count}} items"
}
```

French example:
```json
{
  "item": "{{count}} élément",
  "item_other": "{{count}} éléments"
}
```

## Translation Workflow

### Step 1: Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/{{APP_NAME_SLUG}}.git
cd {{APP_NAME_SLUG}}

# Install dependencies
npm install

# Create a new branch
git checkout -b i18n/improve-spanish-translations
```

### Step 2: Translate

1. Open `/public/locales/{lang}/translation.json`
2. Find missing or incomplete translations (compare with `/public/locales/en/`)
3. Translate each value
4. Save the file

### Step 3: Test

```bash
# Build the project
npm run build

# Start dev server
npm run dev

# Open http://localhost:5173
# Click language selector in header
# Switch to your language
# Navigate all pages to verify translations
```

### Step 4: Submit

```bash
# Stage your changes
git add public/locales/{lang}/

# Commit with descriptive message
git commit -m "i18n: Complete Spanish translations for hero section"

# Push to your fork
git push origin i18n/improve-spanish-translations

# Open a Pull Request on GitHub
```

## Translation Priorities

Focus on these areas in order:

### Priority 1: Critical UI (High Visibility)
- ✅ `nav.*` - Navigation menu
- ✅ `hero.*` - Hero section (homepage above the fold)
- ✅ `emailInput.*` - Email input form
- ✅ `pricing.*` - Pricing page

### Priority 2: Core Features (Medium Visibility)
- ✅ `features.*` - Features section
- ✅ `usage.*` - Usage banner
- ✅ `freeTrial.*` - Free trial banner
- ✅ `analysis:criteria.*` - Analysis criteria names
- ✅ `analysis:results.*` - Analysis results page

### Priority 3: Secondary Pages (Lower Visibility)
- ✅ `analysis:suggestions.*` - Suggestions section
- ✅ `analysis:rewrites.*` - Rewrites section
- ✅ `errors:*` - Error messages
- ✅ `common:*` - Shared components

## Context for Translators

### Application Purpose

This application analyzes **cold emails** (unsolicited sales/marketing emails) and provides AI-powered feedback to improve response rates.

### Target Audience

- **Salespeople**: B2B sales professionals
- **Freelancers**: Independent contractors seeking clients
- **Founders**: Startup founders doing outreach
- **Marketers**: Email marketing specialists

### Tone & Voice

- **Professional** yet **approachable**
- **Clear** and **concise**
- **Action-oriented** (use imperatives)
- **Encouraging** (positive reinforcement)
- **Technical accuracy** without jargon

### Key Terms

| English | Context | Translation Notes |
|---------|---------|------------------|
| Cold email | Unsolicited sales email | Use local sales terminology |
| Analysis | AI evaluation of email | Keep technical but clear |
| Criteria | Scoring dimensions | 7 specific metrics |
| Call-to-Action (CTA) | Request for next step | Common marketing term |
| Spam score | Likelihood to trigger filters | Technical term, may stay English |
| Personalization | Tailoring to recipient | Key concept in sales |

## Translation Tools

### Recommended

1. **[DeepL](https://www.deepl.com/)** - High-quality translations (better than Google)
2. **[Linguee](https://www.linguee.com/)** - Context examples from real translations
3. **[Reverso Context](https://context.reverso.net/)** - See translations in context

### Using AI Assistants

You can use ChatGPT/Claude for initial translations, but **always review**:

```
Prompt: "Translate this JSON to Spanish, preserving all {{variables}} and HTML <tags>:
{
  "hero": {
    "title": "Turn Cold Emails Into <1>Hot Responses</1>",
    "subtitle": "Get instant feedback with {{count}} analyses"
  }
}

Requirements:
- Keep JSON structure identical
- Preserve {{variables}} exactly as-is
- Keep HTML <tags> in same positions
- Use professional but friendly tone for B2B sales context
```

## Quality Checklist

Before submitting, verify:

- [ ] All keys from English file are present
- [ ] No keys are missing or added
- [ ] Placeholders (`{{var}}`) are preserved
- [ ] HTML tags (`<1>`, `<2>`) are preserved
- [ ] JSON syntax is valid (no trailing commas, proper quotes)
- [ ] Tested in browser (all pages)
- [ ] No layout breaks with translated text
- [ ] Tone matches English (professional yet friendly)
- [ ] Technical terms are accurate
- [ ] Native punctuation is used correctly

## Common Mistakes

### 1. Changed Key Names

```json
// ❌ Wrong
"hero": {
  "titre": "Turn Cold Emails Into"  // "titre" should stay "title"
}

// ✅ Correct
"hero": {
  "title": "Transformez les Emails Froids en"
}
```

### 2. Missing Interpolation

```json
// ❌ Wrong
"analyses": "5 of 10 analyses used"

// ✅ Correct
"analyses": "{{used}} of {{limit}} analyses used"
```

### 3. Broken JSON

```json
// ❌ Wrong (trailing comma)
{
  "title": "Hello",
  "subtitle": "World",
}

// ✅ Correct
{
  "title": "Hello",
  "subtitle": "World"
}
```

### 4. Mixed Languages

```json
// ❌ Wrong
{
  "title": "Bienvenue",
  "subtitle": "Welcome to our platform"  // Mixed FR/EN
}

// ✅ Correct
{
  "title": "Bienvenue",
  "subtitle": "Bienvenue sur notre plateforme"
}
```

## Getting Help

### Questions?

- **Translation help**: Post in GitHub Discussions > Translations
- **Technical issues**: Open an issue on GitHub
- **Context questions**: Ask in PR comments

### Review Process

1. Submit your PR
2. Maintainer reviews translations
3. Native speakers verify accuracy
4. Merge when approved
5. Deployed in next release

## Recognition

All contributors will be credited in:
- README.md Contributors section
- Release notes
- Translation credits page (coming soon)

Thank you for helping make this application accessible to users worldwide! 🌍
