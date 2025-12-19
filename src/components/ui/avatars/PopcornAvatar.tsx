import { useId } from 'react';

interface AvatarProps {
    className?: string;
    size?: number;
}

export function PopcornAvatar({ className = '', size = 32 }: AvatarProps) {
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
                <linearGradient id={`${id}-bucket-red`} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#EF4444" />
                    <stop offset="100%" stopColor="#B91C1C" />
                </linearGradient>
            </defs>
            {/* Back Kernels */}
            <circle cx="24" cy="22" r="6" fill="#FEF3C7" />
            <circle cx="40" cy="22" r="6" fill="#FEF3C7" />
            <circle cx="32" cy="18" r="7" fill="#FEF3C7" />
            {/* Bucket */}
            <path d="M18 30L22 56H42L46 30H18Z" fill="white" />
            <path d="M22 30L24 56H28L30 30H22Z" fill={`url(#${id}-bucket-red)`} />
            <path d="M34 30L34 56H38L40 30H34Z" fill={`url(#${id}-bucket-red)`} />
            <rect x="16" y="28" width="32" height="4" rx="1" fill="#E5E7EB" />
            {/* Front Kernels */}
            <circle cx="28" cy="26" r="5" fill="#FDE047" />
            <circle cx="36" cy="26" r="5" fill="#FDE047" />
            {/* Face */}
            <circle cx="26" cy="40" r="2.5" fill="#1F2937" />
            <circle cx="38" cy="40" r="2.5" fill="#1F2937" />
            <path d="M30 46Q32 48 34 46" stroke="#1F2937" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}
