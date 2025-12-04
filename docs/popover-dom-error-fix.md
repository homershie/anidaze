# Popover DOM 錯誤修復指南

## 問題描述

在切換頁面時出現以下錯誤：

```
NotFoundError: Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node.
```

錯誤發生在 `react-dom-client.development.js` 的 `removeChildFromContainer` 函數中，通常出現在點擊 Popover 中的「查看詳情」按鈕進行路由導航時。

## 問題原因

經過排查，發現問題的根本原因是 **Google Chrome 的自動翻譯功能**會動態修改 DOM 結構，導致 React 的虛擬 DOM 與實際 DOM 不一致。當 Popover 組件（特別是使用 Portal 的組件）在路由切換時嘗試清理 DOM 節點時，會因為節點已被翻譯功能修改而找不到對應的父節點，從而觸發 `removeChild` 錯誤。

## 解決方案

### 1. 在服務器端禁用 Google 翻譯

**重要**：必須在服務器端（SSR）添加 meta 標籤，而不是在客戶端。如果只在客戶端添加，第一次載入頁面時 Google 翻譯可能已經開始工作，導致錯誤仍然發生。

在 `app/layout.tsx` 的 `generateMetadata` 函數中添加 `other` 字段：

```tsx
export async function generateMetadata(): Promise<Metadata> {
  // ... 其他 metadata 設定

  return {
    // ... 其他設定
    other: {
      // 禁用 Google 翻譯，避免 DOM 操作錯誤
      // 這會在服務器端渲染時就添加到 HTML head 中
      google: "notranslate",
    },
  };
}
```

這樣可以確保在頁面首次載入時，meta 標籤就已經存在於 HTML 中，Google 翻譯功能不會被啟用。

### 3. 優化 Popover 導航邏輯（可選）

雖然禁用翻譯已經解決了主要問題，但為了進一步提高穩定性，可以優化 `CalendarMediaItem` 組件中的導航邏輯：

```tsx
// 處理點擊「查看詳情」時關閉 Popover 並導航
const handleViewDetails = (e: React.MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();

  // 立即關閉 Popover（不等待動畫）
  setOpen(false);

  // 使用完整頁面導航，避免 React 在路由切換時的 DOM 操作錯誤
  // 使用 requestAnimationFrame 確保 DOM 更新完成
  requestAnimationFrame(() => {
    window.location.href = `/title/${mediaItem.id}`;
  });
};
```

## 驗證方法

1. **檢查 HTML 源碼**：

   - 在 Chrome 瀏覽器中打開開發者工具
   - 切換到 "Elements" 標籤
   - 查看 `<head>` 部分，確認有 `<meta name="google" content="notranslate">` 標籤
   - **重要**：應該在 HTML 源碼中就能看到，而不是通過 JavaScript 動態添加

2. **測試功能**：

   - 點擊 Popover 中的「查看詳情」按鈕
   - 確認不再出現 `removeChild` 錯誤
   - 確認頁面可以正常導航

3. **檢查翻譯功能**：
   - 確認 Chrome 瀏覽器不會自動翻譯頁面內容
   - 如果之前有翻譯，應該會自動關閉

## 注意事項

1. **必須在服務器端添加**：

   - 使用客戶端組件（如 `useEffect`）添加 meta 標籤**無法解決問題**
   - 因為在客戶端 JavaScript 執行之前，Google 翻譯可能已經開始工作
   - 必須在 `generateMetadata` 中使用 `other` 字段，確保 meta 標籤在 HTML 源碼中就存在

2. **使用完整頁面導航的影響**：

   - 使用 `window.location.href` 會導致頁面重新載入，失去 Next.js 的客戶端導航優勢
   - 如果希望保留客戶端導航，可以在禁用翻譯後嘗試改回使用 `router.push()`
   - 但建議先測試確保錯誤不再出現

3. **其他瀏覽器**：

   - 此問題主要出現在 Chrome 瀏覽器中，因為其他瀏覽器（如 Edge）通常沒有類似的自動翻譯功能
   - 如果只在 Chrome 中出現問題，很可能是 Google 翻譯導致的

4. **用戶體驗**：
   - 禁用翻譯可能會影響需要翻譯功能的用戶
   - 如果您的網站需要支援多語言，應該使用 next-intl 等國際化方案，而不是依賴瀏覽器的自動翻譯
   - AniDaze 已經使用 next-intl 實現了多語言支援，因此禁用瀏覽器翻譯是合理的

## 相關文件

- [SEO 設置指南](./seo-setup.md)
- [翻譯設置指南](./translation-setup.md)

## 更新記錄

- 2025-12-04: 初始版本，記錄 Google 翻譯導致的 DOM 錯誤問題及解決方案
- 2025-12-05: 更新為服務器端解決方案，確保首次載入時 meta 標籤就存在
