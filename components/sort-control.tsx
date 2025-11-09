"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SortBy = "airingTime" | "title" | "score" | "popularity";
type SortOrder = "asc" | "desc";

interface SortControlProps {
  sortBy: SortBy;
  sortOrder: SortOrder;
  translations: {
    label: string;
    airingTime: string;
    title: string;
    score: string;
    popularity: string;
    asc: string;
    desc: string;
  };
}

export function SortControl({
  sortBy,
  sortOrder,
  translations,
}: SortControlProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSortByChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sortBy", value);
    router.push(`/?${params.toString()}`);
  };

  const handleSortOrderChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sortOrder", value);
    router.push(`/?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm text-muted-foreground">
        {translations.label}:
      </span>
      <Select value={sortBy} onValueChange={handleSortByChange}>
        <SelectTrigger className="w-36" aria-label={translations.label}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="airingTime">{translations.airingTime}</SelectItem>
          <SelectItem value="title">{translations.title}</SelectItem>
          <SelectItem value="score">{translations.score}</SelectItem>
          <SelectItem value="popularity">{translations.popularity}</SelectItem>
        </SelectContent>
      </Select>
      <Select value={sortOrder} onValueChange={handleSortOrderChange}>
        <SelectTrigger className="w-24" aria-label="Sort order">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="asc">{translations.asc}</SelectItem>
          <SelectItem value="desc">{translations.desc}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
