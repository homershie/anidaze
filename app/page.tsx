import Image from "next/image";
import Link from "next/link";
import {
  anilist,
  SEASONAL_MEDIA_QUERY,
  ONGOING_MEDIA_QUERY,
  type SeasonalMediaResponse,
  type SeasonalMediaItem,
} from "@/lib/anilist";
import { formatLocal, getCurrentSeason, getDayOfWeek } from "@/lib/time";
import { getBestTitle } from "@/lib/title";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CountryTags } from "@/components/country-tags";
import { getTranslations, getLocale } from "next-intl/server";
import type { AppLocale } from "@/i18n/routing";

async function getAllSeasonalMedia(
  season: "WINTER" | "SPRING" | "SUMMER" | "FALL",
  seasonYear: number
): Promise<SeasonalMediaItem[]> {
  const allMedia: SeasonalMediaItem[] = [];
  let page = 1;
  const perPage = 50;
  let hasNextPage = true;

  while (hasNextPage) {
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
  }

  return allMedia;
}

async function getAllOngoingMedia(
  season: "WINTER" | "SPRING" | "SUMMER" | "FALL",
  seasonYear: number
): Promise<SeasonalMediaItem[]> {
  const allMedia: SeasonalMediaItem[] = [];
  let page = 1;
  const perPage = 50;
  let hasNextPage = true;

  while (hasNextPage) {
    const data = await anilist<SeasonalMediaResponse>(
      ONGOING_MEDIA_QUERY,
      {
        page,
        perPage,
        status: ["RELEASING"],
      },
      { next: { revalidate: 60 * 60 * 6, tags: ["ongoing"] } }
    );

    // 過濾掉屬於當前季節的作品（避免重複）
    const filtered = data.Page.media.filter(
      (media) => !(media.season === season && media.seasonYear === seasonYear)
    );

    allMedia.push(...filtered);
    hasNextPage = data.Page.pageInfo.hasNextPage;
    page++;
  }

  return allMedia;
}

// 國家分組（用於動態生成）
const COUNTRY_GROUP_CODES: Record<string, string[]> = {
  chinese: ["TW", "HK", "CN"],
  asia: ["JP", "KR", "TH", "SG", "MY", "ID", "PH", "VN"],
  other: ["US", "GB", "CA", "AU", "FR", "DE", "IT", "ES"],
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ country?: string }>;
}) {
  const t = await getTranslations();
  const { country: selectedCountry } = await searchParams;
  const { season, year } = getCurrentSeason();

  // 並行獲取季節作品和長期播放作品
  const [seasonalMedia, ongoingMedia] = await Promise.all([
    getAllSeasonalMedia(season, year),
    getAllOngoingMedia(season, year),
  ]);

  // 合併並去重（以 media.id 為準）
  const mediaMap = new Map<number, SeasonalMediaItem>();
  seasonalMedia.forEach((media) => mediaMap.set(media.id, media));
  ongoingMedia.forEach((media) => {
    if (!mediaMap.has(media.id)) {
      mediaMap.set(media.id, media);
    }
  });

  const allMedia = Array.from(mediaMap.values());

  // 過濾掉沒有下次播出時間的作品（播出時間未定的作品）
  const mediaWithAiringSchedule = allMedia.filter(
    (media) =>
      media.nextAiringEpisode !== null && media.nextAiringEpisode !== undefined
  );

  // Get current locale for title fetching
  const locale = await getLocale();

  // Fetch titles with TMDB Chinese support
  const itemsWithTitles = await Promise.all(
    mediaWithAiringSchedule.map(async (media: SeasonalMediaItem) => {
      const title = await getBestTitle(
        {
          romaji: media.title.romaji,
          english: media.title.english,
          native: media.title.native,
          synonyms: media.synonyms,
        },
        locale as AppLocale
      );

      // 判斷是否為當前季節作品
      const isCurrentSeason =
        media.season === season && media.seasonYear === year;

      // 判斷是否為成人內容（僅依據 Media 層級的 isAdult，忽略 tags）
      const isAdult = media.isAdult === true;

      return {
        ...media,
        displayTitle: title,
        isCurrentSeason,
        isAdult,
      };
    })
  );

  // 收集所有有作品的國家（只包含有 countryOfOrigin 的作品）
  const countriesWithMedia = new Set<string>();
  itemsWithTitles.forEach((item) => {
    if (item.countryOfOrigin) {
      countriesWithMedia.add(item.countryOfOrigin);
    }
  });

  // 根據選擇的國家過濾作品
  let filteredItems = itemsWithTitles;
  if (selectedCountry && selectedCountry !== "") {
    filteredItems = itemsWithTitles.filter(
      (item) => item.countryOfOrigin === selectedCountry
    );
  }

  // 分類作品
  const generalMedia = filteredItems.filter((m) => !m.isAdult);
  const adultMedia = filteredItems.filter((m) => m.isAdult);

  // 生成國家選單選項（只顯示有作品的國家）
  const countrySelectOptions: Array<{
    group: string;
    countries: Array<{ code: string; name: string }>;
  }> = [];

  Object.entries(COUNTRY_GROUP_CODES).forEach(([groupKey, countryCodes]) => {
    const availableCountries = countryCodes
      .filter((code) => countriesWithMedia.has(code))
      .map((code) => {
        const countryKey = `country.names.${code}` as const;
        return {
          code,
          name: (t(countryKey as "country.names.JP") || code) as string,
        };
      });

    if (availableCountries.length > 0) {
      const groupKeyTyped = `country.groups.${groupKey}` as const;
      countrySelectOptions.push({
        group: (t(groupKeyTyped as "country.groups.chinese") ||
          groupKey) as string,
        countries: availableCountries,
      });
    }
  });

  return (
    <main>
      <Tabs defaultValue="general" className="mt-6">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="general">
              {t("tabs.general", { count: generalMedia.length })}
            </TabsTrigger>
            <TabsTrigger value="adult">
              {t("tabs.adult", { count: adultMedia.length })}
            </TabsTrigger>
          </TabsList>

          <CountryTags
            selectedCountry={selectedCountry || ""}
            countryOptions={countrySelectOptions}
          />
        </div>

        <TabsContent value="general" className="mt-4">
          <MediaList media={generalMedia} />
        </TabsContent>

        <TabsContent value="adult" className="mt-4">
          <MediaList media={adultMedia} />
        </TabsContent>
      </Tabs>
    </main>
  );
}

