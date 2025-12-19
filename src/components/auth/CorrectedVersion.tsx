import React, { useState } from 'react';

interface CorrectedVersionProps {
  originalEmail: string;
  correctedEmail: string;
}

export const CorrectedVersion: React.FC<CorrectedVersionProps> = ({ originalEmail, correctedEmail }) => {
  const [activeTab, setActiveTab] = useState<'before' | 'after'>('after');
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(correctedEmail);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="text-h3 text-gray-900 flex items-center gap-2">
          <span>📧</span>
          Corrected Email Version
        </h3>
        <button
          onClick={handleCopy}
          className="btn-primary text-sm py-2.5 px-5"
        >
          {copied ? (
            <>
              <span>✓</span>
              Copied!
            </>
          ) : (
            <>
              <span>📋</span>
              Copy Corrected Version
            </>
          )}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b-2 border-gray-200">
        <button
          onClick={() => setActiveTab('before')}
          className={`py-3 px-6 font-semibold transition-all duration-250 border-b-3 ${
            activeTab === 'before'
              ? 'border-red-500 text-red-600 -mb-0.5'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          ❌ Original Version
        </button>
        <button
          onClick={() => setActiveTab('after')}
          className={`py-3 px-6 font-semibold transition-all duration-250 border-b-3 ${
            activeTab === 'after'
              ? 'border-accent-500 text-accent-700 -mb-0.5'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          ✅ Corrected Version
        </button>
      </div>

      {/* Content */}
      <div className="card-lg overflow-hidden">
        {activeTab === 'before' ? (
          <div className="bg-red-50 p-6">
            <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 leading-relaxed">
              {originalEmail}
            </pre>
          </div>
        ) : (
          <div className="bg-accent-50 p-6">
            <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 leading-relaxed">
              {correctedEmail}
            </pre>
          </div>
        )}
      </div>

      <div className="alert-info">
        <span className="font-bold">💡 Tip:</span> This corrected version incorporates all the improvements identified in the analysis above.
      </div>
    </div>
  );
};
