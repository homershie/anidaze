import { findLocalizedTitleFromTMDB, findChineseTitleFromTMDB } from "./tmdb";
import { findLocalizedTitleFromWikipedia } from "./wikipedia";
import type { AppLocale } from "@/i18n/routing";

export type TitleInfo = {
  romaji: string | null;
  english: string | null;
  native: string | null;
  synonyms: Array<string | null> | null;
};

/**
 * Get the best available title based on locale and priority
 * @param titleInfo - Title information from AniList
 * @param locale - Target locale ('zh-TW', 'ja', 'en')
 * @returns Best available title for the specified locale
 */
export async function getBestTitle(
  titleInfo: TitleInfo,
  locale: AppLocale = "zh-TW"
): Promise<string> {
  // For Japanese locale: directly use native (Japanese) title from AniList
  if (locale === "ja") {
    if (titleInfo.native) {
      return titleInfo.native;
    }
    // Fallback to romaji if native is not available
    if (titleInfo.romaji) {
      return titleInfo.romaji;
    }
    // Fallback to english
    if (titleInfo.english) {
      return titleInfo.english;
    }
    return "Unknown";
  }

  // For English locale: directly use english title from AniList
  if (locale === "en") {
    if (titleInfo.english) {
      return titleInfo.english;
    }
    // Fallback to romaji
    if (titleInfo.romaji) {
      return titleInfo.romaji;
    }
    // Fallback to native
    if (titleInfo.native) {
      return titleInfo.native;
    }
    return "Unknown";
  }

  // For Chinese (zh-TW or zh-CN): need to fetch from TMDB/Wikipedia
  // Priority 1: Try to get Chinese title from TMDB
  const chineseTitle = await findLocalizedTitleFromTMDB(
    titleInfo.native,
    titleInfo.english,
    locale as "zh-TW" | "zh-CN"
  );
  if (chineseTitle) {
    return chineseTitle;
  }

  // Priority 2: Try to get Chinese title from Wikipedia as fallback
  // Try multiple title sources to improve accuracy for ambiguous titles
  const titleCandidates = [
    titleInfo.romaji,    // Most anime-specific, less ambiguous
    titleInfo.native,    // Japanese title, very specific
    titleInfo.english,   // English title, might be ambiguous
  ].filter((t) => t !== null) as string[];

  for (const candidate of titleCandidates) {
    if (candidate) {
      const wikipediaTitle = await findLocalizedTitleFromWikipedia(candidate, locale as "zh-TW" | "zh-CN");
      if (wikipediaTitle) {
        return wikipediaTitle;
      }
    }
  }

  // Priority 3: Check synonyms for Traditional Chinese titles
  if (titleInfo.synonyms) {
    const chineseSynonym = titleInfo.synonyms.find((s) => s && isChinese(s));
    if (chineseSynonym) {
      return chineseSynonym;
    }
  }

  // Priority 4: native (Japanese) as fallback
  if (titleInfo.native) {
    return titleInfo.native;
  }

  // Priority 5: romaji
  if (titleInfo.romaji) {
    return titleInfo.romaji;
  }

  // Priority 6: english
  if (titleInfo.english) {
    return titleInfo.english;
  }

  // Fallback
  return "Unknown";
}

/**
 * Get the best available title synchronously (without TMDB)
 * This is the default behavior for SSR
 */
export function getBestTitleSync(titleInfo: TitleInfo): string {
  let result = "";

  // Priority 1: Check synonyms for Traditional Chinese titles
  if (titleInfo.synonyms) {
    const chineseSynonym = titleInfo.synonyms.find((s) => s && isChinese(s));
    if (chineseSynonym) {
      result = chineseSynonym;
      return result;
    }
  }

  // Priority 2: native (Japanese)
  if (titleInfo.native) {
    result = titleInfo.native;
    return result;
  }

  // Priority 3: romaji
  if (titleInfo.romaji) {
    result = titleInfo.romaji;
    return result;
  }

  // Priority 4: english
  if (titleInfo.english) {
    result = titleInfo.english;
    return result;
  }

  // Fallback
  return "Unknown";
}

/**
 * Check if a string contains Chinese characters
 */
function isChinese(str: string): boolean {
  const chineseRegex = /[\u4e00-\u9fff]/;
  return chineseRegex.test(str);
}

/**
 * Get Traditional Chinese title from TMDB if available
 * This is meant to be called separately (e.g., with React Query on client side)
 */
export async function getChineseTitleFromTMDB(
  native: string | null,
  english: string | null
): Promise<string | null> {
  try {
    return await findChineseTitleFromTMDB(native, english);
  } catch (error) {
    console.error("Error fetching Traditional Chinese title from TMDB:", error);
    return null;
  }
}

