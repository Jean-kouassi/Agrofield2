/**
 * Hook personnalisé pour détecter les gestures de swipe style Facebook
 * - Animation fluide pendant le geste (la page suit le doigt)
 * - Effet de ressort si le seuil n'est pas atteint
 * - Feedback visuel (opacité + translation)
 */

import { useEffect, useState, useRef } from "react";

interface UseSwipeGestureOptions {
  thresholdPercent?: number;   // % de l'écran pour valider (défaut: 30%)
  onSwipeLeft?: () => void;    // Callback quand on swipe vers la gauche
  onSwipeRight?: () => void;   // Callback quand on swipe vers la droite
  enabled?: boolean;           // Activer/désactuer le gesture (défaut: true)
}

export function useSwipeGesture({
  thresholdPercent = 30,
  onSwipeLeft,
  onSwipeRight,
  enabled = true,
}: UseSwipeGestureOptions = {}) {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchCurrent, setTouchCurrent] = useState<number>(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null);
  const screenWidthRef = useRef(typeof window !== "undefined" ? window.innerWidth : 0);

  // Mettre à jour la largeur d'écran au resize
  useEffect(() => {
    const handleResize = () => {
      screenWidthRef.current = window.innerWidth;
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const minSwipeDistance = (screenWidthRef.current * thresholdPercent) / 100;

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

  function onTouchStart(e: React.TouchEvent) {
    if (!enabled) return;
    const touch = e.targetTouches[0];
    setTouchStart(touch.clientX);
    setTouchCurrent(touch.clientX);
    setIsSwiping(true);
    setSwipeDirection(null);
  }

  function onTouchMove(e: React.TouchEvent) {
    if (!enabled || touchStart === null) return;
    const touch = e.targetTouches[0];
    setTouchCurrent(touch.clientX);
  }

  function onTouchEnd() {
    if (!enabled || touchStart === null) return;
    
    const distance = touchStart - touchCurrent;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      setSwipeDirection("left");
      setTimeout(() => {
        onSwipeLeft?.();
        resetSwipe();
      }, 100); // Petit délai pour l'animation
    } else if (isRightSwipe) {
      setSwipeDirection("right");
      setTimeout(() => {
        onSwipeRight?.();
        resetSwipe();
      }, 100);
    } else {
      // Reset sans action si seuil non atteint
      resetSwipe();
    }
  }

  function resetSwipe() {
    setTouchStart(null);
    setTouchCurrent(0);
    setIsSwiping(false);
    setTimeout(() => setSwipeDirection(null), 300);
  }

  // Calculer la translation et l'opacité pour l'effet visuel
  const getStyle = () => {
    if (!isSwiping || touchStart === null) return {};
    
    const diff = touchCurrent - touchStart;
    const absDiff = Math.abs(diff);
    const maxDrag = screenWidthRef.current * 0.7; // Max 70% de l'écran
    
    // Translation fluide avec résistance
    const resistance = 0.8; // Réduit la vitesse de suivi
    const translateX = diff * resistance;
    
    // Opacité décroissante (plus on swipe, plus c'est transparent)
    const opacity = 1 - (absDiff / maxDrag) * 0.3;
    
    // Scale léger pour effet de profondeur
    const scale = 1 - (absDiff / maxDrag) * 0.05;
    
    // Rotation subtile
    const rotate = (diff / maxDrag) * 2; // ±2 degrés max

    return {
      transform: `translateX(${translateX}px) scale(${scale}) rotate(${rotate}deg)`,
      opacity,
      transition: isSwiping ? 'none' : 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease',
      cursor: isSwiping ? 'grabbing' : 'grab',
      userSelect: isSwiping ? 'none' : 'auto',
    };
  };

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    isSwiping,
    swipeDirection,
    touchProgress: touchStart ? Math.abs(touchCurrent - touchStart) / minSwipeDistance : 0,
    getStyle,
  };
}

/**
 * Composant wrapper pratique pour appliquer le gesture Facebook-style à une page
 */
export function SwipePage({
  children,
  onSwipeLeft,
  onSwipeRight,
  thresholdPercent = 30,
  enabled = true,
  className = "",
}: {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  thresholdPercent?: number;
  enabled?: boolean;
  className?: string;
}) {
  const {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    getStyle,
    isSwiping,
  } = useSwipeGesture({
    thresholdPercent,
    onSwipeLeft,
    onSwipeRight,
    enabled,
  });

  const style = getStyle();

  return (
    <div
      className={`${className} ${isSwiping ? 'swipe-active' : ''}`}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={style as React.CSSProperties}
    >
      {children}
    </div>
  );
}
