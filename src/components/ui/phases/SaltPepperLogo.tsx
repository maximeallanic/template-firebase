import { useId } from 'react';

interface PhaseLogoProps {
    className?: string;
    size?: number;
}

export function SaltPepperLogo({ className = '', size = 32 }: PhaseLogoProps) {
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
                <linearGradient id={`${id}-glass-salt`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#e5e7eb" />
                    <stop offset="50%" stopColor="#ffffff" />
                    <stop offset="100%" stopColor="#d1d5db" />
                </linearGradient>
                <linearGradient id={`${id}-wood-pepper`} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#3f2e26" />
                    <stop offset="50%" stopColor="#5d4037" />
                    <stop offset="100%" stopColor="#3e2723" />
                </linearGradient>
            </defs>

            {/* Salt (Left) - Light/Glass/White */}
            <g transform="translate(-1, 0)">
                <path d="M8 10h6l1 3v13c0 1.1-.9 2-2 2H9c-1.1 0-2-.9-2-2V13l1-3z" fill={`url(#${id}-glass-salt)`} stroke="#9ca3af" strokeWidth="1" />
                <path d="M7 8c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v2H7V8z" fill="#9ca3af" stroke="#6b7280" strokeWidth="1" />
                {/* Salt crystals inside */}
                <circle cx="11" cy="25" r="5" fill="#fff" opacity="0.5" />
                <text x="11" y="24" textAnchor="middle" fontSize="10" fill="#9ca3af" fontWeight="bold">S</text>
            </g>

            {/* Pepper (Right) - Dark/Wood */}
            <g transform="translate(1, 0)">
                {/* Grinder Body */}
                <path d="M20 10h6l1 3v13c0 1.1-.9 2-2 2h-4c-1.1 0-2-.9-2-2V13l1-3z" fill={`url(#${id}-wood-pepper)`} stroke="#271c19" strokeWidth="1" />
                {/* Grinder Top */}
                <path d="M19 8c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v2h-8V8z" fill="#2d1b16" stroke="#000" strokeWidth="1" />
                {/* Turning knob */}
                <circle cx="23.5" cy="5" r="1.5" fill="#a16207" stroke="#713f12" />
                <text x="23.5" y="24" textAnchor="middle" fontSize="10" fill="#a16207" fontWeight="bold">P</text>
            </g>
        </svg>
    );
}
