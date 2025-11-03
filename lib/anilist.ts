const ANILIST_ENDPOINT = "https://graphql.anilist.co";

export async function anilist<T>(
  query: string,
  variables?: Record<string, unknown>,
  init?: RequestInit
) {
  const res = await fetch(ANILIST_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
    // Allow caller to pass Next.js caching controls
    ...(init ?? {}),
  });
  if (!res.ok) {
    const errorText = await res.text();
    let errorMessage = `AniList error ${res.status}`;
    try {
      const errorJson = JSON.parse(errorText) as {
        errors?: Array<{ message: string }>;
        message?: string;
      };
      if (errorJson.errors) {
        errorMessage += `: ${errorJson.errors
          .map((e) => e.message)
          .join(", ")}`;
      } else if (errorJson.message) {
        errorMessage += `: ${errorJson.message}`;
      }
    } catch {
      errorMessage += `: ${errorText}`;
    }
    throw new Error(errorMessage);
  }
  const json = (await res.json()) as {
    data?: T;
    errors?: Array<{ message: string }>;
  };
  if (json.errors) {
    throw new Error(
      `AniList GraphQL errors: ${json.errors.map((e) => e.message).join(", ")}`
    );
  }
  return json.data as T;
}

export const AIRING_QUERY = /* GraphQL */ `
  query Airing($page: Int!, $perPage: Int!) {
    Page(page: $page, perPage: $perPage) {
      pageInfo {
        currentPage
        hasNextPage
      }
      airingSchedules(sort: TIME, notYetAired: true) {
        id
        episode
        airingAt
        media {
          id
          title {
            romaji
            english
            native
          }
          synonyms
          coverImage {
            large
          }
          season
          seasonYear
        }
      }
    }
  }
`;

export const AIRING_BY_MEDIA_QUERY = /* GraphQL */ `
  query AiringByMedia($mediaId: Int!, $page: Int!, $perPage: Int!) {
    Page(page: $page, perPage: $perPage) {
      airingSchedules(mediaId: $mediaId, sort: TIME, notYetAired: true) {
        id
        episode
        airingAt
      }
    }
    Media(id: $mediaId) {
      id
      title {
        romaji
        english
        native
      }
      synonyms
    }
  }
`;

export const MEDIA_DETAIL_QUERY = /* GraphQL */ `
  query MediaDetail($mediaId: Int!) {
    Media(id: $mediaId) {
      id
      title {
        romaji
        english
        native
      }
      synonyms
      description
      coverImage {
        large
        extraLarge
      }
      bannerImage
      season
      seasonYear
      episodes
      status
      format
      genres
      studios {
        nodes {
          name
        }
      }
      averageScore
      popularity
      externalLinks {
        id
        site
        url
      }
    }
  }
`;

// Types for the Airing query response used across the app
export type AiringItem = {
  id: number;
  episode: number;
  airingAt: number;
  media: {
    id: number;
    title: {
      romaji: string | null;
      english: string | null;
      native: string | null;
    };
    synonyms: Array<string | null> | null;
    coverImage?: {
      large?: string | null;
    } | null;
    season: string | null;
    seasonYear: number | null;
  };
};

export type AiringResponse = {
  Page: {
    pageInfo: {
      currentPage: number;
      hasNextPage: boolean;
    };
    airingSchedules: AiringItem[];
  };
};

export type AiringByMediaResponse = {
  Page: {
    airingSchedules: Array<{
      id: number;
      episode: number;
      airingAt: number;
    }>;
  };
  Media: {
    id: number;
    title: {
      romaji: string | null;
      english: string | null;
      native: string | null;
    };
    synonyms: Array<string | null> | null;
  } | null;
};

export type MediaDetailResponse = {
  Media: {
    id: number;
    title: {
      romaji: string | null;
      english: string | null;
      native: string | null;
    };
    synonyms: Array<string | null> | null;
    description: string | null;
    coverImage: {
      large: string | null;
      extraLarge: string | null;
    } | null;
    bannerImage: string | null;
    season: string | null;
    seasonYear: number | null;
    episodes: number | null;
    status: string | null;
    format: string | null;
    genres: Array<string | null> | null;
    studios: {
      nodes: Array<{
        name: string;
      }>;
    } | null;
    averageScore: number | null;
    popularity: number | null;
    externalLinks: Array<{
      id: number;
      site: string;
      url: string;
    } | null> | null;
  } | null;
};
