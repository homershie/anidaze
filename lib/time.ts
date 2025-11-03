export function toUTCZ(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    d.getUTCFullYear() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  );
}

export function formatLocal(
  dt: Date,
  locale = "zh-TW",
  tz = process.env.TIMEZONE || "Asia/Taipei"
) {
  return new Intl.DateTimeFormat(locale, {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(dt);
}

/**
 * 計算當前季節
 * @returns { season: "WINTER" | "SPRING" | "SUMMER" | "FALL", year: number }
 */
export function getCurrentSeason() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-12

  let season: "WINTER" | "SPRING" | "SUMMER" | "FALL";
  if (month >= 1 && month <= 3) {
    season = "WINTER";
  } else if (month >= 4 && month <= 6) {
    season = "SPRING";
  } else if (month >= 7 && month <= 9) {
    season = "SUMMER";
  } else {
    season = "FALL";
  }

  return { season, year };
}

/**
 * 從時間戳（秒）計算星期幾
 * @param timestamp 時間戳（秒）
 * @param timezone 時區，預設為 Asia/Taipei
 * @returns 0-6，0 為週日，1 為週一，...，6 為週六
 */
export function getDayOfWeek(
  timestamp: number,
  timezone = process.env.TIMEZONE || "Asia/Taipei"
): number {
  // 將時間戳轉換為 Date 物件
  const date = new Date(timestamp * 1000);

  // 使用 Intl.DateTimeFormat 取得本地時區的星期幾
  const formatter = new Intl.DateTimeFormat("zh-TW", {
    timeZone: timezone,
    weekday: "long",
  });

  // 轉換為數字：週日=0, 週一=1, ..., 週六=6
  const dayName = formatter.format(date);
  const dayMap: Record<string, number> = {
    星期日: 0,
    星期一: 1,
    星期二: 2,
    星期三: 3,
    星期四: 4,
    星期五: 5,
    星期六: 6,
  };

  // 從星期名稱中提取數字
  if (dayMap[dayName] !== undefined) {
    return dayMap[dayName];
  }

  // 備用方案：直接使用 Date.getDay()（UTC 時間）
  // 但需要考慮時區差異，所以先嘗試用 UTC 計算
  const utcDate = new Date(timestamp * 1000);
  return utcDate.getUTCDay();
}

/**
 * 取得星期幾的中文名稱
 * @param dayOfWeek 0-6，0 為週日，1 為週一，...，6 為週六
 * @returns 星期幾的中文名稱
 */
export function getDayOfWeekName(dayOfWeek: number): string {
  const dayNames = ["週日", "週一", "週二", "週三", "週四", "週五", "週六"];
  return dayNames[dayOfWeek] || "未知";
}
