/**
 * Team Color Utilities
 *
 * Centralized team-based color classes to avoid dynamic Tailwind class issues.
 * Tailwind CSS purges unused classes at build time, so dynamic class names
 * like `text-${color}-400` won't work. These utilities provide static alternatives.
 */

import type { Team } from '../types/gameTypes';

/**
 * Get text color class for a team
 */
export const getTeamTextColor = (team: Team | null | undefined): string => {
    if (!team) return 'text-slate-400';
    return team === 'spicy' ? 'text-red-400' : 'text-pink-400';
};

/**
 * Get lighter text color class for a team
 */
export const getTeamTextColorLight = (team: Team | null | undefined): string => {
    if (!team) return 'text-slate-300';
    return team === 'spicy' ? 'text-red-300' : 'text-pink-300';
};

/**
 * Get background color class for a team
 */
export const getTeamBgColor = (team: Team | null | undefined): string => {
    if (!team) return 'bg-slate-500';
    return team === 'spicy' ? 'bg-red-500' : 'bg-pink-500';
};

/**
 * Get lighter background color class for a team
 */
export const getTeamBgColorLight = (team: Team | null | undefined): string => {
    if (!team) return 'bg-slate-500/20';
    return team === 'spicy' ? 'bg-red-500/20' : 'bg-pink-500/20';
};

/**
 * Get border color class for a team
 */
export const getTeamBorderColor = (team: Team | null | undefined): string => {
    if (!team) return 'border-slate-500';
    return team === 'spicy' ? 'border-red-500' : 'border-pink-500';
};

/**
 * Get gradient background class for a team
 */
export const getTeamGradient = (team: Team | null | undefined): string => {
    if (!team) return 'bg-gradient-to-r from-slate-500 to-slate-600';
    return team === 'spicy'
        ? 'bg-gradient-to-r from-red-500 to-orange-500'
        : 'bg-gradient-to-r from-pink-500 to-purple-500';
};

/**
 * Get ring color class for a team
 */
export const getTeamRingColor = (team: Team | null | undefined): string => {
    if (!team) return 'ring-slate-500';
    return team === 'spicy' ? 'ring-red-500' : 'ring-pink-500';
};

/**
 * Get shadow color class for a team (for glow effects)
 */
export const getTeamShadowColor = (team: Team | null | undefined): string => {
    if (!team) return 'shadow-slate-500/30';
    return team === 'spicy' ? 'shadow-red-500/30' : 'shadow-pink-500/30';
};

/**
 * Get hex color for a team (for SVG strokes, etc.)
 */
export const getTeamHexColor = (team: Team | null | undefined): string => {
    if (!team) return '#64748b'; // slate-500
    return team === 'spicy' ? '#ef4444' : '#ec4899'; // red-500 / pink-500
};

/**
 * Get team display name
 */
export const getTeamDisplayName = (team: Team | null | undefined, t: (key: string) => string): string => {
    if (!team) return '';
    return t(`common:teams.${team}`);
};
