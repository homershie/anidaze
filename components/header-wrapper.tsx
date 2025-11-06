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
    <header className="min-h-[100px] flex flex-wrap items-center sm:justify-between justify-center gap-4 pt-4 pb-4 fixed top-0 left-0 right-0 z-50 bg-white dark:bg-surface-950 box-border">
      <div className="flex items-center gap-4 flex-shrink-0 ml-4">
        <Logo width={180} height={54} priority className="block" />
      </div>
      <div className="flex items-center gap-4 flex-shrink-0 mr-4">
        <SearchToggle />
        <ThemeToggle />
        <LocaleSwitcher />
      </div>

      <Separator className="absolute bottom-0 left-0 right-0" />
    </header>
  );
}
