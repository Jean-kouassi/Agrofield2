/**
 * Agrofield - Détection Intelligente de Réseau
 * Date: 21 Juillet 2026
 * 
 * Détecte automatiquement la qualité de connexion et adapte l'expérience utilisateur
 * sans supprimer aucune fonctionnalité.
 * 
 * Niveaux de connexion:
 * - excellent: WiFi/4G+ (> 5 Mbps) → Toutes fonctionnalités, images HD
 * - good: 4G/3G+ (1-5 Mbps) → Images compressées, features normales
 * - poor: 3G/2G (0.5-1 Mbps) → Texte prioritaire, images lazy-load
 * - offline: < 0.5 Mbps ou hors ligne → Mode offline, file d'attente
 */

export type ConnectionQuality = 'excellent' | 'good' | 'poor' | 'offline';

export interface NetworkStatus {
  quality: ConnectionQuality;
  isOnline: boolean;
  downlink?: number; // Mbps
  rtt?: number; // ms (round-trip time)
  saveData?: boolean; // Data Saver mode activé
  effectiveType?: string; // '2g', '3g', '4g', 'slow-2g'
}

// ============================================================================
// DÉTECTION DE LA QUALITÉ DE CONNEXION
// ============================================================================

/**
 * Obtient le statut réseau actuel avec détails
 * NOTE: Cette fonction ne doit être appelée que côté client (browser)
 */
export function getNetworkStatus(): NetworkStatus {
  // Protection SSR - si window n'existe pas, on retourne un statut par défaut
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      quality: 'good', // Défaut pour SSR
      isOnline: true,
    };
  }
  
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  
  const isOnline = navigator.onLine;
  
  if (!isOnline) {
    return {
      quality: 'offline',
      isOnline: false,
    };
  }
  
  // Si Network Information API disponible (Chrome, Edge, Opera)
  if (connection) {
    const downlink = connection.downlink; // Mbps
    const rtt = connection.rtt; // ms
    const saveData = connection.saveData;
    const effectiveType = connection.effectiveType;
    
    let quality: ConnectionQuality;
    
    // Déterminer la qualité basée sur downlink et rtt
    if (downlink > 5 && rtt < 100) {
      quality = 'excellent'; // WiFi / 4G+
    } else if (downlink > 1 && rtt < 300) {
      quality = 'good'; // 4G / 3G+
    } else if (downlink > 0.5) {
      quality = 'poor'; // 3G / 2G
    } else {
      quality = 'offline'; // Quasi hors ligne
    }
    
    // Mode Data Saver force le mode pauvre
    if (saveData && quality === 'excellent') {
      quality = 'good';
    }
    
    return {
      quality,
      isOnline: true,
      downlink,
      rtt,
      saveData,
      effectiveType,
    };
  }
  
  // Fallback si Network Information API non supportée (Firefox, Safari)
  // On fait un test de vitesse simplifié
  return estimateConnectionQuality();
}

/**
 * Estime la qualité de connexion via un test de ping simplifié
 * (Fallback pour navigateurs sans Network Information API)
 */
async function estimateConnectionQuality(): Promise<NetworkStatus> {
  if (!navigator.onLine) {
    return { quality: 'offline', isOnline: false };
  }
  
  const startTime = performance.now();
  
  try {
    // Petit requête vers un CDN rapide (Supabase dans notre cas)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s max
    
    const response = await fetch('https://stzilbwemluhftcvdqfm.supabase.co/rest/v1/', {
      method: 'HEAD',
      signal: controller.signal,
      cache: 'no-store',
    });
    
    clearTimeout(timeoutId);
    const endTime = performance.now();
    const rtt = endTime - startTime; // ms
    
    // Estimation grossière basée sur le RTT
    let quality: ConnectionQuality;
    let downlink: number;
    
    if (rtt < 100) {
      quality = 'excellent';
      downlink = 5;
    } else if (rtt < 300) {
      quality = 'good';
      downlink = 2;
    } else if (rtt < 1000) {
      quality = 'poor';
      downlink = 0.5;
    } else {
      quality = 'offline';
      downlink = 0;
    }
    
    return {
      quality,
      isOnline: true,
      downlink,
      rtt,
      saveData: false,
      effectiveType: undefined,
    };
  } catch (error) {
    // Timeout ou erreur → considéré comme offline
    return {
      quality: 'offline',
      isOnline: false,
    };
  }
}

