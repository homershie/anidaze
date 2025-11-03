const ANILIST_ENDPOINT = "https://graphql.anilist.co";

export async function anilist<T>(
  query: string,
  variables?: Record<string, unknown>,
  init?: RequestInit
) {
  "use cache";
  const res = await fetch(ANILIST_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
    // Allow caller to pass Next.js caching controls
    ...(init ?? {}),
  });
  if (!res.ok) {
    throw new Error(`AniList error ${res.status}`);
  }
  const json = await res.json();
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
