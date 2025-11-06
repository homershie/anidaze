# DeepL 翻譯整合設定指南

本文檔說明如何設定 DeepL API 和 Vercel KV，以實現 Bangumi 日文簡介自動翻譯為繁體中文的功能。

---

## 📋 功能特色

- ✅ **自動翻譯**：Bangumi 日文簡介自動翻譯為繁體中文
- ✅ **智慧快取**：翻譯結果永久快取，每個作品只翻譯一次
- ✅ **流量控制**：自動追蹤每月 DeepL API 使用量（500,000 字元限制）
- ✅ **降級策略**：超過限額自動顯示日文原文
- ✅ **季節性更新**：每季自動清除快取，獲取最新翻譯

---

## 🚀 快速開始

### 1. 申請 DeepL API 金鑰

1. 前往 [DeepL API 註冊頁面](https://www.deepl.com/pro-api)
2. 註冊免費帳號（Free 方案）
3. 取得 API 金鑰

**免費方案限制：**
- 每月 500,000 字元
- 無需信用卡

### 2. 建立 Vercel KV 資料庫

#### 在 Vercel Dashboard

1. 登入 [Vercel Dashboard](https://vercel.com/dashboard)
2. 選擇你的專案 `anidaze`
3. 點選左側選單的 **Storage**
4. 點選 **Create Database**
5. 選擇 **KV (Redis)**
6. 選擇區域（建議：**Singapore** 或離用戶最近的區域）
7. 資料庫名稱：`anidaze-translations`
8. 點選 **Create**

#### 連接到專案

1. 在 KV 資料庫頁面，點選 **Connect to Project**
2. 選擇專案：`anidaze`
3. 點選 **Connect**

Vercel 會自動將以下環境變數加入你的專案：
```
REDIS_URL
```

**注意**：新版 Vercel KV 使用 `REDIS_URL` 環境變數（舊版使用 `KV_REST_API_URL` 和 `KV_REST_API_TOKEN`）。

### 3. 設定環境變數

#### Vercel 線上環境

1. 前往 Vercel 專案設定
2. 點選 **Settings** → **Environment Variables**
3. 新增以下變數：

| 變數名稱 | 值 | 說明 |
|---------|---|------|
| `DEEPL_API_KEY` | `your_deepl_api_key` | 從 DeepL 取得的 API 金鑰 |
| `REVALIDATE_SECRET` | `your_secret_key` | （可選）保護管理 API 的密鑰 |

#### 本地開發環境

首先，安裝 Vercel CLI（如果尚未安裝）：

```bash
# 全域安裝 Vercel CLI
npm install -g vercel

# 登入 Vercel 帳號
vercel login
```

然後在專案根目錄執行：

```bash
# 下載所有環境變數（包括 KV 連線資訊）
vercel env pull .env.local
```

手動在 `.env.local` 中加入 DeepL API 金鑰：

```env
DEEPL_API_KEY="your_deepl_api_key_here"
REVALIDATE_SECRET="your_secret_key_here"
```

### 4. 安裝依賴套件

專案已經安裝以下套件：

```bash
npm install redis deepl-node
```

如果尚未安裝，請執行上述命令。

**注意**：新版 Vercel KV 使用 `redis` 套件作為客戶端（不再使用 `@vercel/kv`）。

### 5. 部署專案

```bash
git add .
git commit -m "feat: Add DeepL translation with Vercel KV caching"
git push
```

Vercel 會自動部署更新。

---

## 📊 使用說明

### 翻譯邏輯

根據用戶語系自動選擇顯示內容：

| 語系 | 顯示內容 |
|------|----------|
| **zh-TW**（繁體中文） | Bangumi 日文簡介的翻譯版本 |
| **ja**（日文） | Bangumi 日文原文 |
| **en** 或其他 | AniList 英文描述 |

### 流量控制機制

1. **每次翻譯前檢查**：
   - 檢查當月已使用字元數
   - 檢查是否超過 500,000 字元限制

2. **超過限額時**：
   - 自動降級為顯示日文原文
   - Console 顯示警告訊息
   - 下個月 1 號自動重置計數器

3. **快取策略**：
   - 翻譯結果永久快取在 Vercel KV
   - 每個作品只翻譯一次
   - 大幅降低 API 使用量

---

## 🔧 管理 API

### 查詢翻譯統計

**端點**：`GET /api/translation-stats`

```bash
# 查詢當月使用量
curl https://anidaze.vercel.app/api/translation-stats
```

**回應範例**：
```json
{
  "ok": true,
  "stats": {
    "monthlyLimit": 500000,
    "used": 125000,
    "remaining": 375000,
    "percentageUsed": 25.0,
    "isLimitExceeded": false,
    "currentMonth": "2025-11"
  }
}
```

### 手動重置使用量（管理員）

**端點**：`POST /api/translation-stats?action=reset`

```bash
# 重置使用量計數器（需要 secret）
curl -X POST "https://anidaze.vercel.app/api/translation-stats?action=reset&secret=your_secret_key"
```

### 自動化任務（Vercel Cron Jobs）

專案已設定以下 Vercel Cron Jobs，無需手動操作：

#### 1. 每月自動重置使用量計數器

**Cron 設定**：
```json
{
  "path": "/api/translation-stats?action=reset",
  "schedule": "0 0 1 * *"
}
```

- **執行時間**：每月 1 號 00:00 UTC
- **功能**：自動重置 DeepL 使用量計數器
- **無需 secret**：Vercel Cron 請求會自動帶 `x-vercel-cron` header

#### 2. 每季清除翻譯快取

**Cron 設定**：
```json
{
  "path": "/api/seasonal-revalidate?force=true",
  "schedule": "0 0 1 1,4,7,10 *"
}
```

- **執行時間**：每年 1/1、4/1、7/1、10/1 的 00:00 UTC
- **功能**：清除季節快取和所有翻譯快取，讓新番獲得最新翻譯

**完整 `vercel.json` 配置**：
```json
{
  "crons": [
    {
      "path": "/api/seasonal-revalidate?force=true",
      "schedule": "0 0 1 1,4,7,10 *"
    },
    {
      "path": "/api/translation-stats?action=reset",
      "schedule": "0 0 1 * *"
    }
  ]
}
```

---

## 📈 成本估算

### DeepL API（免費方案）
- **每月限額**：500,000 字元
- **預估作品數**：假設每個簡介 200 字元 → 可翻譯 2,500 個作品/月
- **實際使用**：因為有快取，每個作品只翻譯一次，所以實際消耗很少

### Vercel KV（免費方案）
- **儲存空間**：256 MB
- **每日請求**：3,000 次
- **每月數據傳輸**：100 MB

**預估使用量**：
- 假設 5,000 部動畫
- 每個翻譯結果約 500 bytes
- 總需求：2.5 MB（遠低於 256 MB 限制）
- 每日請求：約 50-100 次（遠低於 3,000 次限制）

✅ **結論：免費方案完全足夠使用**

---

## 🔍 監控與除錯

### 檢查翻譯是否正常運作

1. **訪問作品頁面**（繁體中文語系）：
   ```
   https://anidaze.vercel.app/zh-TW/title/129195
   ```

2. **檢查 Console 日誌**：
   - 首次翻譯：`Translating X characters from Japanese to Chinese...`
   - 快取命中：`Translation cache hit`
   - 超限警告：`DeepL monthly quota exceeded`

3. **查詢統計資料**：
   ```bash
   curl https://anidaze.vercel.app/api/translation-stats
   ```

### 常見問題

#### 問題 1：翻譯沒有顯示

**可能原因**：
- DeepL API 金鑰未設定或無效
- Vercel KV 未正確連接
- 已超過月流量限制

**解決方法**：
1. 檢查環境變數是否正確設定
2. 查看 Vercel 部署日誌
3. 查詢翻譯統計確認配額

#### 問題 2：Vercel KV 連線失敗

**錯誤訊息**：`Error: KV_REST_API_URL is not defined`

**解決方法**：
```bash
# 重新拉取環境變數
vercel env pull .env.local

# 確認 KV 已連接到專案
# 前往 Vercel Dashboard → Storage → 檢查連接狀態
```

#### 問題 3：超過 DeepL 免費限額

**降級策略**：
- 自動顯示日文原文
- 等待下個月 1 號自動重置
- 或升級為 DeepL Pro 方案

---

## 🎯 最佳實踐

### 1. 定期監控使用量

在月初檢查上個月的使用量：

```bash
curl https://anidaze.vercel.app/api/translation-stats
```

### 2. 每季更新快取

Vercel Cron Job 會自動在每季開始時清除快取，確保新番獲得最新翻譯。

### 3. 備份策略

如果擔心超過限額，可以：
- 優先翻譯熱門作品
- 設定更積極的快取策略
- 升級為 DeepL Pro（每月 $5.49 起）

---

## 📚 相關文件

- [DeepL API 文檔](https://www.deepl.com/docs-api)
- [Vercel KV 文檔](https://vercel.com/docs/storage/vercel-kv)
- [季節性快取清除設定](./seasonal-revalidate-setup.md)

---

## 🆘 問題回報

如果遇到問題，請提供以下資訊：

1. 錯誤訊息（Console 或 API 回應）
2. 翻譯統計資料（`/api/translation-stats`）
3. Vercel 部署日誌
4. 專案環境變數設定（隱藏敏感資訊）
