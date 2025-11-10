# AniDaze（動畫時日）

AniDaze 是一個以「動畫日曆」與「作品查詢」為核心的 Next.js App Router 專案，目標是練習並整合現代 React / Next 生態，包括 GraphQL、國際化、快取策略、SEO 優化與多平台資料整合等實務。

---

## 專案資訊

- **類型**：Next.js 16.0.1 Side Project
- **語言與技術棧**：TypeScript、React 19、Next.js（App Router）、Tailwind CSS 4、GraphQL
- **目標**：動畫播放日曆與作品資訊查詢網頁應用
- **部署平台**：Vercel

---

## 專案簡介

使用者可以瀏覽當季播出的動畫、查詢作品資訊、透過多種檢視模式（列表、週檢視、月檢視）瀏覽播出時間表，並支援多語言介面切換、搜尋、排序與篩選功能。

本專案整合了多個動漫資料平台（AniList、Bangumi、MyAnimeList、TMDB），提供完整的作品資訊、評分、播出時間與翻譯，並實作了 SSR / ISR 快取策略、SEO 優化與 PWA 支援。

---

## 核心功能（Core Features）

### 資料整合與顯示
- 📅 透過 AniList GraphQL API 取得動畫季番與播放時間表
- 🌐 **多平台資料整合**：
  - **AniList**: 動畫基本資訊、播放時間、評分與排名
  - **Bangumi**: 日文作品簡介與評分
  - **MyAnimeList (Jikan)**: MAL 評分與排名
  - **TMDB**: 中文標題翻譯與作品海報
  - **Wikipedia**: TMDB 的備援中文標題來源
- 📊 多平台評分顯示（AniList、MyAnimeList、Bangumi）

### 檢視與操作
- 📋 **三種檢視模式**：
  - **列表檢視**：完整資訊卡片列表，支援排序與篩選
  - **週檢視**：以一週七天為單位的時間表格檢視
  - **月檢視**：以月份為單位的日曆檢視
- 🔍 **智慧搜尋功能**：
  - 支援多語言搜尋（標題的羅馬拼音、英文、日文、中文）
  - 分類搜尋（全部、標題、類別、製作公司）
  - 即時搜尋結果更新
- 🔄 **排序功能**：
  - 播出時間排序
  - 標題排序
  - 評分排序
  - 人氣度排序
  - 支援升序/降序切換
- 🌏 **國家/地區篩選**：按製作國家過濾作品
- 🔞 **成人內容篩選開關**

### 翻譯系統
- 🈯 **智慧翻譯系統**：
  - 使用 DeepL API 自動翻譯日文簡介為繁體中文
  - Vercel KV (Redis) 快取翻譯結果，降低 API 使用量
  - 每月 500,000 字元免費配額管理
  - 超限自動降級為顯示原文
  - 翻譯統計 API 端點監控使用量

### 國際化與體驗
- 🌍 **多語系支援**（next-intl）：
  - 繁體中文（zh-TW）
  - 日文（ja）
  - 英文（en）
- 🌓 深色模式支援（next-themes）
- 📱 響應式設計與手勢操作（Swipeable）
- 🎨 自訂日系字體（源泉圓體 GenSenRounded）
- 📱 PWA 支援（Web App Manifest、Icons）

### 功能與整合
- 📆 **iCal 日曆匯出功能**：為單一作品生成訂閱日曆
- 💾 **ISR 快取策略**：Incremental Static Regeneration
- 📈 **分析與監控**：
  - Google Analytics 整合
  - Vercel Speed Insights
- 🔍 **SEO 優化**：
  - 動態 Sitemap 生成
  - Robots.txt 設定
  - Open Graph 與 Twitter Card metadata
  - 結構化資料（JSON-LD）

### 技術實作
- ⚡ 原生 Fetch API 搭配 Next.js 快取控制
- 🎯 使用 Radix UI 建立無障礙元件
- 🎨 Tailwind CSS 4 打造「日系乾淨」視覺風格
- 🖼️ Lucide React 圖示庫

