interface AvatarProps {
    className?: string;
    size?: number;
}

export function DefaultAvatar({ className = '', size = 32 }: AvatarProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 64 64"
            className={`drop-shadow-sm ${className}`}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <circle cx="32" cy="32" r="24" fill="#E5E7EB" />
            <path d="M24 24L40 40M40 24L24 40" stroke="#9CA3AF" strokeWidth="4" strokeLinecap="round" />
        </svg>
    );
}
