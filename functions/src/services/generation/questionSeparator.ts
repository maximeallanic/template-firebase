/**
 * Question/Answer Separator - Server-Side Game Orchestration (#72)
 *
 * This module separates generated questions into:
 * - PUBLIC questions (no answers) → stored in customQuestions/
 * - PRIVATE answers → stored in gameData/
 *
 * This ensures clients never have access to correct answers.
 */

import type {
  Phase1QuestionPublic,
  Phase1AnswerPrivate,
  Phase2SetPublic,
  Phase2ItemPublic,
  Phase2SetAnswerPrivate,
  Phase2ItemAnswerPrivate,
  Phase3ThemePublic,
  Phase3QuestionPublic,
  Phase3ThemeAnswerPrivate,
  Phase3AnswerPrivate,
  Phase4QuestionPublic,
  Phase4AnswerPrivate,
  Phase5QuestionPublic,
  Phase5AnswerPrivate,
  PhaseId,
} from '../../types/secureGameTypes';

// Import existing types from generation
import type {
  Phase1Question,
  Phase2Set,
  Phase3Theme,
  Phase4Question,
  Phase5Question,
} from './types';

// ============================================================================
// PHASE 1 - MCQ Questions
// ============================================================================

export interface Phase1Separated {
  publicQuestions: Phase1QuestionPublic[];
  privateAnswers: Phase1AnswerPrivate[];
}

export function separatePhase1Questions(questions: Phase1Question[]): Phase1Separated {
  const publicQuestions: Phase1QuestionPublic[] = [];
  const privateAnswers: Phase1AnswerPrivate[] = [];

  for (const q of questions) {
    publicQuestions.push({
      text: q.text,
      options: q.options,
      anecdote: q.anecdote,
    });
    privateAnswers.push({
      correctIndex: q.correctIndex,
    });
  }

  return { publicQuestions, privateAnswers };
}

// ============================================================================
// PHASE 2 - Binary Choice (A/B/Both)
// ============================================================================

export interface Phase2Separated {
  publicSet: Phase2SetPublic;
  privateAnswers: Phase2SetAnswerPrivate;
}

export function separatePhase2Set(set: Phase2Set): Phase2Separated {
  const publicItems: Phase2ItemPublic[] = [];
  const privateItems: Phase2ItemAnswerPrivate[] = [];

  for (const item of set.items) {
    publicItems.push({
      text: item.text,
      anecdote: item.anecdote,
      justification: item.justification,
    });
    privateItems.push({
      answer: item.answer,
      acceptedAnswers: item.acceptedAnswers ?? [], // Default to empty array to avoid undefined in Firebase
    });
  }

  const publicSet: Phase2SetPublic = {
    title: set.title ?? `${set.optionA} ou ${set.optionB} ?`,
    items: publicItems,
    optionA: set.optionA,
    optionB: set.optionB,
    optionADescription: set.optionADescription,
    optionBDescription: set.optionBDescription,
    humorousDescription: set.humorousDescription,
  };

  const privateAnswers: Phase2SetAnswerPrivate = {
    items: privateItems,
  };

  return { publicSet, privateAnswers };
}

export function separatePhase2Sets(sets: Phase2Set[]): {
  publicSets: Phase2SetPublic[];
  privateAnswers: Phase2SetAnswerPrivate[];
} {
  const publicSets: Phase2SetPublic[] = [];
  const privateAnswers: Phase2SetAnswerPrivate[] = [];

  for (const set of sets) {
    const separated = separatePhase2Set(set);
    publicSets.push(separated.publicSet);
    privateAnswers.push(separated.privateAnswers);
  }

  return { publicSets, privateAnswers };
}

// ============================================================================
// PHASE 3 - Open Questions with LLM Validation
// ============================================================================

export interface Phase3Separated {
  publicThemes: Phase3ThemePublic[];
  privateAnswers: Phase3ThemeAnswerPrivate[];
}

