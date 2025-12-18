/**
 * Prompts - Re-exports from modular structure
 *
 * This file re-exports all prompts from the new modular structure
 * for backward compatibility. All prompts are now organized by language
 * and phase in the ./prompts/ directory.
 *
 * Structure:
 *   ./prompts/
 *   ├── index.ts       - Main loader with language support
 *   └── fr/            - French prompts
 *       ├── index.ts   - French prompts index
 *       ├── system.ts  - System prompts
 *       ├── topic.ts   - Topic generation
 *       ├── phase1.ts  - Tenders (Speed MCQ)
 *       ├── phase2.ts  - Sel ou Poivre (Homophones)
 *       ├── phase3.ts  - La Carte (Menus)
 *       ├── phase4.ts  - La Note (Buzzer)
 *       ├── phase5.ts  - Burger Ultime (Memory)
 *       └── factcheck.ts - Fact verification
 *
 * Usage:
 *   // For backward compatibility (default French)
 *   import { PHASE1_PROMPT } from './prompts';
 *
 *   // For language-aware loading
 *   import { getPrompts, getPrompt } from './prompts';
 *   const prompts = getPrompts('fr');
 *   const phase1 = getPrompt('PHASE1_PROMPT', 'fr');
 *
 * @see ./prompts/index.ts for the modular structure
 */

// Re-export everything from the modular structure (backward compatibility)
export * from './prompts/index';

// Re-export utility functions for language-aware loading
export {
    getPrompts,
    getPrompt,
    isLanguageSupported,
    getSupportedLanguages
} from './prompts/index';

// Re-export types
export type { SupportedLanguage, PromptSet } from './prompts/index';
