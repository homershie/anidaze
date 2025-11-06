"use client";

import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useSearchContext } from "@/components/search-context";

export function SearchToggle() {
  const t = useTranslations("search");
  const { setIsSearchMode } = useSearchContext();

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setIsSearchMode(true)}
      aria-label={t("toggle")}
      title={t("toggle")}
    >
      <Search className="size-4" />
      <span className="sr-only">{t("toggle")}</span>
    </Button>
  );
}

