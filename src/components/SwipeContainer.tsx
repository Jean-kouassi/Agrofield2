/**
 * Composant SwipeContainer - Gesture style Facebook/Instagram
 * 
 * Usage:
 * <SwipeContainer
 *   onSwipeLeft={() => navigate('/page-suivante')}
 *   onSwipeRight={() => navigate('/page-precedente')}
 * >
 *   {/* Contenu de la page */}
 * </SwipeContainer>
 */

import { useState, useRef } from "react";

interface SwipeContainerProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  thresholdPercent?: number; // Défaut: 30% de l'écran
  enabled?: boolean;
  className?: string;
}

export function SwipeContainer({
  children,
  onSwipeLeft,
  onSwipeRight,
  thresholdPercent = 30,
  enabled = true,
  className = "",
}: SwipeContainerProps) {
  const [isSwiping, setIsSwiping] = useState(false);
  const touchStartRef = useRef<number | null>(null);
  const touchCurrentRef = useRef<number>(0);
  const elementRef = useRef<HTMLDivElement>(null);

  const screenWidth = typeof window !== "undefined" ? window.innerWidth : 375;
  const minSwipeDistance = (screenWidth * thresholdPercent) / 100;
  const maxDrag = screenWidth * 0.7;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!enabled) return;
    const touch = e.targetTouches[0];
    touchStartRef.current = touch.clientX;
    touchCurrentRef.current = touch.clientX;
    setIsSwiping(true);
    
    // Haptic feedback (si supporté)
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(5);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!enabled || touchStartRef.current === null || !elementRef.current) return;
    
    const touch = e.targetTouches[0];
    touchCurrentRef.current = touch.clientX;
    
    const diff = touchCurrentRef.current - touchStartRef.current;
    const resistance = 0.8;
    const translateX = diff * resistance;
    const opacity = 1 - (Math.abs(diff) / maxDrag) * 0.3;
    const scale = 1 - (Math.abs(diff) / maxDrag) * 0.05;
    const rotate = (diff / maxDrag) * 2;

    elementRef.current.style.transform = `translateX(${translateX}px) scale(${scale}) rotate(${rotate}deg)`;
    elementRef.current.style.opacity = opacity.toString();
    elementRef.current.style.transition = "none";
    elementRef.current.style.cursor = "grabbing";
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!enabled || touchStartRef.current === null || !elementRef.current) {
      resetStyle();
      return;
    }
    
    const touch = e.changedTouches[0];
    const diff = touchStartRef.current - touch.clientX;
    
    // Appliquer transition fluide pour la sortie
    elementRef.current.style.transition = "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease";
    elementRef.current.style.cursor = "grab";
    
    if (Math.abs(diff) > minSwipeDistance) {
      // Swipe validé - navigation
      if (diff > 0 && onSwipeLeft) {
        // Swipe vers la gauche → page suivante
        elementRef.current.style.transform = "translateX(-100%) scale(0.95)";
        elementRef.current.style.opacity = "0";
        setTimeout(() => {
          onSwipeLeft();
          resetStyle();
        }, 150);
      } else if (diff < 0 && onSwipeRight) {
        // Swipe vers la droite → page précédente
        elementRef.current.style.transform = "translateX(100%) scale(0.95)";
        elementRef.current.style.opacity = "0";
        setTimeout(() => {
          onSwipeRight();
          resetStyle();
        }, 150);
      } else {
        resetStyle();
      }
    } else {
      // Seuil non atteint → retour élastique
      resetStyle();
    }
    
    setIsSwiping(false);
  };

  const resetStyle = () => {
    if (elementRef.current) {
      elementRef.current.style.transform = "";
      elementRef.current.style.opacity = "";
      elementRef.current.style.transition = "";
      elementRef.current.style.cursor = "";
    }
    touchStartRef.current = null;
    touchCurrentRef.current = 0;
  };

  // Support clavier
  useState(() => {
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
  });

  return (
    <div
      ref={elementRef}
      className={`${className} ${isSwiping ? "swipe-active" : ""}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        willChange: isSwiping ? "transform, opacity" : "auto",
        touchAction: "pan-y", // Permet scroll vertical mais bloque horizontal
      }}
    >
      {children}
    </div>
  );
}
