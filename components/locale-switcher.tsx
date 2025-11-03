"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { locales, localeNames, type AppLocale } from "@/i18n/routing";
import { useTransition } from "react";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";

export function LocaleSwitcher() {
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLocale = e.target.value as AppLocale;
    
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
    <NativeSelect
      value={locale}
      onChange={handleChange}
      aria-label="選擇語言"
      className="w-40"
    >
      {locales.map((loc) => (
        <NativeSelectOption key={loc} value={loc}>
          {localeNames[loc]}
        </NativeSelectOption>
      ))}
    </NativeSelect>
  );
}

