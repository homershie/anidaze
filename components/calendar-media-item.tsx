"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import type { SeasonalMediaItem } from "@/lib/anilist";
import { getGenreColor, type GenreColor } from "@/lib/genre-colors";
import { cn } from "@/lib/utils";

interface CalendarMediaItemProps {
  mediaItem: SeasonalMediaItem & {
    displayTitle: string;
    isCurrentSeason: boolean;
    isAdult: boolean;
  };
  episode: number;
  translations: {
    episode: string;
    viewDetails: string;
    downloadIcal: string;
  };
  color?: GenreColor;
}

export function CalendarMediaItem({
  mediaItem,
  episode,
  translations,
  color,
}: CalendarMediaItemProps) {
  // 如果沒有提供顏色，根據類型自動獲取
  const itemColor = color || getGenreColor(mediaItem.genres);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div
          className={cn(
            "text-xs sm:text-sm truncate px-1 py-0.5 rounded cursor-pointer",
            itemColor.bg,
            itemColor.text,
            itemColor.hover
          )}
        >
          {mediaItem.displayTitle}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-3">
          <div className="flex gap-3">
            {mediaItem.coverImage?.large && (
              <Image
                src={mediaItem.coverImage.large}
                alt={mediaItem.displayTitle}
                width={72}
                height={102}
                className="h-[102px] w-[72px] rounded object-cover shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-base mb-1">
                {mediaItem.displayTitle}
              </h4>
              <p className="text-sm text-muted-foreground">
                {translations.episode}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/title/${mediaItem.id}`}>
                {translations.viewDetails}
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href={`/api/ics/${mediaItem.id}`}>
                {translations.downloadIcal}
              </a>
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
