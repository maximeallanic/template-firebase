import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin (only once)
if (!admin.apps.length) {
  admin.initializeApp();
}

// Export initialized Firestore instance
export const db = getFirestore();

// Export admin for other uses
export { admin };
