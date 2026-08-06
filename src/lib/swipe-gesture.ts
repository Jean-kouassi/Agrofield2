/**
 * Hook personnalisé pour détecter les gestures de swipe (gauche/droite)
 * Usage: dans les pages mobiles pour naviguer entre sections
 */

import { useEffect, useState } from "react";

type SwipeDirection = "left" | "right" | null;

interface UseSwipeGestureOptions {
  threshold?: number;        // Distance minimale en px pour valider le swipe (défaut: 50)
  onSwipeLeft?: () => void;  // Callback quand on swipe vers la gauche
  onSwipeRight?: () => void; // Callback quand on swipe vers la droite
  enabled?: boolean;         // Activer/désactiver le gesture (défaut: true)
}

export function useSwipeGesture({
  threshold = 50,
  onSwipeLeft,
  onSwipeRight,
  enabled = true,
}: UseSwipeGestureOptions = {}) {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [swipeDirection, setSwipeDirection] = useState<SwipeDirection>(null);

  const minSwipeDistance = threshold;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && onSwipeRight) {
        onSwipeRight();
      } else if (e.key === "ArrowRight" && onSwipeLeft) {
        onSwipeLeft();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled, onSwipeLeft, onSwipeRight]);

  function onTouchStart(e: React.TouchEvent) => {
    if (!enabled) return;
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  function onTouchMove(e: React.TouchEvent) => {
    if (!enabled) return;
    setTouchEnd(e.targetTouches[0].clientX);
  };

  function onTouchEnd() {
    if (!enabled || !touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      setSwipeDirection("left");
      onSwipeLeft?.();
    } else if (isRightSwipe) {
      setSwipeDirection("right");
      onSwipeRight?.();
    }
    
    // Reset après un court délai pour éviter les déclenchements multiples
    setTimeout(() => setSwipeDirection(null), 300);
  };

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    swipeDirection,
  };
}

/**
 * Composant wrapper pratique pour appliquer le gesture à une page entière
 */
export function SwipePage({
  children,
  onSwipeLeft,
  onSwipeRight,
  threshold = 50,
  enabled = true,
  className = "",
}: {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
  enabled?: boolean;
  className?: string;
}) {
  const { onTouchStart, onTouchMove, onTouchEnd } = useSwipeGesture({
    threshold,
    onSwipeLeft,
    onSwipeRight,
    enabled,
  });

  return (
    <div
      className={className}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {children}
    </div>
  );
}
