"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { CountryTags } from "@/components/country-tags";
import { SortControl } from "@/components/sort-control";

interface ViewControlsProps {
  viewMode: "list" | "week" | "month";
  showAdult: boolean;
  selectedCountry: string;
  countryOptions: Array<{
    group: string;
    countries: Array<{ code: string; name: string }>;
  }>;
  sortBy?: "airingTime" | "title" | "score" | "popularity";
  sortOrder?: "asc" | "desc";
  translations: {
    list: string;
    week: string;
    month: string;
    showAdult: string;
    allCountries: string;
    sortLabel: string;
    sortAiringTime: string;
    sortTitle: string;
    sortScore: string;
    sortPopularity: string;
    sortAsc: string;
    sortDesc: string;
  };
}

export function ViewControls({
  viewMode,
  showAdult,
  selectedCountry,
  countryOptions,
  sortBy = "airingTime",
  sortOrder = "asc",
  translations,
}: ViewControlsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleViewModeChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("viewMode", value);
    // 切換視圖模式時，重置偏移量
    params.delete("weekOffset");
    params.delete("monthOffset");
    router.push(`/?${params.toString()}`);
  };

  const handleShowAdultChange = (checked: boolean) => {
    const params = new URLSearchParams(searchParams.toString());
    if (checked) {
      params.set("showAdult", "true");
    } else {
      params.delete("showAdult");
    }
    router.push(`/?${params.toString()}`);
  };

  return (
    <div className="flex flex-col gap-4 mt-6">
      <div className="flex items-center justify-center sm:justify-between flex-wrap gap-4">
        <Tabs value={viewMode} onValueChange={handleViewModeChange}>
          <TabsList>
            <TabsTrigger value="list">{translations.list}</TabsTrigger>
            <TabsTrigger value="week">{translations.week}</TabsTrigger>
            <TabsTrigger value="month">{translations.month}</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch
              id="showAdult"
              checked={showAdult}
              onCheckedChange={handleShowAdultChange}
            />
            <Label
              htmlFor="showAdult"
              className="text-sm cursor-pointer font-normal"
            >
              {translations.showAdult}
            </Label>
          </div>

          <CountryTags
            selectedCountry={selectedCountry}
            countryOptions={countryOptions}
            allCountriesText={translations.allCountries}
          />
        </div>
      </div>

      {/* 只在列表視圖顯示排序控制 */}
      {viewMode === "list" && (
        <div className="flex justify-center sm:justify-start">
          <SortControl
            sortBy={sortBy}
            sortOrder={sortOrder}
            translations={{
              label: translations.sortLabel,
              airingTime: translations.sortAiringTime,
              title: translations.sortTitle,
              score: translations.sortScore,
              popularity: translations.sortPopularity,
              asc: translations.sortAsc,
              desc: translations.sortDesc,
            }}
          />
        </div>
      )}
    </div>
  );
}
