"use client";

import { useTranslations } from "next-intl";
import { Separator } from "@/components/ui/separator";

interface PageStatsProps {
  selectedCountry?: string | null;
  filteredItemsCount: number;
  filteredItemsCurrentSeasonCount: number;
  filteredItemsOngoingCount: number;
  itemsWithTitlesCount: number;
  itemsWithTitlesCurrentSeasonCount: number;
  itemsWithTitlesOngoingCount: number;
}

export function PageStats({
  selectedCountry,
  filteredItemsCount,
  filteredItemsCurrentSeasonCount,
  filteredItemsOngoingCount,
  itemsWithTitlesCount,
  itemsWithTitlesCurrentSeasonCount,
  itemsWithTitlesOngoingCount,
}: PageStatsProps) {
  const t = useTranslations();

  return (
    <>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        {selectedCountry && selectedCountry !== "" ? (
          <>
            {t("stats.totalWithCountry", {
              count: filteredItemsCount,
              currentSeason: filteredItemsCurrentSeasonCount,
              ongoing: filteredItemsOngoingCount,
              country: (t(
                `country.names.${selectedCountry}` as "country.names.JP"
              ) || selectedCountry) as string,
            })}
          </>
        ) : (
          <>
            {t("stats.total", {
              count: itemsWithTitlesCount,
              currentSeason: itemsWithTitlesCurrentSeasonCount,
              ongoing: itemsWithTitlesOngoingCount,
            })}
          </>
        )}
      </p>
      <Separator className="my-4" />
    </>
  );
}
