# 季節自動更新設定說明

## 概述

為了確保在季節切換日（1/1、4/1、7/1、10/1）能及時更新動畫清單，系統提供了自動清除快取的 API 路由。

## 目前的運作機制

### 自動判斷季節

- 系統會根據當前日期自動判斷季節：
  - **1-3 月**：WINTER（冬季）
  - **4-6 月**：SPRING（春季）
  - **7-9 月**：SUMMER（夏季）
  - **10-12 月**：FALL（秋季）

### 快取機制

- 使用 Next.js ISR（Incremental Static Regeneration）
- 快取時間：**6 小時**
- 當快取過期時，如果有使用者訪問，會自動重新獲取資料

### 潛在問題

- 在季節切換日，如果快取還沒過期（6 小時內），使用者可能會看到舊季節的資料
- 如果沒有使用者訪問，系統不會自動更新

## 解決方案：排程自動更新

### API 路由

已建立 `/api/seasonal-revalidate` API 路由，提供以下功能：

#### GET 請求（自動檢查）

- 自動檢查是否為季節切換日
- 如果是季節切換日，自動清除快取
- 如果不是，返回當前季節資訊

```bash
# 自動檢查並更新（如果是季節切換日）
curl https://your-domain.com/api/seasonal-revalidate

# 強制更新（無論是否為季節切換日）
curl https://your-domain.com/api/seasonal-revalidate?force=true
```

#### POST 請求（手動觸發）

- 強制清除快取（用於 cron job）
- 可選：使用 secret 保護 API

```bash
# 基本使用
curl -X POST https://your-domain.com/api/seasonal-revalidate

# 使用 secret 保護（如果設定了環境變數）
curl -X POST https://your-domain.com/api/seasonal-revalidate?secret=your-secret
# 或使用 header
curl -X POST https://your-domain.com/api/seasonal-revalidate \
  -H "x-secret: your-secret"
```

## 部署平台設定

### Vercel（推薦）

如果您的專案部署在 Vercel，可以使用 Vercel Cron Jobs：

1. 在專案根目錄建立 `vercel.json`：

```json
{
  "crons": [
    {
      "path": "/api/seasonal-revalidate?force=true",
      "schedule": "0 0 1 1,4,7,10 *"
    }
  ]
}
```

這個 cron 設定會在每年的 1/1、4/1、7/1、10/1 的 00:00 UTC 執行。

2. （可選）設定環境變數保護 API：

在 Vercel 專案設定中新增：

```
REVALIDATE_SECRET=your-secret-key-here
```

然後修改 `vercel.json`：

```json
{
  "crons": [
    {
      "path": "/api/seasonal-revalidate?secret=your-secret-key-here&force=true",
      "schedule": "0 0 1 1,4,7,10 *"
    }
  ]
}
```

### 其他平台

#### 使用外部 Cron 服務

可以使用以下服務來定期呼叫 API：

1. **cron-job.org**

   - 建立 cron job
   - URL: `https://your-domain.com/api/seasonal-revalidate?force=true`
   - 排程：每月 1 號 00:00（需要設定 4 個 cron jobs，分別為 1/1、4/1、7/1、10/1）

2. **EasyCron**

   - 類似 cron-job.org
   - 支援更複雜的排程設定

3. **GitHub Actions**
   在 `.github/workflows/seasonal-revalidate.yml`：

```yaml
name: Seasonal Revalidate

on:
  schedule:
    # 每年 1/1、4/1、7/1、10/1 的 00:00 UTC
    - cron: "0 0 1 1,4,7,10 *"
  workflow_dispatch: # 允許手動觸發

jobs:
  revalidate:
    runs-on: ubuntu-latest
    steps:
      - name: Call Revalidate API
        run: |
          curl -X POST https://your-domain.com/api/seasonal-revalidate?force=true
```

#### 使用伺服器 Cron（如果部署在自己的伺服器）

在伺服器上設定 crontab：

```bash
# 編輯 crontab
crontab -e

# 新增以下行（每年 1/1、4/1、7/1、10/1 的 00:00）
0 0 1 1,4,7,10 * curl -X POST https://your-domain.com/api/seasonal-revalidate?force=true
```

## 測試

### 本地測試

```bash
# 啟動開發伺服器
npm run dev

# 在另一個終端機測試 API
curl http://localhost:3000/api/seasonal-revalidate?force=true
```

### 檢查快取是否清除

1. 訪問首頁，查看季節資訊
2. 呼叫 revalidate API
3. 再次訪問首頁，應該會看到更新的資料

## 注意事項

1. **時區問題**：cron job 通常使用 UTC 時間，請根據您的需求調整時間
2. **API 保護**：建議在生產環境設定 `REVALIDATE_SECRET` 環境變數來保護 API
3. **速率限制**：確保 cron job 不會觸發過於頻繁的請求
4. **錯誤處理**：API 會返回 JSON 回應，可以檢查 `ok` 欄位來確認是否成功

## 回應格式

### 成功回應

```json
{
  "ok": true,
  "message": "Cache revalidated successfully",
  "currentSeason": {
    "season": "SPRING",
    "year": 2025
  },
  "revalidatedTags": ["seasonal", "ongoing", "airing"]
}
```

### 失敗回應

```json
{
  "ok": false,
  "error": "Error message"
}
```

### 非季節切換日（GET 請求，無 force 參數）

```json
{
  "ok": false,
  "message": "Not a season change day",
  "currentSeason": {
    "season": "SPRING",
    "year": 2025
  },
  "nextSeasonChangeDays": [
    "2025-01-01",
    "2025-04-01",
    "2025-07-01",
    "2025-10-01"
  ]
}
```
