import { getRequestConfig } from "next-intl/server";
import { routing, type AppLocale } from "./routing";
import { cookies, headers } from "next/headers";

export default getRequestConfig(async ({ requestLocale }) => {
  // 優先順序：middleware > cookie > Accept-Language header > 預設語言
  let locale = (await requestLocale) as AppLocale | undefined;

  // 如果 middleware 沒有提供 locale，嘗試從 cookie 讀取
  if (!locale) {
    const cookieStore = await cookies();
    const localeCookie = cookieStore.get("NEXT_LOCALE")?.value;
    if (localeCookie && routing.locales.includes(localeCookie as AppLocale)) {
      locale = localeCookie as AppLocale;
    }
  }

  // 如果還是沒有 locale，嘗試從 Accept-Language header 讀取
  if (!locale) {
    const headersList = await headers();
    const acceptLanguage = headersList.get("accept-language");
    
    if (acceptLanguage) {
      // 解析 Accept-Language header (例如: "zh-TW,zh;q=0.9,en;q=0.8")
      const languages = acceptLanguage
        .split(",")
        .map((lang) => {
          const [code, q = "q=1"] = lang.trim().split(";");
          const quality = parseFloat(q.replace("q=", ""));
          return { code: code.trim().toLowerCase(), quality };
        })
        .sort((a, b) => b.quality - a.quality);

      // 嘗試匹配支援的語言
      for (const { code } of languages) {
        // Case-insensitive 完全匹配 (例如: zh-tw -> zh-TW, zh-cn -> zh-CN)
        const matchedLocale = routing.locales.find(l => l.toLowerCase() === code);
        if (matchedLocale) {
          locale = matchedLocale;
          break;
        }

        // 語言前綴匹配 (例如: zh-CN, zh-Hans -> zh-CN)
        if (code.startsWith("zh-cn") || code.startsWith("zh-hans")) {
          locale = "zh-CN";
          break;
        } else if (code.startsWith("zh-tw") || code.startsWith("zh-hant")) {
          locale = "zh-TW";
          break;
        } else if (code.startsWith("zh")) {
          // zh 不帶後綴的預設為繁體中文（為了向下相容）
          locale = "zh-TW";
          break;
        } else if (code.startsWith("ja")) {
          locale = "ja";
          break;
        } else if (code.startsWith("en")) {
          locale = "en";
          break;
        }
      }
    }
  }

  // 確保 locale 是有效的，否則使用預設語言
  if (!locale || !routing.locales.includes(locale)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
