// Jikan API endpoint
const JIKAN_ENDPOINT = process.env.JIKAN_ENDPOINT || "https://api.jikan.moe/v4";

/**
 * Jikan API 速率限制：
 * - 公開 API: 每分鐘 3 個請求，每秒 1 個請求
 * - 建議使用 Docker 部署自有實例以獲得更高頻率
 * 
 * 串接方式建議：
 * 1. REST API（當前實作）: 最簡單直接，適合開發和低頻率使用
 * 2. Docker 部署: 適合高頻率請求或需要自定義功能的場景
 * 3. 官方建議使用官方 API 進行開發，生產環境可考慮自建實例
 */

// Jikan Anime Data Types
export type JikanAnimeImage = {
  image_url?: string | null;
  small_image_url?: string | null;
  large_image_url?: string | null;
};

export type JikanAnimeTitle = {
  type: string;
  title: string;
};

export type JikanAnimeScore = {
  score: number | null;
  votes: number | null;
  percentage: number | null;
};

export type JikanAnimeStatistics = {
  watching: number | null;
  completed: number | null;
  on_hold: number | null;
  dropped: number | null;
  plan_to_watch: number | null;
  total: number | null;
  scores: Array<JikanAnimeScore> | null;
};

export type JikanAnimeExternalLink = {
  name: string;
  url: string;
};

export type JikanAnime = {
  mal_id: number;
  url: string;
  images: {
    jpg?: JikanAnimeImage | null;
    webp?: JikanAnimeImage | null;
  };
  trailer?: {
    youtube_id?: string | null;
    url?: string | null;
    embed_url?: string | null;
  } | null;
  approved: boolean;
  titles: Array<JikanAnimeTitle>;
  title: string;
  title_english: string | null;
  title_japanese: string | null;
  title_synonyms: Array<string>;
  type: string | null;
  source: string | null;
  episodes: number | null;
  status: string | null;
  airing: boolean;
  aired: {
    from: string | null;
    to: string | null;
    prop: {
      from: {
        day: number | null;
        month: number | null;
        year: number | null;
      };
      to: {
        day: number | null;
        month: number | null;
        year: number | null;
      };
    };
    string: string | null;
  };
  duration: string | null;
  rating: string | null;
  score: number | null;
  scored_by: number | null;
  rank: number | null;
  popularity: number | null;
  members: number | null;
  favorites: number | null;
  synopsis: string | null;
  background: string | null;
  season: string | null;
  year: number | null;
  broadcast: {
    day: string | null;
    time: string | null;
    timezone: string | null;
    string: string | null;
  };
  producers: Array<{
    mal_id: number;
    type: string;
    name: string;
    url: string;
  }>;
  licensors: Array<{
    mal_id: number;
    type: string;
    name: string;
    url: string;
  }>;
  studios: Array<{
    mal_id: number;
    type: string;
    name: string;
    url: string;
  }>;
  genres: Array<{
    mal_id: number;
    type: string;
    name: string;
    url: string;
  }>;
  explicit_genres: Array<{
    mal_id: number;
    type: string;
    name: string;
    url: string;
  }>;
  themes: Array<{
    mal_id: number;
    type: string;
    name: string;
    url: string;
  }>;
  demographics: Array<{
    mal_id: number;
    type: string;
    name: string;
    url: string;
  }>;
  relations?: Array<{
    relation: string;
    entry: Array<{
      mal_id: number;
      type: string;
      name: string;
      url: string;
    }>;
  }> | null;
  theme?: {
    openings: Array<string>;
    endings: Array<string>;
  } | null;
  external?: Array<JikanAnimeExternalLink> | null;
  streaming?: Array<JikanAnimeExternalLink> | null;
  statistics?: JikanAnimeStatistics | null;
};

export type JikanAnimeResponse = {
  data: JikanAnime;
};

export type JikanAnimeSearchResult = {
  mal_id: number;
  url: string;
  images: {
    jpg?: JikanAnimeImage | null;
    webp?: JikanAnimeImage | null;
  };
  trailer?: {
    youtube_id?: string | null;
    url?: string | null;
    embed_url?: string | null;
  } | null;
  approved: boolean;
  titles: Array<JikanAnimeTitle>;
  title: string;
  title_english: string | null;
  title_japanese: string | null;
  title_synonyms: Array<string>;
  type: string | null;
  source: string | null;
  episodes: number | null;
  status: string | null;
  airing: boolean;
  aired: {
    from: string | null;
    to: string | null;
    prop: {
      from: {
        day: number | null;
        month: number | null;
        year: number | null;
      };
      to: {
        day: number | null;
        month: number | null;
        year: number | null;
      };
    };
    string: string | null;
  };
  duration: string | null;
  rating: string | null;
  score: number | null;
  scored_by: number | null;
  rank: number | null;
  popularity: number | null;
  members: number | null;
  favorites: number | null;
  synopsis: string | null;
  background: string | null;
  season: string | null;
  year: number | null;
  broadcast: {
    day: string | null;
    time: string | null;
    timezone: string | null;
    string: string | null;
  };
  producers: Array<{
    mal_id: number;
    type: string;
    name: string;
    url: string;
  }>;
  licensors: Array<{
    mal_id: number;
    type: string;
    name: string;
    url: string;
  }>;
  studios: Array<{
    mal_id: number;
    type: string;
    name: string;
    url: string;
  }>;
  genres: Array<{
    mal_id: number;
    type: string;
    name: string;
    url: string;
  }>;
  explicit_genres: Array<{
    mal_id: number;
    type: string;
    name: string;
    url: string;
  }>;
  themes: Array<{
    mal_id: number;
    type: string;
    name: string;
    url: string;
  }>;
  demographics: Array<{
    mal_id: number;
    type: string;
    name: string;
    url: string;
  }>;
};

