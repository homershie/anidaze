# ICS 匯出設計說明

本文件說明 AniDaze 的 iCalendar（.ics）匯出策略與 API 介面。重點：以 AniList 的「實際每集檔期」為準，為每一集產生一個 VEVENT，不使用 RRULE，藉此自然支援臨時停播／改檔期；此設計是為了避免日本因節日或事件造成臨時停播／改檔期時，使用者的行事曆出現錯誤重複事件，並可藉由重新取得最新的 `airingSchedules` 隨時保持同步。

## 背景與資料來源

- 來源：AniList GraphQL `airingSchedules` 與 `Media`，以 `notYetAired: true` 拉取未來檔期。
- 官方 GraphQL 指南說明如何組裝請求與變數（僅作一般參考，不提供停播旗標）。
  - 參考： [AniList GraphQL Guide](https://docs.anilist.co/guide/graphql/)
- 邏輯：若資料源更新（如節日或事件導致臨時停播、改日），`airingAt` 會被修改；使用者重新下載 .ics 即可同步（或客戶端定期重新抓取）。

## 設計原則

- 以「每一集的實際播放時間」產生一筆 VEVENT，避免 RRULE 推測造成誤導。
- UID 穩定，採用 `titleId-ep{episode}@anidaze.app`，確保相同事件可被日曆客戶端覆蓋更新。
- 檔名友善：以作品名稱產生檔名，移除不安全字元。

## API 介面

- 路徑：`GET /api/ics/[titleId]`
- 查詢參數：
  - `perPage`（可選）：單次抓取未來檔期的上限，預設 30，上限 50。

### 回傳內容

- `Content-Type`: `text/calendar; charset=utf-8`
- 下載檔名：`{作品名稱}_AniDaze.ics`
- 內容：
  - `VCALENDAR` with `VERSION:2.0`, `PRODID`, `CALSCALE:GREGORIAN`, `METHOD:PUBLISH`
  - 多個 `VEVENT`，每集一筆：
    - `UID`: `titleId-ep{episode}@anidaze.app`
    - `DTSTAMP`: 產檔時間（UTC）
    - `DTSTART`/`DTEND`: 以 `airingAt` 為準（UTC），預設 24 分鐘長度
    - `SUMMARY`: `{作品名} E{episode}（台北時間）`
    - `URL`/`DESCRIPTION`: 指向 `{APP_URL}/title/{id}#ep{episode}`
    - `LOCATION`: `TV / Streaming`

> 備註：不使用 `RRULE`。若未來改為 RRULE，需同步維護 `EXDATE`/`RDATE` 以避免錯誤事件。

## 錯誤處理

- 非法 `titleId`：`400` JSON `{ error: "Invalid titleId" }`
- 找不到未來檔期或作品：`404` JSON `{ error: "No upcoming airing found for this title" }`

## 快速測試

- 下載：`/api/ics/123` 或 `/api/ics/123?perPage=40`
- 檢查 `.ics` 是否包含多個 `VEVENT`，且每筆時間對應 AniList 的 `airingAt`。

## 未來擴充

- 提供 `page` 參數／自動分頁以拉取更多周數。
- 若能取得完整未來排程，可直接輸出「每集 VEVENT」或轉為「RRULE + EXDATE/RDATE」。
- 增加 `duration` 或明確集數時長欄位，取代固定 24 分鐘。
