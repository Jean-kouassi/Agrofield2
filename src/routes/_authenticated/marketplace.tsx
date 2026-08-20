import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Plus, Search, SlidersHorizontal, ShoppingBag, LayoutGrid, ClipboardList, MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductCard, ProductSkeleton, EmptyState } from "@/components/marketplace/product-card";
import { FilterDrawer } from "@/components/marketplace/filter-drawer";
import { ProductDetailModal } from "@/components/marketplace/product-detail-modal";
import { PublishModal } from "@/components/marketplace/publish-modal";
import { SellerDashboard } from "@/components/marketplace/seller-dashboard";
import { OrdersView } from "@/components/marketplace/orders-view";
import { MessagesView } from "@/components/marketplace/messages-view";
import type { FilterValues } from "@/components/marketplace/filter-drawer";
import { CATEGORIES, fcfa } from "@/lib/marketplace-data";
import { fetchListings } from "@/lib/marketplace.service";
import type { MarketplaceListing } from "@/lib/marketplace-data";

export const Route = createFileRoute("/_authenticated/marketplace")({
  head: () => ({
    meta: [
      { title: "Marketplace — AgroSphere" },
      { name: "description", content: "Achetez et vendez vos produits agricoles directement entre producteurs." },
      { property: "og:title", content: "Marketplace — AgroSphere" },
      { property: "og:description", content: "Achetez et vendez vos produits agricoles directement entre producteurs." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MarketplacePage,
});

function MarketplacePage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState("market");
  const [showPublish, setShowPublish] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<MarketplaceListing | null>(null);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [filters, setFilters] = useState<FilterValues>({
    priceMin: "",
    priceMax: "",
    region: "all",
    availability: "all",
    saleType: "all",
  });

  const listingsQ = useQuery({
    queryKey: ["marketplace-listings"],
    queryFn: async () => {
      const data = await fetchListings();
      return data;
    },
  });

  const filtered = useMemo(() => {
    const listings = listingsQ.data ?? [];
    return listings.filter((l: MarketplaceListing) => {
      if (activeCategory !== "all" && l.category !== activeCategory) return false;
      if (
        query.trim() &&
        !`${l.title} ${l.seller} ${l.region} ${l.city}`
          .toLowerCase()
          .includes(query.trim().toLowerCase())
      )
        return false;
      if (filters.priceMin && l.price < Number(filters.priceMin)) return false;
      if (filters.priceMax && l.price > Number(filters.priceMax)) return false;
      if (filters.region !== "all" && l.region !== filters.region) return false;
      if (filters.availability !== "all" && l.status !== filters.availability) return false;
      if (filters.saleType !== "all" && l.saleType !== filters.saleType) return false;
      return true;
    });
  }, [listingsQ.data, query, activeCategory, filters]);

  const stats = useMemo(() => {
    const listings = listingsQ.data ?? [];
    const available = listings.filter((l: MarketplaceListing) => l.status === "available");
    return {
      total: available.length,
      value: (listings.reduce((a: number, l: MarketplaceListing) => a + l.price * l.qty, 0) / 1000000).toFixed(1),
      avgPrice: fcfa(Math.round(listings.reduce((a: number, l: MarketplaceListing) => a + l.price, 0) / (listings.length || 1))),
    };
  }, [listingsQ.data]);

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Marketplace</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Achetez et vendez entre producteurs
          </p>
        </div>
        <Button
          onClick={() => setShowPublish(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
        >
          <Plus size={18} />
          Publier
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-card border border-border rounded-xl p-3">
          <div className="text-xs text-muted-foreground">Offres actives</div>
          <div className="text-xl font-bold text-primary mt-0.5">{stats.total}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-3">
          <div className="text-xs text-muted-foreground">Valeur totale</div>
          <div className="text-xl font-bold text-primary mt-0.5">{stats.value}M F</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-3">
          <div className="text-xs text-muted-foreground">Prix moyen</div>
          <div className="text-xl font-bold text-primary mt-0.5">{stats.avgPrice}</div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="market" className="gap-1.5">
            <ShoppingBag size={16} />
            <span className="hidden sm:inline">Marché</span>
          </TabsTrigger>
          <TabsTrigger value="offers" className="gap-1.5">
            <LayoutGrid size={16} />
            <span className="hidden sm:inline">Mes offres</span>
          </TabsTrigger>
          <TabsTrigger value="orders" className="gap-1.5">
            <ClipboardList size={16} />
            <span className="hidden sm:inline">Commandes</span>
          </TabsTrigger>
          <TabsTrigger value="messages" className="gap-1.5">
            <MessageCircle size={16} />
            <span className="hidden sm:inline">Messages</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab: Marché */}
        <TabsContent value="market" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
              <Input
                placeholder="Rechercher un produit, un vendeur, une région..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 h-12"
                id="marketplace-search"
                name="marketplace-search"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(true)}
              className="h-12 gap-2"
            >
              <SlidersHorizontal size={20} />
              Filtres
            </Button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide" data-swipe-ignore>
            <button
              onClick={() => setActiveCategory("all")}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                activeCategory === "all"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Tout voir
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                  activeCategory === cat.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {listingsQ.isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <ProductSkeleton key={i} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              onReset={() => {
                setQuery("");
                setActiveCategory("all");
                setFilters({ priceMin: "", priceMax: "", region: "all", availability: "all", saleType: "all" });
              }}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((listing) => (
                <ProductCard
                  key={listing.id}
                  listing={listing}
                  onSelect={setSelectedProduct}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab: Mes offres — SellerDashboard sans props requises */}
        <TabsContent value="offers">
          <SellerDashboard myListings={[]} onPublish={() => {}} onEdit={() => {}} onDelete={() => {}} />
        </TabsContent>

        {/* Tab: Commandes — OrdersView sans props requises */}
        <TabsContent value="orders">
          <OrdersView />
        </TabsContent>

        {/* Tab: Messages — MessagesView sans props requises */}
        <TabsContent value="messages">
          <MessagesView conversations={[]} />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <FilterDrawer
        isOpen={showFilters}
        filters={filters}
        setFilters={setFilters}
        onClose={() => setShowFilters(false)}
        onApply={(f) => {
          setFilters(f);
          setShowFilters(false);
        }}
      />

      {selectedProduct && (
        <ProductDetailModal
          listing={selectedProduct}
          allListings={listingsQ.data ?? []}
          onSelect={setSelectedProduct}
          onPlaceOrder={(order) => {
            toast.success("Commande placée avec succès");
            setSelectedProduct(null);
          }}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      {showPublish && (
        <PublishModal
          onClose={() => setShowPublish(false)}
          onPublish={(data) => {
            toast.success("Offre publiée avec succès");
            setShowPublish(false);
            qc.invalidateQueries({ queryKey: ["marketplace-listings"] });
          }}
        />
      )}
    </div>
  );
}