import { findChineseTitleFromTMDB } from "./tmdb";
import { findChineseTitleFromWikipedia } from "./wikipedia";

export type TitleInfo = {
  romaji: string | null;
  english: string | null;
  native: string | null;
  synonyms: Array<string | null> | null;
};

/**
 * Get the best available title based on priority:
 * 1. Traditional Chinese from TMDB (if TMDB_API_KEY is available)
 * 2. Traditional Chinese from Wikipedia (if TMDB fails)
 * 3. synonyms (from AniList)
 * 4. native (Japanese)
 * 5. romaji
 * 6. english
 */
export async function getBestTitle(titleInfo: TitleInfo): Promise<string> {
  // Priority 1: Try to get Traditional Chinese from TMDB
  const chineseTitle = await findChineseTitleFromTMDB(
    titleInfo.native,
    titleInfo.english
  );
  if (chineseTitle) {
    return chineseTitle;
  }

  // Priority 2: Try to get Traditional Chinese from Wikipedia as fallback
  // Try multiple title sources to improve accuracy for ambiguous titles
  const titleCandidates = [
    titleInfo.romaji,    // Most anime-specific, less ambiguous
    titleInfo.native,    // Japanese title, very specific
    titleInfo.english,   // English title, might be ambiguous
  ].filter((t) => t !== null) as string[];

  for (const candidate of titleCandidates) {
    if (candidate) {
      const wikipediaTitle = await findChineseTitleFromWikipedia(candidate);
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

  // Priority 4: native (Japanese)
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

