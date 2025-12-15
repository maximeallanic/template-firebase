import { useState } from 'react';

/**
 * Hook to copy text to clipboard
 * Returns: [copyToClipboard function, isCopied boolean]
 */
export function useClipboard(resetDelay = 2000): [
  (text: string) => Promise<void>,
  boolean
] {
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);

      // Reset after delay
      setTimeout(() => {
        setIsCopied(false);
      }, resetDelay);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      setIsCopied(false);
    }
  };

  return [copyToClipboard, isCopied];
}
