/**
 * 根據作品類型分配顏色
 * 使用 Tailwind CSS 顏色類別
 */

export type GenreColor = {
  bg: string;
  text: string;
  hover: string;
};

const genreColorMap: Record<string, GenreColor> = {
  // 動作類
  Action: {
    bg: "bg-red-500/10",
    text: "text-red-600 dark:text-red-400",
    hover: "hover:bg-red-500/20",
  },
  // 冒險類
  Adventure: {
    bg: "bg-orange-500/10",
    text: "text-orange-600 dark:text-orange-400",
    hover: "hover:bg-orange-500/20",
  },
  // 喜劇類
  Comedy: {
    bg: "bg-yellow-500/10",
    text: "text-yellow-600 dark:text-yellow-400",
    hover: "hover:bg-yellow-500/20",
  },
  // 劇情類
  Drama: {
    bg: "bg-purple-500/10",
    text: "text-purple-600 dark:text-purple-400",
    hover: "hover:bg-purple-500/20",
  },
  // 奇幻類
  Fantasy: {
    bg: "bg-indigo-500/10",
    text: "text-indigo-600 dark:text-indigo-400",
    hover: "hover:bg-indigo-500/20",
  },
  // 科幻類
  "Sci-Fi": {
    bg: "bg-cyan-500/10",
    text: "text-cyan-600 dark:text-cyan-400",
    hover: "hover:bg-cyan-500/20",
  },
  // 懸疑類
  Mystery: {
    bg: "bg-slate-500/10",
    text: "text-slate-600 dark:text-slate-400",
    hover: "hover:bg-slate-500/20",
  },
  // 恐怖類
  Horror: {
    bg: "bg-gray-800/20",
    text: "text-gray-700 dark:text-gray-300",
    hover: "hover:bg-gray-800/30",
  },
  // 戀愛類
  Romance: {
    bg: "bg-pink-500/10",
    text: "text-pink-600 dark:text-pink-400",
    hover: "hover:bg-pink-500/20",
  },
  // 日常類
  "Slice of Life": {
    bg: "bg-green-500/10",
    text: "text-green-600 dark:text-green-400",
    hover: "hover:bg-green-500/20",
  },
  // 運動類
  Sports: {
    bg: "bg-blue-500/10",
    text: "text-blue-600 dark:text-blue-400",
    hover: "hover:bg-blue-500/20",
  },
  // 超自然類
  Supernatural: {
    bg: "bg-violet-500/10",
    text: "text-violet-600 dark:text-violet-400",
    hover: "hover:bg-violet-500/20",
  },
  // 心理類
  Psychological: {
    bg: "bg-rose-500/10",
    text: "text-rose-600 dark:text-rose-400",
    hover: "hover:bg-rose-500/20",
  },
  // 驚悚類
  Thriller: {
    bg: "bg-neutral-500/10",
    text: "text-neutral-600 dark:text-neutral-400",
    hover: "hover:bg-neutral-500/20",
  },
  // 音樂類
  Music: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-600 dark:text-emerald-400",
    hover: "hover:bg-emerald-500/20",
  },
  // 機甲類
  Mecha: {
    bg: "bg-teal-500/10",
    text: "text-teal-600 dark:text-teal-400",
    hover: "hover:bg-teal-500/20",
  },
  // 魔法少女類
  "Mahou Shoujo": {
    bg: "bg-fuchsia-500/10",
    text: "text-fuchsia-600 dark:text-fuchsia-400",
    hover: "hover:bg-fuchsia-500/20",
  },
};

/**
 * 根據作品的類型（genre）獲取顏色
 * @param genres 作品的類型陣列
 * @returns 顏色配置，如果沒有匹配的類型則返回預設顏色
 */
export function getGenreColor(
  genres: Array<string | null> | null | undefined
): GenreColor {
  if (!genres || genres.length === 0) {
    // 預設顏色（primary）
    return {
      bg: "bg-primary/10",
      text: "text-primary",
      hover: "hover:bg-primary/20",
    };
  }

  // 使用第一個非空的類型
  const firstGenre = genres.find((g) => g !== null && g !== undefined);
  if (!firstGenre) {
    return {
      bg: "bg-primary/10",
      text: "text-primary",
      hover: "hover:bg-primary/20",
    };
  }

  // 查找匹配的顏色
  return genreColorMap[firstGenre] || {
    bg: "bg-primary/10",
    text: "text-primary",
    hover: "hover:bg-primary/20",
  };
}

