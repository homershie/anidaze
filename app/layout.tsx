import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_SC } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getLocale, getTranslations } from "next-intl/server";
import { ThemeProvider } from "@/components/theme-provider";
import { SearchProvider } from "@/components/search-context";
import { HeaderWrapper } from "@/components/header-wrapper";
import { Footer } from "@/components/footer";
import { TypekitLoader } from "@/components/typekit-loader";
import { getCurrentSeason } from "@/lib/time";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { GoogleAnalytics } from "@/components/google-analytics";
import "./globals.scss";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Simplified Chinese font
const notoSansSC = Noto_Sans_SC({
  variable: "--font-noto-sans-sc",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
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
        "zh-CN": "/",
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

  // Use Noto Sans SC for Simplified Chinese
  const fontVariables = locale === "zh-CN"
    ? `${geistSans.variable} ${geistMono.variable} ${notoSansSC.variable}`
    : `${geistSans.variable} ${geistMono.variable}`;

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${fontVariables} antialiased`}
      >
        <TypekitLoader />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NextIntlClientProvider locale={locale} messages={messages}>
            <SearchProvider>
              <div className="mx-auto max-w-full p-0 relative top-[100px]">
                <HeaderWrapper />

                {children}

                <Footer />
              </div>
            </SearchProvider>
          </NextIntlClientProvider>
        </ThemeProvider>
        <GoogleAnalytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
