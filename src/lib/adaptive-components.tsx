/**
 * AgroSphere - Composants Adaptatifs Lite Mode
 * Date: 21 Juillet 2026
 * 
 * Fournit des versions "légères" des composants qui s'activent automatiquement
 * selon la qualité de connexion, SANS supprimer de fonctionnalités.
 */

import { useNetworkStatus, type ConnectionQuality } from './network-detection';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Leaf } from 'lucide-react';

// ============================================================================
// IMAGE ADAPTATIVE
// ============================================================================

interface AdaptiveImageProps {
  src?: string;
  alt: string;
  className?: string;
  placeholder?: React.ReactNode;
}

/**
 * Image qui s'adapte automatiquement à la connexion
 * - Excellent/Good: Image normale
 * - Poor: Image compressée + lazy load
 * - Offline: Placeholder uniquement
 */
export function AdaptiveImage({ src, alt, className = '', placeholder }: AdaptiveImageProps) {
  const { quality, config } = useNetworkStatus();

  // Hors ligne → pas d'image du tout
  if (quality === 'offline' || !config.loadImages) {
    return (
      <div className={`bg-gray-100 flex items-center justify-center ${className}`}>
        {placeholder || (
          <div className="text-center p-4">
            <Leaf className="w-8 h-8 mx-auto text-gray-400 mb-2" />
            <span className="text-xs text-gray-500">Image (hors ligne)</span>
          </div>
        )}
      </div>
    );
  }

  // Connexion faible → lazy load agressif + compression
  if (quality === 'poor') {
    return (
      <img
        src={src}
        alt={alt}
        className={`loading-opacity-50 ${className}`}
        loading="lazy"
        style={{ maxWidth: '100%', height: 'auto' }}
        onError={(e) => {
          // Fallback en cas d'erreur de chargement
          e.currentTarget.style.display = 'none';
          const placeholderDiv = document.createElement('div');
          placeholderDiv.className = `bg-gray-100 flex items-center justify-center ${className}`;
          placeholderDiv.innerHTML = `<div class="text-center p-4"><Leaf class="w-8 h-8 mx-auto text-gray-400 mb-2"/></div>`;
          e.currentTarget.parentElement?.appendChild(placeholderDiv);
        }}
      />
    );
  }

  // Bonne connexion → image normale
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
    />
  );
}

// ============================================================================
// CARTE PRODUIT ADAPTATIVE
// ============================================================================

interface OfferCardProps {
  offer: any;
  onViewDetails: () => void;
  onOrder: () => void;
}

/**
 * Carte produit qui adapte son contenu selon la connexion
 * Garde TOUTES les fonctionnalités (voir détails, commander)
 */
