import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "s4.anilist.co",
        pathname: "/file/anilistcdn/**",
      },
    ],
  },
  sassOptions: {
    // 抑制 @import 的 deprecation warning
    // Tailwind CSS v4 必須使用 @import，這是官方要求
    silenceDeprecations: ["import"],
  },
};

export default withNextIntl(nextConfig);
