import Image from "next/image";
import Link from "next/link";
import {
  anilist,
  SEASONAL_MEDIA_QUERY,
  ONGOING_MEDIA_QUERY,
  type SeasonalMediaResponse,
  type SeasonalMediaItem,
} from "@/lib/anilist";
import {
  formatLocal,
  getCurrentSeason,
  getDayOfWeek,
  isWithinWeekRange,
  getWeekRange,
  getMonthRange,
  getDateFromTimestamp,
  getHourFromTimestamp,
} from "@/lib/time";
import { getBestTitle } from "@/lib/title";
import { ViewControls } from "@/components/view-controls";
import { HomeStatsWrapper } from "@/components/home-stats-wrapper";
import { CalendarMediaItem } from "@/components/calendar-media-item";
import { getGenreColor } from "@/lib/genre-colors";
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
  searchParams: Promise<{
    country?: string;
    viewMode?: "list" | "week" | "month";
    showAdult?: string;
    sortBy?: "airingTime" | "title" | "score" | "popularity";
    sortOrder?: "asc" | "desc";
  }>;
}) {
  const t = await getTranslations();
  const params = await searchParams;
  const {
    country: selectedCountry,
    viewMode = "list",
    showAdult,
    sortBy = "airingTime",
    sortOrder = "asc",
  } = params;

  const showAdultContent = showAdult === "true";

  const { season, year } = getCurrentSeason();

  const seasonNames: Record<"WINTER" | "SPRING" | "SUMMER" | "FALL", string> = {
    WINTER: t("season.winter"),
    SPRING: t("season.spring"),
    SUMMER: t("season.summer"),
    FALL: t("season.fall"),
  };

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

  // 根據 showAdult 過濾成人內容
  if (!showAdultContent) {
    filteredItems = filteredItems.filter((m) => !m.isAdult);
  }

  // 根據視圖模式過濾時間範圍（固定為當前週/月）
  let timeFilteredItems = filteredItems;
  if (viewMode === "list") {
    // 列表視圖：顯示所有作品，不進行時間過濾
    timeFilteredItems = filteredItems;
  } else if (viewMode === "week") {
    // 週視圖：只顯示有下一次播出時間且在本週範圍內的作品
    timeFilteredItems = filteredItems.filter((item) => {
      const nextEpisode = item.nextAiringEpisode;
      if (!nextEpisode?.airingAt) return false;
      return isWithinWeekRange(nextEpisode.airingAt, 0);
    });
  } else if (viewMode === "month") {
    // 月視圖：顯示有任何播出時間在本月範圍內的作品（包括過去的日期）
    const { start: monthStart, end: monthEnd } = getMonthRange(0);
    // 創建只包含日期部分的比較對象（忽略時間）
    const monthStartOnly = new Date(
      Date.UTC(
        monthStart.getUTCFullYear(),
        monthStart.getUTCMonth(),
        monthStart.getUTCDate(),
        0,
        0,
        0,
        0
      )
    );
    const monthEndOnly = new Date(
      Date.UTC(
        monthEnd.getUTCFullYear(),
        monthEnd.getUTCMonth(),
        monthEnd.getUTCDate(),
        0,
        0,
        0,
        0
      )
    );

    timeFilteredItems = filteredItems.filter((item) => {
      const airingSchedule = item.airingSchedule?.nodes || [];
      const episodes =
        airingSchedule.length > 0
          ? airingSchedule.filter(
              (e): e is { episode: number; airingAt: number } => e !== null
            )
          : item.nextAiringEpisode
          ? [
              {
                episode: item.nextAiringEpisode.episode,
                airingAt: item.nextAiringEpisode.airingAt,
              },
            ]
          : [];

      // 檢查是否有任何播出時間在月份範圍內（包括過去的日期）
      return episodes.some((episode) => {
        // 使用 getDateFromTimestamp 來獲取一致的時區處理
        const episodeDate = getDateFromTimestamp(episode.airingAt);
        const episodeDateOnly = new Date(
          Date.UTC(
            episodeDate.getUTCFullYear(),
            episodeDate.getUTCMonth(),
            episodeDate.getUTCDate(),
            0,
            0,
            0,
            0
          )
        );
        // 包含過去的日期，只要在月份範圍內
        return (
          episodeDateOnly >= monthStartOnly && episodeDateOnly <= monthEndOnly
        );
      });
    });
  }

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

  // 計算統計數據
  const statsData = {
    itemsWithTitlesCount: itemsWithTitles.length,
    itemsWithTitlesCurrentSeasonCount: itemsWithTitles.filter(
      (m) => m.isCurrentSeason
    ).length,
    itemsWithTitlesOngoingCount: itemsWithTitles.filter(
      (m) => !m.isCurrentSeason
    ).length,
    season: seasonNames[season],
  };

  return (
    <main className="max-w-7xl mx-auto px-4 relative">
      <ViewControls
        viewMode={viewMode}
        showAdult={showAdultContent}
        selectedCountry={selectedCountry || ""}
        countryOptions={countrySelectOptions}
        sortBy={sortBy}
        sortOrder={sortOrder}
        translations={{
          list: t("viewMode.list"),
          week: t("viewMode.week"),
          month: t("viewMode.month"),
          showAdult: t("adultContent.show"),
          allCountries: t("country.all"),
          sortLabel: t("sort.label"),
          sortAiringTime: t("sort.airingTime"),
          sortTitle: t("sort.title"),
          sortScore: t("sort.score"),
          sortPopularity: t("sort.popularity"),
          sortAsc: t("sort.asc"),
          sortDesc: t("sort.desc"),
        }}
      />
      <div className="text-center sm:text-left mt-4">
        <HomeStatsWrapper statsData={statsData} />
      </div>

      <div className="mt-4">
        {viewMode === "list" ? (
          <ListView
            media={timeFilteredItems}
            sortBy={sortBy}
            sortOrder={sortOrder}
          />
        ) : viewMode === "week" ? (
          <WeekView media={timeFilteredItems} weekOffset={0} />
        ) : (
          <MonthView media={timeFilteredItems} monthOffset={0} />
        )}
      </div>
    </main>
  );
}

