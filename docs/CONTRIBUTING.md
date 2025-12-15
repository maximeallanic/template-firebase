# Documentation Contribution Guide

This guide explains how to maintain the documentation organization.

## 📁 Documentation Structure

Documentation is organized in the `docs/` folder with the following structure:

```
docs/
├── README.md              # Main documentation index
├── CONTRIBUTING.md        # This file - contribution guide
│
├── deployment/            # Deployment documentation
│   ├── todo-deployment.md     # Deployment checklist
│   ├── ci-cd.md              # CI/CD pipeline
│   ├── service-account.md     # Service account configuration
│   └── deployment-summary.md  # Process summary
│
├── setup/                 # Installation and configuration guides
│   ├── quick-start.md         # Quick start (5 min)
│   ├── setup-guide.md         # Complete installation
│   ├── local-development.md   # Development environment
│   ├── firebase-analytics.md  # Analytics configuration
│   └── stripe-setup.md        # Stripe configuration
│
├── guides/                # User and developer guides
│   ├── commands.md            # Available commands
│   ├── interface-guide.md     # Interface guide
│   ├── example-emails.md      # Example content
│   └── ui-improvements.md     # UI improvements
│
├── i18n/                  # Internationalization
│   ├── README.md              # i18n overview
│   └── TRANSLATION_GUIDE.md   # Translation guide
│
└── security/              # Security documentation
    └── FIRESTORE-RULES-SUMMARY.md
```

## ✅ Organization Rules

### 1. Files at Project Root

Only **3 markdown files** should stay at the root:
- `README.md` - Main entry point for the project
- `CLAUDE.md` - Instructions for Claude Code
- `CHANGELOG.md` - Version history

**All other markdown files** should be in `docs/`.

### 2. Categorizing New Documents

When creating a new document, place it in the right category:

| Documentation Type | Folder | Examples |
|-------------------|--------|----------|
| Deployment, CI/CD, production | `docs/deployment/` | Deployment guides, server config, pipelines |
| Installation, initial configuration | `docs/setup/` | Getting started, environment config, prerequisites |
| Usage, commands, tutorials | `docs/guides/` | User guides, command references, examples |
| Internationalization | `docs/i18n/` | Language guides, translation instructions |
| Security | `docs/security/` | Security rules, authentication |

### 3. Naming Conventions

- **File names**: Use `kebab-case.md` (all lowercase, words separated by hyphens)
  - ✅ `quick-start.md`, `ci-cd-pipeline.md`, `firebase-analytics.md`
  - ❌ `QuickStart.md`, `CI_CD_Pipeline.md`, `FirebaseAnalytics.md`

- **H1 Titles**: Each file should have **one** H1 title at the beginning
  ```markdown
  # Quick Start Guide
  ```

- **Internal Links**: Use relative paths
  ```markdown
  # From docs/README.md to a guide
  [Quick Start](setup/quick-start.md)

  # From a guide to another in the same folder
  [Commands](commands.md)

  # From a guide to another folder
  [Deployment](../deployment/ci-cd.md)

  # To root
  [Main README](../README.md)
  ```

### 4. Updating Indexes

When you add/modify/delete a document:

1. **Update `docs/README.md`** - Add the new file in the right section

2. **Update `README.md`** (root) - If it's an important document for new users

3. **Update `CLAUDE.md`** - If it's relevant for future Claude Code instances

## 📝 Template for New Documents

Use this template to create a new document:

```markdown
# Document Title

Brief description (1-2 lines) of what this document covers.

## Table of Contents (optional if long)

- [Section 1](#section-1)
- [Section 2](#section-2)

## Section 1

Content...

## Section 2

Content...

## Related Links

- [Other relevant document](./other-doc.md)
- [External documentation](https://example.com)
```

## 🔍 Pre-Commit Checklist

Before committing documentation changes, verify:

- [ ] The file is in the right folder (`deployment/`, `setup/`, `guides/`)
- [ ] The file name uses `kebab-case.md`
- [ ] The document has a clear H1 title
- [ ] Internal links use relative paths and work
- [ ] `docs/README.md` is updated with the new file
- [ ] No new `.md` files were added to root (except README, CLAUDE, CHANGELOG)

## ⚠️ Important Rules

1. **Avoid duplication** - If information already exists, create a link rather than duplicating

2. **Use descriptive titles** - Titles should allow understanding the content without reading the document

3. **Keep documents up to date** - Delete or archive obsolete documents

4. **Document as you go** - Don't wait until the end of development to document

## 🛠️ Useful Tools

### Check Broken Links

```bash
# Install markdown-link-check
npm install -g markdown-link-check

# Check all files
find docs -name "*.md" -exec markdown-link-check {} \;
```

### Generate Table of Contents

```bash
# Install doctoc
npm install -g doctoc

# Generate TOC for a file
doctoc docs/setup/setup-guide.md
```

## 📞 Questions?

If you have questions about where to place a document or how to organize it:
1. Check existing similar documents
2. Check `docs/README.md` to see categories
3. If in doubt, ask in a PR or issue

---

**Thank you for keeping the documentation organized and up to date!** 🙏