export function AdaptiveOfferCard({ offer, onViewDetails, onOrder }: OfferCardProps) {
  const { quality, config } = useNetworkStatus();
  const isPoorConnection = quality === 'poor' || quality === 'offline';

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {/* Zone Image - Adaptative */}
      <div className="relative h-48 bg-gray-100">
        {config.loadImages ? (
          <AdaptiveImage
            src={offer.image_url}
            alt={offer.title}
            className="w-full h-full object-cover"
            placeholder={
              <div className="flex items-center justify-center h-full">
                <Leaf className="w-12 h-12 text-gray-300" />
              </div>
            }
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gradient-to-br from-green-100 to-emerald-100">
            <div className="text-center p-4">
              <Leaf className="w-12 h-12 mx-auto text-green-600 mb-2" />
              <p className="text-sm font-semibold text-green-700">{offer.category}</p>
            </div>
          </div>
        )}

        {/* Badge Prix - Toujours visible */}
        <div className="absolute top-2 right-2">
          <Badge className="bg-green-600 text-white font-bold">
            {offer.price.toLocaleString('fr-FR')} FCFA/kg
          </Badge>
        </div>

        {/* Indicateur Offline */}
        {quality === 'offline' && (
          <div className="absolute top-2 left-2">
            <Badge variant="secondary" className="bg-gray-800 text-white">
              📴 Hors ligne
            </Badge>
          </div>
        )}
      </div>

      {/* Contenu - Simplifié en mode pauvre */}
      <div className="p-4">
        {/* Titre - Toujours complet */}
        <h3 className="font-bold text-lg mb-2 line-clamp-2">
          {offer.title}
        </h3>

        {/* Description - Version longue ou courte selon connexion */}
        {isPoorConnection ? (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {offer.description}
          </p>
        ) : (
          <p className="text-sm text-gray-600 mb-3">
            {offer.description}
          </p>
        )}

        {/* Infos clés - Toujours visibles */}
        <div className="flex items-center justify-between mb-4 text-sm">
          <div className="flex items-center gap-1 text-gray-600">
            <span>📍</span>
            <span className="truncate max-w-[100px]">{offer.region}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-600">
            <span>📦</span>
            <span>{offer.quantity} kg</span>
          </div>
        </div>

        {/* Boutons d'action - Toujours fonctionnels */}
        <div className="flex gap-2">
          <button
            onClick={onViewDetails}
            className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
            disabled={false} // Toujours actif même offline (ouvre cache)
          >
            {quality === 'offline' ? '📴 Voir (cache)' : 'Voir détails'}
          </button>
          
          <button
            onClick={onOrder}
            className="flex-1 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors font-medium text-sm"
            disabled={false} // Toujours actif (file d'attente offline)
          >
            {quality === 'offline' ? '📥 Commander (queue)' : 'Commander'}
          </button>
        </div>

        {/* Statut synchronisation si offline */}
        {quality === 'offline' && (
          <div className="mt-2 text-xs text-gray-500 text-center">
            Les actions seront synchronisées au retour de la connexion
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// SQUELETTE DE CHARGEMENT ADAPTATIF
// ============================================================================

/**
 * Skeleton qui s'adapte à la connexion
 * - Bon: Animation normale
 * - Pauvre: Skeleton statique (moins de données)
 */
export function AdaptiveSkeleton({ className = '' }: { className?: string }) {
  const { quality } = useNetworkStatus();

  if (quality === 'poor' || quality === 'offline') {
    // Version simplifiée
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="h-32 bg-gray-200 rounded" />
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
      </div>
    );
  }

  // Version normale avec animation
  return <Skeleton className={className} />;
}

// ============================================================================
// INDICATEUR DE CONNEXION (BADGE)
// ============================================================================

export function ConnectionBadge() {
  const { quality, isOnline } = useNetworkStatus();

  const getConfig = () => {
    switch (quality) {
      case 'excellent':
        return { color: 'bg-green-500', text: '4G+/WiFi', icon: '📶' };
      case 'good':
        return { color: 'bg-blue-500', text: '4G/3G+', icon: '📶' };
      case 'poor':
        return { color: 'bg-orange-500', text: '3G/2G', icon: '📳' };
      case 'offline':
        return { color: 'bg-gray-500', text: 'Hors ligne', icon: '📴' };
      default:
        return { color: 'bg-gray-500', text: 'Inconnu', icon: '❓' };
    }
  };

  const config = getConfig();

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white ${config.color}`}>
      <span>{config.icon}</span>
      <span className="hidden sm:inline">{config.text}</span>
      {!isOnline && <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />}
    </div>
  );
}

// ============================================================================
// BOUTON ADAPTATIF
// ============================================================================

interface AdaptiveButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  offlineAction?: () => void;
}

/**
 * Bouton qui adapte son comportement selon la connexion
 * - Online: Action normale
 * - Offline: Message informatif + file d'attente
 */
export function AdaptiveButton({ 
  children, 
  loading = false, 
  offlineAction,
  disabled,
  onClick,
  className = '',
  ...props 
}: AdaptiveButtonProps) {
  const { quality } = useNetworkStatus();
  const isOffline = quality === 'offline';

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isOffline && offlineAction) {
      // Action offline spécifique
      offlineAction();
    } else if (onClick) {
      onClick(e);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled || loading}
      className={`
        px-4 py-2 rounded-lg font-medium transition-all
        ${isOffline ? 'bg-gray-600 hover:bg-gray-700' : 'bg-green-600 hover:bg-green-700'}
        text-white
        ${loading ? 'opacity-50 cursor-not-allowed' : ''}
        ${disabled ? 'cursor-not-allowed opacity-50' : ''}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          {children}
        </span>
      ) : (
        <>
          {isOffline && '📴 '}
          {children}
          {isOffline && ' (hors ligne)'}
        </>
      )}
    </button>
  );
}
