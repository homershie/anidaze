"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

interface ViewNavigationProps {
  viewMode: "week" | "month";
  weekOffset: number;
  monthOffset: number;
  translations: {
    previousWeek: string;
    nextWeek: string;
    previousMonth: string;
    nextMonth: string;
  };
}

export function ViewNavigation({
  viewMode,
  weekOffset,
  monthOffset,
  translations,
}: ViewNavigationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePrevious = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (viewMode === "week") {
      const newOffset = weekOffset - 1;
      if (newOffset === 0) {
        params.delete("weekOffset");
      } else {
        params.set("weekOffset", String(newOffset));
      }
      params.delete("monthOffset");
    } else {
      const newOffset = monthOffset - 1;
      if (newOffset === 0) {
        params.delete("monthOffset");
      } else {
        params.set("monthOffset", String(newOffset));
      }
      params.delete("weekOffset");
    }
    router.push(`/?${params.toString()}`);
  };

  const handleNext = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (viewMode === "week") {
      const newOffset = weekOffset + 1;
      params.set("weekOffset", String(newOffset));
      params.delete("monthOffset");
    } else {
      const newOffset = monthOffset + 1;
      params.set("monthOffset", String(newOffset));
      params.delete("weekOffset");
    }
    router.push(`/?${params.toString()}`);
  };

  const previousLabel =
    viewMode === "week"
      ? translations.previousWeek
      : translations.previousMonth;
  const nextLabel =
    viewMode === "week" ? translations.nextWeek : translations.nextMonth;

  return (
    <div className="flex items-center gap-2 justify-center md:justify-start">
      <Button
        variant="outline"
        size="sm"
        onClick={handlePrevious}
        className="flex items-center gap-1"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        <span className="hidden sm:inline">{previousLabel}</span>
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleNext}
        className="flex items-center gap-1"
      >
        <span className="hidden sm:inline">{nextLabel}</span>
        <ChevronRightIcon className="h-4 w-4" />
      </Button>
    </div>
  );
}

