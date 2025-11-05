# SEO 設定文檔

本文檔說明 AniDaze 網站的 SEO（搜尋引擎優化）設定內容。

## 概述

AniDaze 是一個動畫播出時間追蹤工具，已針對搜尋引擎進行全面優化，包括：
- 動態 metadata 生成
- Open Graph 和 Twitter Cards 支援
- 結構化資料（JSON-LD）
- 多語系 SEO 支援
- 響應式圖片優化

## 已設定的 SEO 項目

### 1. Root Layout Metadata（`app/layout.tsx`）

#### 基本資訊
- **標題**：動態生成，根據當前季節自動更新（例如：「AniDaze — 2025年春季動畫」）
- **描述**：多語系描述，從翻譯檔案中讀取
- **關鍵字**：包含動畫、播出時間、AniList、MyAnimeList 等相關關鍵字
- **網站名稱**：AniDaze

#### Open Graph（OG）標籤
- `og:type`: website
- `og:title`: 動態標題（根據當前季節）
- `og:description`: 網站描述
- `og:image`: 使用網站圖示（512x512 PNG）
- `og:url`: 網站 URL（可通過 `NEXT_PUBLIC_SITE_URL` 環境變數設定）
- `og:locale`: 根據使用者語言設定

#### Twitter Cards
- `twitter:card`: summary_large_image
- `twitter:title`: 動態標題
- `twitter:description`: 網站描述
- `twitter:image`: 網站圖示

#### Robots 設定
- `index`: true（允許搜尋引擎索引）
- `follow`: true（允許搜尋引擎追蹤連結）
- Google Bot 設定：
  - `max-video-preview`: -1（無限制）
  - `max-image-preview`: large（大型圖片預覽）
  - `max-snippet`: -1（無限制）

#### 多語系支援
- 支援繁體中文（zh-TW）、日語（ja）、英語（en）
- 使用 `alternates.languages` 標記多語系版本
- 使用 cookie 方式切換語言（非 URL 前綴）

#### 其他設定
- Canonical URL：指向首頁
- Apple Web App 設定：支援添加到主畫面
- Favicon 設定：支援多種格式（PNG、SVG、ICO）
- Web Manifest：支援 PWA 功能

### 2. 動畫詳情頁 Metadata（`app/title/[id]/page.tsx`）

#### 動態 Metadata
每個動畫詳情頁都會動態生成以下 metadata：

- **標題**：使用最佳標題（根據語言偏好選擇）
- **描述**：從 AniList 資料中提取，清理 HTML 標籤，限制在 300 字元內
- **關鍵字**：包含動畫標題（多語言版本）、類型、相關關鍵字
- **圖片**：使用動畫封面圖（extraLarge 或 large）

#### Open Graph
- `og:type`: website
- `og:title`: 動畫標題
- `og:description`: 動畫描述
- `og:image`: 動畫封面圖（1200x630，適合社交分享）
- `og:url`: 動畫詳情頁 URL

#### Twitter Cards
- `twitter:card`: summary_large_image
- `twitter:title`: 動畫標題
- `twitter:description`: 動畫描述
- `twitter:image`: 動畫封面圖

#### 結構化資料（JSON-LD）

使用 Schema.org 的 `TVSeries` 類型，包含：

```json
{
  "@context": "https://schema.org",
  "@type": "TVSeries",
  "name": "動畫標題",
  "alternateName": ["英文標題", "羅馬字標題", "日文標題"],
  "description": "動畫描述",
  "image": "封面圖 URL",
  "url": "頁面 URL",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "評分",
    "bestRating": "10",
    "worstRating": "1",
    "ratingCount": "評分人數"
  },
  "genre": ["類型1", "類型2"],
  "productionCompany": [
    {
      "@type": "Organization",
      "name": "製作公司名稱"
    }
  ],
  "numberOfEpisodes": "集數",
  "datePublished": "發布日期"
}
```

### 3. 翻譯檔案 SEO 內容

三個語言版本的翻譯檔案都包含 SEO 相關內容：

#### 繁體中文（`messages/zh-TW.json`）
- `seo.description`: "AniDaze 是您的動畫播出時間追蹤工具，提供當前季節動畫和長期播放作品的詳細播出時間表。支援下載 iCal 日曆檔案，隨時掌握最新動畫資訊。"
- `seo.keywords`: "動畫,播出時間,動畫時程,AniList,MyAnimeList,動畫日曆,動畫追蹤,新番動畫,春季動畫,夏季動畫,秋季動畫,冬季動畫"

