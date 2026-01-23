import { useId } from 'react';

interface PhaseLogoProps {
    className?: string;
    size?: number;
}

export function LaCarteLogo({ className = '', size = 32 }: PhaseLogoProps) {
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
                <linearGradient id={`${id}-menu-1`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fcd34d" />
                    <stop offset="100%" stopColor="#fbbf24" />
                </linearGradient>
                <linearGradient id={`${id}-menu-2`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fb923c" />
                    <stop offset="100%" stopColor="#f97316" />
                </linearGradient>
                <linearGradient id={`${id}-menu-3`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f87171" />
                    <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>
            </defs>

            {/* Menu 1 (Back Left) */}
            <g transform="rotate(-15, 10, 20)">
                <rect x="6" y="6" width="14" height="20" rx="1" fill={`url(#${id}-menu-1)`} stroke="#b45309" strokeWidth="0.5" />
            </g>

            {/* Menu 2 (Back Right) */}
            <g transform="rotate(15, 22, 20)">
                <rect x="12" y="6" width="14" height="20" rx="1" fill={`url(#${id}-menu-3)`} stroke="#991b1b" strokeWidth="0.5" />
            </g>

            {/* Menu 3 (Center Front) */}
            <rect x="9" y="4" width="14" height="24" rx="1" fill={`url(#${id}-menu-2)`} stroke="#c2410c" strokeWidth="0.5" />
            {/* Lines on Center Menu */}
            <rect x="11" y="8" width="10" height="2" rx="0.5" fill="#fff" opacity="0.6" />
            <rect x="11" y="12" width="6" height="1" rx="0.5" fill="#fff" opacity="0.4" />
            <rect x="11" y="14" width="8" height="1" rx="0.5" fill="#fff" opacity="0.4" />
            <rect x="11" y="16" width="5" height="1" rx="0.5" fill="#fff" opacity="0.4" />

            {/* Star */}
            <circle cx="16" cy="22" r="2" fill="#fff" />
            <circle cx="16" cy="22" r="1" fill="#f59e0b" />
        </svg>
    );
}
