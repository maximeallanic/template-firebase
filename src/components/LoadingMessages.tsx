import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { organicEase, durations } from '../animations';
import { useLoadingMessages } from '../hooks/useGameTranslation';

interface LoadingMessagesProps {
    className?: string;
}

export function LoadingMessages({ className = '' }: LoadingMessagesProps) {
    const { getMessages } = useLoadingMessages();
    const messages = getMessages();

    const [messageIndex, setMessageIndex] = useState(() =>
        Math.floor(Math.random() * messages.length)
    );
    const usedIndices = useRef<Set<number>>(new Set([messageIndex]));

    useEffect(() => {
        if (messages.length === 0) return;

        const interval = setInterval(() => {
            setMessageIndex(prev => {
                // Reset if we've used most messages
                if (usedIndices.current.size >= messages.length - 1) {
                    usedIndices.current = new Set();
                }

                // Find next unused index (different from current)
                let nextIndex: number;
                do {
                    nextIndex = Math.floor(Math.random() * messages.length);
                } while (nextIndex === prev || usedIndices.current.has(nextIndex));

                usedIndices.current.add(nextIndex);
                return nextIndex;
            });
        }, 2500);

        return () => clearInterval(interval);
    }, [messages.length]);

    if (messages.length === 0) {
        return null;
    }

    return (
        <div className={`h-8 flex items-center justify-center ${className}`}>
            <AnimatePresence mode="wait">
                <motion.p
                    key={messageIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: durations.fast, ease: organicEase }}
                    className="text-slate-300 text-sm font-medium"
                >
                    {messages[messageIndex]}
                </motion.p>
            </AnimatePresence>
        </div>
    );
}
