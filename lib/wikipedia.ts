const WIKIPEDIA_ENDPOINT = "https://en.wikipedia.org/w/api.php";
const WIKIDATA_ENDPOINT = "https://www.wikidata.org/w/api.php";

// Wikipedia langlinks response type
export type WikipediaLangLink = {
  lang: string;
  "*": string;
  url?: string;
};

export type WikipediaPage = {
  pageid: number;
  ns: number;
  title: string;
  langlinks?: WikipediaLangLink[];
};

export type WikipediaLangLinksResponse = {
  query: {
    pages: Record<string, WikipediaPage>;
  };
};

// Wikidata entities response type
export type WikidataLabel = {
  language: string;
  value: string;
};

export type WikidataEntity = {
  id: string;
  type: string;
  labels?: Record<string, WikidataLabel>;
  aliases?: Record<string, Array<{ language: string; value: string }>>;
};

export type WikidataEntitiesResponse = {
  entities: Record<string, WikidataEntity>;
};

/**
 * Search Wikipedia for an entry by title
 * @param title - The title to search for
 * @returns Search results with page IDs
 */
export async function searchWikipedia(
  title: string
): Promise<{ pageid: number; title: string }[]> {
  try {
    const url = new URL(WIKIPEDIA_ENDPOINT);
    url.searchParams.set("action", "query");
    url.searchParams.set("format", "json");
    url.searchParams.set("list", "search");
    url.searchParams.set("srsearch", title);
    url.searchParams.set("srlimit", "5");
    url.searchParams.set("origin", "*");

    const res = await fetch(url.toString(), {
      next: { revalidate: 60 * 60 * 24 * 7 }, // Cache for 7 days
    });

    if (!res.ok) {
      return [];
    }

    const data = (await res.json()) as {
      query?: { search?: Array<{ pageid: number; title: string }> };
    };

    return data.query?.search || [];
  } catch (error) {
    console.error("Error searching Wikipedia:", error);
    return [];
  }
}

/**
 * Get language links from a Wikipedia page
 * @param pageTitle - The Wikipedia page title
 * @param languageCode - The language code to filter (e.g., 'zh' for Chinese)
 * @returns Language link for the specified language, or null if not found
 */
export async function getWikipediaLangLink(
  pageTitle: string,
  languageCode: string = "zh"
): Promise<string | null> {
  try {
    const url = new URL(WIKIPEDIA_ENDPOINT);
    url.searchParams.set("action", "query");
    url.searchParams.set("format", "json");
    url.searchParams.set("prop", "langlinks");
    url.searchParams.set("lllang", languageCode);
    url.searchParams.set("titles", pageTitle);
    url.searchParams.set("origin", "*");

    const res = await fetch(url.toString(), {
      next: { revalidate: 60 * 60 * 24 * 7 }, // Cache for 7 days
    });

    if (!res.ok) {
      return null;
    }

    const data = (await res.json()) as WikipediaLangLinksResponse;

    if (data.query?.pages) {
      const pages = Object.values(data.query.pages);
      const page = pages[0];
      if (page?.langlinks && page.langlinks.length > 0) {
        // Find Chinese langlink
        const chineseLink = page.langlinks.find((link) => link.lang === languageCode);
        if (chineseLink) {
          const label = chineseLink["*"];
          // Validate the label is not a list page
          if (!shouldFilterWikipediaResult(label)) {
            return label;
          }
        }
      }
    }

    return null;
  } catch (error) {
    console.error("Error fetching Wikipedia langlink:", error);
    return null;
  }
}

/**
 * Get Wikidata entity ID from Wikipedia page
 * @param pageTitle - The Wikipedia page title
 * @returns Wikidata QID or null if not found
 */
export async function getWikidataId(pageTitle: string): Promise<string | null> {
  try {
    const url = new URL(WIKIPEDIA_ENDPOINT);
    url.searchParams.set("action", "query");
    url.searchParams.set("format", "json");
    url.searchParams.set("prop", "pageprops");
    url.searchParams.set("ppprop", "wikibase_item");
    url.searchParams.set("titles", pageTitle);
    url.searchParams.set("origin", "*");

    const res = await fetch(url.toString(), {
      next: { revalidate: 60 * 60 * 24 * 7 }, // Cache for 7 days
    });

    if (!res.ok) {
      return null;
    }

    const data = (await res.json()) as {
      query?: {
        pages?: Record<
          string,
          {
            pageid: number;
            ns: number;
            title: string;
            pageprops?: { wikibase_item?: string };
          }
        >;
      };
    };

    if (data.query?.pages) {
      const pages = Object.values(data.query.pages);
      const page = pages[0];
      return page?.pageprops?.wikibase_item || null;
    }

    return null;
  } catch (error) {
    console.error("Error fetching Wikidata ID:", error);
    return null;
  }
}

/**
 * Get localized label from Wikidata entity
 * @param entityId - The Wikidata entity ID (QID)
 * @param locale - Target locale ('zh-TW', 'ja', 'en')
 * @returns Localized label or null if not found
 */
