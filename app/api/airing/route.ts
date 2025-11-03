import { NextResponse } from "next/server";
import { anilist, AIRING_QUERY, type AiringResponse } from "@/lib/anilist";

// Revalidate every 6 hours (adjust as needed)
export const revalidate = 60 * 60 * 6;
export const dynamic = "force-static"; // tell Next this can be cached

export async function GET() {
  const data = await anilist<AiringResponse>(
    AIRING_QUERY,
    { page: 1, perPage: 50 },
    { next: { revalidate, tags: ["airing"] } }
  );
  return NextResponse.json(data);
}
