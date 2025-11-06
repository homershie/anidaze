# 週月視圖重構文檔

## 概述

本次重構將主頁面從「一般/成人內容」的標籤切換改為「週/月視圖」模式，並添加了滑動導航、類型顏色編碼、成人內容篩選等功能。這是一個大規模的 UI/UX 改進，提升了用戶體驗和視覺化效果。

## 主要功能

### 1. 視圖模式切換

- **週視圖**：以週為單位顯示動畫播出時間，按星期分組
- **月視圖**：以月為單位顯示，採用 Google Calendar 風格的日曆視圖

### 2. 成人內容控制

- 使用 Checkbox 控制是否顯示成人內容
- 狀態保存在 URL query params（`showAdult=true`）
- 預設不顯示成人內容

### 3. 導航功能

- **移動端**：支援左右滑動手勢切換週/月
- **桌面端**：提供上週/下週、上個月/下個月按鈕

### 4. 類型顏色編碼

- 根據動畫的第一個類型（genre）分配不同顏色
- 支援多種常見類型（動作、冒險、喜劇、劇情等）
- 無類型或未匹配時使用預設顏色

### 5. 完整播出時間顯示

- 月視圖顯示所有未來的播出時間（最多 50 集）
- 不只是下一集，而是到完結前的所有集數

## 技術架構

### 新增組件

#### `ViewControls` (`components/view-controls.tsx`)

視圖控制組件，包含：

- 視圖模式切換（週/月）
- 成人內容 Checkbox
- 國家篩選器

**使用方式：**

```tsx
<ViewControls
  viewMode={viewMode}
  showAdult={showAdultContent}
  selectedCountry={selectedCountry}
  countryOptions={countrySelectOptions}
  translations={{ week, month, showAdult }}
/>
```

#### `SwipeableContainer` (`components/swipeable-container.tsx`)

滑動手勢容器組件，支援：

- 觸控事件（touchstart, touchmove, touchend）
- 滑鼠事件（用於桌面測試）
- 可配置的滑動閾值

**使用方式：**

```tsx
<SwipeableContainer
  onSwipeLeft={() => handleNext()}
  onSwipeRight={() => handlePrevious()}
  swipeThreshold={50}
>
  {children}
</SwipeableContainer>
```

#### `SwipeableView` (`components/swipeable-view.tsx`)

整合滑動手勢與路由的包裝組件：

- 根據視圖模式更新 URL query params
- 自動處理週/月偏移量

#### `ViewNavigation` (`components/view-navigation.tsx`)

桌面端導航按鈕組件：

- 上週/下週、上個月/下個月按鈕
- 響應式設計（手機上隱藏文字）

#### `CalendarMediaItem` (`components/calendar-media-item.tsx`)

月視圖中的媒體項目組件：

- 顯示標題（過長時截斷）
- 點擊後顯示 Popover
- Popover 包含：封面圖片、標題、集數、操作按鈕
- 根據類型顯示不同顏色

### 新增工具函數

#### `lib/genre-colors.ts`

類型顏色映射系統：

- `getGenreColor(genres)`: 根據類型陣列獲取顏色配置
- 支援多種常見動畫類型
- 返回背景色、文字色、hover 狀態

**顏色映射示例：**

- Action（動作）→ 紅色
- Adventure（冒險）→ 橙色
- Comedy（喜劇）→ 黃色
- Drama（劇情）→ 紫色
- Fantasy（奇幻）→ 靛藍色
- Romance（戀愛）→ 粉色
- Slice of Life（日常）→ 綠色
- Sports（運動）→ 藍色

#### `lib/time.ts` 新增函數

週/月範圍計算函數：

```typescript
// 取得週範圍
getWeekRange(weekOffset: number, timezone?: string): { start: Date; end: Date }

// 取得月範圍
getMonthRange(monthOffset: number, timezone?: string): { start: Date; end: Date }

// 判斷時間戳是否在週範圍內
isWithinWeekRange(timestamp: number, weekOffset: number): boolean

// 判斷時間戳是否在月範圍內
isWithinMonthRange(timestamp: number, monthOffset: number): boolean

// 從時間戳取得日期（僅年月日）
getDateFromTimestamp(timestamp: number, timezone?: string): Date
```

## 數據結構變更

### GraphQL 查詢更新

**SEASONAL_MEDIA_QUERY 和 ONGOING_MEDIA_QUERY** 新增欄位：

```graphql
airingSchedule(notYetAired: true, perPage: 50) {
  nodes {
    episode
    airingAt
  }
}
genres
```

### 類型定義更新

**SeasonalMediaItem** 新增屬性：

```typescript
airingSchedule?: {
  nodes: Array<{
    episode: number;
    airingAt: number;
  } | null> | null;
} | null;
genres?: Array<string | null> | null;
```

## URL Query Parameters

新增的 URL 參數：

- `viewMode`: `"week" | "month"` - 視圖模式，預設為 "week"
- `weekOffset`: `number` - 週偏移量，0 為本週，1 為下週，-1 為上週
- `monthOffset`: `number` - 月偏移量，0 為本月，1 為下個月，-1 為上個月
- `showAdult`: `"true"` - 是否顯示成人內容

**示例：**

```
/?viewMode=month&monthOffset=1&showAdult=true
```

## 實作細節

### 週視圖實作

