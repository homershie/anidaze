"use client";

import { useState } from "react";
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
  translations,
  color,
}: CalendarMediaItemProps) {
  // 如果沒有提供顏色，根據類型自動獲取
  const itemColor = color || getGenreColor(mediaItem.genres);
  const [open, setOpen] = useState(false);

  // 處理點擊「查看詳情」時關閉 Popover 並導航
  // 使用完整頁面導航避免 React DOM 操作衝突
  const handleViewDetails = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // 立即關閉 Popover（不等待動畫）
    setOpen(false);

    // 使用完整頁面導航，避免 React 在路由切換時的 DOM 操作錯誤
    // 這會導致頁面重新載入，但可以完全避免 removeChild 錯誤
    // 使用 requestAnimationFrame 確保 DOM 更新完成
    requestAnimationFrame(() => {
      window.location.href = `/title/${mediaItem.id}`;
    });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          className={cn(
            "min-h-[1.25rem] text-[0.5rem] sm:text-xs md:text-sm truncate px-1 py-0.5 rounded cursor-pointer",
            itemColor.bg,
            itemColor.text,
            itemColor.hover
          )}
        >
          {mediaItem.displayTitle}
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="w-80"
        disablePortal={true}
        onInteractOutside={() => setOpen(false)}
      >
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
            <Button variant="outline" size="sm" onClick={handleViewDetails}>
              {translations.viewDetails}
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
