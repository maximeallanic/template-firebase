import { useId } from 'react';

interface AvatarProps {
    className?: string;
    size?: number;
}

export function EggAvatar({ className = '', size = 32 }: AvatarProps) {
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
                <radialGradient id={`${id}-yolk`} cx="30%" cy="30%" r="70%">
                    <stop offset="0%" stopColor="#FCD34D" />
                    <stop offset="100%" stopColor="#F59E0B" />
                </radialGradient>
            </defs>
            {/* White shape */}
            <path d="M16 28C14 42 22 54 32 54C42 54 50 42 48 28C46 18 38 10 32 10C26 10 18 18 16 28Z" fill="#F9FAFB" stroke="#E5E7EB" strokeWidth="1" />
            {/* Yolk */}
            <circle cx="32" cy="36" r="12" fill={`url(#${id}-yolk)`} />
            <circle cx="28" cy="32" r="3" fill="white" opacity="0.8" />
            {/* Face */}
            <circle cx="26" cy="36" r="1.5" fill="#1F2937" />
            <circle cx="38" cy="36" r="1.5" fill="#1F2937" />
            <path d="M30 40Q32 42 34 40" stroke="#1F2937" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}
