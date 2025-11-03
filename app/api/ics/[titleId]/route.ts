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
import {
  getTimezoneFromRequest,
  getDayOfWeekRRULE,
  getTimezoneDisplayName,
} from "@/lib/time";
import { getTranslations } from "next-intl/server";

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

  // Get timezone from request (query parameter, cookie, or default)
  const timezoneCookie = cookieStore.get("TIMEZONE")?.value;
  const timezone = getTimezoneFromRequest(url, timezoneCookie);

  // Get translations for i18n
  const t = await getTranslations({ locale });

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

  const schedules = data.Page.airingSchedules;
  if (schedules.length === 0) {
    return NextResponse.json(
      { error: "No upcoming airing found for this title" },
      { status: 404 }
    );
  }

  // 分析播出時間規律，生成 RRULE
  let rrule: string | undefined;

  if (schedules.length >= 2) {
    // 計算前兩個播出時間的間隔
    const firstTime = schedules[0].airingAt;
    const secondTime = schedules[1].airingAt;
    const intervalSeconds = secondTime - firstTime;
    const intervalDays = intervalSeconds / (24 * 60 * 60);

    // 如果間隔接近 7 天（允許 ±1 天的誤差），使用每週重複
    if (intervalDays >= 6 && intervalDays <= 8) {
      // 使用動態時區計算星期幾
      const dayOfWeek = getDayOfWeekRRULE(firstTime, timezone, "en-US");

      // 計算總集數（如果已知）
      const totalEpisodes = data.Media?.episodes;
      // 如果總集數未知，使用已知的播出時間數量或設定一個合理的上限（例如 50 集）
      const remainingEpisodes = totalEpisodes
        ? Math.max(1, totalEpisodes - schedules[0].episode + 1)
        : Math.max(30, schedules.length); // 至少 30 集，或使用已知的數量

      rrule = `FREQ=WEEKLY;BYDAY=${dayOfWeek};COUNT=${remainingEpisodes}`;
    }
  }

  // 如果無法確定規律，或只有一個播出時間，使用第一個播出時間生成單一事件
  // 但如果有規律，只生成一個帶有 RRULE 的事件
  const events: IcsEvent[] = [];

  // 取得時區顯示名稱（用於 i18n）
  const timezoneDisplayName = getTimezoneDisplayName(timezone);
  // 使用 locale 對應的時區名稱，如果沒有則回退到原始時區字串
  const timezoneName =
    timezoneDisplayName !== timezone
      ? timezoneDisplayName
      : timezone.replace(/_/g, " ");

  if (rrule) {
    // 生成單一重複事件
    const firstSchedule = schedules[0];
    const start = new Date(firstSchedule.airingAt * 1000);
    const end = new Date(start.getTime() + 24 * 60 * 1000);

    events.push({
      uid: `${media.id}-recurring@anidaze.app`,
      start,
      end,
      summary: `${title} (${timezoneName})`,
      url: `${baseUrl}/title/${media.id}`,
      description: `${t("ics.recurringDescription")}\n${t(
        "ics.link"
      )}: ${baseUrl}/title/${media.id}`,
      location: "TV / Streaming",
      rrule,
    });
  } else {
    // 如果無法確定規律，則生成所有已知的播出時間作為單獨事件
    events.push(
      ...schedules.map((s) => {
        const start = new Date(s.airingAt * 1000);
        const end = new Date(start.getTime() + 24 * 60 * 1000);
        return {
          uid: `${media.id}-ep${s.episode}@anidaze.app`,
          start,
          end,
          summary: `${title} E${s.episode} (${timezoneName})`,
          url: `${baseUrl}/title/${media.id}#ep${s.episode}`,
          description: `${t("ics.link")}: ${baseUrl}/title/${media.id}#ep${
            s.episode
          }`,
          location: "TV / Streaming",
        };
      })
    );
  }

  const ics = buildICS(events);

  // 清理檔名：移除 Windows 不允許的字元，保留中文、英文、數字等
  // 移除: < > : " / \ | ? * 和控制字元
  const safeTitle = title
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, "") // 移除 Windows 不允許的字元
    .replace(/\s+/g, " ") // 將多個空格合併為單個空格
    .trim();

  // 確保檔名不為空
  const finalTitle = safeTitle || "AniDaze";
  const filename = `${finalTitle}_AniDaze.ics`;

  // 使用 RFC 5987 格式支援 UTF-8 檔名（適用於現代瀏覽器）
  // 同時提供 ASCII fallback 以確保相容性
  const encodedFilename = encodeURIComponent(filename);
  const asciiFilename =
    finalTitle
      .replace(/[^\x00-\x7F]/g, "_") // 將非 ASCII 字元替換為底線
      .replace(/\s+/g, "_") // 將空格替換為底線
      .replace(/_+/g, "_") // 將多個底線合併為單個
      .replace(/^_+|_+$/g, "") || "AniDaze"; // 移除前後底線，如果為空則使用預設名稱

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${asciiFilename}_AniDaze.ics"; filename*=UTF-8''${encodedFilename}`,
    },
  });
}
