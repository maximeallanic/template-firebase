import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from './firebase';
import { safeStorage } from '../utils/storage';
import type { Avatar } from './gameService';

const STORAGE_KEY_NAME = 'spicy_profile_name';
const STORAGE_KEY_AVATAR = 'spicy_profile_avatar';

export interface UserProfile {
  profileName: string;
  profileAvatar: Avatar;
}

/**
 * Load profile from Firestore with localStorage fallback
 * Priority: Firestore > localStorage
 */
export async function loadProfile(): Promise<UserProfile | null> {
  const user = auth.currentUser;

  // If not authenticated, use localStorage only
  if (!user) {
    return getLocalProfile();
  }

  try {
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const data = userDoc.data();
      if (data.profileName && data.profileAvatar) {
        // Found in Firestore - update localStorage cache
        const profile: UserProfile = {
          profileName: data.profileName,
          profileAvatar: data.profileAvatar as Avatar,
        };
        cacheProfileLocally(profile);
        return profile;
      }
    }

    // No Firestore profile - user needs to create one
    // Don't auto-migrate localStorage (could be from a different account)
    return null;
  } catch (error) {
    console.error('Error loading profile from Firestore:', error);
    // Fallback to localStorage on error
    return getLocalProfile();
  }
}

/**
 * Save profile to Firestore and localStorage
 */
export async function saveProfile(name: string, avatar: Avatar): Promise<void> {
  const user = auth.currentUser;

  // Always save to localStorage (cache)
  cacheProfileLocally({ profileName: name, profileAvatar: avatar });

  // If not authenticated, only localStorage
  if (!user) {
    return;
  }

  try {
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      // Update existing document
      await updateDoc(userDocRef, {
        profileName: name,
        profileAvatar: avatar,
        updatedAt: serverTimestamp(),
      });
    } else {
      // Create new document with profile only
      await setDoc(userDocRef, {
        profileName: name,
        profileAvatar: avatar,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    console.log('Profile saved to Firestore');
  } catch (error) {
    console.error('Error saving profile to Firestore:', error);
    // Profile is still saved locally, so user won't lose data
    throw error;
  }
}

/**
 * Get profile from localStorage only (for quick access)
 */
export function getLocalProfile(): UserProfile | null {
  const name = safeStorage.getItem(STORAGE_KEY_NAME);
  const avatar = safeStorage.getItem(STORAGE_KEY_AVATAR) as Avatar | null;

  if (!name) return null;

  return {
    profileName: name,
    profileAvatar: avatar || 'burger',
  };
}

/**
 * Cache profile to localStorage
 */
function cacheProfileLocally(profile: UserProfile): void {
  safeStorage.setItem(STORAGE_KEY_NAME, profile.profileName);
  safeStorage.setItem(STORAGE_KEY_AVATAR, profile.profileAvatar);
}

/**
 * Clear profile from localStorage (for logout)
 */
export function clearLocalProfile(): void {
  safeStorage.removeItem(STORAGE_KEY_NAME);
  safeStorage.removeItem(STORAGE_KEY_AVATAR);
}
