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
        // 完全匹配 (例如: zh-TW)
        if (routing.locales.includes(code as AppLocale)) {
          locale = code as AppLocale;
          break;
        }
        // 部分匹配 (例如: zh -> zh-TW, ja -> ja, en -> en)
        if (code.startsWith("zh")) {
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
