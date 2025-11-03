"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Sun, Moon, Monitor } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const t = useTranslations("theme");

  // 確保組件在客戶端掛載後才顯示（避免 hydration mismatch）
  useEffect(() => {
    setMounted(true);
  }, []);

  // 在 light -> dark -> system -> light 之間循環
  const cycleTheme = () => {
    const currentTheme = theme || "system";
    if (currentTheme === "light") {
      setTheme("dark");
    } else if (currentTheme === "dark") {
      setTheme("system");
    } else {
      setTheme("light");
    }
  };

  // 根據當前主題決定顯示的圖標和標題
  const getThemeIcon = () => {
    if (!mounted) return <Monitor className="size-4" />;
    
    const currentTheme = theme || "system";
    if (currentTheme === "light") {
      return <Sun className="size-4" />;
    } else if (currentTheme === "dark") {
      return <Moon className="size-4" />;
    } else {
      return <Monitor className="size-4" />;
    }
  };

  const getThemeLabel = () => {
    if (!mounted) return t("system");
    
    const currentTheme = theme || "system";
    if (currentTheme === "light") {
      return t("light");
    } else if (currentTheme === "dark") {
      return t("dark");
    } else {
      return t("system");
    }
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={cycleTheme}
      aria-label={t("label")}
      title={getThemeLabel()}
    >
      {getThemeIcon()}
      <span className="sr-only">{getThemeLabel()}</span>
    </Button>
  );
}

