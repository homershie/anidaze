# AniDaze（動畫時日）

AniDaze 是一個以「動畫日曆」與「追番清單」為核心的 Next.js App Router 專案，目標是練習並整合現代 React / Next 生態，包括 GraphQL、React Query、模式驗證、國際化與快取策略等實務。

---

## 專案資訊

- **類型**：Next.js 16.0.1 Side Project
- **語言與技術棧**：TypeScript、React、Next.js（App Router）、Tailwind CSS、GraphQL、React Query（@tanstack/react-query）、Zod、React Hook Form、date-fns、date-fns-tz、next-intl
- **目標**：動畫播放日曆與追番清單網頁應用

---

## 專案簡介

使用者可以瀏覽即將播出的動畫、查詢作品資訊、建立追番清單，並透過國際化介面切換語言。

本專案同時用於熟悉 SSR / ISR 的資料快取策略、GraphQL API 串接、以及 Zod 搭配 React Hook Form 的表單驗證整合。

---

## 核心功能（Core Features）

- 📅 透過 AniList GraphQL API 取得動畫季番與播放時間表
- 🌍 支援多語系（next-intl）：繁體中文、日文、英文
- 🔍 作品搜尋與類別過濾
- 💾 採用 ISR（Incremental Static Regeneration）快取策略
- 🌐 多平台資料整合：
  - **AniList**: 動畫基本資訊與播放時間
  - **Bangumi**: 日文作品簡介與評分
  - **MyAnimeList (Jikan)**: MAL 評分與排名
  - **TMDB**: 中文標題翻譯
- 🈯 **智慧翻譯系統**：
  - 使用 DeepL API 自動翻譯日文簡介為繁體中文
  - Vercel KV 快取翻譯結果，降低 API 使用量
  - 每月 500,000 字元免費配額管理
  - 超限自動降級為顯示原文
- 📊 多平台評分顯示（AniList、MyAnimeList、Bangumi）
- 📆 iCal 日曆匯出功能
- 🧩 使用 Zod 建立 schema 驗證，結合 React Hook Form 建立互動表單
- ⚡ 使用 @tanstack/react-query 管理遠端資料快取與同步
- 🕒 以 date-fns 與 date-fns-tz 處理時區與日期格式
- 🎨 介面使用 Tailwind CSS，風格走「日系乾淨」視覺調性

---

## 學習目標（Learning Goals）

- 熟悉 Next.js App Router 架構與 Server Actions
- 練習 SSR / ISR / CSR 各種渲染策略
- 學習 GraphQL 請求與型別自動生成（graphql-request + codegen）
- 實作 Type-Safe 的 API Schema 驗證流程（Zod）
- 結合 React Query 實現自動快取、錯誤邊界與資料同步

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

- 使用 Emotion / Framer Motion 增加互動動畫
- 收藏與提醒功能（加入 Watchlist / 推播提醒）
- 批次翻譯與優先級管理

---

## 技術棧（Tech Stack）

### 前端框架
- Next.js 16（App Router）、React 19、TypeScript
- Tailwind CSS 4
- next-intl（國際化）
- next-themes（深色模式）

### 資料管理
- GraphQL、graphql-request
- @tanstack/react-query（資料抓取 / 快取）
- Zod、React Hook Form（表單與驗證）

### API 整合
- **AniList GraphQL API**: 動畫資料主要來源
- **Bangumi API**: 日文簡介與評分
- **Jikan API**: MyAnimeList 資料
- **TMDB API**: 中文標題翻譯
- **DeepL API**: 日文→繁體中文翻譯

### 儲存與快取
- **Vercel KV (Redis)**: 翻譯結果快取與流量追蹤
- **Next.js ISR**: 增量靜態再生成

### 工具與服務
- date-fns、date-fns-tz（日期與時區）
- @vercel/kv（Redis 客戶端）
- deepl-node（DeepL SDK）
- （開發）@graphql-codegen/cli

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

部分功能需要額外的 API 設定。請參考以下文件：

#### 必要設定
- **Vercel KV**: Redis 資料庫用於翻譯快取（[Vercel Dashboard](https://vercel.com/dashboard) 建立）

#### 可選設定（增強功能）
- **DeepL API**: 日文簡介自動翻譯為繁體中文（[設定說明](docs/translation-setup.md)）
- **Bangumi API**: 日文簡介與評分資料
- **TMDB API**: 中文標題翻譯（[設定說明](docs/tmdb-setup.md)）
- **Jikan API**: MyAnimeList 元資料與評分（[設定說明](docs/jikan-setup.md)）
- **Wikipedia API**: TMDB 的備援來源（[使用說明](docs/wikipedia-setup.md)）

詳見 `docs/` 目錄中的個別設定文件。

### 環境變數設定

複製 `.env.example` 為 `.env.local`，並設定以下變數：

```bash
# DeepL 翻譯 API（可選）
DEEPL_API_KEY="your_deepl_api_key"

# Bangumi API（可選）
BANGUMI_ACCESS_TOKEN="your_bangumi_token"

# TMDB API（可選）
TMDB_ACCESS_TOKEN="your_tmdb_token"

# Vercel KV（自動設定）
# 執行 `vercel env pull .env.local` 自動下載
```

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

- 專案以 `create-next-app`（Tailwind 模板）初始化，並自動產生 route types。
- 已安裝套件：`graphql-request`、`graphql`、`@graphql-codegen/cli`（dev）、`zod`、`react-hook-form`、`date-fns`、`date-fns-tz`、`@tanstack/react-query`、`next-intl`。