---

## 學習目標（Learning Goals）

- 熟悉 Next.js 16 App Router 架構與 React 19 新功能
- 練習 SSR / ISR / CSR 各種渲染策略與快取控制
- 學習 GraphQL 請求與型別自動生成（GraphQL Codegen）
- 實作多平台 API 整合與錯誤處理
- 建立 Type-Safe 的應用程式架構
- 掌握國際化（i18n）最佳實踐
- 實作 SEO 優化與 PWA 功能
- 使用 Radix UI 建立無障礙（Accessibility）元件
- Vercel 平台部署與 Serverless Functions 實作
- Redis 快取策略與流量管理

---

## API 端點（API Endpoints）

### 公開端點
- `GET /api/airing` - 獲取正在播放的動畫列表
- `GET /api/ics/[titleId]` - 生成 iCal 格式的播出行事曆
- `GET /api/translation-stats` - 查詢翻譯 API 使用統計

### 管理端點（需要認證）
- `POST /api/seasonal-revalidate` - 清除季節性快取
- `POST /api/translation-stats?action=reset` - 重置翻譯配額
- `POST /api/revalidate?tag=[tag]` - 清除指定快取標籤

### Cron Jobs（自動執行）
- 每月 1 號：自動重置 DeepL 使用量
- 每季首日（1/1、4/1、7/1、10/1）：清除所有快取

---

## 未來可能整合（Possible Future Integrations）

- 使用 Framer Motion 增加互動動畫與頁面轉場效果
- 使用者收藏與追番清單功能（需要身份驗證系統）
- 推播提醒功能（新集播出通知）
- 批次翻譯與優先級管理
- 評論與討論功能
- 進階篩選（聲優、製作人員等）

---

## 技術棧（Tech Stack）

### 前端框架與工具
- **Next.js 16** (App Router)
- **React 19**
- **TypeScript 5**
- **Tailwind CSS 4**
- **next-intl**（國際化）
- **next-themes**（深色模式）

### UI 元件與設計
- **Radix UI**（無障礙元件庫）
  - Checkbox, Dropdown Menu, Popover, Select, Separator, Slot, Switch, Tabs
- **Lucide React**（圖示庫）
- **class-variance-authority**（元件變體管理）
- **tailwind-merge**（Tailwind 類別合併）
- **clsx**（條件類別處理）
- **tw-animate-css**（Tailwind 動畫擴充）

### 資料管理與 API
- **GraphQL**
- **@graphql-codegen**（型別生成）
  - @graphql-codegen/cli
  - @graphql-codegen/typescript
  - @graphql-codegen/typescript-operations
- 原生 **Fetch API** 搭配 Next.js 快取策略

### 外部 API 整合
- **AniList GraphQL API**: 動畫資料主要來源、播放時間、評分
- **Bangumi API**: 日文簡介與評分資料
- **Jikan API**: MyAnimeList 資料、評分與排名
- **TMDB API**: 中文標題翻譯與海報圖片
- **Wikipedia API**: 中文標題的備援來源
- **DeepL API**: 日文→繁體中文自動翻譯

### 儲存與快取
- **Vercel KV (Redis)**: 翻譯結果快取與使用量追蹤
- **Next.js ISR**: 增量靜態再生成
- **redis** (npm package): Redis 客戶端

### 分析與監控
- **Google Analytics**（使用 next/script）
- **Vercel Speed Insights**（@vercel/speed-insights）

### 開發工具
- **ESLint 9**（程式碼檢查）
- **Sass**（樣式預處理）
- **deepl-node**（DeepL SDK）

---

## 開發方式（Getting Started）

安裝依賴並啟動開發伺服器：

```bash
npm install
npm run dev
# 或使用 yarn / pnpm / bun
```

