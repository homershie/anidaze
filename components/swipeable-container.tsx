"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface SwipeableContainerProps {
  children: React.ReactNode;
  className?: string;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  swipeThreshold?: number; // 最小滑動距離（px）
  disabled?: boolean;
}

export function SwipeableContainer({
  children,
  className,
  onSwipeLeft,
  onSwipeRight,
  swipeThreshold = 50,
  disabled = false,
}: SwipeableContainerProps) {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const minSwipeDistance = swipeThreshold;

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disabled) return;
      setTouchEnd(null); // 清除之前的結束位置
      setTouchStart(e.targetTouches[0].clientX);
    },
    [disabled]
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (disabled || !touchStart) return;
      setTouchEnd(e.targetTouches[0].clientX);
    },
    [disabled, touchStart]
  );

  const onTouchEnd = useCallback(() => {
    if (disabled || !touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && onSwipeLeft) {
      onSwipeLeft();
    }
    if (isRightSwipe && onSwipeRight) {
      onSwipeRight();
    }

    // 重置狀態
    setTouchStart(null);
    setTouchEnd(null);
  }, [disabled, touchStart, touchEnd, minSwipeDistance, onSwipeLeft, onSwipeRight]);

  // 滑鼠事件支援（用於桌面測試）
  const [mouseStart, setMouseStart] = useState<number | null>(null);
  const [mouseEnd, setMouseEnd] = useState<number | null>(null);
  const [isMouseDown, setIsMouseDown] = useState(false);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (disabled) return;
      setIsMouseDown(true);
      setMouseEnd(null);
      setMouseStart(e.clientX);
    },
    [disabled]
  );

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (disabled || !isMouseDown || !mouseStart) return;
      setMouseEnd(e.clientX);
    },
    [disabled, isMouseDown, mouseStart]
  );

  const onMouseUp = useCallback(() => {
    if (disabled || !isMouseDown || !mouseStart || !mouseEnd) return;

    const distance = mouseStart - mouseEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && onSwipeLeft) {
      onSwipeLeft();
    }
    if (isRightSwipe && onSwipeRight) {
      onSwipeRight();
    }

    // 重置狀態
    setIsMouseDown(false);
    setMouseStart(null);
    setMouseEnd(null);
  }, [disabled, isMouseDown, mouseStart, mouseEnd, minSwipeDistance, onSwipeLeft, onSwipeRight]);

  return (
    <div
      ref={containerRef}
      className={cn("touch-pan-y", className)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={() => {
        setIsMouseDown(false);
        setMouseStart(null);
        setMouseEnd(null);
      }}
    >
      {children}
    </div>
  );
}

