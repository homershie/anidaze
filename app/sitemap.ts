import type { MetadataRoute } from "next";
import {
  anilist,
  SEASONAL_MEDIA_QUERY,
  ONGOING_MEDIA_QUERY,
  type SeasonalMediaResponse,
  type SeasonalMediaItem,
} from "@/lib/anilist";
import { getCurrentSeason } from "@/lib/time";

async function getAllSeasonalMedia(
  season: "WINTER" | "SPRING" | "SUMMER" | "FALL",
  seasonYear: number
): Promise<SeasonalMediaItem[]> {
  const allMedia: SeasonalMediaItem[] = [];
  let page = 1;
  const perPage = 50;
  let hasNextPage = true;

  while (hasNextPage) {
    try {
      const data = await anilist<SeasonalMediaResponse>(
        SEASONAL_MEDIA_QUERY,
        {
          page,
          perPage,
          season,
          seasonYear,
          status: ["RELEASING", "NOT_YET_RELEASED"],
        },
        { next: { revalidate: 60 * 60 * 6, tags: ["seasonal"] } }
      );

      allMedia.push(...data.Page.media);
      hasNextPage = data.Page.pageInfo.hasNextPage;
      page++;
    } catch (error) {
      console.error(`Failed to fetch page ${page}:`, error);
      hasNextPage = false;
    }
  }

  return allMedia;
}

async function getOngoingMedia(): Promise<SeasonalMediaItem[]> {
  const allMedia: SeasonalMediaItem[] = [];
  let page = 1;
  const perPage = 50;
  let hasNextPage = true;

  while (hasNextPage) {
    try {
      const data = await anilist<SeasonalMediaResponse>(
        ONGOING_MEDIA_QUERY,
        {
          page,
          perPage,
        },
        { next: { revalidate: 60 * 60 * 6, tags: ["ongoing"] } }
      );

      allMedia.push(...data.Page.media);
      hasNextPage = data.Page.pageInfo.hasNextPage;
      page++;
    } catch (error) {
      console.error(`Failed to fetch ongoing page ${page}:`, error);
      hasNextPage = false;
    }
  }

  return allMedia;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://anidaze.com";
  const { season, year } = getCurrentSeason();

  // 獲取當前季度和長期播放的動畫
  const [seasonalMedia, ongoingMedia] = await Promise.all([
    getAllSeasonalMedia(season, year),
    getOngoingMedia(),
  ]);

  // 合併並去重（使用 Set）
  const allMediaIds = new Set<number>();
  [...seasonalMedia, ...ongoingMedia].forEach((media) => {
    allMediaIds.add(media.id);
  });

  // 建立首頁條目
  const homeEntry: MetadataRoute.Sitemap[0] = {
    url: siteUrl,
    lastModified: new Date(),
    changeFrequency: "hourly",
    priority: 1.0,
    alternates: {
      languages: {
        "zh-TW": siteUrl,
        ja: siteUrl,
        en: siteUrl,
      },
    },
  };

  // 建立動畫詳情頁條目
  const mediaEntries: MetadataRoute.Sitemap = Array.from(allMediaIds).map(
    (id) => ({
      url: `${siteUrl}/title/${id}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.8,
      alternates: {
        languages: {
          "zh-TW": `${siteUrl}/title/${id}`,
          ja: `${siteUrl}/title/${id}`,
          en: `${siteUrl}/title/${id}`,
        },
      },
    })
  );

  return [homeEntry, ...mediaEntries];
}
