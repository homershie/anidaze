import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getLocale, getTranslations } from "next-intl/server";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { HomeStatsWrapper } from "@/components/home-stats-wrapper";
import { Logo } from "@/components/logo";
import { TypekitLoader } from "@/components/typekit-loader";
import { getCurrentSeason } from "@/lib/time";
import {
  anilist,
  SEASONAL_MEDIA_QUERY,
  ONGOING_MEDIA_QUERY,
  type SeasonalMediaResponse,
  type SeasonalMediaItem,
} from "@/lib/anilist";
import { getBestTitle } from "@/lib/title";
import type { AppLocale } from "@/i18n/routing";
import "./globals.css";

async function getAllSeasonalMedia(
  season: "WINTER" | "SPRING" | "SUMMER" | "FALL",
  seasonYear: number
): Promise<SeasonalMediaItem[]> {
  const allMedia: SeasonalMediaItem[] = [];
  let page = 1;
  const perPage = 50;
  let hasNextPage = true;

  while (hasNextPage) {
    const data = await anilist<SeasonalMediaResponse>(
      SEASONAL_MEDIA_QUERY,
      {
        page,
        perPage,
        season,
        seasonYear,
        status: ["RELEASING", "NOT_YET_RELEASED"],
      },
      { next: { revalidate: 60 * 60 * 6, tags: ["seasonal"] } }
    );

    allMedia.push(...data.Page.media);
    hasNextPage = data.Page.pageInfo.hasNextPage;
    page++;
  }

  return allMedia;
}

async function getAllOngoingMedia(
  season: "WINTER" | "SPRING" | "SUMMER" | "FALL",
  seasonYear: number
): Promise<SeasonalMediaItem[]> {
  const allMedia: SeasonalMediaItem[] = [];
  let page = 1;
  const perPage = 50;
  let hasNextPage = true;

  while (hasNextPage) {
    const data = await anilist<SeasonalMediaResponse>(
      ONGOING_MEDIA_QUERY,
      {
        page,
        perPage,
        status: ["RELEASING"],
      },
      { next: { revalidate: 60 * 60 * 6, tags: ["ongoing"] } }
    );

    const filtered = data.Page.media.filter(
      (media) => !(media.season === season && media.seasonYear === seasonYear)
    );

    allMedia.push(...filtered);
    hasNextPage = data.Page.pageInfo.hasNextPage;
    page++;
  }

  return allMedia;
}

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations();
  const { season, year } = getCurrentSeason();

  const seasonNames: Record<"WINTER" | "SPRING" | "SUMMER" | "FALL", string> = {
    WINTER: t("season.winter"),
    SPRING: t("season.spring"),
    SUMMER: t("season.summer"),
    FALL: t("season.fall"),
  };

  const siteName = "AniDaze";
  const title = t("app.title", { year, season: seasonNames[season] });
  const description = t("seo.description");
  const keywords = t("seo.keywords");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://anidaze.com";

  return {
    title: {
      default: title,
      template: `%s | ${siteName}`,
    },
    description,
    keywords: keywords.split(",").map((k) => k.trim()),
    authors: [{ name: siteName }],
    creator: siteName,
    publisher: siteName,
    metadataBase: new URL(siteUrl),
    alternates: {
      canonical: "/",
      languages: {
        "zh-TW": "/",
        ja: "/",
        en: "/",
      },
    },
    openGraph: {
      type: "website",
      locale: locale,
      url: siteUrl,
      siteName,
      title,
      description,
      images: [
        {
          url: "/web-app-manifest-512x512.png",
          width: 512,
          height: 512,
          alt: siteName,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/web-app-manifest-512x512.png"],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    icons: {
      icon: [
        { url: "/favicon.svg", type: "image/svg+xml" },
        { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
        { url: "/favicon.ico", sizes: "any" },
      ],
      shortcut: [{ url: "/favicon.ico" }],
      apple: [
        { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      ],
    },
    manifest: "/site.webmanifest",
    appleWebApp: {
      title: siteName,
      capable: true,
      statusBarStyle: "default",
    },
    verification: {
      // 可以在這裡添加 Google Search Console 驗證碼
      // google: "your-google-verification-code",
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  const t = await getTranslations();
  const { season, year } = getCurrentSeason();

  const seasonNames: Record<"WINTER" | "SPRING" | "SUMMER" | "FALL", string> = {
    WINTER: t("season.winter"),
    SPRING: t("season.spring"),
    SUMMER: t("season.summer"),
    FALL: t("season.fall"),
  };

  // 在 layout 中獲取統計數據（僅在首頁需要）
  // 注意：layout 無法直接訪問 searchParams，所以我們先獲取數據
  // searchParams 將由客戶端組件處理
  let statsData = null;
  try {
    const [seasonalMedia, ongoingMedia] = await Promise.all([
      getAllSeasonalMedia(season, year),
      getAllOngoingMedia(season, year),
    ]);

    const mediaMap = new Map<number, SeasonalMediaItem>();
    seasonalMedia.forEach((media) => mediaMap.set(media.id, media));
    ongoingMedia.forEach((media) => {
      if (!mediaMap.has(media.id)) {
        mediaMap.set(media.id, media);
      }
    });

    const allMedia = Array.from(mediaMap.values());
    const mediaWithAiringSchedule = allMedia.filter(
      (media) =>
        media.nextAiringEpisode !== null &&
        media.nextAiringEpisode !== undefined
    );

    const itemsWithTitles = await Promise.all(
      mediaWithAiringSchedule.map(async (media: SeasonalMediaItem) => {
        const title = await getBestTitle(
          {
            romaji: media.title.romaji,
            english: media.title.english,
            native: media.title.native,
            synonyms: media.synonyms,
          },
          locale as AppLocale
        );

        const isCurrentSeason =
          media.season === season && media.seasonYear === year;

        return {
          ...media,
          displayTitle: title,
          isCurrentSeason,
        };
      })
    );

    // 傳遞所有數據，讓客戶端組件根據 searchParams 過濾
    statsData = {
      allItems: itemsWithTitles,
      itemsWithTitlesCount: itemsWithTitles.length,
      itemsWithTitlesCurrentSeasonCount: itemsWithTitles.filter(
        (m) => m.isCurrentSeason
      ).length,
      itemsWithTitlesOngoingCount: itemsWithTitles.filter(
        (m) => !m.isCurrentSeason
      ).length,
    };
  } catch {
    // 如果獲取數據失敗（例如非首頁），則不設置 statsData
    statsData = null;
  }

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <TypekitLoader />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NextIntlClientProvider locale={locale} messages={messages}>
            <div className="mx-auto max-w-4xl p-6">
              <header className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <Logo
                    width={180}
                    height={54}
                    priority
                    className="hidden sm:block"
                  />
                  <h1 className="text-2xl font-bold sm:hidden">
                    {t("app.title", { year, season: seasonNames[season] })}
                  </h1>
                </div>
                <div className="flex items-center gap-4">
                  <ThemeToggle />
                  <LocaleSwitcher />
                </div>
              </header>
              <HomeStatsWrapper statsData={statsData} />
              {children}
            </div>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
