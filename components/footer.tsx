"use client";

import { useTranslations, useLocale } from "next-intl";
import { Github, Instagram } from "lucide-react";

export function Footer() {
  const t = useTranslations("footer");
  const locale = useLocale();

  return (
    <footer className="mt-16 border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center gap-4">
          {/* Translation Notice (只在繁體中文顯示) */}
          {locale === "zh-TW" && (
            <div className="w-full max-w-2xl rounded-lg border border-brand-yellow-200 bg-brand-yellow-50 p-4 text-center dark:border-brand-yellow-900/50 dark:bg-brand-yellow-950/20">
              <h3 className="text-sm font-semibold text-brand-yellow-500 dark:text-brand-yellow-400">
                {t("translationNotice")}
              </h3>
              <p className="mt-2 text-xs text-brand-yellow-500 dark:text-brand-yellow-400">
                {t("translationDetails")}
              </p>
            </div>
          )}

          {/* Copyright */}
          <div className="text-center text-sm text-muted-foreground">
            <p>{t("copyright", { year: new Date().getFullYear() })}</p>
            <p className="mt-1">{t("creator")}</p>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/homershie"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              aria-label={t("github")}
            >
              <Github className="h-5 w-5" />
              <span>GitHub</span>
            </a>
            <span className="text-muted-foreground/40">•</span>
            <a
              href="https://www.instagram.com/homer_create/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              aria-label={t("instagram")}
            >
              <Instagram className="h-5 w-5" />
              <span>Instagram</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
