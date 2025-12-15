import React from 'react';
import type { EmailAnalysis } from '../types/analysis';
import { ScoreCard } from './ScoreCard';
import { Suggestions } from './Suggestions';
import { Rewrites } from './Rewrites';
import { CorrectedVersion } from './CorrectedVersion';

interface AnalysisResultsProps {
  analysis: EmailAnalysis;
  originalEmail: string;
  onReset: () => void;
}

export const AnalysisResults: React.FC<AnalysisResultsProps> = ({ analysis, originalEmail, onReset }) => {
  const getOverallScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getOverallScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Very Good';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Fair';
    if (score >= 50) return 'Needs Work';
    return 'Poor';
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 animate-fade-in">
      {/* Overall Score */}
      <div className="bg-gradient-to-r from-primary-600 via-secondary-600 to-primary-700 rounded-card-lg p-8 text-white shadow-card-lg">
        <div className="text-center">
          <h2 className="text-h2 mb-3">Overall Email Score</h2>
          <div className={`text-7xl font-extrabold mb-3 ${getOverallScoreColor(analysis.overallScore)} filter drop-shadow-lg`}>
            {analysis.overallScore}
          </div>
          <div className="text-xl opacity-95 font-medium">{getOverallScoreLabel(analysis.overallScore)}</div>
        </div>
      </div>

      {/* Criteria Scores Grid */}
      <div>
        <h2 className="text-h2 text-gray-900 mb-6">Detailed Analysis</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <ScoreCard title="Clarity" score={analysis.scores.clarity} icon="🎯" />
          <ScoreCard title="Tone" score={analysis.scores.tone} icon="🎭" />
          <ScoreCard title="Length" score={analysis.scores.length} icon="📏" />
          <ScoreCard title="Call-to-Action" score={analysis.scores.cta} icon="🎬" />
          <ScoreCard title="Spam Check" score={analysis.scores.spam} icon="🛡️" />
          <ScoreCard title="Personalization" score={analysis.scores.personalization} icon="👤" />
          <ScoreCard title="Structure" score={analysis.scores.structure} icon="📐" />
        </div>
      </div>

      {/* Suggestions */}
      {analysis.suggestions && analysis.suggestions.length > 0 && (
        <Suggestions suggestions={analysis.suggestions} />
      )}

      {/* Corrected Version */}
      {analysis.correctedVersion && (
        <CorrectedVersion originalEmail={originalEmail} correctedEmail={analysis.correctedVersion} />
      )}

      {/* Rewrites */}
      {analysis.rewrites && analysis.rewrites.length > 0 && (
        <Rewrites rewrites={analysis.rewrites} />
      )}

      {/* Action Buttons */}
      <div className="flex justify-center gap-4 pt-4">
        <button
          onClick={onReset}
          className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-8 rounded-button transition-all duration-250 shadow-button hover:shadow-button-hover transform hover:-translate-y-0.5"
        >
          Analyze Another Email
        </button>
      </div>
    </div>
  );
};
