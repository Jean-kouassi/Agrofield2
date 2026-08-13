import { useEffect, useState } from 'react';
import { X, Download, CheckCircle } from 'lucide-react';

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Vérifier si l'utilisateur a déjà refusé
      const hasDismissed = localStorage.getItem('pwa-install-dismissed');
      if (!hasDismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-50 mx-auto max-w-md rounded-2xl border border-green-200 bg-white p-4 shadow-xl animate-in slide-in-from-bottom fade-in duration-300">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100">
          <Download className="h-5 w-5 text-green-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-gray-900">Installer AgroSphere</h3>
          <p className="mt-1 text-xs text-gray-600">
            Ajoutez AgroSphere à votre écran d'accueil pour y accéder rapidement, même sans connexion internet.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleInstall}
              className="flex-1 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary/90"
            >
              Installer
            </button>
            <button
              onClick={handleDismiss}
              className="rounded-full border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
            >
              Plus tard
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="shrink-0 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// Composant pour afficher l'état offline
export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed top-16 left-0 right-0 z-50 mx-auto w-max max-w-[90%] rounded-full bg-amber-500 px-4 py-2 text-xs font-semibold text-white shadow-lg animate-in fade-in slide-in-from-top-2">
      <div className="flex items-center gap-2">
        <CheckCircle className="h-4 w-4" />
        <span>Mode hors ligne activé - Vos données sont accessibles</span>
      </div>
    </div>
  );
}