// 將 MediaList 改為接受翻譯函數的參數
async function MediaList({
  media,
}: {
  media: Array<
    SeasonalMediaItem & {
      displayTitle: string;
      isCurrentSeason: boolean;
      isAdult: boolean;
    }
  >;
}) {
  const t = await getTranslations();

  // 按星期分組作品
  // 0: 週日, 1: 週一, ..., 6: 週六, 7: 未定
  const groupedByDay: Record<number, typeof media> = {
    0: [],
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
    6: [],
    7: [], // 未定
  };

  media.forEach((mediaItem) => {
    const nextEpisode = mediaItem.nextAiringEpisode;
    if (nextEpisode?.airingAt) {
      const dayOfWeek = getDayOfWeek(nextEpisode.airingAt);
      groupedByDay[dayOfWeek].push(mediaItem);
    } else {
      groupedByDay[7].push(mediaItem);
    }
  });

  // 星期順序：週日、週一、...、週六、未定
  const dayOrder = [0, 1, 2, 3, 4, 5, 6, 7];

  const dayNameKeys: Record<
    number,
    | "day.sunday"
    | "day.monday"
    | "day.tuesday"
    | "day.wednesday"
    | "day.thursday"
    | "day.friday"
    | "day.saturday"
  > = {
    0: "day.sunday",
    1: "day.monday",
    2: "day.tuesday",
    3: "day.wednesday",
    4: "day.thursday",
    5: "day.friday",
    6: "day.saturday",
  };

  return (
    <div className="space-y-6">
      {dayOrder.map((day) => {
        const dayMedia = groupedByDay[day];
        if (dayMedia.length === 0) return null;

        const dayName = day === 7 ? t("day.undecided") : t(dayNameKeys[day]);

        return (
          <div key={day} className="space-y-3">
            <h3 className="text-lg font-semibold">
              {dayName} ({dayMedia.length})
            </h3>
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {dayMedia.map((mediaItem) => {
                const nextEpisode = mediaItem.nextAiringEpisode;
                return (
                  <li key={mediaItem.id} className="rounded-2xl border p-4">
                    <div className="flex items-start gap-3">
                      {mediaItem.coverImage?.large && (
                        <Image
                          src={mediaItem.coverImage.large}
                          alt={mediaItem.displayTitle}
                          width={72}
                          height={102}
                          className="h-[102px] w-[72px] rounded object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="text-base font-semibold">
                            {mediaItem.displayTitle}
                          </div>
                          {!mediaItem.isCurrentSeason && (
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded dark:text-gray-300 dark:bg-gray-800">
                              {t("media.ongoing")}
                            </span>
                          )}
                        </div>
                        {nextEpisode ? (
                          <>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {t("media.episode", {
                                episode: nextEpisode.episode,
                              })}
                            </div>
                            <div className="text-sm mt-1">
                              {t("media.nextAiring")}
                              {formatLocal(
                                new Date(nextEpisode.airingAt * 1000)
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="text-sm text-gray-500 mt-1">
                            {mediaItem.status === "NOT_YET_RELEASED"
                              ? t("media.notYetReleased")
                              : t("media.airingTimeUndecided")}
                          </div>
                        )}
                        <div className="mt-2 flex items-center gap-3">
                          <Link
                            href={`/title/${mediaItem.id}`}
                            className="text-sm text-brand-red-500 hover:underline"
                          >
                            {t("media.viewDetails")}
                          </Link>
                          <a
                            href={`/api/ics/${mediaItem.id}`}
                            className="text-sm text-brand-blue-600 hover:underline"
                          >
                            {t("media.downloadIcal")}
                          </a>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
