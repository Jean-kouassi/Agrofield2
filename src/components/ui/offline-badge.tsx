import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface OfflineBadgeProps {
  className?: string;
  checkInterval?: number;
}

export function OfflineBadge({ className, checkInterval = 5000 }: OfflineBadgeProps) {
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    // Vérification initiale
    setIsOnline(navigator.onLine);

    // Écouteurs d'événements
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Polling optionnel pour vérification périodique
    const intervalId = setInterval(() => {
      setIsOnline(navigator.onLine);
    }, checkInterval);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(intervalId);
    };
  }, [checkInterval]);

  if (isOnline) {
    return null; // Ne rien afficher quand en ligne
  }

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full bg-agro-accent/90 px-3 py-1.5 text-xs font-medium text-white shadow-lg backdrop-blur-sm transition-all animate-in fade-in slide-in-from-bottom-2",
        className
      )}
      role="status"
      aria-live="polite"
      aria-label="Mode hors ligne activé"
    >
      {/* Icône offline */}
      <svg
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
        />
      </svg>
      
      <span>Hors ligne</span>
      
      {/* Indicateur que les données sont sauvegardées localement */}
      <span className="text-[10px] opacity-80">• Données sauvegardées</span>
    </div>
  );
}

// Version statique pour contrôle manuel
interface OfflineBadgeStaticProps {
  isOnline: boolean;
  className?: string;
}

export function OfflineBadgeStatic({ isOnline, className }: OfflineBadgeStaticProps) {
  if (isOnline) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full bg-agro-accent/90 px-3 py-1.5 text-xs font-medium text-white shadow-lg backdrop-blur-sm",
        className
      )}
      role="status"
      aria-live="polite"
      aria-label="Mode hors ligne activé"
    >
      <svg
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
        />
      </svg>
      <span>Hors ligne</span>
      <span className="text-[10px] opacity-80">• Données sauvegardées</span>
    </div>
  );
}
