import Link from "next/link";
import Image from "next/image";
import {
  anilist,
  MEDIA_DETAIL_QUERY,
  type MediaDetailResponse,
} from "@/lib/anilist";
import { getBestTitleSync } from "@/lib/title";
import { getJikanMetadata, extractMALIdFromAniList } from "@/lib/jikan";

export default async function TitlePage({
  params,
}: {
  params: { id: string };
}) {
  const id = parseInt(params.id, 10);

  // Fetch AniList data
  const anilistData = await anilist<MediaDetailResponse>(
    MEDIA_DETAIL_QUERY,
    { mediaId: id },
    { next: { revalidate: 60 * 60 * 24, tags: [`media-${id}`] } }
  );

  const media = anilistData.Media;
  if (!media) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <div className="text-center">
          <h1 className="text-xl font-semibold">作品不存在</h1>
          <Link
            href="/"
            className="mt-4 inline-block text-sm text-blue-600 hover:underline"
          >
            ← 返回列表
          </Link>
        </div>
      </main>
    );
  }

  // Get title
  const title = getBestTitleSync({
    romaji: media.title.romaji,
    english: media.title.english,
    native: media.title.native,
    synonyms: media.synonyms,
  });

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
          ← 返回列表
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
          加入行事曆
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
            <h2 className="mb-3 text-lg font-semibold">評分</h2>
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
                      `${media.popularity.toLocaleString()} 用戶`}
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
                      `${jikanData.scored_by.toLocaleString()} 評分`}
                  </div>
                </div>
              )}

              {/* MAL Rank */}
              {jikanData?.rank && (
                <div>
                  <div className="text-sm text-gray-600">MAL 排名</div>
                  <div className="text-2xl font-bold">#{jikanData.rank}</div>
                  <div className="text-xs text-gray-500">全站排名</div>
                </div>
              )}
            </div>
          </div>

          {/* Metadata Section */}
          <div className="rounded-lg border p-4">
            <h2 className="mb-3 text-lg font-semibold">作品資訊</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {media.format && (
                <div>
                  <span className="text-gray-600">類型：</span>
                  <span className="font-medium">{media.format}</span>
                </div>
              )}
              {media.episodes && (
                <div>
                  <span className="text-gray-600">集數：</span>
                  <span className="font-medium">{media.episodes}</span>
                </div>
              )}
              {media.status && (
                <div>
                  <span className="text-gray-600">狀態：</span>
                  <span className="font-medium">{media.status}</span>
                </div>
              )}
              {media.season && media.seasonYear && (
                <div>
                  <span className="text-gray-600">季度：</span>
                  <span className="font-medium">
                    {media.seasonYear} {media.season}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Genres */}
          {media.genres && media.genres.length > 0 && (
            <div className="rounded-lg border p-4">
              <h2 className="mb-3 text-lg font-semibold">類型</h2>
              <div className="flex flex-wrap gap-2">
                {media.genres.map(
                  (genre, idx) =>
                    genre && (
                      <span
                        key={idx}
                        className="rounded bg-gray-100 px-3 py-1 text-sm"
                      >
                        {genre}
                      </span>
                    )
                )}
              </div>
            </div>
          )}

          {/* Studios */}
          {media.studios?.nodes && media.studios.nodes.length > 0 && (
            <div className="rounded-lg border p-4">
              <h2 className="mb-3 text-lg font-semibold">製作公司</h2>
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

          {/* Description */}
          {media.description && (
            <div className="rounded-lg border p-4">
              <h2 className="mb-3 text-lg font-semibold">簡介</h2>
              <p
                className="text-sm leading-relaxed text-gray-700"
                dangerouslySetInnerHTML={{
                  __html: media.description
                    .replace(/\n/g, "<br />")
                    .replace(
                      /<br \/><br \/>/g,
                      "</p><p className='text-sm leading-relaxed text-gray-700'>"
                    ),
                }}
              />
            </div>
          )}

          {/* Jikan Synopsis (if different from AniList) */}
          {jikanData?.synopsis && jikanData.synopsis !== media.description && (
            <div className="rounded-lg border p-4">
              <h2 className="mb-3 text-lg font-semibold">MyAnimeList 簡介</h2>
              <p className="text-sm leading-relaxed text-gray-700">
                {jikanData.synopsis}
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
