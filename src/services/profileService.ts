import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, getCurrentUser } from './firebase';
import { safeStorage } from '../utils/storage';
import { isNative } from './platformService';
import type { Avatar } from './gameService';

const STORAGE_KEY_NAME = 'spicy_profile_name';
const STORAGE_KEY_AVATAR = 'spicy_profile_avatar';

/**
 * Save profile to Firestore using REST API (for native apps where SDK hangs)
 */
async function saveProfileViaREST(userId: string, idToken: string, name: string, avatar: Avatar): Promise<boolean> {
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${userId}`;

  try {
    console.log('💾 Saving profile via REST API...');
    const response = await fetch(url + '?updateMask.fieldPaths=profileName&updateMask.fieldPaths=profileAvatar&updateMask.fieldPaths=updatedAt', {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: {
          profileName: { stringValue: name },
          profileAvatar: { stringValue: avatar },
          updatedAt: { timestampValue: new Date().toISOString() },
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Firestore REST save error:', response.status, errorText);
      return false;
    }

    console.log('💾 Profile saved via REST API');
    return true;
  } catch (error) {
    console.error('❌ Firestore REST save error:', error);
    return false;
  }
}

/**
 * Fetch profile from Firestore using REST API (for native apps where SDK hangs)
 */
async function fetchProfileViaREST(userId: string, idToken: string): Promise<UserProfile | null> {
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${userId}`;

  try {
    console.log('📋 Fetching profile via REST API...');
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${idToken}`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log('📋 No profile document found in Firestore');
        return null;
      }
      const errorText = await response.text();
      console.error('❌ Firestore REST API error:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    console.log('📋 Firestore REST response:', data);

    // Parse Firestore document format
    const fields = data.fields;
    if (fields?.profileName?.stringValue && fields?.profileAvatar?.stringValue) {
      const profile: UserProfile = {
        profileName: fields.profileName.stringValue,
        profileAvatar: fields.profileAvatar.stringValue as Avatar,
      };
      console.log('📋 Profile loaded via REST:', profile.profileName);
      return profile;
    }

    return null;
  } catch (error) {
    console.error('❌ Firestore REST fetch error:', error);
    return null;
  }
}

export interface UserProfile {
  profileName: string;
  profileAvatar: Avatar;
}

/**
 * Load profile from Firestore with localStorage fallback
 * Priority: Firestore > localStorage
 */
export async function loadProfile(): Promise<UserProfile | null> {
  const user = getCurrentUser();
  console.log('📋 loadProfile called, user:', user?.email || 'none');

  // If not authenticated, use localStorage only
  if (!user) {
    console.log('📋 No user, using localStorage');
    return getLocalProfile();
  }

  try {
    console.log('📋 Fetching profile from Firestore for uid:', user.uid);

    // On native apps, use REST API directly (SDK hangs)
    if (isNative()) {
      try {
        const idToken = await user.getIdToken();
        const profile = await fetchProfileViaREST(user.uid, idToken);
        if (profile) {
          cacheProfileLocally(profile);
          return profile;
        }
      } catch (restError) {
        console.error('❌ REST API profile fetch failed:', restError);
      }

      // Fallback to localStorage
      const localProfile = getLocalProfile();
      if (localProfile) {
        console.log('📋 Using localStorage profile:', localProfile.profileName);
        return localProfile;
      }

      console.log('📋 No profile found anywhere');
      return null;
    }

    // On web, use SDK with timeout
    const timeoutPromise = new Promise<null>((resolve) => {
      setTimeout(() => {
        console.warn('⚠️ Firestore profile fetch timeout, using localStorage');
        resolve(null);
      }, 5000);
    });

    const firestorePromise = (async () => {
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const data = userDoc.data();
        console.log('📋 Firestore profile found:', data.profileName);
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
      return null;
    })();

    const result = await Promise.race([firestorePromise, timeoutPromise]);

    if (result) {
      return result;
    }

    // No Firestore profile or timeout - try localStorage
    const localProfile = getLocalProfile();
    if (localProfile) {
      console.log('📋 Using localStorage profile:', localProfile.profileName);
      return localProfile;
    }

    // No profile anywhere - user needs to create one
    console.log('📋 No profile found anywhere');
    return null;
  } catch (error) {
    console.error('❌ Error loading profile from Firestore:', error);
    // Fallback to localStorage on error
    return getLocalProfile();
  }
}

/**
 * Save profile to Firestore and localStorage
 */
export async function saveProfile(name: string, avatar: Avatar): Promise<void> {
  const user = getCurrentUser();
  console.log('💾 saveProfile called, user:', user?.email || 'none');

  // Always save to localStorage (cache)
  cacheProfileLocally({ profileName: name, profileAvatar: avatar });
  console.log('💾 Profile saved to localStorage');

  // If not authenticated, only localStorage
  if (!user) {
    return;
  }

  // On native apps, use REST API directly
  if (isNative()) {
    try {
      const idToken = await user.getIdToken();
      await saveProfileViaREST(user.uid, idToken, name, avatar);
    } catch (error) {
      console.error('❌ REST API save failed:', error);
    }
    return;
  }

  // On web, use SDK with timeout
  const saveToFirestore = async () => {
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

      console.log('💾 Profile saved to Firestore');
    } catch (error) {
      console.error('❌ Error saving profile to Firestore:', error);
    }
  };

  // Add timeout for Firestore save
  const timeoutPromise = new Promise<void>((resolve) => {
    setTimeout(() => {
      console.warn('⚠️ Firestore save timeout, profile saved locally only');
      resolve();
    }, 5000);
  });

  await Promise.race([saveToFirestore(), timeoutPromise]);
}

/**
 * Get profile from localStorage only (for quick access)
 * Checks multiple legacy keys for backwards compatibility
 */
export function getLocalProfile(): UserProfile | null {
  // Check current key first, then legacy keys
  const name = safeStorage.getItem(STORAGE_KEY_NAME)
    || safeStorage.getItem('spicy_player_name')
    || safeStorage.getItem('spicy_host_name');
  const avatar = (safeStorage.getItem(STORAGE_KEY_AVATAR)
    || safeStorage.getItem('spicy_player_avatar')
    || safeStorage.getItem('spicy_host_avatar')) as Avatar | null;

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
