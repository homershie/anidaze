import { NextResponse } from "next/server";
import {
  anilist,
  AIRING_BY_MEDIA_QUERY,
  type AiringByMediaResponse,
} from "@/lib/anilist";
import { buildICS, type IcsEvent } from "@/lib/ics";
import { getBestTitle } from "@/lib/title";
import { cookies } from "next/headers";
import { routing } from "@/i18n/routing";
import type { AppLocale } from "@/i18n/routing";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ titleId: string }> }
) {
  const { titleId } = await params;
  const mediaId = Number(titleId);
  if (!Number.isFinite(mediaId) || mediaId <= 0) {
    return NextResponse.json({ error: "Invalid titleId" }, { status: 400 });
  }

  const url = new URL(req.url);
  const perPage = Math.max(
    1,
    Math.min(50, Number(url.searchParams.get("perPage")) || 30)
  );

  const data = await anilist<AiringByMediaResponse>(
    AIRING_BY_MEDIA_QUERY,
    { mediaId, page: 1, perPage },
    { next: { revalidate: 60 * 30, tags: ["airing-ics", `ics-${mediaId}`] } }
  );

  const media = data.Media;

  if (!media || !data.Page.airingSchedules?.length) {
    return NextResponse.json(
      { error: "No upcoming airing found for this title" },
      { status: 404 }
    );
  }

  // Get locale from cookies (fallback to default)
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("NEXT_LOCALE")?.value;
  const locale: AppLocale =
    localeCookie && routing.locales.includes(localeCookie as AppLocale)
      ? (localeCookie as AppLocale)
      : routing.defaultLocale;

  const title = await getBestTitle(
    {
      romaji: media.title.romaji,
      english: media.title.english,
      native: media.title.native,
      synonyms: media.synonyms,
    },
    locale
  );

  // Prefer configured base URL; fallback to request origin
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin || "";

  const events: IcsEvent[] = data.Page.airingSchedules.map((s) => {
    const start = new Date(s.airingAt * 1000);
    const end = new Date(start.getTime() + 24 * 60 * 1000);
    return {
      uid: `${media.id}-ep${s.episode}@anidaze.app`,
      start,
      end,
      summary: `${title} E${s.episode}（台北時間）`,
      url: `${baseUrl}/title/${media.id}#ep${s.episode}`,
      description: `連結： ${baseUrl}/title/${media.id}#ep${s.episode}`,
      location: "TV / Streaming",
    };
  });

  const ics = buildICS(events);
  const safeTitle = title.replace(/[^a-zA-Z0-9-_]+/g, "_");
  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename=${safeTitle}_AniDaze.ics`,
    },
  });
}
