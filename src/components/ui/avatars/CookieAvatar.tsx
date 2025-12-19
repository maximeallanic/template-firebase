import { useId } from 'react';

interface AvatarProps {
    className?: string;
    size?: number;
}

export function CookieAvatar({ className = '', size = 32 }: AvatarProps) {
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
                <linearGradient id={`${id}-cookie`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#D97706" />
                    <stop offset="100%" stopColor="#B45309" />
                </linearGradient>
            </defs>
            <circle cx="32" cy="32" r="24" fill="#FCD34D" />
            <circle cx="32" cy="32" r="24" fill={`url(#${id}-cookie)`} opacity="0.5" />
            {/* Chips */}
            <circle cx="20" cy="20" r="3" fill="#4B0F19" />
            <circle cx="44" cy="24" r="3" fill="#4B0F19" />
            <circle cx="32" cy="46" r="4" fill="#4B0F19" />
            <circle cx="16" cy="36" r="3" fill="#4B0F19" />
            <circle cx="48" cy="38" r="3" fill="#4B0F19" />
            <circle cx="32" cy="12" r="3" fill="#4B0F19" />
            {/* Face */}
            <circle cx="24" cy="30" r="3" fill="white" />
            <circle cx="40" cy="30" r="3" fill="white" />
            <circle cx="25" cy="30" r="1.5" fill="#1F2937" />
            <circle cx="41" cy="30" r="1.5" fill="#1F2937" />
            <path d="M28 36C30 39 34 39 36 36" stroke="#4B0F19" strokeWidth="2" strokeLinecap="round" />
            <path d="M12 40L16 44" stroke="#B45309" strokeWidth="2" opacity="0.4" />
        </svg>
    );
}
