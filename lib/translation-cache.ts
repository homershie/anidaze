import { createClient } from "redis";
import { createHash } from "crypto";

// Initialize Redis client with REDIS_URL
// Vercel automatically provides this environment variable
const redisClient = createClient({
  url: process.env.REDIS_URL || "",
});

// Connect to Redis (lazy connection)
let isConnected = false;
async function getRedis() {
  if (!isConnected) {
    await redisClient.connect();
    isConnected = true;
  }
  return redisClient;
}

/**
 * Translation cache using Vercel KV (Redis)
 *
 * Purpose:
 * - Cache translated text to reduce API calls
 * - Track monthly character usage for DeepL API (500,000 limit)
 * - Automatically reset usage counter on the 1st of each month
 */

const MONTHLY_LIMIT = 500000; // DeepL Free API limit: 500,000 characters/month

/**
 * Generate a hash key for the translation cache
 * Format: translation:{sourceLang}-{targetLang}:{hash}
 */
function getTranslationKey(text: string, sourceLang: string, targetLang: string): string {
  const hash = createHash("md5").update(text).digest("hex");
  return `translation:${sourceLang}-${targetLang}:${hash}`;
}

/**
 * Get the usage key for current month
 * Format: translation:usage:YYYY-MM
 */
function getUsageKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `translation:usage:${year}-${month}`;
}

/**
 * Get cached translation
 * @param text - Original text to translate
 * @param sourceLang - Source language code (e.g., "ja")
 * @param targetLang - Target language code (e.g., "zh")
 * @returns Cached translation or null if not found
 */
export async function getCachedTranslation(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string | null> {
  try {
    const redis = await getRedis();
    const key = getTranslationKey(text, sourceLang, targetLang);
    const cached = await redis.get(key);
    return cached;
  } catch (error) {
    console.error("Error getting cached translation:", error);
    return null;
  }
}

/**
 * Set cached translation
 * @param text - Original text
 * @param translation - Translated text
 * @param sourceLang - Source language code
 * @param targetLang - Target language code
 */
export async function setCachedTranslation(
  text: string,
  translation: string,
  sourceLang: string,
  targetLang: string
): Promise<void> {
  try {
    const redis = await getRedis();
    const key = getTranslationKey(text, sourceLang, targetLang);
    // Store translation permanently (no expiration)
    await redis.set(key, translation);
  } catch (error) {
    console.error("Error setting cached translation:", error);
  }
}

/**
 * Get current month's character usage
 * @returns Number of characters used this month
 */
export async function getMonthlyUsage(): Promise<number> {
  try {
    const redis = await getRedis();
    const key = getUsageKey();
    const usage = await redis.get(key);
    return usage ? parseInt(usage, 10) : 0;
  } catch (error) {
    console.error("Error getting monthly usage:", error);
    return 0;
  }
}

/**
 * Increment monthly character usage
 * @param characters - Number of characters to add
 * @returns New total usage
 */
export async function incrementUsage(characters: number): Promise<number> {
  try {
    const redis = await getRedis();
    const key = getUsageKey();
    const newUsage = await redis.incrBy(key, characters);

    // Set expiration to end of next month to ensure cleanup
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 2, 1);
    const secondsUntilExpiry = Math.floor((nextMonth.getTime() - now.getTime()) / 1000);
    await redis.expire(key, secondsUntilExpiry);

    return newUsage;
  } catch (error) {
    console.error("Error incrementing usage:", error);
    return 0;
  }
}

/**
 * Check if monthly limit has been exceeded
 * @returns True if limit exceeded
 */
export async function isLimitExceeded(): Promise<boolean> {
  const usage = await getMonthlyUsage();
  return usage >= MONTHLY_LIMIT;
}

/**
 * Get remaining character quota for this month
 * @returns Number of characters remaining
 */
export async function getRemainingQuota(): Promise<number> {
  const usage = await getMonthlyUsage();
  return Math.max(0, MONTHLY_LIMIT - usage);
}

/**
 * Check if text can be translated within quota
 * @param textLength - Length of text to translate
 * @returns True if translation is allowed
 */
export async function canTranslate(textLength: number): Promise<boolean> {
  if (textLength <= 0) return false;
  const remaining = await getRemainingQuota();
  return remaining >= textLength;
}

/**
 * Reset monthly usage counter (admin function)
 * Should only be called manually or on the 1st of each month
 */
export async function resetMonthlyUsage(): Promise<void> {
  try {
    const redis = await getRedis();
    const key = getUsageKey();
    await redis.set(key, "0");
    console.log(`Translation usage reset for ${key}`);
  } catch (error) {
    console.error("Error resetting monthly usage:", error);
  }
}

/**
 * Clear all translation cache
 * Warning: This will delete all cached translations
 */
export async function clearTranslationCache(): Promise<void> {
  try {
    const redis = await getRedis();
    // Get all translation keys
    const keys = await redis.keys("translation:*");

    if (keys.length > 0) {
      // Delete in batches to avoid timeout
      const batchSize = 100;
      for (let i = 0; i < keys.length; i += batchSize) {
        const batch = keys.slice(i, i + batchSize);
        await Promise.all(batch.map(key => redis.del(key)));
      }
      console.log(`Cleared ${keys.length} translation cache entries`);
    }
  } catch (error) {
    console.error("Error clearing translation cache:", error);
  }
}

/**
 * Get translation statistics
 * @returns Object with usage stats
 */
export async function getTranslationStats() {
  const usage = await getMonthlyUsage();
  const remaining = await getRemainingQuota();
  const percentage = (usage / MONTHLY_LIMIT) * 100;

  return {
    monthlyLimit: MONTHLY_LIMIT,
    used: usage,
    remaining: remaining,
    percentageUsed: Math.round(percentage * 10) / 10,
    isLimitExceeded: usage >= MONTHLY_LIMIT,
    currentMonth: getUsageKey().split(":")[2], // Extract YYYY-MM
  };
}