#### 英語（`messages/en.json`）
- `seo.description`: "AniDaze is your anime airing schedule tracker. Get detailed airing schedules for current season anime and ongoing series. Download iCal calendar files and stay updated with the latest anime information."
- `seo.keywords`: "anime,airing schedule,anime calendar,AniList,MyAnimeList,anime tracker,seasonal anime,spring anime,summer anime,fall anime,winter anime"

#### 日語（`messages/ja.json`）
- `seo.description`: "AniDazeは、アニメの放送スケジュールを追跡するツールです。今期のアニメと長期放送作品の詳細な放送スケジュールを提供します。iCalカレンダーファイルをダウンロードして、最新のアニメ情報を常に把握できます。"
- `seo.keywords`: "アニメ,放送時間,アニメスケジュール,AniList,MyAnimeList,アニメカレンダー,アニメ追跡,新作アニメ,春季アニメ,夏季アニメ,秋季アニメ,冬季アニメ"

## 環境變數設定

### 必需設定

在 `.env.local` 或部署環境中設定：

```bash
# 網站 URL（用於生成 canonical URL 和 Open Graph）
NEXT_PUBLIC_SITE_URL=https://anidaze.com
```

如果不設定，預設值為 `https://anidaze.com`。

### 可選設定

#### Google Search Console 驗證

在 `app/layout.tsx` 的 `generateMetadata` 函數中，可以添加 Google Search Console 驗證碼：

```typescript
verification: {
  google: "your-google-verification-code",
},
```

## SEO 最佳實踐

### 1. 標題優化
- ✅ 使用描述性且相關的標題
- ✅ 標題長度控制在 50-60 字元內
- ✅ 使用標題模板（`%s | AniDaze`）保持一致性

### 2. 描述優化
- ✅ 描述長度控制在 150-160 字元內
- ✅ 包含主要關鍵字
- ✅ 清楚說明網站功能

### 3. 圖片優化
- ✅ 使用適當的圖片尺寸（OG 圖片：1200x630）
- ✅ 提供 alt 文字
- ✅ 使用 Next.js Image 組件進行優化

### 4. 結構化資料
- ✅ 使用 Schema.org 標準
- ✅ 提供完整的動畫資訊
- ✅ 包含評分和製作公司資訊

### 5. 效能優化
- ✅ 使用 Next.js 的 metadata API 進行靜態生成
- ✅ 設定適當的 revalidate 時間（24 小時）
- ✅ 使用 Next.js Image 組件自動優化圖片

## 測試 SEO 設定

### 1. 使用 Google Rich Results Test
訪問 https://search.google.com/test/rich-results 測試結構化資料。

### 2. 使用 Facebook Sharing Debugger
訪問 https://developers.facebook.com/tools/debug/ 測試 Open Graph 標籤。

### 3. 使用 Twitter Card Validator
訪問 https://cards-dev.twitter.com/validator 測試 Twitter Cards。

### 4. 使用 Google Search Console
- 提交 sitemap.xml（如果有的話）
- 監控索引狀態
- 查看搜尋表現

## 未來改進建議

1. **生成 sitemap.xml**：自動生成包含所有動畫頁面的 sitemap
2. **生成 robots.txt**：設定爬蟲規則
3. **添加 breadcrumbs 結構化資料**：改善導航體驗
4. **添加 FAQ 結構化資料**：如果添加 FAQ 頁面
5. **添加 Review 結構化資料**：整合使用者評分
6. **多語系 URL**：考慮使用 URL 前綴（如 `/zh-TW/`, `/ja/`, `/en/`）而非 cookie

## 相關檔案

- `app/layout.tsx` - Root layout 和 metadata 設定
- `app/title/[id]/page.tsx` - 動畫詳情頁和動態 metadata
- `messages/zh-TW.json` - 繁體中文翻譯（包含 SEO 內容）
- `messages/en.json` - 英語翻譯（包含 SEO 內容）
- `messages/ja.json` - 日語翻譯（包含 SEO 內容）

## 參考資源

- [Next.js Metadata API](https://nextjs.org/docs/app/api-reference/functions/generate-metadata)
- [Schema.org TVSeries](https://schema.org/TVSeries)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Cards](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
- [Google Search Central](https://developers.google.com/search)

