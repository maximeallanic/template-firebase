import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, User } from 'lucide-react';
import { updatePlayerProfile, type Avatar, AVATAR_LIST } from '../../services/gameService';
import { saveProfile } from '../../services/profileService';
import { AvatarIcon } from '../AvatarIcon';

interface ProfileEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentName: string;
    currentAvatar: Avatar;
    roomCode?: string;
    playerId?: string;
    onSave: (name: string, avatar: Avatar) => void;
}

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
    isOpen,
    onClose,
    currentName,
    currentAvatar,
    roomCode,
    playerId,
    onSave
}) => {
    const [name, setName] = useState(currentName);
    const [avatar, setAvatar] = useState<Avatar>(currentAvatar);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setName(currentName);
            setAvatar(currentAvatar);
            setError(null);
        }
    }, [isOpen, currentName, currentAvatar]);

    const handleSave = async () => {
        if (!name.trim()) {
            setError('Le nom ne peut pas être vide');
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            // Save to Firestore (and localStorage cache)
            await saveProfile(name.trim(), avatar);

            // Update in game room database if in a game
            if (roomCode && playerId) {
                await updatePlayerProfile(roomCode, playerId, name.trim(), avatar);
            }

            // Call parent callback
            onSave(name.trim(), avatar);
        } catch (err) {
            console.error('Failed to update profile:', err);
            setError('Échec de la mise à jour du profil. Veuillez réessayer.');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {/* Backdrop - opacity animation only (no scale/translate) */}
            <motion.div
                key="profile-modal-backdrop"
                className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={onClose}
            />

            {/* Modal content container */}
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
                <motion.div
                    key="profile-modal-content"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="bg-slate-900 border border-indigo-500/30 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden pointer-events-auto"
                >
                    {/* Header */}
                    <div className="p-5 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <User className="w-5 h-5 text-indigo-400" />
                            Modifier le Profil
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-700"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-6 space-y-6">
                        {/* Name Input */}
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-indigo-300 uppercase tracking-wide">
                                Nom du Chef
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Votre nom"
                                maxLength={12}
                                className="w-full bg-slate-950/60 border-2 border-indigo-500/30 rounded-xl p-3 text-lg font-bold focus:border-pink-500 focus:outline-none transition-all placeholder:text-slate-600 text-white"
                            />
                        </div>

                        {/* Avatar Selection */}
                        <div className="space-y-3">
                            <label className="block text-sm font-bold text-indigo-300 uppercase tracking-wide">
                                Choisir un Avatar
                            </label>
                            <div className="grid grid-cols-5 gap-2">
                                {AVATAR_LIST.map(item => (
                                    <button
                                        key={item}
                                        type="button"
                                        onClick={() => setAvatar(item as Avatar)}
                                        className={`aspect-square rounded-xl p-1 flex items-center justify-center transition-all duration-300 ${
                                            avatar === item
                                                ? 'bg-gradient-to-br from-red-500 to-pink-500 scale-110 shadow-lg shadow-pink-500/30'
                                                : 'bg-slate-800 hover:bg-slate-700'
                                        }`}
                                    >
                                        <AvatarIcon avatar={item} size={36} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-500/20 text-red-200 p-3 rounded-xl text-center font-medium text-sm border border-red-500/30">
                                {error}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-5 border-t border-slate-700 bg-slate-800/30 flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            disabled={isSaving}
                            className="px-5 py-2 rounded-xl font-bold text-slate-400 hover:text-white transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving || !name.trim()}
                            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white px-6 py-2 rounded-xl font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
                        >
                            {isSaving ? (
                                <>Enregistrement...</>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" /> Enregistrer
                                </>
                            )}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
