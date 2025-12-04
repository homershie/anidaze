const TMDB_ENDPOINT = "https://api.themoviedb.org/3";

// TMDB alternative titles response type
export type TMDBAlternativeTitle = {
  iso_3166_1: string;
  title: string;
  type: string;
};

export type TMDBAlternativeTitlesResponse = {
  id: number;
  titles?: TMDBAlternativeTitle[]; // Movie format
  results?: TMDBAlternativeTitle[]; // TV format
};

// TMDB translations response type
export type TMDBTranslation = {
  iso_3166_1: string;
  iso_639_1: string;
  name: string;
  english_name: string;
  data: {
    name?: string;
    title?: string;
    overview?: string;
    homepage?: string;
    tagline?: string;
  };
};

export type TMDBTranslationsResponse = {
  id: number;
  translations: TMDBTranslation[];
};

// TMDB search result types
export type TMDBResult = {
  id: number;
  title?: string;
  name?: string;
  media_type: string;
};

export type TMDBSearchResponse = {
  results: TMDBResult[];
  total_results: number;
  total_pages: number;
};

/**
 * Get TMDB authentication headers
 * Supports both Bearer Token (preferred) and API Key methods
 */
function getTMDBAuthHeaders(): HeadersInit {
  const accessToken = process.env.TMDB_ACCESS_TOKEN;
  const apiKey = process.env.TMDB_API_KEY;

  // Prefer Bearer token if available
  if (accessToken) {
    return {
      Authorization: `Bearer ${accessToken}`,
    };
  }

  // Fallback to API key method
  if (apiKey) {
    return {};
  }

  throw new Error("Either TMDB_ACCESS_TOKEN or TMDB_API_KEY must be set");
}

/**
 * Get TMDB authentication query parameters
 * Only used if Bearer token is not available
 */
function getTMDBAuthParams(): Record<string, string> | null {
  const accessToken = process.env.TMDB_ACCESS_TOKEN;
  const apiKey = process.env.TMDB_API_KEY;

  // Bearer token doesn't need query params
  if (accessToken) {
    return null;
  }

  // Use API key as query parameter
  if (apiKey) {
    return { api_key: apiKey };
  }

  return null;
}

/**
 * Search for anime in TMDB by title
 * @param title - The title to search for
 * @param language - Language code (e.g., 'ja-JP', 'en-US')
 */
export async function searchTMDB(
  title: string,
  language: string = "en-US"
): Promise<TMDBSearchResponse> {
  const url = new URL(`${TMDB_ENDPOINT}/search/multi`);

  // Add authentication query params if using API key
  const authParams = getTMDBAuthParams();
  if (authParams) {
    url.searchParams.set("api_key", authParams.api_key);
  }

  url.searchParams.set("query", title);
  url.searchParams.set("language", language);

  const headers = getTMDBAuthHeaders();
  const res = await fetch(url.toString(), {
    headers,
    next: { revalidate: 60 * 60 * 24 }, // Cache for 24 hours
  });

  if (!res.ok) {
    let errorMessage = `TMDB search error ${res.status}`;
    try {
      const errorText = await res.text();
      if (errorText) {
        errorMessage += `: ${errorText}`;
      }
    } catch {
      // Ignore error reading response body
    }
    if (res.status === 429) {
      console.warn(errorMessage);
      return {
        results: [],
        total_results: 0,
        total_pages: 0,
      };
    }
    throw new Error(errorMessage);
  }

  return res.json();
}

/**
 * Get alternative titles for a TMDB entry
 * @param tmdbId - The TMDB entry ID
 * @param mediaType - The media type ('movie', 'tv', or 'multi')
 * @returns Alternative titles response, or null if resource not found (404)
 */
