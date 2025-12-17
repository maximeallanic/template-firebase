import React, { useId } from 'react';
import type { Avatar } from '../services/gameService';

interface AvatarIconProps {
    avatar: Avatar | string;
    className?: string;
    size?: number;
}

export const AvatarIcon: React.FC<AvatarIconProps> = ({ avatar, className = '', size = 32 }) => {
    const id = useId();
    const svgProps = {
        width: size,
        height: size,
        viewBox: "0 0 64 64",
        className: `drop-shadow-sm ${className}`,
        fill: "none",
        xmlns: "http://www.w3.org/2000/svg"
    };

    switch (avatar) {
        // ==============================
        // SAVORY GROUP
        // ==============================
        case 'burger':
            return (
                <svg {...svgProps}>
                    <defs>
                        <linearGradient id={`${id}-bun`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#FCD34D" />
                            <stop offset="100%" stopColor="#F59E0B" />
                        </linearGradient>
                        <linearGradient id={`${id}-meat`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#92400E" />
                            <stop offset="100%" stopColor="#78350F" />
                        </linearGradient>
                        <linearGradient id={`${id}-cheese`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#FDE047" />
                            <stop offset="100%" stopColor="#EAB308" />
                        </linearGradient>
                        <filter id={`${id}-shadow`} x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="0" dy="2" stdDeviation="1" floodOpacity="0.2" />
                        </filter>
                    </defs>
                    {/* Bun bottom */}
                    <path d="M10 44H54V48C54 52.4 50.4 56 46 56H18C13.6 56 10 52.4 10 48V44Z" fill={`url(#${id}-bun)`} filter={`url(#${id}-shadow)`} />
                    {/* Lettuce */}
                    <path d="M6 38C10 41 14 38 18 41C22 38 26 41 30 38C34 41 38 38 42 41C46 38 50 41 54 38C58 41 58 40 58 40H6" fill="#4ADE80" />
                    {/* Patty */}
                    <rect x="8" y="32" width="48" height="10" rx="3" fill={`url(#${id}-meat)`} />
                    {/* Cheese */}
                    <path d="M6 38L10 44H54L58 38H6Z" fill={`url(#${id}-cheese)`} />
                    <path d="M14 44V48C14 49.1 14.9 50 16 50C17.1 50 18 49.1 18 48V44" fill={`url(#${id}-cheese)`} />
                    <path d="M40 44V47C40 48.1 40.9 49 42 49C43.1 49 44 48.1 44 47V44" fill={`url(#${id}-cheese)`} />
                    {/* Bun top */}
                    <path d="M8 28C8 17 17 8 32 8C47 8 56 17 56 28H8Z" fill={`url(#${id}-bun)`} />
                    {/* Sesame seeds */}
                    <circle cx="20" cy="18" r="1.5" fill="#FEF3C7" opacity="0.8" />
                    <circle cx="32" cy="14" r="1.5" fill="#FEF3C7" opacity="0.8" />
                    <circle cx="44" cy="18" r="1.5" fill="#FEF3C7" opacity="0.8" />
                    <circle cx="26" cy="24" r="1.5" fill="#FEF3C7" opacity="0.8" />
                    <circle cx="38" cy="24" r="1.5" fill="#FEF3C7" opacity="0.8" />
                    {/* Face */}
                    <circle cx="22" cy="36" r="3" fill="white" />
                    <circle cx="42" cy="36" r="3" fill="white" />
                    <circle cx="23" cy="36" r="1.5" fill="#1F2937" />
                    <circle cx="43" cy="36" r="1.5" fill="#1F2937" />
                    <path d="M28 40C28 42 30 43 32 43C34 43 36 42 36 40" stroke="#1F2937" strokeWidth="2" strokeLinecap="round" />
                </svg>
            );

        case 'pizza':
            return (
                <svg {...svgProps}>
                    <defs>
                        <linearGradient id={`${id}-crust`} x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#F59E0B" />
                            <stop offset="100%" stopColor="#D97706" />
                        </linearGradient>
                        <linearGradient id={`${id}-cheese`} x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#FDE047" />
                            <stop offset="100%" stopColor="#EAB308" />
                        </linearGradient>
                        <linearGradient id={`${id}-pep`} x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#EF4444" />
                            <stop offset="100%" stopColor="#B91C1C" />
                        </linearGradient>
                    </defs>
                    <g filter="drop-shadow(0px 2px 2px rgba(0,0,0,0.1))">
                        {/* Slice */}
                        <path d="M32 8L58 52C58 52 48 56 32 56C16 56 6 52 6 52L32 8Z" fill={`url(#${id}-cheese)`} stroke={`url(#${id}-crust)`} strokeWidth="4" strokeLinejoin="round" />
                        {/* Crust Top Detail */}
                        <path d="M10 48C10 48 18 46 32 46C46 46 54 48 54 48" stroke="#F59E0B" strokeWidth="2" opacity="0.5" strokeLinecap="round" />
                        {/* Pepperoni */}
                        <circle cx="32" cy="26" r="5" fill={`url(#${id}-pep)`} />
                        <circle cx="24" cy="40" r="4" fill={`url(#${id}-pep)`} />
                        <circle cx="42" cy="38" r="4" fill={`url(#${id}-pep)`} />
                        {/* Face */}
                        <circle cx="26" cy="22" r="3" fill="white" />
                        <circle cx="38" cy="22" r="3" fill="white" />
                        <circle cx="27" cy="22" r="1.5" fill="#1F2937" />
                        <circle cx="39" cy="22" r="1.5" fill="#1F2937" />
                        <path d="M29 28C30 30 32 30 35 28" stroke="#1F2937" strokeWidth="2" strokeLinecap="round" />
                    </g>
                </svg>
            );

        case 'taco':
            return (
                <svg {...svgProps}>
                    <defs>
                        <linearGradient id={`${id}-shell`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#FCD34D" />
                            <stop offset="100%" stopColor="#F59E0B" />
                        </linearGradient>
                        <linearGradient id={`${id}-meat`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#78350F" />
                            <stop offset="100%" stopColor="#451a03" />
                        </linearGradient>
                    </defs>
                    {/* Rear Shell */}
                    <path d="M12 44C12 28 22 16 36 16C50 16 60 28 60 44" fill={`url(#${id}-shell)`} opacity="0.8" />
                    {/* Meat */}
                    <path d="M14 44C14 30 24 20 36 20C48 20 56 30 56 44" fill={`url(#${id}-meat)`} />
                    {/* Lettuce */}
                    <path d="M16 34C20 38 24 34 28 38C32 34 36 38 40 34C44 38 48 34 52 38" stroke="#4ADE80" strokeWidth="6" strokeLinecap="round" />
                    {/* Tomatoes */}
                    <circle cx="24" cy="34" r="3" fill="#EF4444" />
                    <circle cx="40" cy="34" r="3" fill="#EF4444" />
                    {/* Front Shell */}
                    <path d="M8 44C8 26 18 14 34 14C50 14 60 26 60 44H8Z" fill="none" stroke={`url(#${id}-shell)`} strokeWidth="0" />
                    <path d="M6 46C6 28 16 16 32 16C46 16 56 28 56 46" fill={`url(#${id}-shell)`} stroke="#D97706" strokeWidth="2" />
                    {/* Face */}
                    <g transform="translate(-2, 4)">
                        <circle cx="24" cy="30" r="3" fill="white" />
                        <circle cx="40" cy="30" r="3" fill="white" />
                        <circle cx="25" cy="30" r="1.5" fill="#1F2937" />
                        <circle cx="41" cy="30" r="1.5" fill="#1F2937" />
                        <path d="M28 34C30 36 34 36 36 34" stroke="#1F2937" strokeWidth="2" strokeLinecap="round" />
                    </g>
                </svg>
            );

        case 'hotdog':
            return (
                <svg {...svgProps}>
                    <defs>
                        <linearGradient id={`${id}-bun`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#FCD34D" />
                            <stop offset="100%" stopColor="#F59E0B" />
                        </linearGradient>
                        <linearGradient id={`${id}-sausage`} x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#EF4444" />
                            <stop offset="100%" stopColor="#B91C1C" />
                        </linearGradient>
                    </defs>
                    <g transform="rotate(-10 32 32)">
                        {/* Bun Back */}
                        <path d="M14 26C14 22 20 18 32 18C44 18 50 22 50 26V46C50 50 44 54 32 54C20 54 14 50 14 46V26Z" fill={`url(#${id}-bun)`} />
                        {/* Sausage */}
                        <rect x="18" y="14" width="28" height="44" rx="14" fill={`url(#${id}-sausage)`} />
                        <path d="M22 20C22 20 24 18 32 18C40 18 42 20 42 20" stroke="#FFF" opacity="0.3" strokeWidth="2" strokeLinecap="round" />
                        {/* Mustard */}
                        <path d="M28 16C28 16 36 20 28 24C20 28 28 32 36 36C44 40 36 44 28 48" stroke="#FDE047" strokeWidth="4" strokeLinecap="round" />
                        {/* Bun Front - Actually side view implies seeing both sides or sitniig in it. Simplified back rect is fine, lets add side highlight */}
                        <path d="M14 28C14 28 12 36 12 40C12 48 18 54 32 54C46 54 52 48 52 40C52 36 50 28 50 28" fill="none" stroke={`url(#${id}-bun)`} strokeWidth="4" />

                        {/* Face */}
                        <circle cx="26" cy="34" r="3" fill="white" />
                        <circle cx="38" cy="34" r="3" fill="white" />
                        <circle cx="27" cy="34" r="1.5" fill="#1F2937" />
                        <circle cx="39" cy="34" r="1.5" fill="#1F2937" />
                        <path d="M30 38C31 39 33 39 34 38" stroke="#1F2937" strokeWidth="2" strokeLinecap="round" />
                    </g>
                </svg>
            );

        case 'fries':
            return (
                <svg {...svgProps}>
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
                    <path d="M14 30H50L48 34H16L14 30Z" fill="#991B1B" /> {/* Inner shadow rim */}

                    {/* Face */}
                    <circle cx="24" cy="42" r="3" fill="white" />
                    <circle cx="40" cy="42" r="3" fill="white" />
                    <circle cx="25" cy="42" r="1.5" fill="#1F2937" />
                    <circle cx="41" cy="42" r="1.5" fill="#1F2937" />
                    <path d="M28 48C30 50 34 50 36 48" stroke="white" strokeWidth="2" strokeLinecap="round" />
                </svg>
            );

        // ==============================
        // SWEET GROUP
        // ==============================
        case 'donut':
            return (
                <svg {...svgProps}>
                    <defs>
                        <linearGradient id={`${id}-dough`} x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#FCD34D" />
                            <stop offset="100%" stopColor="#D97706" />
                        </linearGradient>
                        <linearGradient id={`${id}-glaze`} x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#F9A8D4" />
                            <stop offset="100%" stopColor="#EC4899" />
                        </linearGradient>
                    </defs>
                    {/* Donut Body */}
                    <circle cx="32" cy="32" r="24" fill={`url(#${id}-dough)`} />
                    <circle cx="32" cy="32" r="8" fill="#1F2937" /> {/* Hole background, using dark slate for depth or just match bg? actually transparent is better but bg isn't clear using dark grey */}

                    {/* Glaze */}
                    <path d="M32 12C46 12 53 22 53 30C53 34 50 38 46 36C42 34 40 38 36 36C32 34 30 38 26 36C22 34 18 36 14 34C14 20 22 12 32 12Z" fill={`url(#${id}-glaze)`} />

                    {/* Light Reflection */}
                    <path d="M16 20Q24 14 32 14" stroke="white" strokeWidth="3" opacity="0.3" strokeLinecap="round" fill="none" />

                    {/* Sprinkles */}
                    <rect x="20" y="20" width="4" height="2" rx="1" fill="#FEF3C7" transform="rotate(-30 20 20)" />
                    <rect x="36" y="18" width="4" height="2" rx="1" fill="#60A5FA" transform="rotate(15 36 18)" />
                    <rect x="44" y="26" width="4" height="2" rx="1" fill="#A78BFA" transform="rotate(-10 44 26)" />
                    <rect x="24" y="16" width="4" height="2" rx="1" fill="#34D399" transform="rotate(45 24 16)" />
                    <rect x="18" y="30" width="4" height="2" rx="1" fill="#FCD34D" transform="rotate(80 18 30)" />

                    {/* Face */}
                    <circle cx="24" cy="28" r="3" fill="white" />
                    <circle cx="40" cy="28" r="3" fill="white" />
                    <circle cx="25" cy="28" r="1.5" fill="#1F2937" />
                    <circle cx="41" cy="28" r="1.5" fill="#1F2937" />
                    <path d="M28 34C30 37 34 37 36 34" stroke="#1F2937" strokeWidth="2" strokeLinecap="round" />
                </svg>
            );

        case 'cupcake':
            return (
                <svg {...svgProps}>
                    <defs>
                        <linearGradient id={`${id}-wrapper`} x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#EC4899" />
                            <stop offset="100%" stopColor="#BE185D" />
                        </linearGradient>
                        <linearGradient id={`${id}-frosting`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#F9A8D4" />
                            <stop offset="100%" stopColor="#F472B6" />
                        </linearGradient>
                    </defs>
                    {/* Wrapper */}
                    <path d="M16 38L20 56H44L48 38H16Z" fill={`url(#${id}-wrapper)`} />
                    <path d="M18 38L21 56M24 38L26 56M30 38L31 56M34 38L33 56M40 38L38 56M46 38L43 56" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />

                    {/* Cake */}
                    <path d="M14 38C14 34 20 30 32 30C44 30 50 34 50 38H14Z" fill="#F59E0B" />

                    {/* Frosting */}
                    <path d="M32 8C42 8 48 16 48 24C48 30 44 32 40 30C36 28 38 24 32 24C26 24 28 28 24 30C20 32 16 30 16 24C16 16 22 8 32 8Z" fill={`url(#${id}-frosting)`} />
                    <path d="M32 8C28 8 24 12 24 16" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" fill="none" />

                    {/* Cherry */}
                    <circle cx="32" cy="8" r="4" fill="#EF4444" />
                    <path d="M32 4L36 0" stroke="#166534" strokeWidth="2" />

                    {/* Face */}
                    <circle cx="26" cy="22" r="3" fill="white" />
                    <circle cx="38" cy="22" r="3" fill="white" />
                    <circle cx="27" cy="22" r="1.5" fill="#1F2937" />
                    <circle cx="39" cy="22" r="1.5" fill="#1F2937" />
                    <path d="M29 26C30 28 34 28 35 26" stroke="#1F2937" strokeWidth="2" strokeLinecap="round" />
                </svg>
            );

        case 'icecream':
            return (
                <svg {...svgProps}>
                    <defs>
                        <linearGradient id={`${id}-cone`} x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#FCD34D" />
                            <stop offset="100%" stopColor="#D97706" />
                        </linearGradient>
                        <linearGradient id={`${id}-scoop`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#A78BFA" /> {/* User wanted colors, lets go colorful purple/pink mix */}
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

        case 'cookie':
            return (
                <svg {...svgProps}>
                    <defs>
                        <linearGradient id={`${id}-cookie`} x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#D97706" />
                            <stop offset="100%" stopColor="#B45309" />
                        </linearGradient>
                    </defs>
                    <circle cx="32" cy="32" r="24" fill="#FCD34D" /> {/* Base dough lighter */}
                    <circle cx="32" cy="32" r="24" fill={`url(#${id}-cookie)`} opacity="0.5" /> {/* Gradient overlay */}

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

                    <path d="M12 40L16 44" stroke="#B45309" strokeWidth="2" opacity="0.4" /> {/* Bite mark hint? Or texture */}
                </svg>
            );

        case 'watermelon':
            return (
                <svg {...svgProps}>
                    <defs>
                        <linearGradient id={`${id}-flesh`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#EF4444" />
                            <stop offset="100%" stopColor="#DC2626" />
                        </linearGradient>
                        <linearGradient id={`${id}-rind`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#22C55E" />
                            <stop offset="100%" stopColor="#15803D" />
                        </linearGradient>
                    </defs>
                    {/* Rind */}
                    <path d="M8 32C8 45.3 18.7 56 32 56C45.3 56 56 45.3 56 32" fill={`url(#${id}-rind)`} />
                    <path d="M11 32C11 43.6 20.4 53 32 53C43.6 53 53 43.6 53 32" fill="#DCFCE7" /> {/* White pith */}
                    {/* Flesh */}
                    <path d="M14 32C14 41.9 22.1 50 32 50C41.9 50 50 41.9 50 32H14Z" fill={`url(#${id}-flesh)`} />

                    {/* Seeds */}
                    <circle cx="24" cy="38" r="2" fill="#1F2937" />
                    <circle cx="40" cy="38" r="2" fill="#1F2937" />
                    <circle cx="32" cy="44" r="2" fill="#1F2937" />

                    {/* Face */}
                    <circle cx="26" cy="32" r="3" fill="white" />
                    <circle cx="38" cy="32" r="3" fill="white" />
                    <circle cx="27" cy="32" r="1.5" fill="#1F2937" />
                    <circle cx="39" cy="32" r="1.5" fill="#1F2937" />
                    <path d="M29 36C30 37 34 37 35 36" stroke="#1F2937" strokeWidth="1.5" strokeLinecap="round" />

                    {/* Highlight */}
                    <path d="M18 32Q22 36 26 32" stroke="white" opacity="0.2" strokeWidth="2" fill="none" />
                </svg>
            );


        // ==============================
        // FRESH/SPICY GROUP
        // ==============================
        case 'sushi':
            return (
                <svg {...svgProps}>
                    <defs>
                        <linearGradient id={`${id}-rice`} x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#F9FAFB" />
                            <stop offset="100%" stopColor="#D1D5DB" />
                        </linearGradient>
                        <linearGradient id={`${id}-nori`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#374151" />
                            <stop offset="100%" stopColor="#111827" />
                        </linearGradient>
                        <linearGradient id={`${id}-salmon`} x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#FB7185" />
                            <stop offset="100%" stopColor="#E11D48" />
                        </linearGradient>
                    </defs>

                    {/* Nori */}
                    <rect x="10" y="24" width="44" height="24" rx="4" fill={`url(#${id}-nori)`} />

                    {/* Rice Top */}
                    <ellipse cx="32" cy="24" rx="20" ry="8" fill={`url(#${id}-rice)`} />

                    {/* Salmon Filling */}
                    <circle cx="32" cy="24" r="6" fill={`url(#${id}-salmon)`} />
                    <path d="M28 22C30 20 34 20 36 22" stroke="white" strokeWidth="1" opacity="0.4" />

                    {/* Face on Nori */}
                    <circle cx="24" cy="36" r="3" fill="white" />
                    <circle cx="40" cy="36" r="3" fill="white" />
                    <circle cx="25" cy="36" r="1.5" fill="#1F2937" />
                    <circle cx="41" cy="36" r="1.5" fill="#1F2937" />

                    {/* Blush */}
                    <ellipse cx="18" cy="40" rx="3" ry="2" fill="#F472B6" opacity="0.5" />
                    <ellipse cx="46" cy="40" rx="3" ry="2" fill="#F472B6" opacity="0.5" />

                    <path d="M29 40C30 42 34 42 35 40" stroke="white" strokeWidth="2" strokeLinecap="round" />
                </svg>
            );

        case 'chili':
            return (
                <svg {...svgProps}>
                    <defs>
                        <linearGradient id={`${id}-chili`} x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#EF4444" />
                            <stop offset="50%" stopColor="#B91C1C" />
                            <stop offset="100%" stopColor="#7F1D1D" />
                        </linearGradient>
                    </defs>
                    <g transform="rotate(45 32 32)">
                        {/* Stem */}
                        <path d="M30 6H34V12H30V6Z" fill="#166534" />
                        <path d="M26 12H38C38 12 36 16 32 16C28 16 26 12 26 12Z" fill="#22C55E" />

                        {/* Body */}
                        <path d="M26 14C20 18 18 28 22 40C24 48 30 58 32 60C34 58 40 48 42 40C46 28 44 18 38 14H26Z" fill={`url(#${id}-chili)`} />

                        {/* Shine */}
                        <path d="M28 20C26 26 26 34 28 42" stroke="white" strokeWidth="2" opacity="0.3" strokeLinecap="round" fill="none" />

                        {/* Face - Angry */}
                        <g transform="translate(0, 10) rotate(-45 32 30)"> {/* Counter rotate face to be upright-ish? No, keep it angled with body matches playfulness */}
                            {/* Keep face simple aligned with body flow */}
                        </g>

                        {/* Re-doing face to be simpler and align with curve */}
                        <circle cx="28" cy="30" r="3" fill="white" />
                        <circle cx="36" cy="30" r="3" fill="white" />
                        <circle cx="29" cy="30" r="1.5" fill="#1F2937" />
                        <circle cx="35" cy="30" r="1.5" fill="#1F2937" />
                        {/* Eyebrows */}
                        <path d="M26 26L30 28" stroke="#1F2937" strokeWidth="1.5" />
                        <path d="M38 26L34 28" stroke="#1F2937" strokeWidth="1.5" />
                        {/* Mouth */}
                        <path d="M30 36C31 35 33 35 34 36" stroke="#1F2937" strokeWidth="1.5" />
                    </g>
                </svg>
            );

        case 'popcorn':
            return (
                <svg {...svgProps}>
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
                    <circle cx="36" cy="26" r="5" fill="#FDP047" />

                    {/* Face */}
                    <circle cx="26" cy="40" r="2.5" fill="#1F2937" />
                    <circle cx="38" cy="40" r="2.5" fill="#1F2937" />
                    <path d="M30 46Q32 48 34 46" stroke="#1F2937" strokeWidth="2" strokeLinecap="round" />
                </svg>
            );

        case 'avocado':
            return (
                <svg {...svgProps}>
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
                    <circle cx="35" cy="39" r="3" fill="white" opacity="0.3" /> {/* Pit Shine */}

                    {/* Face */}
                    <circle cx="26" cy="26" r="3" fill="#1F2937" />
                    <circle cx="38" cy="26" r="3" fill="#1F2937" />
                    {/* Cheeks */}
                    <circle cx="22" cy="30" r="2" fill="#F472B6" opacity="0.4" />
                    <circle cx="42" cy="30" r="2" fill="#F472B6" opacity="0.4" />

                    <path d="M30 30C31 31 33 31 34 30" stroke="#1F2937" strokeWidth="2" strokeLinecap="round" />
                </svg>
            );

        case 'egg':
            return (
                <svg {...svgProps}>
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

        default:
            return (
                <svg {...svgProps}>
                    <circle cx="32" cy="32" r="24" fill="#E5E7EB" />
                    <path d="M24 24L40 40M40 24L24 40" stroke="#9CA3AF" strokeWidth="4" strokeLinecap="round" />
                </svg>
            );
    }
};

export default AvatarIcon;