打開 `http://localhost:3000` 以瀏覽應用。

可以從編輯 `app/page.tsx` 開始，儲存後頁面會自動更新。

### API 設定（API Setup）

部分功能需要額外的 API 設定。

#### 必要設定
- **Vercel KV**: Redis 資料庫用於翻譯快取
  - 在 [Vercel Dashboard](https://vercel.com/dashboard) 建立 KV 資料庫
  - 連結到專案後自動設定環境變數
  - 本地開發使用 `vercel env pull .env.local` 下載環境變數

#### 可選設定（增強功能）
- **DeepL API**: 日文簡介自動翻譯為繁體中文
  - 申請免費 API Key：https://www.deepl.com/pro-api
  - 免費額度：每月 500,000 字元
- **Bangumi API**: 日文簡介與評分資料
  - 申請 Access Token（可選，用於存取私人收藏）
- **TMDB API**: 中文標題翻譯與海報圖片
  - 申請 API Key 或 Bearer Token：https://www.themoviedb.org/settings/api
  - 建議使用 Bearer Token（TMDB_ACCESS_TOKEN）
- **Jikan API**: MyAnimeList 資料、評分與排名
  - 無需 API Key，公開 API
  - 注意 Rate Limiting（每秒最多 3 個請求）
- **Wikipedia API**: 中文標題的備援來源
  - 無需 API Key，公開 API
- **Google Analytics**: 網站流量分析
  - 申請 Measurement ID：https://analytics.google.com/

### 環境變數設定

複製 `.env.example` 為 `.env.local`，並設定以下變數：

```bash
# 應用程式 URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"  # 或你的 Vercel URL
TIMEZONE="Asia/Taipei"

# Google Analytics（可選）
NEXT_PUBLIC_GA_ID="G-XXXXXXXXXX"

# Bangumi API（可選）
BANGUMI_ACCESS_TOKEN="your_access_token_here"

# TMDB API（可選）
# 建議使用 Bearer Token
TMDB_ACCESS_TOKEN="your_access_token_here"
# 或使用 API Key
TMDB_API_KEY="your_api_key_here"

# DeepL 翻譯 API（可選）
DEEPL_API_KEY="your_api_key_here"

# Vercel KV Redis（自動設定）
# 執行 `vercel env pull .env.local` 自動下載
# REDIS_URL="redis://..."

# Revalidation Secret（可選，保護管理 API）
REVALIDATE_SECRET="your_secret_key_here"
```

**注意事項：**
- `NEXT_PUBLIC_` 開頭的變數會暴露給瀏覽器端
- `REVALIDATE_SECRET` 用於保護 `/api/seasonal-revalidate` 和 `/api/translation-stats` 端點
- Vercel KV 變數由 Vercel 自動設定，無需手動填寫

### 自動化任務（Vercel Cron Jobs）

專案已設定以下 Vercel Cron Jobs：

1. **每月自動重置翻譯配額**
   - 時間：每月 1 號 00:00 UTC
   - 端點：`/api/translation-stats?action=reset`

2. **每季清除快取**
   - 時間：每年 1/1、4/1、7/1、10/1 的 00:00 UTC
   - 端點：`/api/seasonal-revalidate?force=true`
   - 功能：清除季節快取和翻譯快取

---

## 備註（Notes）

- 專案以 `create-next-app` 初始化，使用 Next.js 16 App Router 架構
- 使用 TypeScript 提供完整的型別安全
- 採用 GraphQL Codegen 自動生成 TypeScript 型別定義
- 使用原生 Fetch API 搭配 Next.js 內建快取機制，無需額外的資料抓取庫
- 專案結構遵循 Next.js App Router 慣例
- 使用 Radix UI Primitives 確保無障礙性（Accessibility）
- 自訂字體使用「源泉圓體」（GenSenRounded），展現日系風格
- 部署於 Vercel 平台，充分利用 Edge Functions 與 ISR 功能
