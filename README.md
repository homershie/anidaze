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
- 🌍 支援多語系（next-intl）
- 🔍 作品搜尋與類別過濾
- 💾 採用 ISR（Incremental Static Regeneration）快取策略
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

## 未來可能整合（Possible Future Integrations）

- AWS / Cloudflare 部署練習
- 匯出 iCal 格式行事曆
- 使用 Emotion / Framer Motion 增加互動動畫
- 收藏與提醒功能（加入 Watchlist / 推播提醒）

---

## 技術棧（Tech Stack）

- Next.js 16（App Router）、React、TypeScript
- Tailwind CSS
- GraphQL、graphql-request
- @tanstack/react-query（資料抓取 / 快取）
- Zod、React Hook Form（表單與驗證）
- date-fns、date-fns-tz（日期與時區）
- next-intl（國際化）
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

- **TMDB API**：用於中文標題翻譯（[設定說明](docs/tmdb-setup.md)）
- **Wikipedia API**：作為 TMDB 的備援來源（[使用說明](docs/wikipedia-setup.md)）
- **Jikan API**：用於 MyAnimeList 元資料（[設定說明](docs/jikan-setup.md)）

詳見 `docs/` 目錄中的個別設定文件。

---

## 備註（Notes）

- 專案以 `create-next-app`（Tailwind 模板）初始化，並自動產生 route types。
- 已安裝套件：`graphql-request`、`graphql`、`@graphql-codegen/cli`（dev）、`zod`、`react-hook-form`、`date-fns`、`date-fns-tz`、`@tanstack/react-query`、`next-intl`。
