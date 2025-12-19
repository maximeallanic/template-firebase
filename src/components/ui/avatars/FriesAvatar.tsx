import { useId } from 'react';

interface AvatarProps {
    className?: string;
    size?: number;
}

export function FriesAvatar({ className = '', size = 32 }: AvatarProps) {
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
                <linearGradient id={`${id}-box`} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#EF4444" />
                    <stop offset="100%" stopColor="#DC2626" />
                </linearGradient>
                <linearGradient id={`${id}-fry`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FDE047" />
                    <stop offset="100%" stopColor="#F59E0B" />
                </linearGradient>
            </defs>
            {/* Back Fries */}
            <rect x="18" y="14" width="6" height="30" rx="2" fill={`url(#${id}-fry)`} transform="rotate(-10 18 14)" />
            <rect x="40" y="14" width="6" height="30" rx="2" fill={`url(#${id}-fry)`} transform="rotate(10 40 14)" />
            <rect x="24" y="10" width="6" height="36" rx="2" fill={`url(#${id}-fry)`} />
            <rect x="34" y="12" width="6" height="34" rx="2" fill={`url(#${id}-fry)`} />
            <rect x="29" y="8" width="6" height="38" rx="2" fill={`url(#${id}-fry)`} />
            {/* Box */}
            <path d="M14 30L18 56H46L50 30H14Z" fill={`url(#${id}-box)`} />
            <path d="M14 30H50L48 34H16L14 30Z" fill="#991B1B" />
            {/* Face */}
            <circle cx="24" cy="42" r="3" fill="white" />
            <circle cx="40" cy="42" r="3" fill="white" />
            <circle cx="25" cy="42" r="1.5" fill="#1F2937" />
            <circle cx="41" cy="42" r="1.5" fill="#1F2937" />
            <path d="M28 48C30 50 34 50 36 48" stroke="white" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}
