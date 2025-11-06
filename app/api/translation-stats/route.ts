import { NextRequest, NextResponse } from "next/server";
import {
  getTranslationStats,
  resetMonthlyUsage,
} from "@/lib/translation-cache";

/**
 * Translation Statistics API
 *
 * GET: Get current month's translation statistics
 * POST: Reset monthly usage counter (requires secret)
 */

const ADMIN_SECRET = process.env.REVALIDATE_SECRET;

/**
 * GET /api/translation-stats
 * Returns current translation usage statistics
 */
export async function GET() {
  try {
    const stats = await getTranslationStats();

    return NextResponse.json({
      ok: true,
      stats,
    });
  } catch (error) {
    console.error("Error fetching translation stats:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to fetch translation statistics",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/translation-stats?action=reset
 * Reset monthly usage counter (admin only or Vercel Cron)
 *
 * Accepts requests from:
 * - Vercel Cron Jobs (x-vercel-cron header)
 * - Authorized requests (with secret)
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    // Check if action is reset
    if (action !== "reset") {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid action. Use ?action=reset to reset monthly usage.",
        },
        { status: 400 }
      );
    }

    // Check if request is from Vercel Cron
    const cronSecret = request.headers.get("x-vercel-cron");
    const isFromCron = Boolean(cronSecret);

    // If not from Cron, verify secret
    if (!isFromCron && ADMIN_SECRET) {
      const secretFromQuery = searchParams.get("secret");
      const secretFromHeader = request.headers.get("x-secret");
      const providedSecret = secretFromQuery || secretFromHeader;

      if (providedSecret !== ADMIN_SECRET) {
        return NextResponse.json(
          {
            ok: false,
            error: "Unauthorized. Invalid or missing secret.",
          },
          { status: 401 }
        );
      }
    }

    // Reset monthly usage
    await resetMonthlyUsage();

    const stats = await getTranslationStats();

    return NextResponse.json({
      ok: true,
      message: "Monthly usage reset successfully",
      source: isFromCron ? "vercel-cron" : "manual",
      stats,
    });
  } catch (error) {
    console.error("Error resetting translation usage:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to reset translation usage",
      },
      { status: 500 }
    );
  }
}
