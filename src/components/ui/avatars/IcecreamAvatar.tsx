import { useId } from 'react';

interface AvatarProps {
    className?: string;
    size?: number;
}

export function IcecreamAvatar({ className = '', size = 32 }: AvatarProps) {
    const id = useId();
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 64 64"
            className={`drop-shadow-sm ${className}`}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <defs>
                <linearGradient id={`${id}-cone`} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#FCD34D" />
                    <stop offset="100%" stopColor="#D97706" />
                </linearGradient>
                <linearGradient id={`${id}-scoop`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#A78BFA" />
                    <stop offset="100%" stopColor="#8B5CF6" />
                </linearGradient>
                <linearGradient id={`${id}-scoop2`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6EE7B7" />
                    <stop offset="100%" stopColor="#34D399" />
                </linearGradient>
                <linearGradient id={`${id}-scoop3`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F9A8D4" />
                    <stop offset="100%" stopColor="#EC4899" />
                </linearGradient>
            </defs>
            {/* Cone */}
            <path d="M24 36L32 60L40 36H24Z" fill={`url(#${id}-cone)`} />
            <path d="M26 36L32 54M38 36L32 54M28 36L36 36" stroke="#B45309" strokeWidth="1" opacity="0.4" />
            {/* Scoops */}
            <circle cx="26" cy="26" r="8" fill={`url(#${id}-scoop2)`} />
            <circle cx="38" cy="26" r="8" fill={`url(#${id}-scoop3)`} />
            <circle cx="32" cy="16" r="8" fill={`url(#${id}-scoop)`} />
            {/* Face on top scoop */}
            <circle cx="29" cy="16" r="2" fill="white" />
            <circle cx="35" cy="16" r="2" fill="white" />
            <circle cx="29.5" cy="16" r="1" fill="#1F2937" />
            <circle cx="35.5" cy="16" r="1" fill="#1F2937" />
            <path d="M31 18C31.5 19 32.5 19 33 18" stroke="#1F2937" strokeWidth="1.5" strokeLinecap="round" />
            {/* Sparkles */}
            <path d="M44 10L46 14M45 12H47" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
        </svg>
    );
}
