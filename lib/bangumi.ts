// Bangumi API endpoint
const BANGUMI_ENDPOINT = "https://api.bgm.tv/v0";
const BANGUMI_ACCESS_TOKEN = process.env.BANGUMI_ACCESS_TOKEN;

/**
 * Bangumi API 說明：
 * - API 文檔: https://bangumi.github.io/api/
 * - 快取政策: 建議 300 秒（5 分鐘）
 * - 認證: 可選的 Bearer Token（查看私有收藏需要）
 */

// Bangumi Subject Types
export type BangumiSubjectType = 1 | 2 | 3 | 4 | 6;

export type BangumiSubjectCollection = {
  on_hold: number;
  dropped: number;
  wish: number;
  collect: number;
  doing: number;
};

export type BangumiSubjectImage = {
  large: string;
  common: string;
  medium: string;
  small: string;
  grid: string;
};

export type BangumiSubjectRating = {
  rank: number;
  total: number;
  count: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
    6: number;
    7: number;
    8: number;
    9: number;
    10: number;
  };
  score: number;
};

export type BangumiSubjectTag = {
  name: string;
  count: number;
};

export type BangumiSubject = {
  id: number;
  type: BangumiSubjectType;
  name: string;
  name_cn: string;
  summary: string;
  nsfw: boolean;
  locked: boolean;
  date: string | null;
  platform: string;
  images: BangumiSubjectImage;
  infobox: Array<{
    key: string;
    value: string | Array<{ v: string }>;
  }> | null;
  volumes: number;
  eps: number;
  total_episodes: number;
  rating: BangumiSubjectRating;
  collection: BangumiSubjectCollection;
  tags: Array<BangumiSubjectTag>;
};

export type BangumiSubjectResponse = BangumiSubject;

export type BangumiSearchResult = {
  id: number;
  type: BangumiSubjectType;
  name: string;
  name_cn: string;
  summary: string;
  nsfw: boolean;
  locked: boolean;
  date: string | null;
  platform: string;
  images: BangumiSubjectImage;
  infobox: Array<{
    key: string;
    value: string | Array<{ v: string }>;
  }> | null;
  volumes: number;
  eps: number;
  total_episodes: number;
  rating: BangumiSubjectRating;
  collection: BangumiSubjectCollection;
  tags: Array<BangumiSubjectTag>;
  score: number;
};

export type BangumiSearchResponse = {
  total: number;
  limit: number;
  offset: number;
  data: Array<BangumiSearchResult>;
};

/**
 * Get Bangumi API headers
 */
function getBangumiHeaders(): HeadersInit {
  const headers: HeadersInit = {
    "User-Agent": "AniDaze/1.0 (https://github.com/yourusername/anidaze)",
    "Content-Type": "application/json",
  };

  if (BANGUMI_ACCESS_TOKEN) {
    headers.Authorization = `Bearer ${BANGUMI_ACCESS_TOKEN}`;
  }

  return headers;
}

/**
 * Get subject (anime/manga) by Bangumi ID
 * @param subjectId - Bangumi subject ID
 */
export async function getBangumiSubjectById(
  subjectId: number
): Promise<BangumiSubjectResponse> {
  const url = `${BANGUMI_ENDPOINT}/subjects/${subjectId}`;

  const res = await fetch(url, {
    // Bangumi API 建議緩存 300 秒（5 分鐘）
    next: { revalidate: 300 },
    headers: getBangumiHeaders(),
  });

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(`Bangumi subject ${subjectId} not found`);
    }
    throw new Error(`Bangumi API error ${res.status}`);
  }

  return res.json();
}

/**
 * Search subjects by keyword
 * @param query - Search query
 * @param type - Subject type (2 = anime)
 * @param limit - Number of results (default: 10, max: 25)
 * @param offset - Offset for pagination (default: 0)
 */
export async function searchBangumiSubjects(
  query: string,
  type: BangumiSubjectType = 2, // 2 = anime
  limit: number = 10,
  offset: number = 0
): Promise<BangumiSearchResponse> {
  const url = new URL(`${BANGUMI_ENDPOINT}/search/subjects`);
  url.searchParams.set("limit", Math.min(limit, 25).toString());
  url.searchParams.set("offset", offset.toString());

  const res = await fetch(url.toString(), {
    method: "POST",
    next: { revalidate: 60 * 60 * 6 }, // Cache for 6 hours
    headers: getBangumiHeaders(),
    body: JSON.stringify({
      keyword: query,
      filter: {
        type: [type],
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`Bangumi search error ${res.status}`);
  }

  return res.json();
}

/**
 * Extract Bangumi ID from AniList external links
 * @param externalLinks - Array of external links from AniList
 * @returns Bangumi ID if found, null otherwise
 */
export function extractBangumiIdFromAniList(
  externalLinks: Array<{
    id: number;
    site: string;
    url: string;
  } | null> | null
): number | null {
  if (!externalLinks) return null;

  const bangumiLink = externalLinks.find(
    (link) =>
      link &&
      (link.site.toLowerCase() === "bangumi" ||
        link.site.toLowerCase().includes("bangumi"))
  );

  if (!bangumiLink || !bangumiLink.url) return null;

  // Extract ID from URL like https://bgm.tv/subject/12345 or https://bangumi.tv/subject/12345
  const match = bangumiLink.url.match(/\/subject\/(\d+)/);
  if (match && match[1]) {
    return parseInt(match[1], 10);
  }

  return null;
}

/**
 * Get subject summary and metadata from Bangumi
 * This function attempts to find the subject by ID or searching with title
 *
 * @param bangumiId - Optional Bangumi subject ID (preferred if available)
 * @param title - Title to search for if bangumiId is not available
 * @param locale - Optional locale to determine if translation is needed
 */
export async function getBangumiMetadata(
  bangumiId?: number | null,
  title?: string | null,
  locale?: string
): Promise<{
  summary: string | null;
  summary_zh: string | null;
  name_cn: string | null;
  rating: BangumiSubjectRating | null;
  tags: Array<BangumiSubjectTag> | null;
  collection: BangumiSubjectCollection | null;
} | null> {
  try {
    let subjectData: BangumiSubject;

    // If Bangumi ID is available, use it directly (more accurate)
    if (bangumiId) {
      subjectData = await getBangumiSubjectById(bangumiId);
    } else if (title) {
      // Otherwise, search by title
      const searchResults = await searchBangumiSubjects(title, 2, 1);
      if (searchResults.data.length === 0) {
        return null;
      }
      // Get full details of the first result
      const firstResult = searchResults.data[0];
      subjectData = await getBangumiSubjectById(firstResult.id);
    } else {
      return null;
    }

    // Get Japanese summary
    const summary = subjectData.summary || null;

    // Translate to Chinese if locale is zh-TW and summary exists
    let summary_zh: string | null = null;
    if (summary && locale === "zh-TW") {
      // Dynamic import to avoid circular dependencies and reduce bundle size
      const { translateJaToZhTW } = await import("./translate");
      summary_zh = await translateJaToZhTW(summary);
    }

    return {
      summary,
      summary_zh,
      name_cn: subjectData.name_cn || null,
      rating: subjectData.rating || null,
      tags: subjectData.tags || null,
      collection: subjectData.collection || null,
    };
  } catch (error) {
    console.error("Error fetching Bangumi metadata:", error);
    return null;
  }
}
