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

/**
 * 驗證時區字串是否有效
 * @param timezone 時區字串
 * @returns 是否為有效的時區
 */
export function isValidTimezone(timezone: string): boolean {
  try {
    // 使用 Intl.DateTimeFormat 來驗證時區
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
    });
    // 如果能夠格式化日期，表示時區有效
    formatter.format(new Date());
    return true;
  } catch {
    return false;
  }
}

/**
 * 從請求中獲取時區（支援 query parameter、cookie、預設值）
 * @param url 請求 URL
 * @param timezoneCookie 時區 cookie 值
 * @returns 有效的時區字串
 */
export function getTimezoneFromRequest(
  url: URL,
  timezoneCookie?: string | null
): string {
  // 優先順序：query parameter > cookie > 環境變數 > 預設值
  const queryTz = url.searchParams.get("tz");
  const cookieTz = timezoneCookie;
  const envTz = process.env.TIMEZONE;
  const defaultTz = "Asia/Taipei";

  // 嘗試 query parameter
  if (queryTz && isValidTimezone(queryTz)) {
    return queryTz;
  }

  // 嘗試 cookie
  if (cookieTz && isValidTimezone(cookieTz)) {
    return cookieTz;
  }

  // 嘗試環境變數
  if (envTz && isValidTimezone(envTz)) {
    return envTz;
  }

  // 使用預設值
  return defaultTz;
}

/**
 * 取得星期幾的 RRULE 格式（SU, MO, TU, etc.）
 * @param timestamp 時間戳（秒）
 * @param timezone 時區
 * @param locale 語系（用於格式化星期幾名稱）
 * @returns RRULE 格式的星期幾（SU, MO, TU, WE, TH, FR, SA）
 */
export function getDayOfWeekRRULE(
  timestamp: number,
  timezone: string,
  locale: string = "en-US"
): string {
  const date = new Date(timestamp * 1000);
  const formatter = new Intl.DateTimeFormat(locale, {
    timeZone: timezone,
    weekday: "short",
  });
  const dayName = formatter.format(date);

  // 支援多種語系的星期幾名稱
  const dayMap: Record<string, string> = {
    // English
    Sun: "SU",
    Mon: "MO",
    Tue: "TU",
    Wed: "WE",
    Thu: "TH",
    Fri: "FR",
    Sat: "SA",
    // 中文
    週日: "SU",
    週一: "MO",
    週二: "TU",
    週三: "WE",
    週四: "TH",
    週五: "FR",
    週六: "SA",
    星期日: "SU",
    星期一: "MO",
    星期二: "TU",
    星期三: "WE",
    星期四: "TH",
    星期五: "FR",
    星期六: "SA",
    // Japanese
    日: "SU",
    月: "MO",
    火: "TU",
    水: "WE",
    木: "TH",
    金: "FR",
    土: "SA",
    日曜日: "SU",
    月曜日: "MO",
    火曜日: "TU",
    水曜日: "WE",
    木曜日: "TH",
    金曜日: "FR",
    土曜日: "SA",
  };

  return dayMap[dayName] || "SU";
}

/**
 * 取得時區的顯示名稱（用於 i18n 文字）
 * @param timezone 時區字串
 * @returns 時區的簡短名稱（如 "Asia/Taipei" -> "台北時間"）
 */
export function getTimezoneDisplayName(timezone: string): string {
  // 常見時區的對應名稱
  const timezoneNames: Record<string, string> = {
    "Asia/Taipei": "台北時間",
    "Asia/Tokyo": "東京時間",
    "Asia/Shanghai": "北京時間",
    "Asia/Hong_Kong": "香港時間",
    "Asia/Seoul": "首爾時間",
    "America/New_York": "紐約時間",
    "America/Los_Angeles": "洛杉磯時間",
    "Europe/London": "倫敦時間",
    "Europe/Paris": "巴黎時間",
    "Australia/Sydney": "雪梨時間",
  };

  return timezoneNames[timezone] || timezone;
}

/**
 * 取得指定週偏移的週開始日期（週日）
 * @param weekOffset 週偏移量，0 為本週，1 為下週，-1 為上週
 * @param timezone 時區，預設為 Asia/Taipei
 * @returns Date 物件，表示該週的週日（00:00:00）
 */
export function getWeekStartDate(
  weekOffset: number = 0,
  timezone: string = process.env.TIMEZONE || "Asia/Taipei"
): Date {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  // 取得當前日期在指定時區的資訊
  const parts = formatter.formatToParts(now);
  const year = parseInt(parts.find((p) => p.type === "year")?.value || "0");
  const month = parseInt(parts.find((p) => p.type === "month")?.value || "0") - 1;
  const day = parseInt(parts.find((p) => p.type === "day")?.value || "0");
  const hour = parseInt(parts.find((p) => p.type === "hour")?.value || "0");
  const minute = parseInt(parts.find((p) => p.type === "minute")?.value || "0");
  const second = parseInt(parts.find((p) => p.type === "second")?.value || "0");

  // 創建該時區的日期物件（使用 UTC 來模擬）
  const localDate = new Date(Date.UTC(year, month, day, hour, minute, second));

  // 取得星期幾（0=週日, 1=週一, ..., 6=週六）
  const dayOfWeek = localDate.getUTCDay();

  // 計算到週日的天數差
  const daysToSunday = -dayOfWeek;

  // 加上週偏移量
  const targetDate = new Date(localDate);
  targetDate.setUTCDate(targetDate.getUTCDate() + daysToSunday + weekOffset * 7);

  // 設定為該日的 00:00:00
  targetDate.setUTCHours(0, 0, 0, 0);

  return targetDate;
}

