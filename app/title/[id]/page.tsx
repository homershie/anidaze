import Link from "next/link";

export default async function TitlePage({
  params,
}: {
  params: { id: string };
}) {
  const id = params.id;
  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">作品 #{id}</h1>
        <a
          className="rounded bg-black px-3 py-1.5 text-white text-sm"
          href={`/api/ics/${id}`}
        >
          加入行事曆
        </a>
      </div>
      <div className="mt-4">
        <Link href="/" className="text-sm text-blue-600 hover:underline">
          ← 返回列表
        </Link>
      </div>
    </main>
  );
}


