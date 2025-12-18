import React from 'react';

interface SkipLinkProps {
    /** The ID of the element to skip to (without the #) */
    targetId: string;
    /** The text to display in the skip link */
    children?: React.ReactNode;
}

/**
 * SkipLink component - Provides keyboard users a way to skip navigation and go directly to main content.
 * This link is visually hidden until focused, then appears at the top of the page.
 *
 * @example
 * // In your layout component:
 * <SkipLink targetId="main-content">Skip to main content</SkipLink>
 * <nav>...</nav>
 * <main id="main-content">...</main>
 */
export const SkipLink: React.FC<SkipLinkProps> = ({
    targetId,
    children = 'Aller au contenu principal'
}) => {
    return (
        <a
            href={`#${targetId}`}
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:bg-white focus:text-black focus:px-4 focus:py-2 focus:rounded-lg focus:font-bold focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
            {children}
        </a>
    );
};
