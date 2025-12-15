import { onRequest } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { Timestamp } from 'firebase-admin/firestore';
import { db } from './config/firebase';

/**
 * Deletes expired email sessions from Firestore
 * Can be triggered via HTTP request or scheduled (Cloud Scheduler)
 */
async function cleanupExpiredSessions(): Promise<{ deleted: number }> {
  console.log('🧹 Starting cleanup of expired email sessions...');

  const now = Timestamp.now();
  let totalDeleted = 0;

  try {
    // Query expired sessions in batches
    const batchSize = 500;
    let hasMore = true;

    while (hasMore) {
      const expiredSessions = await db
        .collection('emailSessions')
        .where('expiresAt', '<', now)
        .limit(batchSize)
        .get();

      if (expiredSessions.empty) {
        hasMore = false;
        break;
      }

      // Delete in batches (Firestore limit is 500 operations per batch)
      const batch = db.batch();
      expiredSessions.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      totalDeleted += expiredSessions.size;

      console.log(`🗑️ Deleted ${expiredSessions.size} expired sessions`);

      // If we got less than batch size, we're done
      if (expiredSessions.size < batchSize) {
        hasMore = false;
      }
    }

    console.log(`✅ Cleanup completed. Total deleted: ${totalDeleted}`);
    return { deleted: totalDeleted };
  } catch (error) {
    console.error('❌ Error cleaning up expired sessions:', error);
    throw error;
  }
}

/**
 * HTTP endpoint for manual cleanup (for testing or emergency cleanup)
 * Can be called via: POST https://.../cleanExpiredSessions
 */
export const cleanExpiredSessions = onRequest(async (req, res) => {
  try {
    const result = await cleanupExpiredSessions();
    res.json({
      success: true,
      deleted: result.deleted,
      message: `Successfully deleted ${result.deleted} expired sessions`,
    });
  } catch (error: unknown) {
    console.error('Error in cleanExpiredSessions endpoint:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: message,
    });
  }
});

/**
 * Scheduled function that runs daily at 3 AM UTC
 * Automatically cleans up expired sessions
 */
export const cleanExpiredSessionsScheduled = onSchedule(
  {
    schedule: '0 3 * * *', // Every day at 3 AM UTC
    timeZone: 'UTC',
  },
  async (event) => {
    try {
      console.log('⏰ Scheduled cleanup triggered at:', event.scheduleTime);
      const result = await cleanupExpiredSessions();
      console.log(`✅ Scheduled cleanup completed. Deleted ${result.deleted} sessions`);
    } catch (error) {
      console.error('❌ Error in scheduled cleanup:', error);
      throw error;
    }
  }
);
