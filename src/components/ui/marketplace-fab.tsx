import { ShoppingCart } from 'lucide-react';
import { Link } from '@tanstack/react-router';

export function MarketplaceFab() {
  return (
    <Link
      to="/marketplace"
      className="fixed bottom-6 right-6 z-50 bg-orange-500 text-white p-4 rounded-full shadow-xl hover:bg-orange-600 transition-all active:scale-95 flex items-center justify-center"
      aria-label="Aller au Marketplace - Créer et parcourir les offres agricoles"
      title="Marketplace AgroSphere"
    >
      <ShoppingCart size={28} />
    </Link>
  );
}
