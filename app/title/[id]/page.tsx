import Link from "next/link";
import Image from "next/image";
import {
  anilist,
  MEDIA_DETAIL_QUERY,
  type MediaDetailResponse,
} from "@/lib/anilist";
import { getBestTitle } from "@/lib/title";
import { getJikanMetadata, extractMALIdFromAniList } from "@/lib/jikan";
import { getLocale, getTranslations } from "next-intl/server";
import type { AppLocale } from "@/i18n/routing";

export default async function TitlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idString } = await params;
  const id = parseInt(idString, 10);

  // Fetch AniList data
  const anilistData = await anilist<MediaDetailResponse>(
    MEDIA_DETAIL_QUERY,
    { mediaId: id },
    { next: { revalidate: 60 * 60 * 24, tags: [`media-${id}`] } }
  );

  const media = anilistData.Media;

  // Get translations and locale
  const t = await getTranslations();
  const locale = await getLocale();

  if (!media) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <div className="text-center">
          <h1 className="text-xl font-semibold">{t("title.notFound")}</h1>
          <Link
            href="/"
            className="mt-4 inline-block text-sm text-blue-600 hover:underline"
          >
            {t("title.backToList")}
          </Link>
        </div>
      </main>
    );
  }

  // Get title with TMDB Chinese support
  const title = await getBestTitle(
    {
      romaji: media.title.romaji,
      english: media.title.english,
      native: media.title.native,
      synonyms: media.synonyms,
    },
    locale as AppLocale
  );

  // Extract MAL ID from AniList external links
  const malId = extractMALIdFromAniList(media.externalLinks);

  // Fetch Jikan metadata (try with MAL ID first, fallback to title search)
  const jikanData = await getJikanMetadata(
    malId || undefined,
    title || undefined
  );

  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="mb-4">
        <Link href="/" className="text-sm text-blue-600 hover:underline">
          {t("title.backToList")}
        </Link>
      </div>

      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{title}</h1>
          {media.title.english && media.title.english !== title && (
            <p className="mt-1 text-lg text-gray-600">{media.title.english}</p>
          )}
          {media.title.native && (
            <p className="mt-1 text-gray-500">{media.title.native}</p>
          )}
        </div>
        <a
          className="rounded bg-black px-4 py-2 text-white text-sm hover:bg-gray-800"
          href={`/api/ics/${id}`}
        >
          {t("title.addToCalendar")}
        </a>
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 md:grid-cols-[200px_1fr]">
        {/* Cover Image */}
        {media.coverImage?.large && (
          <div className="hidden md:block">
            <Image
              src={media.coverImage.large}
              alt={title}
              width={200}
              height={300}
              className="rounded-lg object-cover"
            />
          </div>
        )}

        {/* Main Content */}
        <div className="space-y-4">
          {/* Scores Section */}
          <div className="rounded-lg border p-4">
            <h2 className="mb-3 text-lg font-semibold">{t("title.scores")}</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {/* AniList Score */}
              {media.averageScore !== null && (
                <div>
                  <div className="text-sm text-gray-600">AniList</div>
                  <div className="text-2xl font-bold">
                    {(media.averageScore / 10).toFixed(1)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {media.popularity &&
                      `${media.popularity.toLocaleString()} ${t(
                        "title.users"
                      )}`}
                  </div>
                </div>
              )}

              {/* MyAnimeList Score (from Jikan) */}
              {jikanData && jikanData.score !== null && (
                <div>
                  <div className="text-sm text-gray-600">MyAnimeList</div>
                  <div className="text-2xl font-bold">
                    {jikanData.score.toFixed(1)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {jikanData.scored_by &&
                      `${jikanData.scored_by.toLocaleString()} ${t(
                        "title.ratings"
                      )}`}
                  </div>
                </div>
              )}

              {/* MAL Rank */}
              {jikanData?.rank && (
                <div>
                  <div className="text-sm text-gray-600">{t("title.rank")}</div>
                  <div className="text-2xl font-bold">#{jikanData.rank}</div>
                  <div className="text-xs text-gray-500">
                    {t("title.siteRank")}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Metadata Section */}
          <div className="rounded-lg border p-4">
            <h2 className="mb-3 text-lg font-semibold">{t("title.info")}</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {media.format && (
                <div>
                  <span className="text-gray-600">{t("title.type")}</span>
                  <span className="font-medium">
                    {t(`anilist.format.${media.format}`) || media.format}
                  </span>
                </div>
              )}
              {media.episodes && (
                <div>
                  <span className="text-gray-600">{t("title.episodes")}</span>
                  <span className="font-medium">{media.episodes}</span>
                </div>
              )}
              {media.status && (
                <div>
                  <span className="text-gray-600">{t("title.status")}</span>
                  <span className="font-medium">
                    {t(`anilist.status.${media.status}`) || media.status}
                  </span>
                </div>
              )}
              {media.season && media.seasonYear && (
                <div>
                  <span className="text-gray-600">{t("title.season")}</span>
                  <span className="font-medium">
                    {media.seasonYear}{" "}
                    {t(`season.${media.season.toLowerCase()}`) || media.season}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Genres */}
          {media.genres && media.genres.length > 0 && (
            <div className="rounded-lg border p-4">
              <h2 className="mb-3 text-lg font-semibold">
                {t("title.genres")}
              </h2>
              <div className="flex flex-wrap gap-2">
                {media.genres.map(
                  (genre, idx) =>
                    genre && (
                      <span
                        key={idx}
                        className="rounded bg-gray-100 px-3 py-1 text-sm"
                      >
                        {t(`anilist.genres.${genre}`) || genre}
                      </span>
                    )
                )}
              </div>
            </div>
          )}

          {/* Studios */}
          {media.studios?.nodes && media.studios.nodes.length > 0 && (
            <div className="rounded-lg border p-4">
              <h2 className="mb-3 text-lg font-semibold">
                {t("title.studios")}
              </h2>
              <div className="flex flex-wrap gap-2">
                {media.studios.nodes.map((studio, idx) => (
                  <span
                    key={idx}
                    className="rounded bg-gray-100 px-3 py-1 text-sm"
                  >
                    {studio.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
