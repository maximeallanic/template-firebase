import { useId } from 'react';

interface PhaseLogoProps {
    className?: string;
    size?: number;
}

export function SucreSaleLogo({ className = '', size = 32 }: PhaseLogoProps) {
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
                <linearGradient id={`${id}-candy`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f472b6" />
                    <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>
                <linearGradient id={`${id}-wrapper`} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#fda4af" />
                    <stop offset="50%" stopColor="#fb7185" />
                    <stop offset="100%" stopColor="#fda4af" />
                </linearGradient>
                <linearGradient id={`${id}-pretzel`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#d97706" />
                </linearGradient>
            </defs>

            {/* Candy (Left) - Sweet */}
            <g transform="translate(-2, 0)">
                {/* Wrapper twisted ends */}
                <path d="M2,14 L6,12 L6,20 L2,18 Z" fill={`url(#${id}-wrapper)`} stroke="#e11d48" strokeWidth="0.5" />
                <path d="M14,12 L18,14 L18,18 L14,20 Z" fill={`url(#${id}-wrapper)`} stroke="#e11d48" strokeWidth="0.5" />
                {/* Candy body */}
                <ellipse cx="10" cy="16" rx="5" ry="4.5" fill={`url(#${id}-candy)`} stroke="#be185d" strokeWidth="1" />
                {/* Shine */}
                <ellipse cx="8" cy="14" rx="1.5" ry="1" fill="#fff" opacity="0.5" />
            </g>

            {/* Pretzel (Right) - Salty */}
            <g transform="translate(2, 0)">
                {/* Pretzel shape - classic twisted form */}
                <path
                    d="M22,8 C18,8 16,12 18,15 C16,15 16,19 18,21 C16,23 18,26 22,26 C26,26 28,23 26,21 C28,19 28,15 26,15 C28,12 26,8 22,8 Z M22,12 C23,12 24,13 24,14 C24,15 23,16 22,16 C21,16 20,15 20,14 C20,13 21,12 22,12 Z"
                    fill={`url(#${id}-pretzel)`}
                    stroke="#92400e"
                    strokeWidth="1"
                />
                {/* Salt crystals */}
                <circle cx="20" cy="10" r="0.6" fill="#fff" opacity="0.8" />
                <circle cx="24" cy="11" r="0.5" fill="#fff" opacity="0.8" />
                <circle cx="19" cy="18" r="0.5" fill="#fff" opacity="0.8" />
                <circle cx="25" cy="19" r="0.6" fill="#fff" opacity="0.8" />
                <circle cx="21" cy="24" r="0.5" fill="#fff" opacity="0.8" />
                <circle cx="23" cy="23" r="0.4" fill="#fff" opacity="0.8" />
            </g>
        </svg>
    );
}
