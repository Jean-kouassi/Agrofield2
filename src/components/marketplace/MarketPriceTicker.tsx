/**
 * MarketPriceTicker
 * Affiche les prix des produits agricoles sur les marchés locaux du Burkina Faso.
 * Sparkline chart 30 jours (SVG inline léger) + tendances + comparaison marchés.
 * Auto-refresh 5 min si online. Mock data si offline.
 */

import { useEffect, useState, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, RefreshCw, MapPin, Clock } from "lucide-react";

/* ──────────────── Types ──────────────── */

type MarketName = "Ouaga" | "Bobo" | "Banfora" | "Koudougou";

type ProductName =
  | "Tomate"
  | "Oignon"
  | "Maïs"
  | "Mil"
  | "Sorgho"
  | "Riz local";

interface PricePoint {
  date: string;
  price: number; // FCFA per kg
}

interface ProductPrice {
  product: ProductName;
  prices: Record<MarketName, number>; // current price per market
  history: PricePoint[]; // 30-day history for selected market
  trend: number; // % change vs last week
  unit: string;
}

interface MarketPriceTickerProps {
  markets?: MarketName[];
  products?: ProductName[];
  refreshIntervalMs?: number;
  isOffline?: boolean;
  className?: string;
}

/* ──────────────── Mock Data Generator ──────────────── */

const BASE_PRICES: Record<ProductName, number> = {
  Tomate: 400,
  Oignon: 600,
  Maïs: 250,
  Mil: 350,
  Sorgho: 280,
  "Riz local": 450,
};

const MARKET_MULTIPLIERS: Record<MarketName, number> = {
  Ouaga: 1.0,
  Bobo: 0.92,
  Banfora: 0.88,
  Koudougou: 0.95,
};

function generateMockHistory(basePrice: number, days: number): PricePoint[] {
  const today = new Date();
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (days - 1 - i));
    // Random walk with slight upward drift
    const noise = (Math.random() - 0.45) * 0.08;
    const trend = i * 0.002;
    const price = Math.round(basePrice * (1 + trend + noise * (i / days)));
    return {
      date: date.toISOString().split("T")[0],
      price: Math.max(50, price),
    };
  });
}

function generateMockData(products: ProductName[], markets: MarketName[]): ProductPrice[] {
  return products.map((product) => {
    const base = BASE_PRICES[product];
    const currentPrice = base * (1 + (Math.random() - 0.5) * 0.15);

    const prices = {} as Record<MarketName, number>;
    markets.forEach((m) => {
      prices[m] = Math.round(currentPrice * MARKET_MULTIPLIERS[m] * (1 + (Math.random() - 0.5) * 0.08));
    });

    const history = generateMockHistory(currentPrice, 30);
    const weekAgoPrice = history[Math.max(0, history.length - 7)].price;
    const todayPrice = history[history.length - 1].price;
    const trend = Math.round(((todayPrice - weekAgoPrice) / weekAgoPrice) * 100);

    return {
      product,
      prices,
      history,
      trend,
      unit: "FCFA/kg",
    };
  });
}

/* ──────────────── Sparkline (SVG inline) ──────────────── */

function Sparkline({ data, width = 80, height = 24, color = "var(--color-primary)" }: {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);

  const points = data
    .map((v, i) => {
      const x = i * stepX;
      const y = height - ((v - min) / range) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const lastX = (data.length - 1) * stepX;
  const lastY = height - ((data[data.length - 1] - min) / range) * height;
  const firstY = height - ((data[0] - min) / range) * height;

  // Area path for subtle fill
  const areaPath = `M0,${height} L${points.replace(/ /g, " L")} L${width},${height} Z`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <path d={areaPath} fill={color} opacity={0.1} />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lastX} cy={lastY} r={2} fill={color} />
      <circle cx={0} cy={firstY} r={1.5} fill={color} opacity={0.5} />
    </svg>
  );
}

/* ──────────────── Component ──────────────── */

const DEFAULT_MARKETS: MarketName[] = ["Ouaga", "Bobo", "Banfora", "Koudougou"];
const DEFAULT_PRODUCTS: ProductName[] = ["Tomate", "Oignon", "Maïs", "Mil", "Sorgho", "Riz local"];