// ============================================================================
// MONITEUR DE CONNEXION (OBSERVABLE)
// ============================================================================

class NetworkMonitorClass {
  private status: NetworkStatus = { quality: 'good', isOnline: true }; // Valeur par défaut pour SSR
  private listeners: Set<(status: NetworkStatus) => void> = new Set();
  private pollInterval?: NodeJS.Timeout;

  constructor() {
    // Initialisation uniquement côté client
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      this.status = getNetworkStatus();
      
      // Écouter les événements natifs
      window.addEventListener('online', () => this.updateStatus());
      window.addEventListener('offline', () => this.updateStatus());
      
      // Polling toutes les 30 secondes pour détecter changements de qualité
      this.startPolling();
      
      console.log('[NetworkMonitor] Initialized with status:', this.status.quality);
    }
  }

  private startPolling() {
    this.pollInterval = setInterval(() => {
      this.updateStatus();
    }, 30000); // 30 secondes
  }

  private updateStatus() {
    const newStatus = getNetworkStatus();
    
    // Ne notifier que si changement significatif
    if (newStatus.quality !== this.status.quality || newStatus.isOnline !== this.status.isOnline) {
      console.log('[NetworkMonitor] Connection quality changed:', {
        from: this.status.quality,
        to: newStatus.quality,
        downlink: newStatus.downlink,
        rtt: newStatus.rtt,
      });
      
      this.status = newStatus;
      this.notifyListeners();
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this.status);
      } catch (error) {
        console.error('[NetworkMonitor] Listener error:', error);
      }
    });
  }

  /**
   * S'abonner aux changements de statut réseau
   * @returns Fonction de désabonnement
   */
  subscribe(callback: (status: NetworkStatus) => void): () => void {
    this.listeners.add(callback);
    
    // Envoyer le statut actuel immédiatement
    callback(this.status);
    
    // Retourner fonction unsubscribe
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Obtient le statut actuel (synchrone)
   */
  getStatus(): NetworkStatus {
    return this.status;
  }

  /**
   * Vérifie si la connexion est suffisante pour une action donnée
   */
  canPerformAction(requiredQuality: ConnectionQuality): boolean {
    const current = this.getStatus();
    
    const qualityOrder: ConnectionQuality[] = ['offline', 'poor', 'good', 'excellent'];
    const currentIndex = qualityOrder.indexOf(current.quality);
    const requiredIndex = qualityOrder.indexOf(requiredQuality);
    
    return currentIndex >= requiredIndex;
  }

  /**
   * Arrête le monitoring (à appeler au cleanup)
   */
  destroy() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
    this.listeners.clear();
  }
}

// Singleton exporté
export const networkMonitor = new NetworkMonitorClass();

// ============================================================================
// UTILITAIRES DE CONFIGURATION
// ============================================================================

/**
 * Configuration recommandée selon la qualité de connexion
 */
