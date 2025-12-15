import React from 'react';
import type { Suggestion } from '../types/analysis';

interface SuggestionsProps {
  suggestions: Suggestion[];
}

export const Suggestions: React.FC<SuggestionsProps> = ({ suggestions }) => {
  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'critical':
        return 'alert-danger';
      case 'important':
        return 'alert-warning';
      case 'minor':
        return 'alert-info';
      default:
        return 'alert bg-gray-50 border-gray-300 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return '🚨';
      case 'important':
        return '⚠️';
      case 'minor':
        return '💡';
      default:
        return 'ℹ️';
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-h3 text-gray-900 flex items-center gap-2">
        <span>💬</span>
        Actionable Suggestions
      </h3>
      <div className="space-y-3">
        {suggestions.map((suggestion, idx) => (
          <div
            key={idx}
            className={`${getTypeStyle(suggestion.type)} transition-all duration-250 hover:scale-[1.01]`}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">{getTypeIcon(suggestion.type)}</span>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-base mb-2">{suggestion.title}</h4>
                <p className="text-sm leading-relaxed mb-2">{suggestion.description}</p>
                {suggestion.example && (
                  <div className="mt-3 p-3 bg-white/60 rounded-button border border-current/20">
                    <p className="text-xs font-mono leading-relaxed">{suggestion.example}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