export function separatePhase3Themes(themes: Phase3Theme[]): Phase3Separated {
  const publicThemes: Phase3ThemePublic[] = [];
  const privateAnswers: Phase3ThemeAnswerPrivate[] = [];

  for (const theme of themes) {
    const publicQuestions: Phase3QuestionPublic[] = [];
    const privateQuestionAnswers: Phase3AnswerPrivate[] = [];

    for (const q of theme.questions) {
      publicQuestions.push({
        question: q.question,
      });
      privateQuestionAnswers.push({
        expectedAnswer: q.answer,
        acceptableAnswers: q.acceptableAnswers ?? [], // Default to empty array to avoid undefined in Firebase
      });
    }

    publicThemes.push({
      title: theme.title,
      description: theme.description,
      // isTrap is NOT exposed to clients
      questions: publicQuestions,
    });

    privateAnswers.push({
      isTrap: theme.isTrap ?? false,
      questions: privateQuestionAnswers,
    });
  }

  return { publicThemes, privateAnswers };
}

// ============================================================================
// PHASE 4 - MCQ Race
// ============================================================================

export interface Phase4Separated {
  publicQuestions: Phase4QuestionPublic[];
  privateAnswers: Phase4AnswerPrivate[];
}

export function separatePhase4Questions(questions: Phase4Question[]): Phase4Separated {
  const publicQuestions: Phase4QuestionPublic[] = [];
  const privateAnswers: Phase4AnswerPrivate[] = [];

  for (const q of questions) {
    publicQuestions.push({
      text: q.text,
      options: q.options,
      anecdote: q.anecdote,
    });
    privateAnswers.push({
      correctIndex: q.correctIndex,
    });
  }

  return { publicQuestions, privateAnswers };
}

// ============================================================================
// PHASE 5 - Burger Ultime (Memory Duel)
// ============================================================================

export interface Phase5Separated {
  publicQuestions: Phase5QuestionPublic[];
  privateAnswers: Phase5AnswerPrivate[];
}

export function separatePhase5Questions(questions: Phase5Question[]): Phase5Separated {
  const publicQuestions: Phase5QuestionPublic[] = [];
  const privateAnswers: Phase5AnswerPrivate[] = [];

  for (const q of questions) {
    publicQuestions.push({
      question: q.question,
    });
    privateAnswers.push({
      expectedAnswer: q.answer,
      // acceptableAnswers can be added by LLM during validation
    });
  }

  return { publicQuestions, privateAnswers };
}

// ============================================================================
// GENERIC SEPARATOR
// ============================================================================

export type SeparatedData = {
  publicData: unknown;
  privateData: unknown;
};

/**
 * Separate questions from answers for any phase
 */
export function separateQuestionsAnswers(
  phase: PhaseId,
  data: unknown
): SeparatedData {
  switch (phase) {
    case 'phase1': {
      const result = separatePhase1Questions(data as Phase1Question[]);
      return {
        publicData: result.publicQuestions,
        privateData: result.privateAnswers,
      };
    }
    case 'phase2': {
      // Handle both single set and array of sets
      if (Array.isArray(data)) {
        const result = separatePhase2Sets(data as Phase2Set[]);
        return {
          publicData: result.publicSets,
          privateData: result.privateAnswers,
        };
      } else {
        const result = separatePhase2Set(data as Phase2Set);
        return {
          publicData: result.publicSet,
          privateData: result.privateAnswers,
        };
      }
    }
    case 'phase3': {
      const result = separatePhase3Themes(data as Phase3Theme[]);
      return {
        publicData: result.publicThemes,
        privateData: result.privateAnswers,
      };
    }
    case 'phase4': {
      const result = separatePhase4Questions(data as Phase4Question[]);
      return {
        publicData: result.publicQuestions,
        privateData: result.privateAnswers,
      };
    }
    case 'phase5': {
      const result = separatePhase5Questions(data as Phase5Question[]);
      return {
        publicData: result.publicQuestions,
        privateData: result.privateAnswers,
      };
    }
    default:
      throw new Error(`Unknown phase: ${phase}`);
  }
}
