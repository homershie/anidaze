"use client";

import { PageStats } from "@/components/page-stats";

interface HomeStatsWrapperProps {
  statsData: {
    itemsWithTitlesCount: number;
    itemsWithTitlesCurrentSeasonCount: number;
    itemsWithTitlesOngoingCount: number;
    season: string;
  } | null;
}

export function HomeStatsWrapper({ statsData }: HomeStatsWrapperProps) {
  if (!statsData) {
    return null;
  }

  return (
    <PageStats
      totalCount={statsData.itemsWithTitlesCount}
      currentSeasonCount={statsData.itemsWithTitlesCurrentSeasonCount}
      ongoingCount={statsData.itemsWithTitlesOngoingCount}
      season={statsData.season}
    />
  );
}
