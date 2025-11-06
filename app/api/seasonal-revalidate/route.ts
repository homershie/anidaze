import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getCurrentSeason } from "@/lib/time";

/**
 * 檢查是否為季節切換日（1/1、4/1、7/1、10/1）
 */
function isSeasonChangeDay(): boolean {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12
  const day = now.getDate();

  // 季節切換日：1/1, 4/1, 7/1, 10/1
  return (
    (month === 1 && day === 1) ||
    (month === 4 && day === 1) ||
    (month === 7 && day === 1) ||
    (month === 10 && day === 1)
  );
}

/**
 * 驗證請求是否來自 Vercel Cron Job 或授權來源
 */
function isAuthorizedRequest(req: Request): boolean {
  // 檢查是否來自 Vercel Cron（Vercel 會自動加入這個 header）
  const cronSecret = req.headers.get("x-vercel-cron");
  if (cronSecret) {
    return true;
  }

  // 檢查是否有設定 REVALIDATE_SECRET 環境變數
  const envSecret = process.env.REVALIDATE_SECRET;
  if (!envSecret) {
    // 如果沒有設定 secret，允許所有請求（開發環境或簡單部署）
    return true;
  }

  // 檢查 query parameter 或 header 中的 secret
  const url = new URL(req.url);
  const secret = url.searchParams.get("secret") || req.headers.get("x-secret");
  return secret === envSecret;
}

/**
 * GET: 檢查並在季節切換日自動清除快取
 * POST: 強制清除快取（用於 cron job）
 */
export async function GET(req: Request) {
  // 驗證請求來源
  if (!isAuthorizedRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const force = url.searchParams.get("force") === "true";

  // 如果不是季節切換日且沒有強制參數，則不執行
  if (!force && !isSeasonChangeDay()) {
    const { season, year } = getCurrentSeason();
    return NextResponse.json({
      ok: false,
      message: "Not a season change day",
      currentSeason: { season, year },
      nextSeasonChangeDays: [
        `${year}-01-01`,
        `${year}-04-01`,
        `${year}-07-01`,
        `${year}-10-01`,
      ],
    });
  }

  // 清除季節相關的快取
  try {
    revalidateTag("seasonal", { expire: 0 });
    revalidateTag("ongoing", { expire: 0 });
    revalidateTag("airing", { expire: 0 });

    const { season, year } = getCurrentSeason();

    return NextResponse.json({
      ok: true,
      message: "Cache revalidated successfully",
      currentSeason: { season, year },
      revalidatedTags: ["seasonal", "ongoing", "airing"],
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * POST: 強制清除快取（用於 cron job 或手動觸發）
 * 可以選擇性地傳入 secret 來保護 API
 */
export async function POST(req: Request) {
  // 驗證請求來源
  if (!isAuthorizedRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    revalidateTag("seasonal", { expire: 0 });
    revalidateTag("ongoing", { expire: 0 });
    revalidateTag("airing", { expire: 0 });

    const { season, year } = getCurrentSeason();

    return NextResponse.json({
      ok: true,
      message: "Cache revalidated successfully",
      currentSeason: { season, year },
      revalidatedTags: ["seasonal", "ongoing", "airing"],
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
