import type { MetadataRoute } from "next";
import {
  anilist,
  SEASONAL_MEDIA_QUERY,
  ONGOING_MEDIA_QUERY,
  type SeasonalMediaResponse,
  type SeasonalMediaItem,
} from "@/lib/anilist";
import { getCurrentSeason } from "@/lib/time";

// 限制最多獲取的頁面數，避免 API 速率限制
const MAX_PAGES = 3;
const RETRY_ATTEMPTS = 2;
const RETRY_DELAY_MS = 500;

async function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry<T>(fn: () => Promise<T>) {
  let attempt = 0;
  let lastError: unknown;

  while (attempt <= RETRY_ATTEMPTS) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === RETRY_ATTEMPTS) {
        break;
      }
      const backoff = RETRY_DELAY_MS * Math.pow(2, attempt);
      await wait(backoff);
    }
    attempt += 1;
  }

  throw lastError;
}

async function getLimitedSeasonalMedia(
  season: "WINTER" | "SPRING" | "SUMMER" | "FALL",
  seasonYear: number
): Promise<SeasonalMediaItem[]> {
  const allMedia: SeasonalMediaItem[] = [];
  let page = 1;
  const perPage = 50;

  while (page <= MAX_PAGES) {
    try {
      const data = await fetchWithRetry(() =>
        anilist<SeasonalMediaResponse>(
          SEASONAL_MEDIA_QUERY,
          {
            page,
            perPage,
            season,
            seasonYear,
            status: ["RELEASING", "NOT_YET_RELEASED"],
          },
          { next: { revalidate: 60 * 60 * 6, tags: ["seasonal"] } }
        )
      );

      allMedia.push(...data.Page.media);

      if (!data.Page.pageInfo.hasNextPage) {
        break;
      }

      page++;

      // 添加小延遲以避免速率限制
      if (page <= MAX_PAGES) {
        await wait(100);
      }
    } catch (error) {
      console.error(`Failed to fetch seasonal page ${page}:`, error);
      break;
    }
  }

  return allMedia;
}

async function getLimitedOngoingMedia(): Promise<SeasonalMediaItem[]> {
  const allMedia: SeasonalMediaItem[] = [];
  let page = 1;
  const perPage = 50;

  while (page <= MAX_PAGES) {
    try {
      const data = await fetchWithRetry(() =>
        anilist<SeasonalMediaResponse>(
          ONGOING_MEDIA_QUERY,
          {
            page,
            perPage,
          },
          { next: { revalidate: 60 * 60 * 6, tags: ["ongoing"] } }
        )
      );

      allMedia.push(...data.Page.media);

      if (!data.Page.pageInfo.hasNextPage) {
        break;
      }

      page++;

      // 添加小延遲以避免速率限制
      if (page <= MAX_PAGES) {
        await wait(100);
      }
    } catch (error) {
      console.error(`Failed to fetch ongoing page ${page}:`, error);
      break;
    }
  }

  return allMedia;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://anidaze.com";
  const { season, year } = getCurrentSeason();

  try {
    // 獲取當前季度的動畫（限制頁數）
    const seasonalMedia = await getLimitedSeasonalMedia(season, year);

    // 添加延遲
    await new Promise((resolve) => setTimeout(resolve, 200));

    // 獲取長期播放的動畫（限制頁數）
    const ongoingMedia = await getLimitedOngoingMedia();

    // 合併並去重，同時過濾成人內容
    const allMediaIds = new Set<number>();
    [...seasonalMedia, ...ongoingMedia].forEach((media) => {
      // 只添加非成人內容到 sitemap
      if (media.isAdult !== true) {
        allMediaIds.add(media.id);
      }
    });

    // 建立首頁條目
    const homeEntry: MetadataRoute.Sitemap[0] = {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 1.0,
    };

    // 建立動畫詳情頁條目
    const mediaEntries: MetadataRoute.Sitemap = Array.from(allMediaIds).map(
      (id) => ({
        url: `${siteUrl}/title/${id}`,
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: 0.8,
      })
    );

    return [homeEntry, ...mediaEntries];
  } catch (error) {
    console.error("Failed to generate sitemap:", error);
    // 如果失敗，至少返回首頁
    return [
      {
        url: siteUrl,
        lastModified: new Date(),
        changeFrequency: "hourly",
        priority: 1.0,
      },
    ];
  }
}
