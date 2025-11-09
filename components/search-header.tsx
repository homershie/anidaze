"use client";

import { ArrowLeft, Search as SearchIcon, ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSearchContext } from "@/components/search-context";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

export function SearchHeader() {
  const t = useTranslations("search");
  const { setIsSearchMode } = useSearchContext();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // 從 URL 參數初始化搜尋狀態
  useEffect(() => {
    const query = searchParams.get("q") || "";
    const category = searchParams.get("category") || "all";
    setSearchQuery(query);
    setSelectedCategory(category);
  }, [searchParams]);

  const categories = [
    { value: "all", label: t("category.all") },
    { value: "title", label: t("category.title") },
    { value: "genre", label: t("category.genre") },
    { value: "studio", label: t("category.studio") },
  ];

  const selectedCategoryLabel =
    categories.find((cat) => cat.value === selectedCategory)?.label ||
    categories[0].label;

  const handleBack = () => {
    setIsSearchMode(false);
    // 返回時清除搜尋參數
    const params = new URLSearchParams(searchParams.toString());
    params.delete("q");
    params.delete("category");
    router.push(`/?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // 通過 URL 參數傳遞搜尋查詢
    const params = new URLSearchParams(searchParams.toString());
    params.set("q", searchQuery);
    params.set("category", selectedCategory);
    router.push(`/?${params.toString()}`);
  };

  return (
    <header className="min-h-[100px] flex items-center gap-4 pt-4 pb-4 fixed top-0 left-0 right-0 z-50 bg-white dark:bg-surface-950 box-border">
      <div className="flex items-center gap-4 flex-shrink-0 ml-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          aria-label={t("back")}
          title={t("back")}
        >
          <ArrowLeft className="size-4" />
          <span className="sr-only">{t("back")}</span>
        </Button>
        <h1 className="text-2xl hidden sm:block text-black/70 dark:text-white/70 font-medium whitespace-nowrap">
          {t("title")}
        </h1>
      </div>
      <div className="flex items-center justify-end gap-4 flex-1 min-w-0 mr-4">
        <form
          onSubmit={handleSearch}
          className="flex-shrink min-w-0 w-full max-w-[400px]"
        >
          <InputGroup className="w-full min-w-0 min-h-[40px]">
            <InputGroupInput
              placeholder={t("placeholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="min-w-0"
            />
            <InputGroupAddon align="inline-end" className="flex-shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <InputGroupButton
                    variant="ghost"
                    className="!pr-1.5 text-xs whitespace-nowrap"
                    type="button"
                  >
                    <span className="hidden sm:inline">
                      {selectedCategoryLabel}
                    </span>
                    <span className="sm:hidden">類</span>
                    <ChevronDown className="size-3" />
                  </InputGroupButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="[--radius:0.95rem]">
                  {categories.map((category) => (
                    <DropdownMenuItem
                      key={category.value}
                      onClick={() => setSelectedCategory(category.value)}
                    >
                      {category.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <InputGroupButton
                variant="default"
                className="bg-transparent text-black/70 dark:text-white/70 hover:bg-brand-blue-800 hover:text-white flex-shrink-0"
                size="icon-sm"
                type="submit"
                aria-label={t("submit")}
              >
                <SearchIcon className="size-3" />
                <span className="sr-only">{t("submit")}</span>
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </form>
      </div>
      <Separator className="absolute bottom-0 left-0 right-0" />
    </header>
  );
}
