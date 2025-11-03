"use client";

import { useSearchParams } from "next/navigation";
import { PageStats } from "@/components/page-stats";
import { useMemo } from "react";

interface Item {
  countryOfOrigin?: string | null;
  isCurrentSeason: boolean;
}

interface HomeStatsWrapperProps {
  statsData: {
    allItems: Item[];
    itemsWithTitlesCount: number;
    itemsWithTitlesCurrentSeasonCount: number;
    itemsWithTitlesOngoingCount: number;
  } | null;
}

export function HomeStatsWrapper({ statsData }: HomeStatsWrapperProps) {
  const searchParams = useSearchParams();
  const selectedCountry = searchParams.get("country");

  const computedStats = useMemo(() => {
    if (!statsData) {
      return null;
    }

    let filteredItems = statsData.allItems;
    if (selectedCountry && selectedCountry !== "") {
      filteredItems = statsData.allItems.filter(
        (item) => item.countryOfOrigin === selectedCountry
      );
    }

    return {
      filteredItemsCount: filteredItems.length,
      filteredItemsCurrentSeasonCount: filteredItems.filter(
        (m) => m.isCurrentSeason
      ).length,
      filteredItemsOngoingCount: filteredItems.filter((m) => !m.isCurrentSeason)
        .length,
      itemsWithTitlesCount: statsData.itemsWithTitlesCount,
      itemsWithTitlesCurrentSeasonCount:
        statsData.itemsWithTitlesCurrentSeasonCount,
      itemsWithTitlesOngoingCount: statsData.itemsWithTitlesOngoingCount,
    };
  }, [statsData, selectedCountry]);

  if (!computedStats || !statsData) {
    return null;
  }

  return (
    <PageStats
      selectedCountry={selectedCountry}
      filteredItemsCount={computedStats.filteredItemsCount}
      filteredItemsCurrentSeasonCount={
        computedStats.filteredItemsCurrentSeasonCount
      }
      filteredItemsOngoingCount={computedStats.filteredItemsOngoingCount}
      itemsWithTitlesCount={computedStats.itemsWithTitlesCount}
      itemsWithTitlesCurrentSeasonCount={
        computedStats.itemsWithTitlesCurrentSeasonCount
      }
      itemsWithTitlesOngoingCount={computedStats.itemsWithTitlesOngoingCount}
    />
  );
}
