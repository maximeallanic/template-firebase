import { useId } from 'react';

interface PhaseLogoProps {
    className?: string;
    size?: number;
}

export function BurgerUltimeLogo({ className = '', size = 32 }: PhaseLogoProps) {
    const id = useId();
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 32 32"
            className={className}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <defs>
                <linearGradient id={`${id}-bun`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#d97706" />
                </linearGradient>
            </defs>

            {/* Top bun */}
            <path d="M4 11c0-4 5.4-7 12-7s12 3 12 7H4z" fill={`url(#${id}-bun)`} stroke="#b45309" strokeWidth="1" />
            {/* Sesame seeds */}
            <circle cx="10" cy="8" r="0.8" fill="#fef3c7" /> <circle cx="16" cy="6" r="0.8" fill="#fef3c7" /> <circle cx="22" cy="8" r="0.8" fill="#fef3c7" />

            {/* Lettuce */}
            <path d="M3 12 Q6 14 9 12 T15 12 T21 12 T27 12 T29 12 L29 14 L3 14 Z" fill="#4ade80" stroke="#16a34a" strokeWidth="0.5" />

            {/* Tomato */}
            <rect x="4" y="14" width="24" height="2" fill="#ef4444" />

            {/* Patty 1 */}
            <rect x="5" y="16" width="22" height="3" rx="1" fill="#78350f" />

            {/* Cheese 1 (Dripping) */}
            <path d="M4,15 L28,15 L28,17 L24,17 L24,19 L20,17 L14,17 L14,20 L10,17 L4,17 Z" fill="#facc15" />

            {/* Patty 2 */}
            <rect x="5" y="21" width="22" height="3" rx="1" fill="#78350f" />

            {/* Cheese 2 */}
            <rect x="4" y="20" width="24" height="1" fill="#facc15" />

            {/* Bottom bun */}
            <path d="M4 25h24c0 2.5-5.4 4-12 4S4 27.5 4 25z" fill={`url(#${id}-bun)`} stroke="#b45309" strokeWidth="1" />
        </svg>
    );
}
