import React from 'react';
import type { CriteriaScore } from '../types/analysis';

interface ScoreCardProps {
  title: string;
  score: CriteriaScore;
  icon: string;
}

export const ScoreCard: React.FC<ScoreCardProps> = ({ title, score, icon }) => {
  const getScoreColor = (scoreValue: number) => {
    if (scoreValue >= 80) return 'text-accent-700 bg-accent-50 border-accent-200';
    if (scoreValue >= 60) return 'text-yellow-700 bg-yellow-50 border-yellow-200';
    if (scoreValue >= 40) return 'text-orange-700 bg-orange-50 border-orange-200';
    return 'text-red-700 bg-red-50 border-red-200';
  };

  const getProgressColor = (scoreValue: number) => {
    if (scoreValue >= 80) return 'bg-accent-500';
    if (scoreValue >= 60) return 'bg-yellow-500';
    if (scoreValue >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className={`card p-6 border-2 transition-all duration-250 hover:scale-105 ${getScoreColor(score.score)}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{icon}</span>
          <div>
            <h3 className="font-bold text-base">{title}</h3>
            <p className="text-xs opacity-90 font-medium mt-0.5">{score.label}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-extrabold">{score.score}</div>
          <div className="text-xs opacity-75 font-medium">/ 100</div>
        </div>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-3">
        <div
          className={`h-2.5 rounded-full transition-all duration-700 ease-out ${getProgressColor(score.score)}`}
          style={{ width: `${score.score}%` }}
        ></div>
      </div>

      <p className="text-xs mt-2 leading-relaxed">{score.description}</p>

      {score.issues && score.issues.length > 0 && (
        <ul className="mt-3 space-y-1.5 pl-1">
          {score.issues.map((issue, idx) => (
            <li key={idx} className="text-xs flex items-start gap-2 leading-relaxed">
              <span className="mt-0.5 text-current opacity-75">•</span>
              <span>{issue}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
