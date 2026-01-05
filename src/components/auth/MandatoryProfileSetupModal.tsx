import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ChefHat } from 'lucide-react';
import { type Avatar, AVATAR_LIST } from '../../services/gameService';
import { saveProfile } from '../../services/profileService';
import { AvatarIcon } from '../AvatarIcon';
import { useTranslation } from 'react-i18next';

interface MandatoryProfileSetupModalProps {
    isOpen: boolean;
    onComplete: () => void;
}

export const MandatoryProfileSetupModal: React.FC<MandatoryProfileSetupModalProps> = ({
    isOpen,
    onComplete
}) => {
    const { t } = useTranslation();
    const [name, setName] = useState('');
    const [avatar, setAvatar] = useState<Avatar | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const canSave = name.trim().length > 0 && avatar !== null;

    const handleSave = async () => {
        if (!name.trim()) {
            setError(t('profileSetup.errorNameRequired'));
            return;
        }
        if (!avatar) {
            setError(t('profileSetup.errorAvatarRequired'));
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            await saveProfile(name.trim(), avatar);
            onComplete();
        } catch (err) {
            console.error('Failed to save profile:', err);
            setError(t('profileSetup.errorSaveFailed'));
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {/* Backdrop - NO click to close */}
            <motion.div
                key="mandatory-profile-backdrop"
                className="fixed inset-0 z-[70] bg-black/90 backdrop-blur-md"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
            />

            {/* Modal content container */}
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                <motion.div
                    key="mandatory-profile-content"
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    transition={{ duration: 0.3, type: 'spring', bounce: 0.3 }}
                    className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 border-2 border-indigo-500/40 w-full max-w-md rounded-3xl shadow-2xl shadow-indigo-500/20 overflow-hidden"
                >
                    {/* Header - Fun and welcoming */}
                    <div className="p-6 text-center bg-gradient-to-r from-orange-500/20 via-pink-500/20 to-purple-500/20">
                        <motion.div
                            initial={{ rotate: -10 }}
                            animate={{ rotate: [0, -5, 5, 0] }}
                            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                            className="inline-block mb-3"
                        >
                            <ChefHat className="w-12 h-12 text-orange-400 mx-auto" />
                        </motion.div>
                        <h2 className="text-2xl font-black text-white mb-1">
                            {t('profileSetup.title')}
                        </h2>
                        <p className="text-slate-400 text-sm">
                            {t('profileSetup.subtitle')}
                        </p>
                    </div>

                    {/* Body */}
                    <div className="p-6 space-y-6">
                        {/* Name Input */}
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-indigo-300 uppercase tracking-wide">
                                {t('profileSetup.nameLabel')}
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder={t('profileSetup.namePlaceholder')}
                                maxLength={12}
                                autoFocus
                                className="w-full bg-slate-950/60 border-2 border-indigo-500/30 rounded-xl p-4 text-lg font-bold focus:border-pink-500 focus:outline-none transition-all placeholder:text-slate-600 text-white"
                            />
                        </div>

                        {/* Avatar Selection */}
                        <div className="space-y-3">
                            <label className="block text-sm font-bold text-indigo-300 uppercase tracking-wide">
                                {t('profileSetup.avatarLabel')}
                            </label>
                            <div className="grid grid-cols-5 gap-2">
                                {AVATAR_LIST.map(item => (
                                    <motion.button
                                        key={item}
                                        type="button"
                                        onClick={() => setAvatar(item as Avatar)}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className={`aspect-square rounded-xl p-1.5 flex items-center justify-center transition-all duration-200 ${
                                            avatar === item
                                                ? 'bg-gradient-to-br from-orange-500 to-pink-500 scale-110 shadow-lg shadow-pink-500/40 ring-2 ring-white/30'
                                                : 'bg-slate-800/80 hover:bg-slate-700 border border-slate-700'
                                        }`}
                                    >
                                        <AvatarIcon avatar={item} size={36} />
                                    </motion.button>
                                ))}
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-red-500/20 text-red-200 p-3 rounded-xl text-center font-medium text-sm border border-red-500/30"
                            >
                                {error}
                            </motion.div>
                        )}
                    </div>

                    {/* Footer - Single CTA button, no cancel */}
                    <div className="p-6 pt-0">
                        <motion.button
                            onClick={handleSave}
                            disabled={!canSave || isSaving}
                            whileHover={canSave && !isSaving ? { scale: 1.02 } : {}}
                            whileTap={canSave && !isSaving ? { scale: 0.98 } : {}}
                            className="w-full bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 hover:from-orange-400 hover:via-pink-400 hover:to-purple-400 text-white py-4 rounded-xl font-black text-lg shadow-lg shadow-pink-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-all"
                        >
                            {isSaving ? (
                                <>{t('profileSetup.saving')}</>
                            ) : (
                                <>
                                    <Sparkles className="w-5 h-5" />
                                    {t('profileSetup.saveButton')}
                                </>
                            )}
                        </motion.button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
