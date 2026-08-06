/**
 * SwipeContainer - Gesture physique style Facebook/iOS/Android
 * 
 * Basé sur:
 * - Facebook Rebound (spring physics: tension/friction)
 * - iOS interactivePopGestureRecognizer (critically-damped spring)
 * - Android SpringForce (damping ratio + stiffness)
 * 
 * Caractéristiques:
 * - Suivi doigt 1:1 pendant le gesture (aucune résistance)
 * - Vélocité calculée en temps réel
 * - Seuil double: distance (30%) + vélocité (700px/s)
 * - Animation spring physique à la release
 * - Feedback visuel: opacity + scale + shadow
 */

import { useState, useRef, useEffect } from "react";

interface SwipeContainerProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  enabled?: boolean;
  className?: string;
}

// Constantes physiques optimisées (basées sur iOS/Android/Facebook)
const PHYSICS = {
  // Seuil de distance: 30% de l'écran (standard iOS/Android)
  DISTANCE_THRESHOLD_PERCENT: 0.3,
  
  // Seuil de vélocité: 700px/s (flick threshold)
  VELOCITY_THRESHOLD: 700,
  
  // Résistance pendant le drag (1.0 = aucun, 0.8 = légère résistance)
  DRAG_RESISTANCE: 1.0, // 1:1 mapping comme iOS
  
  // Feedback visuel max
  MAX_OPACITY_REDUCTION: 0.2, // 1.0 → 0.8
  MAX_SCALE_REDUCTION: 0.05,  // 1.0 → 0.95
  MAX_ROTATION: 2,            // ±2 degrés
  
  // Spring parameters (critically-damped)
  SPRING_TENSION: 300,        // iOS default ~300-400
  SPRING_FRICTION: 15,        // iOS default ~12-18
  
  // Haptic feedback duration (ms)
  HAPTIC_DURATION: 5,
};

