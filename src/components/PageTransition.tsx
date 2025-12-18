import React from 'react';
import { motion } from 'framer-motion';
import { organicEase } from '../animations';

interface PageTransitionProps {
    children: React.ReactNode;
}

/**
 * PageTransition - Wraps page content with smooth opacity transitions.
 *
 * IMPORTANT: Uses only opacity transitions (no scale/translate) to ensure
 * backgrounds and backdrops don't shift during page changes.
 * The SharedBackground component handles background animations separately.
 */
export const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{
                opacity: 1,
                transition: {
                    duration: 0.4,
                    ease: organicEase,
                },
            }}
            exit={{
                opacity: 0,
                transition: {
                    duration: 0.25,
                    ease: organicEase,
                },
            }}
            className="w-full min-h-screen"
        >
            {children}
        </motion.div>
    );
};