// 列表視圖組件（原週視圖）
async function ListView({
  media,
  sortBy,
  sortOrder,
}: {
  media: Array<
    SeasonalMediaItem & {
      displayTitle: string;
      isCurrentSeason: boolean;
      isAdult: boolean;
    }
  >;
  sortBy: "airingTime" | "title" | "score" | "popularity";
  sortOrder: "asc" | "desc";
}) {
  const t = await getTranslations();

  // 排序函數
  const sortMedia = (
    items: typeof media,
    by: typeof sortBy,
    order: typeof sortOrder
  ) => {
    return [...items].sort((a, b) => {
      let compareValue = 0;

      switch (by) {
        case "airingTime":
          const aTime = a.nextAiringEpisode?.airingAt ?? Infinity;
          const bTime = b.nextAiringEpisode?.airingAt ?? Infinity;
          compareValue = aTime - bTime;
          break;
        case "title":
          compareValue = a.displayTitle.localeCompare(b.displayTitle);
          break;
        case "score":
          const aScore = a.averageScore ?? -1;
          const bScore = b.averageScore ?? -1;
          compareValue = bScore - aScore; // 默認高分在前
          break;
        case "popularity":
          const aPopularity = a.popularity ?? -1;
          const bPopularity = b.popularity ?? -1;
          compareValue = bPopularity - aPopularity; // 默認高人氣在前
          break;
      }

      return order === "asc" ? compareValue : -compareValue;
    });
  };

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

  // 對每個分組進行排序
  Object.keys(groupedByDay).forEach((day) => {
    const dayNum = parseInt(day);
    groupedByDay[dayNum] = sortMedia(
      groupedByDay[dayNum],
      sortBy,
      sortOrder
    );
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

// 週視圖組件（按時間段顯示）
async function WeekView({
  media,
  weekOffset,
}: {
  media: Array<
    SeasonalMediaItem & {
      displayTitle: string;
      isCurrentSeason: boolean;
      isAdult: boolean;
    }
  >;
  weekOffset: number;
}) {
  const t = await getTranslations();
  const { start, end } = getWeekRange(weekOffset);

  // 按小時和星期分組作品
  // hourByDay[hour][dayOfWeek] = [...media]
  const hourByDay: Record<number, Record<number, typeof media>> = {};

  media.forEach((mediaItem) => {
    const nextEpisode = mediaItem.nextAiringEpisode;
    if (nextEpisode?.airingAt) {
      const hour = getHourFromTimestamp(nextEpisode.airingAt);
      const dayOfWeek = getDayOfWeek(nextEpisode.airingAt);

      if (!hourByDay[hour]) {
        hourByDay[hour] = {};
      }
      if (!hourByDay[hour][dayOfWeek]) {
        hourByDay[hour][dayOfWeek] = [];
      }
      hourByDay[hour][dayOfWeek].push(mediaItem);
    }
  });

  // 獲取所有有動畫的小時並排序
  const hours = Object.keys(hourByDay)
    .map((h) => parseInt(h))
    .sort((a, b) => a - b);

  const dayNameKeys: Record<number, string> = {
    0: "day.sunday",
    1: "day.monday",
    2: "day.tuesday",
    3: "day.wednesday",
    4: "day.thursday",
    5: "day.friday",
    6: "day.saturday",
  };

  // 格式化週範圍顯示（只顯示日期部分）
  const locale = await getLocale();
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    timeZone: process.env.TIMEZONE || "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  // 週六的日期（start + 6天）
  const endDate = new Date(start);
  endDate.setUTCDate(endDate.getUTCDate() + 6);
  const weekRangeText = `${dateFormatter.format(start)} - ${dateFormatter.format(endDate)}`;

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground mb-4">{weekRangeText}</div>

      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* 表頭：星期 */}
          <div className="grid grid-cols-8 gap-px border-b mb-2">
            <div className="p-2 text-center text-sm font-medium">時間</div>
            {[0, 1, 2, 3, 4, 5, 6].map((day) => (
              <div key={day} className="p-2 text-center text-sm font-medium">
                {t(
                  dayNameKeys[day] as
                    | "day.sunday"
                    | "day.monday"
                    | "day.tuesday"
                    | "day.wednesday"
                    | "day.thursday"
                    | "day.friday"
                    | "day.saturday"
                )}
              </div>
            ))}
          </div>

          {/* 時間段行 */}
          {hours.map((hour) => (
            <div key={hour} className="grid grid-cols-8 gap-px border-b">
              {/* 時間標籤 */}
              <div className="p-2 text-sm font-medium bg-muted/30 flex items-center justify-center">
                {String(hour).padStart(2, "0")}:00
              </div>

              {/* 每天的動畫 */}
              {[0, 1, 2, 3, 4, 5, 6].map((day) => {
                const dayMedia = hourByDay[hour]?.[day] || [];
                return (
                  <div key={day} className="p-2 border-r min-h-[80px]">
                    <div className="space-y-1">
                      {dayMedia.map((mediaItem) => {
                        const color = getGenreColor(mediaItem.genres);
                        return (
                          <CalendarMediaItem
                            key={mediaItem.id}
                            mediaItem={mediaItem}
                            episode={
                              mediaItem.nextAiringEpisode?.episode || 1
                            }
                            color={color}
                            translations={{
                              episode: t("media.episode", {
                                episode:
                                  mediaItem.nextAiringEpisode?.episode || 1,
                              }),
                              viewDetails: t("media.viewDetails"),
                              downloadIcal: t("media.downloadIcal"),
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 月視圖組件
async function MonthView({
  media,
  monthOffset,
}: {
  media: Array<
    SeasonalMediaItem & {
      displayTitle: string;
      isCurrentSeason: boolean;
      isAdult: boolean;
    }
  >;
  monthOffset: number;
}) {
  const t = await getTranslations();
  const { start, end } = getMonthRange(monthOffset);

  // 取得月份的第一天和最後一天
  const monthStart = new Date(start);
  const monthEnd = new Date(end);

  // 計算月份的第一個週日（作為日曆的開始）
  // 使用 UTC 日期來計算，因為 start 已經是 UTC 日期
  const firstDayOfMonth = monthStart.getUTCDay(); // 0=週日, 1=週一, ...
  const calendarStart = new Date(monthStart);
  calendarStart.setUTCDate(calendarStart.getUTCDate() - firstDayOfMonth);
  calendarStart.setUTCHours(0, 0, 0, 0);

  // 計算月份的最後一個週六（作為日曆的結束）
  const lastDayOfMonth = monthEnd.getUTCDay();
  const daysToAdd = 6 - lastDayOfMonth;
  const calendarEnd = new Date(monthEnd);
  calendarEnd.setUTCDate(calendarEnd.getUTCDate() + daysToAdd);
  calendarEnd.setUTCHours(23, 59, 59, 999);

  // 生成日曆的所有日期
  const calendarDays: Date[] = [];
  const currentDate = new Date(calendarStart);
  while (currentDate <= calendarEnd) {
    calendarDays.push(new Date(currentDate));
    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
  }

  // 按週分組日期（每7天）
  const weeks: Date[][] = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }

  // 按日期和媒體分組所有播出時間
  type MediaItemWithEpisode = {
    mediaItem: (typeof media)[0];
    episode: number;
    airingAt: number;
  };
  const mediaByDate: Record<string, MediaItemWithEpisode[]> = {};

  media.forEach((mediaItem) => {
    // 獲取所有播出時間（包括過去的日期）
    const airingSchedule = mediaItem.airingSchedule?.nodes || [];

    // 如果沒有 airingSchedule，使用 nextAiringEpisode 作為備用
    const episodes =
      airingSchedule.length > 0
        ? airingSchedule.filter(
            (e): e is { episode: number; airingAt: number } => e !== null
          )
        : mediaItem.nextAiringEpisode
        ? [
            {
              episode: mediaItem.nextAiringEpisode.episode,
              airingAt: mediaItem.nextAiringEpisode.airingAt,
            },
          ]
        : [];

    episodes.forEach((episode) => {
      // 使用 getDateFromTimestamp 來獲取一致的時區處理
      const episodeDate = getDateFromTimestamp(episode.airingAt);

      // 只處理在月份範圍內的播出時間（包括過去的日期）
      // 使用 monthStart 和 monthEnd 來確保只顯示當月的內容
      // 比較日期部分（年月日），忽略時間部分
      const episodeDateOnly = new Date(
        Date.UTC(
          episodeDate.getUTCFullYear(),
          episodeDate.getUTCMonth(),
          episodeDate.getUTCDate(),
          0,
          0,
          0,
          0
        )
      );
      const monthStartOnly = new Date(
        Date.UTC(
          monthStart.getUTCFullYear(),
          monthStart.getUTCMonth(),
          monthStart.getUTCDate(),
          0,
          0,
          0,
          0
        )
      );
      const monthEndOnly = new Date(
        Date.UTC(
          monthEnd.getUTCFullYear(),
          monthEnd.getUTCMonth(),
          monthEnd.getUTCDate(),
          0,
          0,
          0,
          0
        )
      );

      if (episodeDateOnly < monthStartOnly || episodeDateOnly > monthEndOnly)
        return;

      const dateKey = `${episodeDate.getUTCFullYear()}-${String(
        episodeDate.getUTCMonth() + 1
      ).padStart(2, "0")}-${String(episodeDate.getUTCDate()).padStart(2, "0")}`;

      if (!mediaByDate[dateKey]) {
        mediaByDate[dateKey] = [];
      }
      mediaByDate[dateKey].push({
        mediaItem,
        episode: episode.episode,
        airingAt: episode.airingAt,
      });
    });
  });

  // 格式化月份顯示
  const locale = await getLocale();
  const monthText = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
  }).format(monthStart);

  const dayNameKeys: Record<number, string> = {
    0: "day.sunday",
    1: "day.monday",
    2: "day.tuesday",
    3: "day.wednesday",
    4: "day.thursday",
    5: "day.friday",
    6: "day.saturday",
  };

  return (
    <div className="space-y-4">
      <div className="text-lg font-semibold mb-4">{monthText}</div>

      {/* 日曆表格 */}
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* 表頭：星期 */}
          <div className="grid grid-cols-7 gap-px border-b mb-2">
            {[0, 1, 2, 3, 4, 5, 6].map((day) => (
              <div key={day} className="p-2 text-center text-sm font-medium">
                {t(
                  dayNameKeys[day] as
                    | "day.sunday"
                    | "day.monday"
                    | "day.tuesday"
                    | "day.wednesday"
                    | "day.thursday"
                    | "day.friday"
                    | "day.saturday"
                )}
              </div>
            ))}
          </div>

          {/* 週 */}
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 gap-px border-b">
              {week.map((date, dayIndex) => {
                const dateKey = `${date.getUTCFullYear()}-${String(
                  date.getUTCMonth() + 1
                ).padStart(2, "0")}-${String(date.getUTCDate()).padStart(
                  2,
                  "0"
                )}`;
                const isCurrentMonth =
                  date.getUTCMonth() === monthStart.getUTCMonth();
                const dayNumber = date.getUTCDate();
                const dayMedia = mediaByDate[dateKey] || [];

                return (
                  <div
                    key={dayIndex}
                    className={`p-2 border-r ${
                      isCurrentMonth ? "bg-background" : "bg-muted/30"
                    }`}
                  >
                    <div
                      className={`text-sm mb-1 ${
                        isCurrentMonth
                          ? "font-semibold"
                          : "text-muted-foreground"
                      }`}
                    >
                      {dayNumber}
                    </div>
                    <div className="space-y-1 min-h-[60px]">
                      {dayMedia.map((item) => {
                        // 使用唯一 key：mediaId + episode + airingAt
                        const uniqueKey = `${item.mediaItem.id}-${item.episode}-${item.airingAt}`;
                        // 根據類型獲取顏色
                        const color = getGenreColor(item.mediaItem.genres);
                        return (
                          <CalendarMediaItem
                            key={uniqueKey}
                            mediaItem={item.mediaItem}
                            episode={item.episode}
                            color={color}
                            translations={{
                              episode: t("media.episode", {
                                episode: item.episode,
                              }),
                              viewDetails: t("media.viewDetails"),
                              downloadIcal: t("media.downloadIcal"),
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
