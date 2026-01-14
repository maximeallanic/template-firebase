# GitHub Copilot Instructions for PR Reviews

## Project Overview

**Spicy vs Sweet** is a multiplayer party quiz game built with React 19 + TypeScript + Firebase. When reviewing PRs, ensure changes align with the project's architecture and quality standards.

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Framer Motion
- **Backend**: Firebase Functions (Node 22, v2 API)
- **Database**: Firebase Realtime Database (game state) + Firestore (user data)
- **AI**: Google Gemini via Genkit
- **i18n**: i18next (5 languages: EN, FR, ES, DE, PT)

## PR Review Checklist

### 1. Quality Checks (Mandatory)

All PRs must pass these checks before merging:

```bash
npm run type-check   # TypeScript validation
npm run lint         # ESLint code quality
```

Verify the CI pipeline passes:
- ESLint (no errors or warnings)
- TypeScript type-check (no errors)
- Functions build successfully

### 2. Code Quality Standards

#### TypeScript
- [ ] No `any` types unless absolutely necessary (document why)
- [ ] Proper type definitions for all function parameters and return types
- [ ] Use existing types from `src/types/` instead of creating duplicates
- [ ] Generic types should have meaningful constraints

#### React Patterns
- [ ] Use functional components with hooks
- [ ] Proper dependency arrays in `useEffect`, `useMemo`, `useCallback`
- [ ] Avoid inline function definitions in JSX where performance matters
- [ ] Use `useReducedMotion()` hook for animations (accessibility)
- [ ] No direct DOM manipulation; use refs when necessary

#### State Management
- [ ] Game state through Firebase RTDB subscriptions
- [ ] Local UI state with `useState`/`useReducer`
- [ ] Context for shared state (`SoloGameContext`, `ToastContext`, etc.)
- [ ] No prop drilling beyond 2-3 levels

### 3. Architecture Compliance

#### File Organization
- Components: `src/components/{category}/`
- Phase components: `src/components/phases/Phase{N}Player.tsx`
- Services: `src/services/`
- Hooks: `src/hooks/use{Name}.ts`
- Types: `src/types/`

#### Firebase Functions (v2 API)
```typescript
// Correct pattern
export const functionName = onCall(async ({ data, auth }) => {
  // Implementation
});
```

#### Mock Players Convention
- IDs must start with `mock_` prefix
- Exclude from completion checks:
```typescript
const realPlayers = Object.values(players).filter(
  p => p.isOnline && !p.id.startsWith('mock_')
);
```

### 4. Security Review

#### OWASP Top 10 Considerations
- [ ] No user input directly in SQL/NoSQL queries
- [ ] Validate and sanitize all user inputs
- [ ] No secrets or API keys in code
- [ ] Proper Firebase security rules for new data paths
- [ ] Auth checks in Cloud Functions (`auth.uid` validation)

#### Firebase Security
- [ ] Realtime Database rules updated if new paths added
- [ ] Firestore rules updated for new collections
- [ ] No sensitive data exposed to clients

### 5. Performance

- [ ] No unnecessary re-renders (use React DevTools Profiler)
- [ ] Large lists use virtualization or pagination
- [ ] Images optimized and lazy-loaded
- [ ] Bundle size impact checked (`npm run build`)
- [ ] Firebase queries are indexed and efficient

### 6. Accessibility (a11y)

- [ ] Semantic HTML elements (`button`, `nav`, `main`, etc.)
- [ ] ARIA attributes where needed
- [ ] Keyboard navigation support
- [ ] Color contrast compliance
- [ ] `useReducedMotion()` for animations
- [ ] Focus management for modals/dialogs

### 7. Internationalization (i18n)

- [ ] All user-facing strings use translation keys
- [ ] New keys added to ALL 5 language files (EN, FR, ES, DE, PT)
- [ ] Translation files: `public/locales/{lang}/*.json`
- [ ] Use appropriate namespace for new keys

### 8. Error Handling

- [ ] Try-catch for async operations
- [ ] User-friendly error messages (translated)
- [ ] Console errors logged with context
- [ ] Firebase disconnect handlers for real-time features
- [ ] Graceful degradation for network issues

### 9. Testing Considerations

- [ ] Changes testable with Firebase emulators
- [ ] Debug panel supports new features (dev mode)
- [ ] Mock players work correctly with new phase logic

## Common Issues to Flag

### Critical (Block PR)
- Security vulnerabilities (XSS, injection, exposed secrets)
- TypeScript `any` without justification
- Missing auth checks in Cloud Functions
- Breaking changes to game state structure without migration
- Hardcoded strings (not translated)

### Important (Request Changes)
- Missing error handling
- Performance regressions
- Accessibility violations
- Incomplete i18n (missing translations)
- Unused imports or dead code

### Suggestions (Non-blocking)
- Code style improvements
- Better variable naming
- Documentation improvements
- Potential optimizations

## Game-Specific Review Points

### Phase Logic
- Verify phase state machine transitions are correct
- Check completion logic excludes mock players
- Ensure proper cleanup on phase end
- Validate score calculations

### Real-time Sync
- `onValue()` subscriptions properly unsubscribed
- `onDisconnect()` handlers for player presence
- Optimistic updates with rollback on failure

### Audio/Haptics
- Sound effects use `audioService.ts`
- Haptic feedback uses `hapticService.ts`
- Respect user preferences (sound/haptic settings)

## Review Response Format

When providing feedback, use this format:

```
### Summary
Brief overview of the PR and its purpose.

### Approved / Changes Requested / Needs Discussion

### Details
- **[CRITICAL]** Security/breaking issues that block merge
- **[IMPORTANT]** Issues that should be addressed before merge
- **[SUGGESTION]** Non-blocking improvements

### Quality Checks
- [ ] TypeScript: Pass/Fail
- [ ] ESLint: Pass/Fail
- [ ] Build: Pass/Fail

### Testing Notes
How to test these changes locally.
```

## References

- [CLAUDE.md](../CLAUDE.md) - Full project documentation
- [Firebase Docs](https://firebase.google.com/docs)
- [React 19 Docs](https://react.dev)
- [Framer Motion](https://www.framer.com/motion/)