export type JikanAnimeSearchResponse = {
  data: Array<JikanAnimeSearchResult>;
  pagination: {
    last_visible_page: number;
    has_next_page: boolean;
    current_page: number;
    items: {
      count: number;
      total: number;
      per_page: number;
    };
  };
};

/**
 * Get Jikan API base URL
 * Supports custom endpoint (e.g., self-hosted Docker instance)
 */
function getJikanEndpoint(): string {
  return JIKAN_ENDPOINT;
}

/**
 * Get anime by MyAnimeList ID
 * @param malId - MyAnimeList anime ID
 */
export async function getJikanAnimeById(
  malId: number
): Promise<JikanAnimeResponse> {
  const url = `${getJikanEndpoint()}/anime/${malId}/full`;
  
  const res = await fetch(url, {
    // Jikan API 建議緩存 24 小時
    next: { revalidate: 60 * 60 * 24 },
    headers: {
      "User-Agent": "AniDaze/1.0",
    },
  });

  if (!res.ok) {
    if (res.status === 429) {
      throw new Error("Jikan API rate limit exceeded. Consider using Docker deployment for higher rate limits.");
    }
    throw new Error(`Jikan API error ${res.status}`);
  }

  return res.json();
}

/**
 * Get anime by MyAnimeList ID (basic info only, faster)
 * @param malId - MyAnimeList anime ID
 */
export async function getJikanAnimeBasic(
  malId: number
): Promise<JikanAnimeResponse> {
  const url = `${getJikanEndpoint()}/anime/${malId}`;
  
  const res = await fetch(url, {
    next: { revalidate: 60 * 60 * 24 },
    headers: {
      "User-Agent": "AniDaze/1.0",
    },
  });

  if (!res.ok) {
    if (res.status === 429) {
      throw new Error("Jikan API rate limit exceeded. Consider using Docker deployment for higher rate limits.");
    }
    throw new Error(`Jikan API error ${res.status}`);
  }

  return res.json();
}

/**
 * Search anime by title
 * @param query - Search query
 * @param limit - Number of results (default: 10, max: 25)
 */
export async function searchJikanAnime(
  query: string,
  limit: number = 10
): Promise<JikanAnimeSearchResponse> {
  const url = new URL(`${getJikanEndpoint()}/anime`);
  url.searchParams.set("q", query);
  url.searchParams.set("limit", Math.min(limit, 25).toString());
  url.searchParams.set("order_by", "score");
  url.searchParams.set("sort", "desc");
  
  const res = await fetch(url.toString(), {
    next: { revalidate: 60 * 60 * 6 }, // Cache for 6 hours
    headers: {
      "User-Agent": "AniDaze/1.0",
    },
  });

  if (!res.ok) {
    if (res.status === 429) {
      throw new Error("Jikan API rate limit exceeded. Consider using Docker deployment for higher rate limits.");
    }
    throw new Error(`Jikan API search error ${res.status}`);
  }

  return res.json();
}

/**
 * Extract MAL ID from AniList external links
 * @param externalLinks - Array of external links from AniList
 * @returns MAL ID if found, null otherwise
 */
export function extractMALIdFromAniList(
  externalLinks: Array<{
    id: number;
    site: string;
    url: string;
  } | null> | null
): number | null {
  if (!externalLinks) return null;

  const malLink = externalLinks.find(
    (link) => link && link.site.toLowerCase() === "myanimelist"
  );

  if (!malLink || !malLink.url) return null;

  // Extract ID from URL like https://myanimelist.net/anime/12345
  const match = malLink.url.match(/myanimelist\.net\/anime\/(\d+)/);
  if (match && match[1]) {
    return parseInt(match[1], 10);
  }

  return null;
}

/**
 * Get anime metadata and score from Jikan
 * This function attempts to find anime by searching with title,
 * or can use MAL ID if available
 * 
 * @param malId - Optional MyAnimeList ID (preferred if available)
 * @param title - Title to search for if malId is not available
 */
export async function getJikanMetadata(
  malId?: number | null,
  title?: string | null
): Promise<{
  score: number | null;
  scored_by: number | null;
  rank: number | null;
  popularity: number | null;
  synopsis: string | null;
  genres: Array<{ name: string }> | null;
  studios: Array<{ name: string }> | null;
  statistics: JikanAnimeStatistics | null;
} | null> {
  try {
    let animeData: JikanAnime;

    // If MAL ID is available, use it directly (more accurate)
    if (malId) {
      const response = await getJikanAnimeBasic(malId);
      animeData = response.data;
    } else if (title) {
      // Otherwise, search by title
      const searchResults = await searchJikanAnime(title, 1);
      if (searchResults.data.length === 0) {
        return null;
      }
      // Get full details of the first result
      const firstResult = searchResults.data[0];
      const response = await getJikanAnimeBasic(firstResult.mal_id);
      animeData = response.data;
    } else {
      return null;
    }

    return {
      score: animeData.score,
      scored_by: animeData.scored_by,
      rank: animeData.rank,
      popularity: animeData.popularity,
      synopsis: animeData.synopsis,
      genres: animeData.genres.map((g) => ({ name: g.name })),
      studios: animeData.studios.map((s) => ({ name: s.name })),
      statistics: animeData.statistics || null,
    };
  } catch (error) {
    console.error("Error fetching Jikan metadata:", error);
    return null;
  }
}

