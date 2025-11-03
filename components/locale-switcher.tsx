"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { locales, localeNames, type AppLocale } from "@/i18n/routing";
import { useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function LocaleSwitcher() {
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const handleValueChange = (value: string) => {
    const newLocale = value as AppLocale;
    
    // 使用 router.replace 並設置 locale，next-intl 會處理 cookie 設置
    router.replace(pathname, { locale: newLocale });
    
    // 使用 startTransition 確保路由更新完成後再刷新
    startTransition(() => {
      // 強制重新載入頁面以立即應用語言切換
      // 對於 localePrefix: 'never'，這是必要的，因為語言是通過 cookie 設置的
      window.location.reload();
    });
  };

  return (
    <Select value={locale} onValueChange={handleValueChange}>
      <SelectTrigger className="w-40" aria-label="選擇語言">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {locales.map((loc) => (
          <SelectItem key={loc} value={loc}>
            {localeNames[loc]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

