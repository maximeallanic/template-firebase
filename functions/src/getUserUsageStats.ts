import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db } from './config/firebase';
import { calculateCost } from './utils/costCalculator';

/**
 * Get user usage statistics including token consumption and costs
 * This is an optional admin/analytics function
 */
export const getUserUsageStats = onCall(async ({ auth }) => {
  if (!auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = auth.uid;

  try {
    // Get all analyses for this user
    const analysesSnapshot = await db
      .collection('users')
      .doc(userId)
      .collection('analyses')
      .orderBy('createdAt', 'desc')
      .get();

    let totalPromptTokens = 0;
    let totalCandidatesTokens = 0;
    let totalTokens = 0;
    let totalCost = 0;
    let analysesCount = 0;

    const analysesByMonth: Record<string, {
      count: number;
      tokens: number;
      cost: number;
    }> = {};

    // Calculate statistics
    analysesSnapshot.forEach((doc) => {
      const data = doc.data();
      const usageMetadata = data.usageMetadata;

      if (usageMetadata) {
        const promptTokens = usageMetadata.promptTokens || 0;
        const candidatesTokens = usageMetadata.candidatesTokens || 0;
        const tokens = usageMetadata.totalTokens || 0;
        const cost = calculateCost(promptTokens, candidatesTokens);

        totalPromptTokens += promptTokens;
        totalCandidatesTokens += candidatesTokens;
        totalTokens += tokens;
        totalCost += cost;
        analysesCount++;

        // Group by month
        if (data.createdAt) {
          const date = data.createdAt.toDate();
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

          if (!analysesByMonth[monthKey]) {
            analysesByMonth[monthKey] = { count: 0, tokens: 0, cost: 0 };
          }

          analysesByMonth[monthKey].count++;
          analysesByMonth[monthKey].tokens += tokens;
          analysesByMonth[monthKey].cost += cost;
        }
      }
    });

    return {
      success: true,
      stats: {
        totalAnalyses: analysesCount,
        totalPromptTokens,
        totalCandidatesTokens,
        totalTokens,
        totalCost,
        averageTokensPerAnalysis: analysesCount > 0 ? Math.round(totalTokens / analysesCount) : 0,
        averageCostPerAnalysis: analysesCount > 0 ? totalCost / analysesCount : 0,
        byMonth: analysesByMonth,
      },
    };
  } catch (error: unknown) {
    console.error('Error fetching user usage stats:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new HttpsError('internal', `Failed to fetch usage stats: ${message}`);
  }
});
