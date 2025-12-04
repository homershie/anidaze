import {defineRouting} from 'next-intl/routing';

export const locales = ['zh-TW', 'zh-CN', 'ja', 'en'] as const;
export type AppLocale = typeof locales[number];

export const defaultLocale: AppLocale = 'zh-TW';

export const routing = defineRouting({
  // 使用 cookie/瀏覽器偵測，不使用路徑前綴
  localePrefix: 'never',
  locales,
  defaultLocale
});

export const localeNames: Record<AppLocale, string> = {
  'zh-TW': '繁體中文',
  'zh-CN': '简体中文',
  ja: '日本語',
  en: 'English'
};


