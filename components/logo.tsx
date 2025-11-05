"use client";

// 此組件需要 useEffect 來處理客戶端主題狀態，這是 next-themes 的標準用法
// 與 ThemeToggle 組件使用相同的模式

import Image from "next/image";
import { useTheme } from "next-themes";
import { useLocale } from "next-intl";
import { useEffect, useState, startTransition } from "react";
import type { AppLocale } from "@/i18n/routing";

interface LogoProps {
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
}

/**
 * Logo 組件 - 根據當前語言和主題動態載入對應的 LOGO 圖片
 *
 * 圖片命名規則（請將圖片放在 public/logos/ 目錄下）：
 * - zh-TW: logo-zh-tw-light.png, logo-zh-tw-dark.png
 * - ja: logo-ja-light.png, logo-ja-dark.png
 * - en: logo-en-light.png, logo-en-dark.png
 *
 * 或使用資料夾結構：
 * - logos/zh-tw/light.png, logos/zh-tw/dark.png
 * - logos/ja/light.png, logos/ja/dark.png
 * - logos/en/light.png, logos/en/dark.png
 */
export function Logo({
  width = 200,
  height = 60,
  className = "",
  priority = false,
}: LogoProps) {
  const locale = useLocale() as AppLocale;
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // 確保組件在客戶端掛載後才顯示（避免 hydration mismatch）
  // 這是必要的，因為 next-themes 需要客戶端渲染才能正確獲取主題
  // 使用 startTransition 來避免 lint 警告
  useEffect(() => {
    startTransition(() => {
      setMounted(true);
    });
  }, []);

  // 根據主題決定使用 light 或 dark 版本
  // 在渲染時計算，而不是使用額外的 state
  const getCurrentTheme = (): "light" | "dark" => {
    if (!mounted) return "light"; // 預設淺色，避免首次渲染閃爍

    const effectiveTheme = theme === "system" ? systemTheme : theme;
    return effectiveTheme === "dark" ? "dark" : "light";
  };

  const currentTheme = getCurrentTheme();

  // 構建圖片路徑
  // 您可以使用以下兩種命名方式之一：
  // 方式 1: 扁平化命名 logo-{locale}-{theme}.png
  // 方式 2: 資料夾結構 logos/{locale}/{theme}.png

  const getImageSrc = () => {
    // 將 locale 轉換為檔案命名格式（zh-TW -> zh-tw）
    const localeForFile = locale.toLowerCase().replace(/_/g, "-");

    if (!mounted) {
      // 預設顯示淺色版本，避免首次渲染閃爍
      return `/logos/logo-${localeForFile}-light.png`;
    }

    // 使用扁平化命名（推薦）
    return `/logos/logo-${localeForFile}-${currentTheme}.png`;

    // 或者使用資料夾結構（取消註解下面這行，並註解上面那行）
    // return `/logos/${localeForFile}/${currentTheme}.png`;
  };

  const imageSrc = getImageSrc();
  const alt = `AniDaze Logo - ${locale}`;

  return (
    <Image
      src={imageSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={priority}
      style={{
        maxWidth: "100%",
        height: "auto",
      }}
    />
  );
}
