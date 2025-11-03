import { NextResponse } from "next/server";
import {
  anilist,
  AIRING_QUERY,
  type AiringResponse,
  type AiringItem,
} from "@/lib/anilist";
import { buildICS, type IcsEvent } from "@/lib/ics";
import { getBestTitle } from "@/lib/title";

export async function GET() {
  const data = await anilist<AiringResponse>(
    AIRING_QUERY,
    { page: 1, perPage: 10 },
    { next: { revalidate: 60 * 60 * 6, tags: ["airing-ics"] } }
  );

  // Get titles with TMDB Chinese support
  const eventsWithTitles = await Promise.all(
    data.Page.airingSchedules.map(async (a: AiringItem) => {
      const start = new Date(a.airingAt * 1000); // AniList returns unix seconds
      const end = new Date(start.getTime() + 24 * 60 * 1000); // assume 24 min runtime
      const title = await getBestTitle({
        romaji: a.media.title.romaji,
        english: a.media.title.english,
        native: a.media.title.native,
        synonyms: a.media.synonyms,
      });
      return {
        uid: `${a.media.id}-ep${a.episode}@anidaze.app`,
        start,
        end,
        summary: `${title} EP${a.episode}`,
        url: `${process.env.NEXT_PUBLIC_APP_URL}/title/${a.media.id}#ep${a.episode}`,
      };
    })
  );

  const events: IcsEvent[] = eventsWithTitles;

  const ics = buildICS(events);
  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename=AniDaze_Sample.ics`,
    },
  });
}
