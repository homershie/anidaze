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
import { useState } from "react";

export function SearchHeader() {
  const t = useTranslations("search");
  const { setIsSearchMode } = useSearchContext();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

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
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: 實作搜尋邏輯
    console.log("Search:", searchQuery, "Category:", selectedCategory);
  };

  return (
    <header className="min-h-[80px] flex flex-wrap items-center sm:justify-between justify-center gap-4">
      <div className="flex items-center gap-4 flex-shrink-0 w-full sm:w-auto">
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
        <h1 className="text-2xl text-black/70 dark:text-white/70 font-medium">
          {t("title")}
        </h1>
      </div>
      <div className="flex items-center gap-4 flex-shrink-0 w-full sm:w-auto">
        <form
          onSubmit={handleSearch}
          className="flex-1 sm:flex-initial min-w-0"
        >
          <InputGroup className="w-full sm:w-auto min-w-[300px] min-h-[40px]">
            <InputGroupInput
              placeholder={t("placeholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <InputGroupAddon align="inline-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <InputGroupButton
                    variant="ghost"
                    className="!pr-1.5 text-xs"
                    type="button"
                  >
                    {selectedCategoryLabel}
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
                className="bg-transparent text-black/70 dark:text-white/70 hover:bg-brand-blue-800 hover:text-white"
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
      <Separator />
    </header>
  );
}