export function getConnectionConfig(quality: ConnectionQuality) {
  switch (quality) {
    case 'excellent':
      return {
        loadImages: true,
        imageQuality: 'high', // Original / WebP haute qualité
        lazyLoadImages: false,
        enableAnimations: true,
        enableRealtimeUpdates: true,
        prefetchData: true,
        maxConcurrentUploads: 5,
        uploadTimeout: 30000, // 30s
        cacheStrategy: 'network-first',
      };

    case 'good':
      return {
        loadImages: true,
        imageQuality: 'medium', // WebP compressé ~200KB
        lazyLoadImages: true,
        enableAnimations: true,
        enableRealtimeUpdates: true,
        prefetchData: false,
        maxConcurrentUploads: 3,
        uploadTimeout: 45000, // 45s
        cacheStrategy: 'stale-while-revalidate',
      };

    case 'poor':
      return {
        loadImages: true,
        imageQuality: 'low', // WebP très compressé ~50KB, ou placeholder
        lazyLoadImages: 'aggressive', // Seulement quand visible
        enableAnimations: false, // Désactiver animations CSS
        enableRealtimeUpdates: false, // Polling manuel uniquement
        prefetchData: false,
        maxConcurrentUploads: 1,
        uploadTimeout: 90000, // 1min 30s
        cacheStrategy: 'cache-first',
      };

    case 'offline':
      return {
        loadImages: false, // Pas d'images du tout
        imageQuality: 'none',
        lazyLoadImages: false,
        enableAnimations: false,
        enableRealtimeUpdates: false,
        prefetchData: false,
        maxConcurrentUploads: 0,
        uploadTimeout: 0,
        cacheStrategy: 'cache-only',
      };

    default:
      return getConnectionConfig('good');
  }
}

/**
 * Hook React pour surveiller la qualité de connexion
 * 
 * Exemple d'usage:
 * ```tsx
 * function OfferCard({ offer }) {
 *   const { quality, config } = useNetworkStatus();
 *   
 *   return (
 *     <div>
 *       {config.loadImages ? (
 *         <img src={getImageUrl(offer, config.imageQuality)} />
 *       ) : (
 *         <div className="image-placeholder">🌾</div>
 *       )}
 *       <h3>{offer.title}</h3>
 *       {quality === 'offline' && <span>📴 Hors ligne</span>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useNetworkStatus() {
  const [status, setStatus] = useState<NetworkStatus>(networkMonitor.getStatus());
  const config = getConnectionConfig(status.quality);

  useEffect(() => {
    const unsubscribe = networkMonitor.subscribe(setStatus);
    return () => unsubscribe();
  }, []);

  return {
    ...status,
    config,
    isExcellent: status.quality === 'excellent',
    isGood: status.quality === 'good',
    isPoor: status.quality === 'poor',
    isOffline: status.quality === 'offline',
  };
}

/**
 * HOC (Higher-Order Component) pour adapter un composant selon le réseau
 * 
 * Exemple:
 * ```tsx
 * const AdaptiveOfferList = withNetworkAdaptation(OfferList, {
 *   poorMode: TextOnlyOfferList,
 *   offlineMode: OfflineNotice,
 * });
 * ```
 */
export function withNetworkAdaptation<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    poorMode?: React.ComponentType<P>;
    offlineMode?: React.ComponentType<P>;
  }
) {
  return function AdaptedComponent(props: P) {
    const { quality } = useNetworkStatus();
    
    if (quality === 'offline' && options.offlineMode) {
      return React.createElement(options.offlineMode, props);
    }
    
    if (quality === 'poor' && options.poorMode) {
      return React.createElement(options.poorMode, props);
    }
    
    return React.createElement(Component, props);
  };
}

// ============================================================================
// EXPORTS POUR USAGE DIRECT
// ============================================================================

/**
 * Vérifie rapidement si on peut charger des images
 */
export function shouldLoadImages(): boolean {
  const status = networkMonitor.getStatus();
  return status.quality !== 'offline';
}

/**
 * Obtient la qualité d'image recommandée
 */
export function getImageQuality(): 'high' | 'medium' | 'low' | 'none' {
  const status = networkMonitor.getStatus();
  const config = getConnectionConfig(status.quality);
  return config.imageQuality as 'high' | 'medium' | 'low' | 'none';
}

/**
 * Décide s'il faut activer le mode économie de données
 */
export function shouldEnableDataSaver(): boolean {
  const status = networkMonitor.getStatus();
  return status.quality === 'poor' || status.saveData === true;
}
