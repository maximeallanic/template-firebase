import type { ComponentType } from 'react';
import {
    TendersLogo,
    SucreSaleLogo,
    LaCarteLogo,
    LaNoteLogo,
    BurgerUltimeLogo,
    SaltPepperLogo,
    DefaultPhaseLogo,
} from './ui/phases';

export type PhaseLogoType = 'nuggets' | 'saltpepper' | 'sweetysalty' | 'menus' | 'addition' | 'burger';

interface PhaseLogoComponentProps {
    className?: string;
    size?: number;
}

type PhaseLogoComponent = ComponentType<PhaseLogoComponentProps>;

const PHASE_LOGO_COMPONENTS: Record<PhaseLogoType, PhaseLogoComponent> = {
    nuggets: TendersLogo,
    saltpepper: SaltPepperLogo,
    sweetysalty: SucreSaleLogo,
    menus: LaCarteLogo,
    addition: LaNoteLogo,
    burger: BurgerUltimeLogo,
};

interface PhaseLogoProps {
    phase: PhaseLogoType | string;
    className?: string;
    size?: number;
}

export const PhaseLogo: React.FC<PhaseLogoProps> = ({ phase, className = '', size = 32 }) => {
    const Component = PHASE_LOGO_COMPONENTS[phase as PhaseLogoType] || DefaultPhaseLogo;
    return <Component className={className} size={size} />;
};
