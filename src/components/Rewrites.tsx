import React from 'react';
import type { Rewrite } from '../types/analysis';

interface RewritesProps {
  rewrites: Rewrite[];
}

export const Rewrites: React.FC<RewritesProps> = ({ rewrites }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-h3 text-gray-900 flex items-center gap-2">
        <span>✍️</span>
        Sentence Rewrites
      </h3>
      <div className="space-y-4">
        {rewrites.map((rewrite, idx) => (
          <div key={idx} className="card-lg overflow-hidden transition-all duration-250 hover:scale-[1.01]">
            <div className="bg-red-50 p-4 border-b-2 border-red-200">
              <div className="flex items-start gap-3">
                <span className="text-red-600 font-bold text-sm flex-shrink-0">❌ Before:</span>
                <p className="text-sm text-gray-700 flex-1 font-mono leading-relaxed">{rewrite.original}</p>
              </div>
            </div>
            <div className="bg-accent-50 p-4 border-b-2 border-accent-200">
              <div className="flex items-start gap-3">
                <span className="text-accent-700 font-bold text-sm flex-shrink-0">✅ After:</span>
                <p className="text-sm text-gray-700 flex-1 font-mono leading-relaxed">{rewrite.improved}</p>
              </div>
            </div>
            <div className="bg-primary-50 p-4">
              <div className="flex items-start gap-3">
                <span className="text-primary-700 font-bold text-sm flex-shrink-0">💡 Why:</span>
                <p className="text-sm text-gray-700 flex-1 leading-relaxed">{rewrite.reason}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
