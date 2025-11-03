import { NextResponse } from "next/server";
import {
  anilist,
  AIRING_BY_MEDIA_QUERY,
  type AiringByMediaResponse,
} from "@/lib/anilist";
import { buildICS, type IcsEvent } from "@/lib/ics";

function getByDayFromUTCDate(date: Date) {
  const map = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"] as const;
  return map[date.getUTCDay()];
}

export async function GET(
  req: Request,
  { params }: { params: { titleId: string } }
) {
  const mediaId = Number(params.titleId);
  if (!Number.isFinite(mediaId) || mediaId <= 0) {
    return NextResponse.json({ error: "Invalid titleId" }, { status: 400 });
  }

  const data = await anilist<AiringByMediaResponse>(
    AIRING_BY_MEDIA_QUERY,
    { mediaId, page: 1, perPage: 1 },
    { next: { revalidate: 60 * 60, tags: ["airing-ics", `ics-${mediaId}`] } }
  );

  const nextAiring = data.Page.airingSchedules[0];
  const media = data.Media;

  if (!media || !nextAiring) {
    return NextResponse.json(
      { error: "No upcoming airing found for this title" },
      { status: 404 }
    );
  }

  const start = new Date(nextAiring.airingAt * 1000);
  const end = new Date(start.getTime() + 24 * 60 * 1000); // assume ~24 min
  const title =
    media.title.romaji ||
    media.title.english ||
    media.title.native ||
    "Unknown";

  // Prefer configured base URL; fallback to request origin
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin || "";

  const byDay = getByDayFromUTCDate(start);

  const event: IcsEvent = {
    uid: `${media.id}-ep${nextAiring.episode}@anidaze.app`,
    start,
    end,
    summary: `${title} E${nextAiring.episode}（台北時間）`,
    url: `${baseUrl}/title/${media.id}#ep${nextAiring.episode}`,
    description: `連結： ${baseUrl}/title/${media.id}#ep${nextAiring.episode}`,
    location: "TV / Streaming",
    rrule: `FREQ=WEEKLY;BYDAY=${byDay}`,
  };

  const ics = buildICS([event]);
  const safeTitle = title.replace(/[^a-zA-Z0-9-_]+/g, "_");
  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename=${safeTitle}_AniDaze.ics`,
    },
  });
}
