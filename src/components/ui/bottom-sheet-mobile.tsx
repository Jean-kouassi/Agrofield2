import * as React from "react";
import { cn } from "@/lib/utils";

interface BottomSheetMobileProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  preventClose?: boolean;
}

export function BottomSheetMobile({
  isOpen,
  onClose,
  title,
  children,
  footer,
  className,
  preventClose = false,
}: BottomSheetMobileProps) {
  // Empêcher le scroll du body quand la sheet est ouverte
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Gérer la fermeture avec Echap
  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !preventClose) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose, preventClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm animate-in fade-in"
        onClick={preventClose ? undefined : onClose}
        aria-hidden="true"
      />
      
      {/* Sheet */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] overflow-hidden rounded-t-2xl bg-background shadow-2xl animate-in slide-in-from-bottom",
          "transition-transform duration-300 ease-out",
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bottom-sheet-title"
      >
        {/* Handle bar (indicateur de poignée) */}
        <div className="flex items-center justify-center pt-3 pb-1">
          <div 
            className="h-1.5 w-12 rounded-full bg-muted-foreground/30" 
            aria-hidden="true"
          />
        </div>
        
        {/* Header */}
        {title && (
          <div className="sticky top-0 flex items-center justify-between border-b bg-background px-4 py-3">
            <h2 
              id="bottom-sheet-title"
              className="text-lg font-semibold text-agro-primary"
            >
              {title}
            </h2>
            {!preventClose && (
              <button
                onClick={onClose}
                className="rounded-full p-2 text-muted-foreground hover:bg-muted transition-colors"
                aria-label="Fermer"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        )}
        
        {/* Content - Scrollable */}
        <div className="overflow-y-auto px-4 py-4" style={{ maxHeight: "calc(85vh - 120px)" }}>
          {children}
        </div>
        
        {/* Footer (sticky) */}
        {footer && (
          <div className="sticky bottom-0 border-t bg-background px-4 py-3">
            {footer}
          </div>
        )}
      </div>
    </>
  );
}

// Hook pour gérer l'ouverture/fermeture
export function useBottomSheet(initialState = false) {
  const [isOpen, setIsOpen] = React.useState(initialState);
  
  const open = React.useCallback(() => setIsOpen(true), []);
  const close = React.useCallback(() => setIsOpen(false), []);
  const toggle = React.useCallback(() => setIsOpen(prev => !prev), []);
  
  return { isOpen, open, close, toggle };
}
