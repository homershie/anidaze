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
      episodes
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

export const SEASONAL_MEDIA_QUERY = /* GraphQL */ `
  query SeasonalMedia(
    $page: Int!
    $perPage: Int!
    $season: MediaSeason!
    $seasonYear: Int!
    $status: [MediaStatus!]
  ) {
    Page(page: $page, perPage: $perPage) {
      pageInfo {
        currentPage
        hasNextPage
        total
      }
      media(
        season: $season
        seasonYear: $seasonYear
        status_in: $status
        type: ANIME
        sort: POPULARITY_DESC
      ) {
        id
        title {
          romaji
          english
          native
        }
        synonyms
        countryOfOrigin
        coverImage {
          large
        }
        season
        seasonYear
        status
        isAdult
        tags {
          id
          name
          isAdult
        }
        nextAiringEpisode {
          episode
          airingAt
        }
      }
    }
  }
`;

export const ONGOING_MEDIA_QUERY = /* GraphQL */ `
  query OngoingMedia($page: Int!, $perPage: Int!, $status: [MediaStatus!]) {
    Page(page: $page, perPage: $perPage) {
      pageInfo {
        currentPage
        hasNextPage
        total
      }
      media(status_in: $status, type: ANIME, sort: POPULARITY_DESC) {
        id
        title {
          romaji
          english
          native
        }
        synonyms
        countryOfOrigin
        coverImage {
          large
        }
        season
        seasonYear
        status
        isAdult
        tags {
          id
          name
          isAdult
        }
        nextAiringEpisode {
          episode
          airingAt
        }
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
    episodes: number | null;
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

export type SeasonalMediaItem = {
  id: number;
  title: {
    romaji: string | null;
    english: string | null;
    native: string | null;
  };
  synonyms: Array<string | null> | null;
  countryOfOrigin: string | null;
  coverImage?: {
    large?: string | null;
  } | null;
  season: string | null;
  seasonYear: number | null;
  status: string | null;
  isAdult?: boolean | null;
  tags?: Array<{
    id: number;
    name: string;
    isAdult: boolean | null;
  } | null> | null;
  nextAiringEpisode?: {
    episode: number;
    airingAt: number;
  } | null;
};

export type SeasonalMediaResponse = {
  Page: {
    pageInfo: {
      currentPage: number;
      hasNextPage: boolean;
      total?: number | null;
    };
    media: SeasonalMediaItem[];
  };
};
