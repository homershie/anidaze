import Image from "next/image";
import Link from "next/link";
import {
  anilist,
  AIRING_QUERY,
  type AiringResponse,
  type AiringItem,
} from "@/lib/anilist";
import { formatLocal } from "@/lib/time";

export default async function Home() {
  const data = await anilist<AiringResponse>(
    AIRING_QUERY,
    { page: 1, perPage: 30 },
    { next: { revalidate: 60 * 60 * 6, tags: ["airing"] } }
  );

  const items = data.Page.airingSchedules;

  return (
    <main className="mx-auto max-w-4xl p-6">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">AniDaze — 本週播放表</h1>
        <a
          className="rounded bg-black px-3 py-1.5 text-white text-sm"
          href="/api/ics/sample"
        >
          下載 iCal（示例）
        </a>
      </header>

      <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {items.map((a: AiringItem) => {
          const title =
            a.media.title.romaji ||
            a.media.title.english ||
            a.media.title.native ||
            "Unknown";
          const dt = new Date(a.airingAt * 1000);
          return (
            <li
              key={`${a.media.id}-${a.episode}`}
              className="rounded-2xl border p-4"
            >
              <div className="flex items-start gap-3">
                {a.media.coverImage?.large && (
                  <Image
                    src={a.media.coverImage.large}
                    alt={title}
                    width={72}
                    height={102}
                    className="h-[102px] w-[72px] rounded object-cover"
                  />
                )}
                <div className="flex-1">
                  <div className="text-base font-semibold">{title}</div>
                  <div className="text-sm text-gray-600">EP {a.episode}</div>
                  <div className="text-sm mt-1">播出：{formatLocal(dt)}</div>
                  <Link
                    href={`/title/${a.media.id}`}
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
    </main>
  );
}
