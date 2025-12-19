import type { Avatar } from '../types/gameTypes';
import {
    BurgerAvatar,
    PizzaAvatar,
    TacoAvatar,
    HotdogAvatar,
    FriesAvatar,
    DonutAvatar,
    CupcakeAvatar,
    IcecreamAvatar,
    CookieAvatar,
    WatermelonAvatar,
    SushiAvatar,
    ChiliAvatar,
    PopcornAvatar,
    AvocadoAvatar,
    EggAvatar,
    DefaultAvatar,
} from './ui/avatars';

interface AvatarIconProps {
    avatar: Avatar | string;
    className?: string;
    size?: number;
}

type AvatarComponent = React.FC<{ className?: string; size?: number }>;

const AVATAR_COMPONENTS: Record<string, AvatarComponent> = {
    burger: BurgerAvatar,
    pizza: PizzaAvatar,
    taco: TacoAvatar,
    hotdog: HotdogAvatar,
    fries: FriesAvatar,
    donut: DonutAvatar,
    cupcake: CupcakeAvatar,
    icecream: IcecreamAvatar,
    cookie: CookieAvatar,
    watermelon: WatermelonAvatar,
    sushi: SushiAvatar,
    chili: ChiliAvatar,
    popcorn: PopcornAvatar,
    avocado: AvocadoAvatar,
    egg: EggAvatar,
};

export const AvatarIcon: React.FC<AvatarIconProps> = ({ avatar, className = '', size = 32 }) => {
    const Component = AVATAR_COMPONENTS[avatar] || DefaultAvatar;
    return <Component className={className} size={size} />;
};
