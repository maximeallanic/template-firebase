import { useId } from 'react';

interface AvatarProps {
    className?: string;
    size?: number;
}

export function AvocadoAvatar({ className = '', size = 32 }: AvatarProps) {
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
                <linearGradient id={`${id}-skin`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#15803D" />
                    <stop offset="100%" stopColor="#14532D" />
                </linearGradient>
                <linearGradient id={`${id}-inside`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#D9F99D" />
                    <stop offset="100%" stopColor="#BEF264" />
                </linearGradient>
                <linearGradient id={`${id}-pit`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#92400E" />
                    <stop offset="100%" stopColor="#78350F" />
                </linearGradient>
            </defs>
            <ellipse cx="32" cy="32" rx="22" ry="26" fill={`url(#${id}-skin)`} />
            <ellipse cx="32" cy="32" rx="18" ry="22" fill={`url(#${id}-inside)`} />
            <circle cx="32" cy="42" r="10" fill={`url(#${id}-pit)`} />
            <circle cx="35" cy="39" r="3" fill="white" opacity="0.3" />
            {/* Face */}
            <circle cx="26" cy="26" r="3" fill="#1F2937" />
            <circle cx="38" cy="26" r="3" fill="#1F2937" />
            {/* Cheeks */}
            <circle cx="22" cy="30" r="2" fill="#F472B6" opacity="0.4" />
            <circle cx="42" cy="30" r="2" fill="#F472B6" opacity="0.4" />
            <path d="M30 30C31 31 33 31 34 30" stroke="#1F2937" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}