/**
 * 取得指定週偏移的週範圍
 * @param weekOffset 週偏移量，0 為本週，1 為下週，-1 為上週
 * @param timezone 時區，預設為 Asia/Taipei
 * @returns { start: Date, end: Date } 週開始（週日 00:00:00）和週結束（週六 23:59:59）
 */
export function getWeekRange(
  weekOffset: number = 0,
  timezone: string = process.env.TIMEZONE || "Asia/Taipei"
): { start: Date; end: Date } {
  const start = getWeekStartDate(weekOffset, timezone);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6); // 週六
  end.setUTCHours(23, 59, 59, 999);

  return { start, end };
}

/**
 * 判斷時間戳是否在指定週範圍內
 * @param timestamp 時間戳（秒）
 * @param weekOffset 週偏移量，0 為本週，1 為下週，-1 為上週
 * @param timezone 時區，預設為 Asia/Taipei
 * @returns 是否在該週範圍內
 */
export function isWithinWeekRange(
  timestamp: number,
  weekOffset: number = 0,
  timezone: string = process.env.TIMEZONE || "Asia/Taipei"
): boolean {
  const { start, end } = getWeekRange(weekOffset, timezone);
  const date = new Date(timestamp * 1000);

  return date >= start && date <= end;
}

/**
 * 取得指定月偏移的月份第一天
 * @param monthOffset 月偏移量，0 為本月，1 為下個月，-1 為上個月
 * @param timezone 時區，預設為 Asia/Taipei
 * @returns Date 物件，表示該月的第一天（00:00:00）
 */
export function getMonthStartDate(
  monthOffset: number = 0,
  timezone: string = process.env.TIMEZONE || "Asia/Taipei"
): Date {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  // 取得當前日期在指定時區的資訊
  const parts = formatter.formatToParts(now);
  const year = parseInt(parts.find((p) => p.type === "year")?.value || "0");
  const month = parseInt(parts.find((p) => p.type === "month")?.value || "0") - 1;

  // 計算目標月份
  let targetYear = year;
  let targetMonth = month + monthOffset;

  // 處理月份溢出
  while (targetMonth < 0) {
    targetMonth += 12;
    targetYear -= 1;
  }
  while (targetMonth >= 12) {
    targetMonth -= 12;
    targetYear += 1;
  }

  // 創建該月的第一天
  const startDate = new Date(Date.UTC(targetYear, targetMonth, 1, 0, 0, 0, 0));

  return startDate;
}

/**
 * 取得指定月偏移的月範圍
 * @param monthOffset 月偏移量，0 為本月，1 為下個月，-1 為上個月
 * @param timezone 時區，預設為 Asia/Taipei
 * @returns { start: Date, end: Date } 月開始（第一天 00:00:00）和月結束（最後一天 23:59:59）
 */
export function getMonthRange(
  monthOffset: number = 0,
  timezone: string = process.env.TIMEZONE || "Asia/Taipei"
): { start: Date; end: Date } {
  const start = getMonthStartDate(monthOffset, timezone);
  const end = new Date(start);

  // 取得下個月的第一天，然後減去 1 毫秒
  end.setUTCMonth(end.getUTCMonth() + 1);
  end.setUTCDate(0); // 設為上個月的最後一天
  end.setUTCHours(23, 59, 59, 999);

  return { start, end };
}

/**
 * 判斷時間戳是否在指定月範圍內
 * @param timestamp 時間戳（秒）
 * @param monthOffset 月偏移量，0 為本月，1 為下個月，-1 為上個月
 * @param timezone 時區，預設為 Asia/Taipei
 * @returns 是否在該月範圍內
 */
export function isWithinMonthRange(
  timestamp: number,
  monthOffset: number = 0,
  timezone: string = process.env.TIMEZONE || "Asia/Taipei"
): boolean {
  const { start, end } = getMonthRange(monthOffset, timezone);
  const date = new Date(timestamp * 1000);

  return date >= start && date <= end;
}

/**
 * 從時間戳取得該日期在指定時區的日期物件（只包含年月日，時間為 00:00:00）
 * @param timestamp 時間戳（秒）
 * @param timezone 時區，預設為 Asia/Taipei
 * @returns Date 物件，表示該日期（00:00:00）
 */
export function getDateFromTimestamp(
  timestamp: number,
  timezone: string = process.env.TIMEZONE || "Asia/Taipei"
): Date {
  const date = new Date(timestamp * 1000);
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(date);
  const year = parseInt(parts.find((p) => p.type === "year")?.value || "0");
  const month = parseInt(parts.find((p) => p.type === "month")?.value || "0") - 1;
  const day = parseInt(parts.find((p) => p.type === "day")?.value || "0");

  return new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
}

/**
 * 從時間戳取得該時間在指定時區的小時數
 * @param timestamp 時間戳（秒）
 * @param timezone 時區，預設為 Asia/Taipei
 * @returns 小時數（0-23）
 */
export function getHourFromTimestamp(
  timestamp: number,
  timezone: string = process.env.TIMEZONE || "Asia/Taipei"
): number {
  const date = new Date(timestamp * 1000);
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  return parseInt(parts.find((p) => p.type === "hour")?.value || "0");
}