export async function getTMDBAlternativeTitles(
  tmdbId: number,
  mediaType: "movie" | "tv" | "multi" = "tv"
): Promise<TMDBAlternativeTitlesResponse | null> {
  // Use 'tv' for anime series
  const endpoint = mediaType === "tv" ? "tv" : "movie";
  const url = new URL(
    `${TMDB_ENDPOINT}/${endpoint}/${tmdbId}/alternative_titles`
  );

  // Add authentication query params if using API key
  const authParams = getTMDBAuthParams();
  if (authParams) {
    url.searchParams.set("api_key", authParams.api_key);
  }

  const headers = getTMDBAuthHeaders();
  const res = await fetch(url.toString(), {
    headers,
    next: { revalidate: 60 * 60 * 24 }, // Cache for 24 hours
  });

  if (!res.ok) {
    // 404 is expected if resource doesn't exist in TMDB
    if (res.status === 404) {
      return null;
    }
    let errorMessage = `TMDB alternative titles error ${res.status}`;
    try {
      const errorText = await res.text();
      if (errorText) {
        errorMessage += `: ${errorText}`;
      }
    } catch {
      // Ignore error reading response body
    }
    if (res.status === 429) {
      console.warn(errorMessage);
      return null;
    }
    throw new Error(errorMessage);
  }

  return res.json();
}

/**
 * Get translations for a TMDB entry
 * @param tmdbId - The TMDB entry ID
 * @param mediaType - The media type ('movie', 'tv', or 'multi')
 * @returns Translations response, or null if resource not found (404)
 */
export async function getTMDBTranslations(
  tmdbId: number,
  mediaType: "movie" | "tv" | "multi" = "tv"
): Promise<TMDBTranslationsResponse | null> {
  // Use 'tv' for anime series
  const endpoint = mediaType === "tv" ? "tv" : "movie";
  const url = new URL(`${TMDB_ENDPOINT}/${endpoint}/${tmdbId}/translations`);

  // Add authentication query params if using API key
  const authParams = getTMDBAuthParams();
  if (authParams) {
    url.searchParams.set("api_key", authParams.api_key);
  }

  const headers = getTMDBAuthHeaders();
  const res = await fetch(url.toString(), {
    headers,
    next: { revalidate: 60 * 60 * 24 }, // Cache for 24 hours
  });

  if (!res.ok) {
    // 404 is expected if resource doesn't exist in TMDB
    if (res.status === 404) {
      return null;
    }
    let errorMessage = `TMDB translations error ${res.status}`;
    try {
      const errorText = await res.text();
      if (errorText) {
        errorMessage += `: ${errorText}`;
      }
    } catch {
      // Ignore error reading response body
    }
    if (res.status === 429) {
      console.warn(errorMessage);
      return null;
    }
    throw new Error(errorMessage);
  }

  return res.json();
}

/**
 * Find localized title from TMDB based on locale
 * @param nativeTitle - Japanese title
 * @param englishTitle - English title
 * @param locale - Target locale ('zh-TW', 'zh-CN', 'ja', 'en')
 * @returns Localized title if found, null otherwise
 */
