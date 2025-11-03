import { getRequestConfig } from "next-intl/server";
import { routing, type AppLocale } from "./routing";
import { cookies } from "next/headers";

export default getRequestConfig(async ({ requestLocale }) => {
  // 從 middleware 或 cookie 取得語言，如果沒有則使用預設語言
  let locale = (await requestLocale) as AppLocale | undefined;

  // 如果 middleware 沒有提供 locale，嘗試從 cookie 讀取
  if (!locale) {
    const cookieStore = await cookies();
    const localeCookie = cookieStore.get("NEXT_LOCALE")?.value;
    if (localeCookie && routing.locales.includes(localeCookie as AppLocale)) {
      locale = localeCookie as AppLocale;
    }
  }

  // 確保 locale 是有效的
  if (!locale || !routing.locales.includes(locale)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
