"use client";

// 此組件需要 useEffect 來處理客戶端主題狀態，這是 next-themes 的標準用法
// 與 ThemeToggle 組件使用相同的模式

import Image from "next/image";
import { useTheme } from "next-themes";
import { useLocale } from "next-intl";
import { useEffect, useState, startTransition, useRef } from "react";
import { locales } from "@/i18n/routing";
import type { AppLocale } from "@/i18n/routing";

// 支援的語言列表（從路由配置導入）
const SUPPORTED_LOCALES: readonly AppLocale[] = locales;
// 支援的主題列表
const THEMES: readonly ("light" | "dark")[] = ["light", "dark"] as const;

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
  const preloadedRef = useRef(false);

  // 預載入所有可能的圖片組合（所有語言 x 所有主題）
  // 這樣在切換主題或語言時，圖片已經在瀏覽器快取中，可以立即顯示
  useEffect(() => {
    if (preloadedRef.current) return;
    preloadedRef.current = true;

    const preloadImages = () => {
      SUPPORTED_LOCALES.forEach((loc) => {
        const localeForFile = loc.toLowerCase().replace(/_/g, "-");
        THEMES.forEach((themeName) => {
          const imageSrc = `/logos/logo-${localeForFile}-${themeName}.png`;
          // 使用 Image 物件預載入圖片到瀏覽器快取
          const img = new window.Image();
          img.src = imageSrc;
        });
      });
    };

    // 使用 startTransition 來避免阻塞主線程
    startTransition(() => {
      preloadImages();
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
