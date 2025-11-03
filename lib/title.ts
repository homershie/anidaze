import { findChineseTitleFromTMDB } from "./tmdb";

export type TitleInfo = {
  romaji: string | null;
  english: string | null;
  native: string | null;
  synonyms: Array<string | null> | null;
};

/**
 * Get the best available title based on priority:
 * 1. Chinese from TMDB (if TMDB_API_KEY is available)
 * 2. synonyms (from AniList)
 * 3. native (Japanese)
 * 4. romaji
 * 5. english
 */
export async function getBestTitle(titleInfo: TitleInfo): Promise<string> {
  // Priority 1: Try to get Chinese from TMDB
  const chineseTitle = await findChineseTitleFromTMDB(
    titleInfo.native,
    titleInfo.english
  );
  if (chineseTitle) {
    return chineseTitle;
  }

  // Priority 2: Check synonyms for Chinese titles
  if (titleInfo.synonyms) {
    const chineseSynonym = titleInfo.synonyms.find((s) => s && isChinese(s));
    if (chineseSynonym) {
      return chineseSynonym;
    }
  }

  // Priority 3: native (Japanese)
  if (titleInfo.native) {
    return titleInfo.native;
  }

  // Priority 4: romaji
  if (titleInfo.romaji) {
    return titleInfo.romaji;
  }

  // Priority 5: english
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

  // Priority 1: Check synonyms for Chinese titles
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
 * Get Chinese title from TMDB if available
 * This is meant to be called separately (e.g., with React Query on client side)
 */
export async function getChineseTitleFromTMDB(
  native: string | null,
  english: string | null
): Promise<string | null> {
  try {
    return await findChineseTitleFromTMDB(native, english);
  } catch (error) {
    console.error("Error fetching Chinese title from TMDB:", error);
    return null;
  }
}

