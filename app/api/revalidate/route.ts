import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

export async function POST(req: Request) {
  const { tag } = await req.json().catch(() => ({ tag: undefined }));
  if (!tag) return NextResponse.json({ error: "missing tag" }, { status: 400 });
  revalidateTag(tag, { expire: 0 });
  return NextResponse.json({ ok: true, revalidated: tag });
}
