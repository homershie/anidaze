const TMDB_ENDPOINT = "https://api.themoviedb.org/3";

// TMDB alternative titles response type
export type TMDBAlternativeTitle = {
  iso_3166_1: string;
  title: string;
  type: string;
};

export type TMDBAlternativeTitlesResponse = {
  id: number;
  titles: TMDBAlternativeTitle[];
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
 * Search for anime in TMDB by title
 * @param title - The title to search for
 * @param language - Language code (e.g., 'ja-JP', 'en-US')
 */
export async function searchTMDB(
  title: string,
  language: string = "en-US"
): Promise<TMDBSearchResponse> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    throw new Error("TMDB_API_KEY is not set");
  }

  const url = new URL(`${TMDB_ENDPOINT}/search/multi`);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("query", title);
  url.searchParams.set("language", language);

  const res = await fetch(url.toString(), {
    next: { revalidate: 60 * 60 * 24 }, // Cache for 24 hours
  });

  if (!res.ok) {
    throw new Error(`TMDB search error ${res.status}`);
  }

  return res.json();
}

/**
 * Get alternative titles for a TMDB entry
 * @param tmdbId - The TMDB entry ID
 * @param mediaType - The media type ('movie', 'tv', or 'multi')
 */
export async function getTMDBAlternativeTitles(
  tmdbId: number,
  mediaType: "movie" | "tv" | "multi" = "tv"
): Promise<TMDBAlternativeTitlesResponse> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    throw new Error("TMDB_API_KEY is not set");
  }

  // Use 'tv' for anime series
  const endpoint = mediaType === "tv" ? "tv" : "movie";
  const url = new URL(
    `${TMDB_ENDPOINT}/${endpoint}/${tmdbId}/alternative_titles`
  );
  url.searchParams.set("api_key", apiKey);

  const res = await fetch(url.toString(), {
    next: { revalidate: 60 * 60 * 24 }, // Cache for 24 hours
  });

  if (!res.ok) {
    throw new Error(`TMDB alternative titles error ${res.status}`);
  }

  return res.json();
}

/**
 * Find Chinese title from TMDB by searching with native (Japanese) or English title
 * @param nativeTitle - Japanese title
 * @param englishTitle - English title
 * @returns Chinese title if found, null otherwise
 */
export async function findChineseTitleFromTMDB(
  nativeTitle: string | null,
  englishTitle: string | null
): Promise<string | null> {
  if (!process.env.TMDB_API_KEY) {
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

    // Search TMDB
    const searchResults = await searchTMDB(searchTitle);

    // If no results, return null
    if (searchResults.results.length === 0) {
      return null;
    }

    // Get the first result (most relevant)
    const firstResult = searchResults.results[0];

    // Determine media type
    const mediaType = firstResult.media_type === "movie" ? "movie" : "tv";

    // Get alternative titles
    const altTitles = await getTMDBAlternativeTitles(firstResult.id, mediaType);

    // Look for Chinese titles
    const chineseTitles = altTitles.titles.filter(
      (title) =>
        title.iso_3166_1 === "CN" || // Mainland China (Simplified)
        title.iso_3166_1 === "HK" || // Hong Kong (Traditional)
        title.iso_3166_1 === "TW" // Taiwan (Traditional)
    );

    // Return the first Chinese title found
    if (chineseTitles.length > 0) {
      return chineseTitles[0].title;
    }

    return null;
  } catch (error) {
    console.error("Error fetching Chinese title from TMDB:", error);
    return null;
  }
}