export async function findLocalizedTitleFromTMDB(
  nativeTitle: string | null,
  englishTitle: string | null,
  locale: "zh-TW" | "zh-CN" | "ja" | "en" = "zh-TW"
): Promise<string | null> {
  // Check if either auth method is configured
  if (!process.env.TMDB_ACCESS_TOKEN && !process.env.TMDB_API_KEY) {
    return null;
  }

  try {
    let searchTitle: string | null = null;

    // Try searching with Japanese title first
    if (nativeTitle) {
      searchTitle = nativeTitle;
    } else if (englishTitle) {
      searchTitle = englishTitle;
    }

    if (!searchTitle) {
      return null;
    }

    // Search TMDB with locale-specific language code
    const tmdbLanguage =
      locale === "zh-TW" ? "zh-TW" : locale === "zh-CN" ? "zh-CN" : locale === "ja" ? "ja-JP" : "en-US";
    const searchResults = await searchTMDB(searchTitle, tmdbLanguage);

    // If no results, return null
    if (searchResults.results.length === 0) {
      return null;
    }

    // Get the first result (most relevant)
    const firstResult = searchResults.results[0];

    // For Japanese or English, try to get the title directly from search result
    if (locale === "ja" || locale === "en") {
      const title = firstResult.name || firstResult.title;
      if (title) {
        return title;
      }
    }

    // Determine media type
    const mediaType = firstResult.media_type === "movie" ? "movie" : "tv";

    // Try alternative titles first (for official alternative titles)
    const altTitles = await getTMDBAlternativeTitles(firstResult.id, mediaType);

    if (altTitles) {
      // TV uses "results", Movie uses "titles"
      const titles = altTitles.results || altTitles.titles;

      if (titles && Array.isArray(titles)) {
        if (locale === "zh-TW") {
          // Look for Traditional Chinese titles with priority: TW > HK
          const twTitle = titles.find((title) => title.iso_3166_1 === "TW");
          if (twTitle) return twTitle.title;

          const hkTitle = titles.find((title) => title.iso_3166_1 === "HK");
          if (hkTitle) return hkTitle.title;
        } else if (locale === "zh-CN") {
          // Look for Simplified Chinese titles with priority: CN
          const cnTitle = titles.find((title) => title.iso_3166_1 === "CN");
          if (cnTitle) return cnTitle.title;
        } else if (locale === "ja") {
          // Look for Japanese titles
          const jpTitle = titles.find((title) => title.iso_3166_1 === "JP");
          if (jpTitle) return jpTitle.title;
        } else if (locale === "en") {
          // Look for English titles with priority: US > GB
          const usTitle = titles.find((title) => title.iso_3166_1 === "US");
          if (usTitle) return usTitle.title;

          const gbTitle = titles.find((title) => title.iso_3166_1 === "GB");
          if (gbTitle) return gbTitle.title;
        }
      }
    }

    // Fallback to translations API (more comprehensive)
    const translations = await getTMDBTranslations(firstResult.id, mediaType);

    if (
      translations &&
      translations.translations &&
      Array.isArray(translations.translations)
    ) {
      if (locale === "zh-TW") {
        // Look for Traditional Chinese titles with priority: TW > HK
        const twTranslation = translations.translations.find(
          (t) => t.iso_3166_1 === "TW" && t.iso_639_1 === "zh"
        );
        if (twTranslation && twTranslation.data.name) {
          return twTranslation.data.name;
        }
        if (twTranslation && twTranslation.data.title) {
          return twTranslation.data.title;
        }

        const hkTranslation = translations.translations.find(
          (t) => t.iso_3166_1 === "HK" && t.iso_639_1 === "zh"
        );
        if (hkTranslation && hkTranslation.data.name) {
          return hkTranslation.data.name;
        }
        if (hkTranslation && hkTranslation.data.title) {
          return hkTranslation.data.title;
        }
      } else if (locale === "zh-CN") {
        // Look for Simplified Chinese titles with priority: CN
        const cnTranslation = translations.translations.find(
          (t) => t.iso_3166_1 === "CN" && t.iso_639_1 === "zh"
        );
        if (cnTranslation && cnTranslation.data.name) {
          return cnTranslation.data.name;
        }
        if (cnTranslation && cnTranslation.data.title) {
          return cnTranslation.data.title;
        }
      } else if (locale === "ja") {
        // Look for Japanese translations
        const jpTranslation = translations.translations.find(
          (t) => t.iso_3166_1 === "JP" && t.iso_639_1 === "ja"
        );
        if (jpTranslation && jpTranslation.data.name) {
          return jpTranslation.data.name;
        }
        if (jpTranslation && jpTranslation.data.title) {
          return jpTranslation.data.title;
        }
      } else if (locale === "en") {
        // Look for English translations with priority: US > GB
        const usTranslation = translations.translations.find(
          (t) =>
            (t.iso_3166_1 === "US" || t.iso_3166_1 === "GB") &&
            t.iso_639_1 === "en"
        );
        if (usTranslation && usTranslation.data.name) {
          return usTranslation.data.name;
        }
        if (usTranslation && usTranslation.data.title) {
          return usTranslation.data.title;
        }
      }
    }

    return null;
  } catch (error) {
    console.error(`Error fetching ${locale} title from TMDB:`, error);
    return null;
  }
}

/**
 * Find Traditional Chinese title from TMDB by searching with native (Japanese) or English title
 * @param nativeTitle - Japanese title
 * @param englishTitle - English title
 * @returns Traditional Chinese title if found, null otherwise
 * @deprecated Use findLocalizedTitleFromTMDB instead
 */
export async function findChineseTitleFromTMDB(
  nativeTitle: string | null,
  englishTitle: string | null
): Promise<string | null> {
  return findLocalizedTitleFromTMDB(nativeTitle, englishTitle, "zh-TW");
}
