import { NextResponse } from "next/server";
import { anilist, AIRING_QUERY } from "@/lib/anilist";
import type { AiringQuery } from "@/lib/__generated__/types.generated";

export async function GET() {
  const data = await anilist<AiringQuery>(
    AIRING_QUERY,
    { page: 1, perPage: 50 },
    { next: { revalidate: 60 * 60 * 6, tags: ["airing"] } }
  );
  return NextResponse.json(data);
}
