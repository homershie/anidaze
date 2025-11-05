"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { SwipeableContainer } from "./swipeable-container";

interface SwipeableViewProps {
  children: React.ReactNode;
  viewMode: "week" | "month";
  weekOffset: number;
  monthOffset: number;
}

export function SwipeableView({
  children,
  viewMode,
  weekOffset,
  monthOffset,
}: SwipeableViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSwipeLeft = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (viewMode === "week") {
      const newOffset = weekOffset + 1;
      params.set("weekOffset", String(newOffset));
      params.delete("monthOffset");
    } else {
      const newOffset = monthOffset + 1;
      params.set("monthOffset", String(newOffset));
      params.delete("weekOffset");
    }
    router.push(`/?${params.toString()}`);
  };

  const handleSwipeRight = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (viewMode === "week") {
      const newOffset = weekOffset - 1;
      if (newOffset === 0) {
        params.delete("weekOffset");
      } else {
        params.set("weekOffset", String(newOffset));
      }
      params.delete("monthOffset");
    } else {
      const newOffset = monthOffset - 1;
      if (newOffset === 0) {
        params.delete("monthOffset");
      } else {
        params.set("monthOffset", String(newOffset));
      }
      params.delete("weekOffset");
    }
    router.push(`/?${params.toString()}`);
  };

  return (
    <SwipeableContainer
      onSwipeLeft={handleSwipeLeft}
      onSwipeRight={handleSwipeRight}
    >
      {children}
    </SwipeableContainer>
  );
}