export function MarketPriceTicker({
  markets = DEFAULT_MARKETS,
  products = DEFAULT_PRODUCTS,
  refreshIntervalMs = 5 * 60 * 1000,
  isOffline = false,
  className,
}: MarketPriceTickerProps) {
  const [data, setData] = useState<ProductPrice[]>([]);
  const [selectedMarket, setSelectedMarket] = useState<MarketName>("Ouaga");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [scrollIndex, setScrollIndex] = useState(0);

  const refresh = useCallback(() => {
    setRefreshing(true);
    // Simulate fetch delay
    setTimeout(() => {
      setData(generateMockData(products, markets));
      setLastUpdated(new Date());
      setRefreshing(false);
    }, 500);
  }, [products, markets]);

  useEffect(() => {
    refresh();
    if (!isOffline) {
      const interval = setInterval(refresh, refreshIntervalMs);
      return () => clearInterval(interval);
    }
  }, [refresh, refreshIntervalMs, isOffline]);

  const visibleProducts = useMemo(() => {
    return data.slice(scrollIndex, scrollIndex + 3);
  }, [data, scrollIndex]);

  const handleScroll = (dir: "left" | "right") => {
    if (dir === "left" && scrollIndex > 0) setScrollIndex(scrollIndex - 1);
    if (dir === "right" && scrollIndex < data.length - 3) setScrollIndex(scrollIndex + 1);
  };

  if (data.length === 0) {
    return (
      <Card className={cn("p-4", className)}>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-pulse rounded bg-muted" />
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded bg-muted" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)} role="region" aria-label="Prix marchés agricoles">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" aria-hidden="true" />
          <span className="text-sm font-semibold text-foreground">Prix Marchés</span>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Clock className="h-3 w-3" />
              {lastUpdated.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <button
            onClick={refresh}
            disabled={refreshing}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            aria-label="Rafraîchir les prix"
            style={{ minHeight: 36, minWidth: 36 }}
          >
            <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Market selector */}
      <div className="flex gap-1 overflow-x-auto scrollbar-thin px-3 pt-2" data-swipe-ignore>
        {markets.map((market) => (
          <button
            key={market}
            onClick={() => setSelectedMarket(market)}
            className={cn(
              "whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-colors",
              selectedMarket === market
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/70",
              "focus:outline-none focus:ring-2 focus:ring-ring"
            )}
            style={{ minHeight: 36 }}
            aria-label={`Sélectionner marché ${market}`}
            aria-pressed={selectedMarket === market}
          >
            {market}
          </button>
        ))}
      </div>

      {/* Price cards */}
      <div className="relative p-3">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {visibleProducts.map((item) => {
            const price = item.prices[selectedMarket];
            const sparkData = item.history.map((h) => h.price);
            const isUp = item.trend > 2;
            const isDown = item.trend < -2;

            return (
              <div
                key={item.product}
                className="rounded-lg border bg-card p-3 transition-shadow hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">{item.product}</span>
                  <div className="flex items-center gap-0.5">
                    {isUp && <TrendingUp className="h-3 w-3 text-primary" aria-hidden="true" />}
                    {isDown && <TrendingDown className="h-3 w-3 text-destructive" aria-hidden="true" />}
                    {!isUp && !isDown && <Minus className="h-3 w-3 text-muted-foreground" aria-hidden="true" />}
                    <span
                      className={cn(
                        "text-[10px] font-semibold",
                        isUp ? "text-primary" : isDown ? "text-destructive" : "text-muted-foreground"
                      )}
                    >
                      {item.trend > 0 ? "+" : ""}{item.trend}%
                    </span>
                  </div>
                </div>

                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-lg font-bold text-foreground">{price}</span>
                  <span className="text-[10px] text-muted-foreground">{item.unit}</span>
                </div>

                {/* Sparkline */}
                <div className="mt-2 flex items-center justify-between">
                  <Sparkline
                    data={sparkData}
                    width={70}
                    height={20}
                    color={isDown ? "var(--color-destructive)" : "var(--color-primary)"}
                  />
                  <span className="text-[9px] text-muted-foreground">30j</span>
                </div>

                {/* Market comparison */}
                <div className="mt-2 flex gap-1">
                  {markets
                    .filter((m) => m !== selectedMarket)
                    .slice(0, 2)
                    .map((m) => {
                      const altPrice = item.prices[m];
                      const diff = Math.round(((price - altPrice) / altPrice) * 100);
                      return (
                        <Badge key={m} variant="outline" className="text-[8px]">
                          {m}: {altPrice} {diff !== 0 && (diff > 0 ? `▲${diff}%` : `▼${Math.abs(diff)}%`)}
                        </Badge>
                      );
                    })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Navigation arrows for mobile scroll */}
        {data.length > 3 && (
          <div className="mt-2 flex items-center justify-center gap-3">
            <button
              onClick={() => handleScroll("left")}
              disabled={scrollIndex === 0}
              className="rounded-md p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="Produits précédents"
              style={{ minHeight: 36, minWidth: 36 }}
            >
              ←
            </button>
            <span className="text-[10px] text-muted-foreground">
              {scrollIndex + 1}-{Math.min(scrollIndex + 3, data.length)} / {data.length}
            </span>
            <button
              onClick={() => handleScroll("right")}
              disabled={scrollIndex >= data.length - 3}
              className="rounded-md p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="Produits suivants"
              style={{ minHeight: 36, minWidth: 36 }}
            >
              →
            </button>
          </div>
        )}
      </div>

      {/* Offline notice */}
      {isOffline && (
        <div className="border-t bg-muted/30 px-4 py-2">
          <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            Données hors ligne — dernières valeurs connues
          </p>
        </div>
      )}
    </Card>
  );
}

export { BASE_PRICES, MARKET_MULTIPLIERS };
export type { MarketName, ProductName, ProductPrice, PricePoint };