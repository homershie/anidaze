import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { NextRequest, NextResponse } from "next/server";

const intlMiddleware = createMiddleware(routing);

export default function proxy(request: NextRequest) {
  // 調試：記錄請求路徑
  console.log("[proxy] Request path:", request.nextUrl.pathname);

  const response = intlMiddleware(request);

  // 當使用 localePrefix: 'never' 時，必須阻止路由重寫
  // 只保留 locale header，但不改變 URL 路徑
  if (response) {
    const rewriteHeader = response.headers.get("x-middleware-rewrite");
    const localeHeader = response.headers.get("x-next-intl-locale");

    // 如果檢測到重寫（例如 /en），移除重寫但保留 locale
    if (rewriteHeader) {
      console.log("[proxy] Detected rewrite to:", rewriteHeader);
      console.log("[proxy] Removing rewrite, keeping original path");

      // 創建新的響應，不進行重寫
      const newResponse = NextResponse.next();

      // 保留 locale header，讓 next-intl 知道當前語言
      if (localeHeader) {
        newResponse.headers.set("x-next-intl-locale", localeHeader);
        console.log("[proxy] Setting locale header:", localeHeader);
      }

      // 複製其他必要的 headers（保留 cookie 等）
      response.headers.forEach((value, key) => {
        if (key.startsWith("x-middleware-request-") && key.includes("cookie")) {
          // 保留 cookie 相關的 headers
        } else if (key === "x-next-intl-locale") {
          // locale header 已經設置
        }
      });

      return newResponse;
    }
  }

  return response || NextResponse.next();
}

export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
