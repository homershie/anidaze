"use client";

import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { SearchToggle } from "@/components/search-toggle";
import { SearchHeader } from "@/components/search-header";
import { useSearchContext } from "@/components/search-context";
import { Separator } from "@/components/ui/separator";

export function HeaderWrapper() {
  const { isSearchMode } = useSearchContext();

  if (isSearchMode) {
    return <SearchHeader />;
  }

  return (
    <header className="min-h-[80px] flex flex-wrap items-center sm:justify-between justify-center gap-4">
      <div className="flex items-center gap-4 flex-shrink-0">
        <Logo width={180} height={54} priority className="block" />
      </div>
      <div className="flex items-center gap-4 flex-shrink-0">
        <SearchToggle />
        <ThemeToggle />
        <LocaleSwitcher />
      </div>

      <Separator />
    </header>
  );
}
