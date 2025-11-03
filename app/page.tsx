import Image from "next/image";
import Link from "next/link";
import {
  anilist,
  SEASONAL_MEDIA_QUERY,
  ONGOING_MEDIA_QUERY,
  type SeasonalMediaResponse,
  type SeasonalMediaItem,
} from "@/lib/anilist";
import { formatLocal, getCurrentSeason } from "@/lib/time";
import { getBestTitle } from "@/lib/title";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

export default async function Home() {
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

  // Fetch titles with TMDB Chinese support
  const itemsWithTitles = await Promise.all(
    allMedia.map(async (media: SeasonalMediaItem) => {
      const title = await getBestTitle({
        romaji: media.title.romaji,
        english: media.title.english,
        native: media.title.native,
        synonyms: media.synonyms,
      });

      // 判斷是否為當前季節作品
      const isCurrentSeason =
        media.season === season && media.seasonYear === year;

      // 判斷是否為成人內容（根據 tags 中的 isAdult）
      const isAdult = media.tags?.some((tag) => tag?.isAdult === true) ?? false;

      return {
        ...media,
        displayTitle: title,
        isCurrentSeason,
        isAdult,
      };
    })
  );

  // 分類作品
  const generalMedia = itemsWithTitles.filter((m) => !m.isAdult);
  const adultMedia = itemsWithTitles.filter((m) => m.isAdult);

  const seasonNames: Record<"WINTER" | "SPRING" | "SUMMER" | "FALL", string> = {
    WINTER: "冬季",
    SPRING: "春季",
    SUMMER: "夏季",
    FALL: "秋季",
  };

  return (
    <main className="mx-auto max-w-4xl p-6">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">
          AniDaze — {year}年{seasonNames[season]}動畫
        </h1>
        <a
          className="rounded bg-black px-3 py-1.5 text-white text-sm"
          href="/api/ics/sample"
        >
          下載 iCal（示例）
        </a>
      </header>

      <p className="mt-2 text-sm text-gray-600">
        共 {itemsWithTitles.length} 部動畫（
        {itemsWithTitles.filter((m) => m.isCurrentSeason).length} 部本季新番，
        {itemsWithTitles.filter((m) => !m.isCurrentSeason).length} 部長期播放）
      </p>

      <Tabs defaultValue="general" className="mt-6">
        <TabsList>
          <TabsTrigger value="general">
            一般內容 ({generalMedia.length})
          </TabsTrigger>
          <TabsTrigger value="adult">
            成人內容 ({adultMedia.length})
          </TabsTrigger>
        </TabsList>

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

function MediaList({
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
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {media.map((mediaItem) => {
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
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                      長期播放
                    </span>
                  )}
                </div>
                {nextEpisode ? (
                  <>
                    <div className="text-sm text-gray-600">
                      EP {nextEpisode.episode}
                    </div>
                    <div className="text-sm mt-1">
                      下次播出：
                      {formatLocal(new Date(nextEpisode.airingAt * 1000))}
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-gray-500 mt-1">
                    {mediaItem.status === "NOT_YET_RELEASED"
                      ? "尚未播出"
                      : "播出時間未定"}
                  </div>
                )}
                <Link
                  href={`/title/${mediaItem.id}`}
                  className="mt-2 inline-block text-sm text-blue-600 hover:underline"
                >
                  查看詳情
                </Link>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
