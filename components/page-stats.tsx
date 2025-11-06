"use client";

import { useTranslations } from "next-intl";
import { Separator } from "@/components/ui/separator";

interface PageStatsProps {
  totalCount: number;
  currentSeasonCount: number;
  ongoingCount: number;
  season: string;
}

export function PageStats({
  totalCount,
  currentSeasonCount,
  ongoingCount,
  season,
}: PageStatsProps) {
  const t = useTranslations();

  return (
    <>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        {t("stats.currentAiring", {
          count: totalCount,
          currentSeason: currentSeasonCount,
          ongoing: ongoingCount,
          season,
        })}
      </p>
      <Separator className="my-4" />
    </>
  );
}
