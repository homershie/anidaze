import * as deepl from "deepl-node";
import { Converter } from "opencc-js";
import {
  getCachedTranslation,
  setCachedTranslation,
  canTranslate,
  incrementUsage,
  isLimitExceeded,
} from "./translation-cache";

/**
 * DeepL Translation Service with OpenCC Converter
 *
 * Features:
 * - Automatic caching to reduce API calls
 * - Monthly character limit tracking (500,000 chars/month)
 * - Graceful degradation when limit exceeded
 * - Error handling with fallback to original text
 * - Simplified to Traditional Chinese (Taiwan) conversion using OpenCC
 *
 * Translation Process:
 * 1. Japanese → Simplified Chinese (via DeepL API)
 * 2. Simplified Chinese → Traditional Chinese Taiwan (via OpenCC)
 */

const DEEPL_API_KEY = process.env.DEEPL_API_KEY;

// Initialize DeepL translator (lazy initialization)
let translator: deepl.Translator | null = null;

// Initialize OpenCC converter (Simplified Chinese to Traditional Chinese - Taiwan standard)
const converter = Converter({ from: "cn", to: "tw" });

function getTranslator(): deepl.Translator | null {
  if (!DEEPL_API_KEY) {
    console.warn("DEEPL_API_KEY not set. Translation service disabled.");
    return null;
  }

  if (!translator) {
    translator = new deepl.Translator(DEEPL_API_KEY);
  }

  return translator;
}

/**
 * Translate text from Japanese to Chinese
 * with automatic caching and quota management
 *
 * @param text - Japanese text to translate
 * @param convertToTraditional - Whether to convert to Traditional Chinese (Taiwan). Default: true
 * @returns Translated text or original text if translation fails/quota exceeded
 */
export async function translateJaToZhTW(text: string, convertToTraditional: boolean = true): Promise<string> {
  if (!text || text.trim().length === 0) {
    return text;
  }

  const sourceLang = "ja";
  const targetLang = "zh";

  try {
    // Step 1: Check cache first
    const cached = await getCachedTranslation(text, sourceLang, targetLang);
    if (cached) {
      console.log("Translation cache hit");
      return cached;
    }

    // Step 2: Check if DeepL is configured
    const translatorInstance = getTranslator();
    if (!translatorInstance) {
      console.warn("DeepL not configured, returning original text");
      return text;
    }

    // Step 3: Check monthly quota
    const limitExceeded = await isLimitExceeded();
    if (limitExceeded) {
      console.warn(
        "DeepL monthly quota exceeded. Returning original Japanese text."
      );
      return text;
    }

    // Step 4: Check if we have enough quota for this text
    const textLength = text.length;
    const canTranslateText = await canTranslate(textLength);
    if (!canTranslateText) {
      console.warn(
        `Insufficient quota for text of length ${textLength}. Returning original text.`
      );
      return text;
    }

    // Step 5: Translate using DeepL API (to Simplified Chinese)
    console.log(`Translating ${textLength} characters from Japanese to Simplified Chinese...`);
    const result = await translatorInstance.translateText(text, sourceLang, "zh");

    // Step 5.5: Convert to Traditional Chinese if needed
    let translatedText = result.text;
    if (convertToTraditional) {
      translatedText = converter(translatedText);
      console.log("Converted Simplified Chinese to Traditional Chinese (Taiwan)");
    } else {
      console.log("Keeping Simplified Chinese output");
    }

    // Step 6: Update usage counter
    await incrementUsage(textLength);

    // Step 7: Cache the result
    await setCachedTranslation(text, translatedText, sourceLang, targetLang);

    console.log("Translation successful and cached");
    return translatedText;
  } catch (error) {
    console.error("Translation error:", error);

    // Graceful degradation: return original text on error
    if (error instanceof Error) {
      console.error("Error details:", error.message);
    }

    return text;
  }
}

/**
 * Translate text with custom language pair
 *
 * @param text - Text to translate
 * @param sourceLang - Source language code (ISO 639-1)
 * @param targetLang - Target language code (ISO 639-1 or with variant)
 * @returns Translated text or original text if translation fails
 */
export async function translateText(
  text: string,
  sourceLang: deepl.SourceLanguageCode,
  targetLang: deepl.TargetLanguageCode
): Promise<string> {
  if (!text || text.trim().length === 0) {
    return text;
  }

  try {
    // Check cache
    const cached = await getCachedTranslation(text, sourceLang, targetLang);
    if (cached) {
      return cached;
    }

    const translatorInstance = getTranslator();
    if (!translatorInstance) {
      return text;
    }

    // Check quota
    const limitExceeded = await isLimitExceeded();
    if (limitExceeded) {
      console.warn("DeepL quota exceeded");
      return text;
    }

    const textLength = text.length;
    const canTranslateText = await canTranslate(textLength);
    if (!canTranslateText) {
      return text;
    }

    // Translate
    const result = await translatorInstance.translateText(
      text,
      sourceLang,
      targetLang
    );

    const translatedText = result.text;

    // Update usage and cache
    await incrementUsage(textLength);
    await setCachedTranslation(text, translatedText, sourceLang, targetLang);

    return translatedText;
  } catch (error) {
    console.error("Translation error:", error);
    return text;
  }
}

/**
 * Batch translate multiple texts (more efficient for multiple items)
 *
 * @param texts - Array of texts to translate
 * @param sourceLang - Source language code
 * @param targetLang - Target language code
 * @returns Array of translated texts
 */
export async function batchTranslate(
  texts: string[],
  sourceLang: deepl.SourceLanguageCode,
  targetLang: deepl.TargetLanguageCode
): Promise<string[]> {
  if (texts.length === 0) return [];

  try {
    const translatorInstance = getTranslator();
    if (!translatorInstance) {
      return texts;
    }

    // Check quota for total length
    const totalLength = texts.reduce((sum, text) => sum + text.length, 0);
    const limitExceeded = await isLimitExceeded();
    const canTranslateAll = await canTranslate(totalLength);

    if (limitExceeded || !canTranslateAll) {
      console.warn("Quota insufficient for batch translation");
      return texts;
    }

    // Translate all at once
    const results = await translatorInstance.translateText(
      texts,
      sourceLang,
      targetLang
    );

    // Update usage
    await incrementUsage(totalLength);

    // Cache each result
    const translatedTexts = Array.isArray(results)
      ? results.map((r) => r.text)
      : [(results as deepl.TextResult).text];

    for (let i = 0; i < texts.length; i++) {
      await setCachedTranslation(
        texts[i],
        translatedTexts[i],
        sourceLang,
        targetLang
      );
    }

    return translatedTexts;
  } catch (error) {
    console.error("Batch translation error:", error);
    return texts;
  }
}