export function SwipeContainer({
  children,
  onSwipeLeft,
  onSwipeRight,
  enabled = true,
  className = "",
}: SwipeContainerProps) {
  const [isSwiping, setIsSwiping] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);
  
  // État du gesture
  const gestureRef = useRef({
    startX: 0,
    currentX: 0,
    lastX: 0,
    lastTime: 0,
    velocity: 0,
  });

  // Calculer la vélocité en temps réel
  const calculateVelocity = (currentX: number, currentTime: number) => {
    const { lastX, lastTime } = gestureRef.current;
    const deltaTime = currentTime - lastTime;
    
    if (deltaTime === 0) return 0;
    
    return (currentX - lastX) / (deltaTime / 1000); // px/s
  };

  // Appliquer les transformations CSS
  const applyTransform = (translateX: number) => {
    const elem = elementRef.current;
    if (!elem) return;
    
    const screenWidth = window.innerWidth;
    const absTranslate = Math.abs(translateX);
    const maxDrag = screenWidth * 0.7;
    
    // Interpolation linéaire pour feedback visuel
    const progress = Math.min(absTranslate / maxDrag, 1);
    const opacity = 1 - progress * PHYSICS.MAX_OPACITY_REDUCTION;
    const scale = 1 - progress * PHYSICS.MAX_SCALE_REDUCTION;
    const rotate = (translateX / maxDrag) * PHYSICS.MAX_ROTATION;
    
    // Shadow portée progressive
    const shadowOpacity = progress * 0.3;
    const shadowBlur = progress * 40;
    
    elem.style.transform = `translateX(${translateX}px) scale(${scale}) rotate(${rotate}deg)`;
    elem.style.opacity = opacity.toString();
    elem.style.boxShadow = `0 ${10 + shadowBlur}px ${20 + shadowBlur}px rgba(0,0,0,${shadowOpacity})`;
    elem.style.transition = 'none'; // Aucun lissage pendant le drag
    elem.style.cursor = 'grabbing';
    elem.style.willChange = 'transform, opacity, box-shadow';
  };

  // Reset styles
  const resetStyles = () => {
    const elem = elementRef.current;
    if (!elem) return;
    
    elem.style.transform = '';
    elem.style.opacity = '';
    elem.style.boxShadow = '';
    elem.style.transition = '';
    elem.style.cursor = 'grab';
    elem.style.willChange = 'auto';
  };

  // Animation spring à la release avec transition visible
  const animateToTarget = (targetX: number, onComplete?: () => void) => {
    const elem = elementRef.current;
    if (!elem) return;
    
    // Simulation spring simple (Euler integration)
    let position = parseFloat(elem.style.transform.match(/translateX\(([-\d.]+)px\)/)?.[1] || '0');
    let velocity = gestureRef.current.velocity * PHYSICS.DRAG_RESISTANCE;
    
    const tension = PHYSICS.SPRING_TENSION;
    const friction = PHYSICS.SPRING_FRICTION;
    const mass = 1; // kg (arbitraire)
    
    let lastTime = performance.now();
    
    const animate = () => {
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.05); // Clamp à 50ms max
      lastTime = now;
      
      // Loi de Hooke: F = -kx - bv
      const displacement = targetX - position;
      const springForce = tension * displacement;
      const dampingForce = friction * velocity;
      const acceleration = (springForce - dampingForce) / mass;
      
      velocity += acceleration * dt;
      position += velocity * dt;
      
      // Appliquer transformation avec PLUS de visibilité
      const progress = Math.abs(position / targetX);
      const opacity = Math.max(0.3, progress); // Minimum 0.3 pour qu'on voit toujours la page
      const scale = 0.85 + 0.15 * progress; // Scale de 0.85 à 1.0 (plus visible)
      const rotate = (position / window.innerWidth) * 3; // ±3 degrés (plus visible)
      
      // Shadow PLUS prononcée
      const shadowOpacity = 0.2 + progress * 0.4;
      const shadowBlur = 20 + progress * 60;
      const shadowY = 10 + progress * 30;
      
      elem.style.transform = `translateX(${position}px) scale(${scale}) rotate(${rotate}deg)`;
      elem.style.opacity = opacity.toString();
      elem.style.boxShadow = `0 ${shadowY}px ${shadowBlur}px rgba(0,0,0,${shadowOpacity})`;
      
      // Check si proche de la cible (< 5px)
      if (Math.abs(targetX - position) < 5 && Math.abs(velocity) < 50) {
        elem.style.transform = `translateX(${targetX}px) scale(0.85) rotate(${targetX / window.innerWidth * 3}deg)`;
        elem.style.opacity = '0.3';
        elem.style.boxShadow = `0 40px 80px rgba(0,0,0,0.6)`;
        
        // Attendre que l'animation soit bien visible avant de naviguer
        setTimeout(() => {
          onComplete?.();
        }, 200); // Délai pour voir la transition
        return;
      }
      
      requestAnimationFrame(animate);
    };
    
    requestAnimationFrame(animate);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    // IMPORTANT: Ne pas intercepter si on touche un élément interactif (bouton, lien, input)
    const target = e.target as HTMLElement;
    if (target.closest('button, a, input, select, textarea, [role="button"], .no-swipe')) {
      return; // Laisser l'événement passer normalement
    }
    
    if (!enabled) return;
    
    const touch = e.targetTouches[0];
    const now = performance.now();
    
    gestureRef.current = {
      startX: touch.clientX,
      currentX: touch.clientX,
      lastX: touch.clientX,
      lastTime: now,
      velocity: 0,
    };
    
    setIsSwiping(true);
    
    // Haptic feedback (si supporté)
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(PHYSICS.HAPTIC_DURATION);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // Si on touche un élément interactif, ne pas intercepter
    const target = e.target as HTMLElement;
    if (target.closest('button, a, input, select, textarea, [role="button"], .no-swipe')) {
      return;
    }
    
    if (!enabled || !isSwiping) return;
    
    const touch = e.targetTouches[0];
    const now = performance.now();
    
    gestureRef.current.currentX = touch.clientX;
    gestureRef.current.velocity = calculateVelocity(touch.clientX, now);
    
    // Mettre à jour pour prochain calcul vélocité
    gestureRef.current.lastX = touch.clientX;
    gestureRef.current.lastTime = now;
    
    // Calculer translation avec résistance
    const diff = gestureRef.current.currentX - gestureRef.current.startX;
    const translateX = diff * PHYSICS.DRAG_RESISTANCE;
    
    applyTransform(translateX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    // Si on touche un élément interactif, ne pas intercepter
    const target = e.target as HTMLElement;
    if (target.closest('button, a, input, select, textarea, [role="button"], .no-swipe')) {
      resetStyles();
      setIsSwiping(false);
      return;
    }
    
    if (!enabled || !isSwiping) {
      resetStyles();
      setIsSwiping(false);
      return;
    }
    
    const touch = e.changedTouches[0];
    const finalX = touch.clientX;
    const diff = finalX - gestureRef.current.startX;
    const screenWidth = window.innerWidth;
    
    const distanceThreshold = screenWidth * PHYSICS.DISTANCE_THRESHOLD_PERCENT;
    const velocity = gestureRef.current.velocity;
    
    // Décision: navigation ou retour?
    const shouldSwipeLeft = diff > distanceThreshold || velocity > PHYSICS.VELOCITY_THRESHOLD;
    const shouldSwipeRight = diff < -distanceThreshold || velocity < -PHYSICS.VELOCITY_THRESHOLD;
    
    if (shouldSwipeLeft && onSwipeRight) {
      // Swipe vers la droite → page précédente
      animateToTarget(screenWidth * 0.8, () => {
        setTimeout(() => {
          onSwipeRight();
          resetStyles();
          setIsSwiping(false);
        }, 100);
      });
    } else if (shouldSwipeRight && onSwipeLeft) {
      // Swipe vers la gauche → page suivante
      animateToTarget(-screenWidth * 0.8, () => {
        setTimeout(() => {
          onSwipeLeft();
          resetStyles();
          setIsSwiping(false);
        }, 100);
      });
    } else {
      // Retour élastique (spring back to center)
      animateToTarget(0, () => {
        resetStyles();
        setIsSwiping(false);
      });
    }
  };

  // Support clavier
  useEffect(() => {
    if (!enabled) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && onSwipeRight) {
        onSwipeRight();
      } else if (e.key === 'ArrowRight' && onSwipeLeft) {
        onSwipeLeft();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, onSwipeLeft, onSwipeRight]);

  return (
    <div
      ref={elementRef}
      className={`${className} ${isSwiping ? 'swipe-active' : ''}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        touchAction: 'pan-y', // Permet scroll vertical, bloque horizontal
        cursor: 'grab',
        WebkitOverflowScrolling: 'touch', // Smooth scrolling iOS
      }}
    >
      {children}
    </div>
  );
}
