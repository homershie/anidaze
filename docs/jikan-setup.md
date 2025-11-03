# Jikan API 整合說明

Jikan 是一個非官方的 [MyAnimeList](https://myanimelist.net) API，用於獲取動畫和漫畫的詳細資訊，包括評分、統計數據和元數據。

## 串接方式建議

根據您的需求和開發環境，Jikan 提供以下幾種串接方式：

### 1. REST API（推薦，當前實作）

**適用場景：**
- 開發和測試階段
- 低到中等頻率的請求
- 快速開始，無需額外配置

**優點：**
- 最簡單直接的方式
- 無需部署額外服務
- 與現有 `tmdb.ts` 和 `anilist.ts` 風格一致

**限制：**
- 官方公開 API 速率限制：每分鐘 3 個請求，每秒 1 個請求
- 適合開發和個人使用

**使用方式：**
```typescript
import { getJikanMetadata, getJikanAnimeById } from '@/lib/jikan';

// 使用 MAL ID（推薦）
const metadata = await getJikanMetadata(12345);

// 或使用標題搜尋（較不準確）
const metadata = await getJikanMetadata(null, "Attack on Titan");
```

### 2. Docker 部署（生產環境推薦）

**適用場景：**
- 高頻率請求需求
- 需要自定義功能
- 生產環境部署

**優點：**
- 更高的速率限制（取決於伺服器配置）
- 更好的穩定性和控制權
- 減少對官方服務的依賴

**部署方式：**

1. 使用官方 Docker 映像檔：
```bash
docker run -d -p 8080:8080 jikan/jikan-rest:v4
```

2. 配置環境變數（`.env.local`）：
```env
JIKAN_ENDPOINT=http://localhost:8080/v4
```

3. 修改 `lib/jikan.ts` 中的端點（已完成，支援自定義端點）

### 3. PHP 解析器（不適用於本專案）

PHP 解析器僅適用於 PHP 專案，本專案使用 TypeScript/Next.js，因此不適用。

### 4. 社群整合庫

Jikan 社群提供了多種語言的客戶端庫（Python、Go、Rust 等），但對於 Next.js/TypeScript 專案，直接使用 REST API 更簡單直接。

## 當前實作功能

### 已整合的功能

1. **獲取動畫基本資訊** (`getJikanAnimeBasic`)
   - 評分、排名、人氣度
   - 簡介、類型、工作室
   - 統計數據

2. **獲取完整動畫資訊** (`getJikanAnimeById`)
   - 包含所有基本資訊
   - 關係作品、主題曲
   - 外部連結、串流平台

3. **標題搜尋** (`searchJikanAnime`)
   - 當沒有 MAL ID 時，使用標題搜尋
   - 自動排序（按評分降序）

4. **自動 MAL ID 提取** (`extractMALIdFromAniList`)
   - 從 AniList 的外部連結中提取 MAL ID
   - 提高查詢準確性

5. **整合到作品詳情頁面** (`app/title/[id]/page.tsx`)
   - 顯示 MyAnimeList 評分
   - 顯示 MAL 排名
   - 顯示評分人數
   - 顯示 MyAnimeList 簡介（如果與 AniList 不同）

## 使用範例

### 在服務端組件中使用

```typescript
import { getJikanMetadata, extractMALIdFromAniList } from '@/lib/jikan';

// 從 AniList 數據中提取 MAL ID
const malId = extractMALIdFromAniList(anilistData.Media.externalLinks);

// 獲取 Jikan 元數據
const jikanData = await getJikanMetadata(
  malId || undefined,
  title || undefined
);

// 使用數據
if (jikanData) {
  console.log('MAL 評分:', jikanData.score);
  console.log('評分人數:', jikanData.scored_by);
  console.log('排名:', jikanData.rank);
}
```

### 在 API Route 中使用

```typescript
import { getJikanAnimeById } from '@/lib/jikan';

export async function GET(request: Request) {
  const malId = 12345; // 從請求中獲取
  const data = await getJikanAnimeById(malId);
  return Response.json(data);
}
```

## 速率限制處理

程式碼已包含速率限制錯誤處理：

```typescript
if (res.status === 429) {
  throw new Error("Jikan API rate limit exceeded. Consider using Docker deployment for higher rate limits.");
}
```

**建議：**
- 開發階段：使用官方 REST API
- 生產環境：考慮 Docker 部署自有實例
- 實作請求佇列或快取策略以減少 API 呼叫

## 快取策略

程式碼已實作 Next.js 快取策略：

- 基本資訊：24 小時快取
- 搜尋結果：6 小時快取
- 使用 `next.revalidate` 控制快取時間

## 環境變數配置

### 使用官方 API（預設）

無需配置，直接使用 `https://api.jikan.moe/v4`

### 使用自建 Docker 實例

在 `.env.local` 中設定：

```env
JIKAN_ENDPOINT=http://localhost:8080/v4
```

或生產環境：

```env
JIKAN_ENDPOINT=https://your-jikan-instance.com/v4
```

## 資料結構

Jikan API 返回的主要資料欄位：

- `score`: 評分 (1-10)
- `scored_by`: 評分人數
- `rank`: 全站排名
- `popularity`: 人氣排名
- `synopsis`: 簡介
- `genres`: 類型陣列
- `studios`: 工作室陣列
- `statistics`: 統計數據（觀看、完成、暫停等）

詳細類型定義請參考 `lib/jikan.ts`。

## 注意事項

1. **Jikan 是非官方 API**：資料來源於解析 MyAnimeList 網站，請遵守使用條款
2. **速率限制**：官方 API 有嚴格的速率限制，避免頻繁請求
3. **錯誤處理**：已實作基本錯誤處理，但建議在生產環境中加入重試機制
4. **資料準確性**：當沒有 MAL ID 時，使用標題搜尋可能不夠準確，建議優先使用 MAL ID

## 參考資源

- [Jikan API 官方文件](https://docs.api.jikan.moe/)
- [Jikan REST API GitHub](https://github.com/jikan-me/jikan-rest)
- [MyAnimeList 網站](https://myanimelist.net/)

