import { AvatarIcon } from '../components/AvatarIcon';
import { AVATAR_LIST } from '../services/gameService';

export default function TestAvatars() {
    return (
        <div className="min-h-screen bg-brand-dark p-8 text-white grid grid-cols-5 gap-8">
            {AVATAR_LIST.map((avatar) => (
                <div key={avatar} className="flex flex-col items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
                    <AvatarIcon avatar={avatar} size={128} />
                    <span className="capitalize text-xl font-bold text-gray-300">{avatar}</span>
                </div>
            ))}
        </div>
    );
}
