/**
 * 驗證工具：當季動畫訪問限制
 */

const ALLOWED_STATUSES = ["RELEASING", "NOT_YET_RELEASED"] as const;

/**
 * 檢查作品狀態是否允許公開顯示
 */
export function isAllowedStatus(status: string | null | undefined): boolean {
  if (!status) return false;
  return ALLOWED_STATUSES.includes(status as typeof ALLOWED_STATUSES[number]);
}

/**
 * 檢查作品是否可訪問（狀態 + 成人內容）
 */
export function isMediaAccessible(
  media: {
    status: string | null | undefined;
    isAdult?: boolean | null;
  },
  filterAdult: boolean = true
): boolean {
  if (!isAllowedStatus(media.status)) {
    return false;
  }

  if (filterAdult && media.isAdult === true) {
    return false;
  }

  return true;
}

/**
 * 獲取訪問被拒絕的原因
 */
export function getAccessDeniedReason(
  status: string | null | undefined,
  isAdult: boolean | null | undefined
): "notCurrentSeason" | "adultContent" | "notFound" {
  if (!status) return "notFound";
  if (!isAllowedStatus(status)) return "notCurrentSeason";
  if (isAdult === true) return "adultContent";
  return "notFound";
}
