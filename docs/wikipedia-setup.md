# Wikipedia API 整合說明

本文檔說明 AniDaze 如何使用維基百科 API 來補充中文標題翻譯。

## 概述

為了補強 TMDB 在中文化標題上的缺漏，AniDaze 整合了維基百科（Wikipedia）和維基數據（Wikidata）的 API 作為備援來源，提高中文標題的覆蓋率。

## 技術細節

### 使用的 API

1. **Wikipedia MediaWiki API**
   - 端點：`https://en.wikipedia.org/w/api.php`
   - 用途：搜尋條目、取得跨語言連結

2. **Wikidata API**
   - 端點：`https://www.wikidata.org/w/api.php`
   - 用途：取得結構化的多語言標籤

### 查詢流程

查詢中文標題的優先順序如下：

1. **優先 1**：從 TMDB 取得繁體中文標題
2. **優先 2**：從維基百科/維基數據取得繁體中文標題（新增）
3. **優先 3**：從 AniList 的 synonyms 中找出中文標題
4. **優先 4**：使用日文原名（native）
5. **優先 5**：使用羅馬化標題（romaji）
6. **優先 6**：使用英文標題

### 查詢方法

維基百科查詢使用兩種方法：

#### 方法 1：Wikipedia Langlinks

查詢條目的跨語言連結（interlanguage links），直接取得中文維基條目的標題。

```
1. 搜尋 Wikipedia 條目
2. 過濾掉不適合的結果（列表頁面、消歧義頁面等）
3. 取得該條目的 langlinks，過濾出中文（zh）連結
4. 返回中文標題
```

#### 方法 2：Wikidata Labels

通過 Wikidata 取得更結構化的多語言標籤。

```
1. 從 Wikipedia 取得 Wikidata QID
2. 查詢 Wikidata 該條目的 labels 和 aliases
3. 優先取得 zh 標籤，其次 zh-Hant
4. 返回中文標題
```

### 結果過濾

為了避免返回不適當的結果（如列表頁面、年份動畫列表等），系統會自動過濾包含以下關鍵字的搜尋結果：

- 列表關鍵字：`list`、`列表`、`catalog`、`catalogue`、`目錄`
- 分類關鍵字：`category:`、`分類:`
- 消歧義關鍵字：`disambiguation`、`disambig`、`消歧義`

### 快取策略

為了減少 API 請求負擔，維基百科 API 回應會快取 **7 天**：

- Next.js `revalidate: 60 * 60 * 24 * 7` 設定
- 防止重複查詢相同條目
- 符合維基百科 API 使用規範

## 設定

**無需任何設定**！

與 TMDB 不同，維基百科 API：
- 免費使用
- 無需註冊或 API Key
- 無請求限制（但請遵守禮貌使用原則）

## 使用方式

在程式碼中，Wikipedia 查詢會自動作為 TMDB 的備援：

```typescript
import { getBestTitle } from "@/lib/title";

// 自動使用 TMDB -> Wikipedia -> AniList 的優先順序
const title = await getBestTitle({
  romaji: "One Piece",
  english: "One Piece",
  native: "ワンピース",
  synonyms: ["海賊王"],
});
```

## 錯誤處理

所有維基百科 API 查詢都包含錯誤處理：

- 查詢失敗時自動返回 `null`
- 不影響其他標題來源的查詢
- 錯誤資訊記錄到 console.error

## 優點與限制

### 優點

✅ **無需額外設定**：免費使用，無需 API Key
✅ **高覆蓋率**：維基百科收錄大量動畫條目
✅ **多語言支援**：可擴展支援其他語言
✅ **結構化資料**：Wikidata 提供精確的語言標籤

### 限制

⚠️ **查詢延遲**：需要額外的 HTTP 請求
⚠️ **資料準確性**：依賴維基百科社群維護
⚠️ **快取延遲**：7 天內資料不會更新
⚠️ **可能歧義**：搜尋結果可能不完全匹配（已透過過濾機制改善）

## 建議

為了最佳效能和準確性：

1. 保留 TMDB 作為主要來源（優先順序 1）
2. 僅在 TMDB 沒有結果時使用維基百科
3. 遵循快取策略，避免過度請求
4. 考量未來新增更多來源的可能性

## 參考資料

- [Wikipedia API 文件](https://www.mediawiki.org/wiki/API:Main_page)
- [Wikidata API 文件](https://www.wikidata.org/wiki/Wikidata:Data_access)
- [MediaWiki API 中文文件](https://www.mediawiki.org/wiki/API:Main_page/zh)

