export interface EmailAnalysis {
  overallScore: number;
  scores: {
    clarity: CriteriaScore;
    tone: CriteriaScore;
    length: CriteriaScore;
    cta: CriteriaScore;
    spam: CriteriaScore;
    personalization: CriteriaScore;
    structure: CriteriaScore;
  };
  suggestions: Suggestion[];
  rewrites: Rewrite[];
  correctedVersion?: string;
}

export interface CriteriaScore {
  score: number; // 0-100
  label: string;
  description: string;
  issues?: string[];
}

export interface Suggestion {
  type: 'critical' | 'important' | 'minor';
  title: string;
  description: string;
  example?: string;
}

export interface Rewrite {
  original: string;
  improved: string;
  reason: string;
}

export interface AnalyzeEmailRequest {
  emailContent: string;
}

export interface AnalyzeEmailResponse {
  success: boolean;
  data?: EmailAnalysis;
  analysisId?: string;
  error?: string;
  usage?: {
    used: number;
    limit: number;
  };
}

export interface UsageMetadata {
  promptTokens: number; // Input tokens
  candidatesTokens: number; // Output tokens (visible in response)
  totalTokens: number; // Total tokens (input + output + thinking)
  thinkingTokens?: number; // Thinking tokens (Gemini 2.5 internal reasoning, billed as output)
  estimatedCost?: number; // Estimated cost in USD (optional)
}

export interface AnalysisRecord {
  id: string;
  emailContent: string;
  analysis: EmailAnalysis;
  createdAt: Date;
  originalEmail?: string;
  source?: 'text' | 'email'; // Source of the analysis (text input or email)
  emailSubject?: string; // Subject line (for email-based analyses)
  senderEmail?: string; // Sender email address (for email-based analyses)
  usageMetadata?: UsageMetadata; // Token usage metrics from Vertex AI
}

export interface AnalysisHistoryResponse {
  analyses: AnalysisRecord[];
  hasMore: boolean;
}