export async function getWikidataLocalizedLabel(
  entityId: string,
  locale: "zh-TW" | "ja" | "en" = "zh-TW"
): Promise<string | null> {
  try {
    // Map locale to Wikipedia language codes
    const languageCodes = locale === "zh-TW" ? ["zh", "zh-Hant"] : locale === "ja" ? ["ja"] : ["en"];
    
    const url = new URL(WIKIDATA_ENDPOINT);
    url.searchParams.set("action", "wbgetentities");
    url.searchParams.set("format", "json");
    url.searchParams.set("ids", entityId);
    url.searchParams.set("props", "labels|aliases");
    url.searchParams.set("languages", languageCodes.join("|"));
    url.searchParams.set("origin", "*");

    const res = await fetch(url.toString(), {
      next: { revalidate: 60 * 60 * 24 * 7 }, // Cache for 7 days
    });

    if (!res.ok) {
      return null;
    }

    const data = (await res.json()) as WikidataEntitiesResponse;

    if (data.entities && data.entities[entityId]) {
      const entity = data.entities[entityId];

      // Try each language code in order
      for (const langCode of languageCodes) {
        // Try labels first
        if (entity.labels?.[langCode]) {
          const label = entity.labels[langCode].value;
          if (!shouldFilterWikipediaResult(label)) {
            return label;
          }
        }

        // Try aliases if no label found
        if (entity.aliases?.[langCode] && entity.aliases[langCode].length > 0) {
          const label = entity.aliases[langCode][0].value;
          if (!shouldFilterWikipediaResult(label)) {
            return label;
          }
        }
      }
    }

    return null;
  } catch (error) {
    console.error(`Error fetching Wikidata ${locale} label:`, error);
    return null;
  }
}

/**
 * Get Chinese label from Wikidata entity
 * @param entityId - The Wikidata entity ID (QID)
 * @returns Chinese label or null if not found
 * @deprecated Use getWikidataLocalizedLabel instead
 */
export async function getWikidataChineseLabel(
  entityId: string
): Promise<string | null> {
  return getWikidataLocalizedLabel(entityId, "zh-TW");
}

/**
 * Check if a Wikipedia title should be filtered out (e.g., list pages, disambiguation pages)
 */
function shouldFilterWikipediaResult(pageTitle: string): boolean {
  const lowerTitle = pageTitle.toLowerCase();
  
  // Filter out list pages
  const listPatterns = [
    "列表",
    "list",
    "catalog",
    "catalogue",
    "目錄",
    "category:",
    "分類:",
    "disambiguation",
    "disambig",
    "消歧義",
    "_(disambiguation)",
    "_(消歧義)"
  ];
  
  for (const pattern of listPatterns) {
    if (lowerTitle.includes(pattern)) {
      return true;
    }
  }
  
  // Filter out non-anime TV shows that might have similar names
  // Note: We use more specific patterns to avoid filtering out anime titles
  const nonAnimePatterns = [
    " (tv series)",
    " (tv show)",
    " (series)",
    " (電視劇)",
    " (電視劇集)",
    " season ",
  ];
  
  // Only filter if these patterns are in the title
  for (const pattern of nonAnimePatterns) {
    if (lowerTitle.includes(pattern) && !lowerTitle.includes("anime")) {
      // Check if it's likely a live-action TV series, not anime
      const liveActionKeywords = ["actor", "actress", "network", "broadcast", "episodes"];
      if (liveActionKeywords.some(keyword => lowerTitle.includes(keyword))) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Find localized title from Wikipedia/Wikidata
 * @param title - The title to search for (Japanese or English)
 * @param locale - Target locale ('zh-TW', 'ja', 'en')
 * @returns Localized title if found, null otherwise
 */
export async function findLocalizedTitleFromWikipedia(
  title: string,
  locale: "zh-TW" | "ja" | "en" = "zh-TW"
): Promise<string | null> {
  if (!title) {
    return null;
  }

  // For Japanese and English, Wikipedia is not needed as AniList already provides them
  // Only Traditional Chinese needs Wikipedia lookup
  if (locale !== "zh-TW") {
    return null;
  }

  try {
    // First, search Wikipedia for the entry
    const searchResults = await searchWikipedia(title);

    if (searchResults.length === 0) {
      return null;
    }

    // Filter out inappropriate results (list pages, disambiguation pages, etc.)
    const filteredResults = searchResults.filter(
      (result) => !shouldFilterWikipediaResult(result.title)
    );

    // If no valid results after filtering, return null
    if (filteredResults.length === 0) {
      return null;
    }

    // Try the first valid result
    const firstResult = filteredResults[0];

    // Method 1: Try to get langlinks directly
    const langLink = await getWikipediaLangLink(firstResult.title, "zh");
    if (langLink) {
      return langLink;
    }

    // Method 2: Try via Wikidata
    const wikidataId = await getWikidataId(firstResult.title);
    if (wikidataId) {
      const chineseLabel = await getWikidataLocalizedLabel(wikidataId, "zh-TW");
      if (chineseLabel) {
        return chineseLabel;
      }
    }

    return null;
  } catch (error) {
    console.error("Error fetching Chinese title from Wikipedia:", error);
    return null;
  }
}

/**
 * Find Traditional Chinese title from Wikipedia/Wikidata
 * This function searches Wikipedia with the given title and attempts to find
 * a Chinese translation through langlinks or Wikidata
 * @param title - The title to search for (Japanese or English)
 * @returns Traditional Chinese title if found, null otherwise
 * @deprecated Use findLocalizedTitleFromWikipedia instead
 */
export async function findChineseTitleFromWikipedia(
  title: string
): Promise<string | null> {
  return findLocalizedTitleFromWikipedia(title, "zh-TW");
}

