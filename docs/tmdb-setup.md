# TMDB API 設定說明

本文檔說明如何設定 TMDB（The Movie Database）API 以支援中文標題功能。

## 認證方式

TMDB 提供兩種認證方式，皆可在 AniDaze 中使用：

### 方式 1：Bearer Token（推薦）

使用 API Read Access Token，這是官方推薦的認證方式。

**優點：**

- 更安全（不會在 URL 中暴露）
- 可在 v3 和 v4 API 間共用
- 官方推薦

**設定步驟：**

1. 登入 [TMDB 帳號](https://www.themoviedb.org/login)
2. 前往 [Account Settings](https://www.themoviedb.org/settings/api) > API 設定
3. 在 "API Read Access Token" 區塊，建立新 Token 或使用現有的
4. 複製 Token 到您的 `.env` 檔案：

```env
TMDB_ACCESS_TOKEN="your_access_token_here"
```

### 方式 2：API Key

傳統的 API Key 認證方式。

**設定步驟：**

1. 登入 [TMDB 帳號](https://www.themoviedb.org/login)
2. 前往 [Account Settings](https://www.themoviedb.org/settings/api)
3. 在 "API Key (v3 auth)" 區塊，申請新的 API Key 或使用現有的
4. 複製 API Key 到您的 `.env` 檔案：

```env
TMDB_API_KEY="your_api_key_here"
```

## 環境變數設定

在專案根目錄的 `.env` 檔案中設定：

```env
# 只需設定其中一個，優先使用 ACCESS_TOKEN
TMDB_ACCESS_TOKEN="your_access_token_here"
# OR
TMDB_API_KEY="your_api_key_here"
```

**注意：**

- 兩種方式提供相同的存取權限
- 如果同時設定，優先使用 `TMDB_ACCESS_TOKEN`
- 至少需要設定其中一個才能使用 TMDB 功能

## 功能說明

設定 TMDB API 後，AniDaze 可用於：

1. **中文標題查詢**：從 TMDB 的 alternative titles 取得中文譯名
2. **海報和背景圖**：取得高品質作品圖片（未來功能）

## 使用方式

在程式碼中，TMDB 會自動處理兩種認證方式：

```typescript
import { findChineseTitleFromTMDB } from "@/lib/tmdb";

// 自動使用正確的認證方式
const chineseTitle = await findChineseTitleFromTMDB(nativeTitle, englishTitle);
```

## 快取策略

TMDB 回應會快取 24 小時，減少不必要的 API 請求。

## 參考資料

- [TMDB 官方文件：Application Authentication](https://developer.themoviedb.org/docs/authentication-application)
- [TMDB 帳號設定頁面](https://www.themoviedb.org/settings/api)
- [TMDB API 文件](https://developer.themoviedb.org/)