1. **數據過濾**：根據 `weekOffset` 過濾出該週範圍內的動畫
2. **按星期分組**：將動畫按播出時間的星期幾分組
3. **顯示格式**：顯示週範圍（例如 "2025/01/05 - 2025/01/11"）
4. **保留原有功能**：顯示封面、集數、播出時間、操作按鈕

### 月視圖實作

1. **日曆生成**：

   - 計算月份的第一個週日作為日曆開始
   - 計算月份的最後一個週六作為日曆結束
   - 生成完整的日曆天數

2. **數據處理**：

   - 獲取所有未來的播出時間（最多 50 集）
   - 按日期分組所有播出時間
   - 每個日期顯示所有在該日播出的集數

3. **視覺化**：

   - 7 列（週日到週六）
   - 每個日期格子顯示該日所有動畫
   - 標題過長時截斷顯示
   - 根據類型顯示不同顏色

4. **互動**：
   - 點擊標題顯示 Popover
   - Popover 包含完整資訊和操作按鈕

### 滑動手勢實作

1. **觸控事件**：

   - `touchstart`: 記錄起始位置
   - `touchmove`: 更新結束位置
   - `touchend`: 計算滑動距離，觸發切換

2. **滑動判斷**：

   - 左滑（距離 > 閾值）：切換到下週/下個月
   - 右滑（距離 < -閾值）：切換到上週/上個月
   - 預設閾值：50px

3. **路由更新**：
   - 使用 Next.js `useRouter` 更新 URL
   - 保持其他 query params 不變

### 類型顏色系統

1. **顏色映射**：

   - 定義常見類型的顏色配置
   - 每個類型包含：背景色、文字色、hover 狀態
   - 使用 Tailwind CSS 的半透明顏色（如 `bg-red-500/10`）

2. **顏色選擇**：

   - 使用動畫的第一個類型
   - 如果沒有類型或未匹配，使用預設顏色（primary）

3. **深色模式支援**：
   - 所有顏色配置都考慮深色模式
   - 使用 `dark:` 前綴調整深色模式下的顏色

## 國際化（i18n）

新增的翻譯鍵：

```json
{
  "viewMode": {
    "week": "週",
    "month": "月"
  },
  "adultContent": {
    "show": "顯示成人內容"
  },
  "navigation": {
    "previousWeek": "上週",
    "nextWeek": "下週",
    "previousMonth": "上個月",
    "nextMonth": "下個月"
  }
}
```

支援語言：中文（繁體）、英文、日文

## 性能考量

1. **數據查詢**：

   - 使用 ISR（Incremental Static Regeneration）快取
   - 播出時間數據每 6 小時更新一次
   - 月視圖限制最多獲取 50 個未來播出時間

2. **渲染優化**：

   - 使用 React 的 `key` 屬性優化列表渲染
   - 月視圖使用虛擬化或分頁可能會更好（未來改進）

3. **圖片優化**：
   - 使用 Next.js Image 組件自動優化
   - 封面圖片使用適當的尺寸

## 使用範例

### 基本使用

```tsx
// 主頁面組件
export default async function Home({ searchParams }) {
  const { viewMode = "week", weekOffset, monthOffset, showAdult } = await searchParams;

  // 過濾數據
  const filteredItems = /* ... */;

  return (
    <main>
      <ViewControls /* ... */ />
      <ViewNavigation /* ... */ />
      <SwipeableView /* ... */>
        {viewMode === "week" ? (
          <WeekView media={filteredItems} />
        ) : (
          <MonthView media={filteredItems} />
        )}
      </SwipeableView>
    </main>
  );
}
```

### 獲取類型顏色

```tsx
import { getGenreColor } from "@/lib/genre-colors";

const color = getGenreColor(mediaItem.genres);
// 返回: { bg: "bg-red-500/10", text: "text-red-600", hover: "hover:bg-red-500/20" }
```

### 計算時間範圍

```tsx
import { getWeekRange, isWithinWeekRange } from "@/lib/time";

// 獲取本週範圍
const { start, end } = getWeekRange(0);

// 判斷時間戳是否在本週
const isInThisWeek = isWithinWeekRange(timestamp, 0);
```

## 未來可能的改進

1. **性能優化**：

   - 月視圖使用虛擬滾動處理大量數據
   - 實現分頁載入更多播出時間

2. **功能增強**：

   - 添加時間軸視圖（顯示 24 小時時間軸）
   - 添加篩選功能（按類型、國家等）
   - 添加收藏/追蹤功能

3. **UI/UX 改進**：

   - 添加動畫過渡效果
   - 改進響應式設計
   - 添加鍵盤快捷鍵支援

4. **數據處理**：
   - 支援更長時間範圍的查詢
   - 實現智能預測播出時間（如果 API 沒有提供）

## 相關文件

- [ICS 設定文檔](./ics.md) - iCal 日曆匯出功能
- [Jikan 設定文檔](./jikan-setup.md) - MyAnimeList API 整合
- [TMDB 設定文檔](./tmdb-setup.md) - TMDB API 整合

## 總結

本次重構大幅提升了用戶體驗，主要改進包括：

1. ✅ 更直觀的視圖模式（週/月）
2. ✅ 更靈活的導航方式（滑動 + 按鈕）
3. ✅ 更豐富的視覺化（類型顏色編碼）
4. ✅ 更完整的數據顯示（所有播出時間）
5. ✅ 更好的互動體驗（Popover 顯示詳細資訊）

所有功能都支援國際化和響應式設計，並且考慮了性能優化。
