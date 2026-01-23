import { useId } from 'react';

interface PhaseLogoProps {
    className?: string;
    size?: number;
}

export function TendersLogo({ className = '', size = 32 }: PhaseLogoProps) {
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
                <linearGradient id={`${id}-tenders`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fcd34d" />
                    <stop offset="100%" stopColor="#d97706" />
                </linearGradient>
            </defs>

            {/* Tender 1 (Back/Bottom) */}
            <path
                d="M20,12 C24,10 28,14 26,18 C25,21 20,24 16,22 C12,20 18,14 20,12 Z"
                fill={`url(#${id}-tenders)`}
                stroke="#b45309"
                strokeWidth="1"
                transform="rotate(10, 22, 17)"
            />

            {/* Tender 2 (Middle) */}
            <path
                d="M10,8 C14,6 18,7 20,10 C22,14 20,18 16,20 C11,22 6,18 6,14 C6,10 8,9 10,8 Z"
                fill={`url(#${id}-tenders)`}
                stroke="#b45309"
                strokeWidth="1"
            />

            {/* Tender 3 (Front/Top) */}
            <path
                d="M6,16 C10,14 16,14 18,18 C20,22 16,27 11,28 C6,29 2,24 4,20 C4.5,18 5,17 6,16 Z"
                fill={`url(#${id}-tenders)`}
                stroke="#b45309"
                strokeWidth="1"
            />

            {/* Texture/Breading dots */}
            <circle cx="12" cy="12" r="0.5" fill="#78350f" opacity="0.3" />
            <circle cx="14" cy="16" r="0.5" fill="#78350f" opacity="0.3" />
            <circle cx="9" cy="22" r="0.5" fill="#78350f" opacity="0.3" />
            <circle cx="23" cy="15" r="0.5" fill="#78350f" opacity="0.3" />

            {/* Sauce Cup - Ketchup/BBQ */}
            <path d="M24,22 C24,22 25,20 28,20 C30,20 30,22 30,22 C30,24 29,26 27,26 C25,26 24,24 24,22 Z" fill="#ef4444" stroke="#991b1b" strokeWidth="0.5" />
            <ellipse cx="27" cy="22" rx="2" ry="0.8" fill="#fee2e2" opacity="0.5" />
        </svg>
    );
}
