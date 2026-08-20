import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatFcfa, harvestAlert } from "@/lib/agrosphere";
import { Sprout, TrendingUp, TrendingDown, AlertTriangle, Camera, Plus, ShoppingCart, Calendar, Droplets, SprayCan, Pickaxe, Wheat, Paperclip, ArrowUp, CloudSun } from "lucide-react";
import { ActivityTimeline } from "@/components/ui/activity-timeline";
import { WeatherAlertBanner } from "@/components/weather/WeatherAlertBanner";
import { CropCalendarStrip } from "@/components/agriculture/CropCalendarStrip";
import { MarketPriceTicker } from "@/components/marketplace/MarketPriceTicker";

import { useState, useEffect } from "react";

// Formater un timestamp en texte lisible
function formatTimestamp(dateString: string | null): string {
  if (!dateString) return "À l'instant";
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins}min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Tableau de bord — AgroSphere" },
      { name: "description", content: "Vue d'ensemble de vos parcelles, alertes IA et performance financière agricole." },
      { property: "og:title", content: "Tableau de bord — AgroSphere" },
      { property: "og:description", content: "Vue d'ensemble de vos parcelles, alertes IA et performance financière agricole." },
      { property: "og:url", content: "https://AgroSphere2.vercel.app/dashboard" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = Route.useRouteContext();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showWeather, setShowWeather] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const parcelsQ = useQuery({
    queryKey: ["parcels"],
    queryFn: async () => {
      const { data, error } = await supabase.from("parcels").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const expensesQ = useQuery({
    queryKey: ["expenses-total"],
    queryFn: async () => {
      const { data, error } = await supabase.from("expenses").select("amount_fcfa");
      if (error) throw error;
      return (data ?? []).reduce((s, r) => s + Number(r.amount_fcfa || 0), 0);
    },
  });

  const salesQ = useQuery({
    queryKey: ["sales-total"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sales").select("quantity_kg, unit_price_fcfa");
      if (error) throw error;
      return (data ?? []).reduce((s, r) => s + Number(r.quantity_kg || 0) * Number(r.unit_price_fcfa || 0), 0);
    },
  });

  const profileQ = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      return data;
    },
  });

  // Récupérer les vraies activités depuis la base de données
  const activitiesQ = useQuery({
    queryKey: ["dashboard-activities", user.id],
    queryFn: async () => {
      const activities: any[] = [];
      
      // 1. Ventes récentes (max 3)
      const { data: sales, error: salesError } = await supabase
        .from("sales")
        .select(`
          *,
          parcel:parcel_id (id, name, crop_type)
        `)
        .eq("user_id", user.id)
        .order("sold_at", { ascending: false })
        .limit(3);
      
      if (sales && !salesError) {
        sales.forEach((sale) => {
          const parcelName = (sale.parcel as any)?.name || "Sans parcelle";
          const totalRevenue = Number(sale.quantity_kg || 0) * Number(sale.unit_price_fcfa || 0);
          const proofCount = (sale as any).proof_photos?.length || 0;
          
          activities.push({
            id: `sale-${sale.id}`,
            type: "success" as const,
            title: `Vente de ${sale.crop_type} - ${parcelName}`,
            description: `${sale.quantity_kg}kg × ${sale.unit_price_fcfa} FCFA = ${totalRevenue.toLocaleString('fr-FR')} FCFA${proofCount > 0 ? ` • ${proofCount} preuve${proofCount > 1 ? 's' : ''} 📎` : ''}`,
            timestamp: formatTimestamp(sale.sold_at),
            icon: <ShoppingCart className="h-5 w-5" />,
            sortDate: new Date(sale.sold_at)
          });
        });
      }
      
      // 2. Dépenses récentes (max 2)
      const { data: expenses, error: expensesError } = await supabase
        .from("expenses")
        .select(`
          *,
          parcel:parcel_id (id, name, crop_type)
        `)
        .eq("user_id", user.id)
        .order("spent_at", { ascending: false })
        .limit(2);
      
      if (expenses && !expensesError) {
        expenses.forEach((expense) => {
          const parcelName = (expense.parcel as any)?.name || "Sans parcelle";
          const proofCount = (expense as any).proof_photos?.length || 0;
          
          activities.push({
            id: `expense-${expense.id}`,
            type: "activity" as const,
            title: `${expense.category} - ${parcelName}`,
            description: `${Number(expense.amount_fcfa).toLocaleString('fr-FR')} FCFA${proofCount > 0 ? ` • ${proofCount} preuve${proofCount > 1 ? 's' : ''} 📎` : ''}`,
            timestamp: formatTimestamp(expense.spent_at),
            icon: <TrendingDown className="h-5 w-5" />,
            sortDate: new Date(expense.spent_at)
          });
        });
      }
      
      // 3. Interventions culturales récentes (max 3)
      const { data: events, error: eventsError } = await supabase
        .from("crop_events")
        .select(`
          *,
          parcel:parcel_id (id, name, crop_type)
        `)
        .eq("user_id", user.id)
        .order("event_date", { ascending: false })
        .limit(3);
      
      if (events && !eventsError) {
        const eventIcons: Record<string, any> = {
          irrigation: <Droplets className="h-5 w-5" />,
          fertilization: <SprayCan className="h-5 w-5" />,
          treatment: <SprayCan className="h-5 w-5" />,
          weeding: <Pickaxe className="h-5 w-5" />,
          harvest: <Wheat className="h-5 w-5" />,
          sowing: <Sprout className="h-5 w-5" />,
        };
        
        const eventTypes: Record<string, string> = {
          irrigation: "Irrigation",
          fertilization: "Fertilisation",
          treatment: "Traitement",
          weeding: "Désherbage",
          harvest: "Récolte",
          sowing: "Semis",
          other: "Intervention",
        };
        
        events.forEach((event) => {
          const parcelName = (event.parcel as any)?.name || "Sans parcelle";
          const inputCost = Number(event.input_cost_fcfa || 0);
          const laborCost = Number(event.labor_cost_fcfa || 0);
          const totalCost = inputCost + laborCost;
          
          activities.push({
            id: `event-${event.id}`,
            type: "activity" as const,
            title: `${eventTypes[event.event_type] || "Intervention"} - ${parcelName}`,
            description: `${event.notes || "Aucune note"}${totalCost > 0 ? ` • ${totalCost.toLocaleString('fr-FR')} FCFA` : ''}`,
            timestamp: formatTimestamp(event.event_date),
            icon: eventIcons[event.event_type] || <Sprout className="h-5 w-5" />,
            sortDate: new Date(event.event_date)
          });
        });
      }
      
      return activities;
    },
    refetchInterval: 60 * 1000, // Rafraîchir toutes les minutes
  });

  const netto = (salesQ.data ?? 0) - (expensesQ.data ?? 0);
  const threshold = Number(profileQ.data?.expense_alert_threshold ?? 0);
  const overThreshold = threshold > 0 && (expensesQ.data ?? 0) > threshold;

  const alerts = (parcelsQ.data ?? [])
    .map((p) => ({ p, a: harvestAlert(p.crop_type, p.sowing_date) }))
    .filter((x) => x.a && x.a.level !== "info");

  // Convertir les alertes en événements pour ActivityTimeline
  const timelineEvents = alerts.map(({ p, a }) => ({
    id: `alert-${p.id}`,
    type: a!.level === "critical" ? "alert" : "warning" as const,
    title: `${p.name} — ${p.crop_type}`,
    description: a!.label,
    timestamp: `Récolte dans ${(a as any).daysUntilHarvest} jours`,
    icon: a!.level === "critical" ? <AlertTriangle className="h-5 w-5" /> : <Calendar className="h-5 w-5" />,
    sortDate: new Date()
  }));

  // Combiner alertes + activités réelles
  const allEvents = [
    ...timelineEvents,
    ...(activitiesQ.data ?? [])
  ].sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime());

  // Marketplace: mes offres actives
  const myOffersQ = useQuery({
    queryKey: ["my-market-offers", user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketplace_listings")
        .select("*")
        .eq("seller_id", user.id as string)
        .eq("status", "active")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const activeOffersCount = myOffersQ.data?.length ?? 0;
  const recentOffers = myOffersQ.data ?? [];

  return (
    <div className="space-y-5">
      {/* En-tête avec salutation + Marketplace */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Bonjour</p>
          <h1 className="text-2xl font-black tracking-tight">
            {profileQ.data?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || "Agriculteur"}
          </h1>
        </div>
        <Link
          to="/marketplace"
          className="relative flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/20"
        >
          <ShoppingCart className="h-4 w-4" />
          Marché
          {activeOffersCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {activeOffersCount}
            </span>
          )}
        </Link>
      </div>

      {/* Weather Alert Banner - Météo agricole + alertes */}
      {showWeather && (
        <WeatherAlertBanner
          location="Ouagadougou"
          onDismiss={() => setShowWeather(false)}
        />
      )}

      {/* Bouton pour réafficher la météo si dismissée */}
      {!showWeather && (
        <button
          onClick={() => {
            localStorage.removeItem("weather-banner-dismissed");
            setShowWeather(true);
          }}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card p-3 text-sm font-medium text-foreground hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
          style={{ minHeight: 48 }}
          aria-label="Réafficher la météo"
        >
          <CloudSun className="h-4 w-4 text-primary" />
          Afficher la météo
        </button>
      )}

      {/* Calendrier cultural - Cycle de la parcelle la plus récente */}
      {parcelsQ.data && parcelsQ.data.length > 0 && (() => {
        const parcel = parcelsQ.data[0] as any;
        const cropMap: Record<string, string> = {
          "Mil": "mil", "Sorgho": "sorgho", "Maïs": "mais", "Riz": "riz",
          "Coton": "coton", "Arachide": "arachide", "Niébé": "niebe",
        };
        const cropType = (cropMap[parcel?.crop_type] || "mais") as any;
        const plantingDate = parcel?.sowing_date || new Date().toISOString().split("T")[0];
        return <CropCalendarStrip cropType={cropType} plantingDate={plantingDate} />;
      })()}

      {/* Statistiques financières */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Ventes"
          value={formatFcfa(salesQ.data ?? 0)}
          icon={<TrendingUp className="h-4 w-4" />}
          tone="ok"
        />
        <StatCard
          label="Dépenses"
          value={formatFcfa(expensesQ.data ?? 0)}
          icon={<TrendingDown className="h-4 w-4" />}
          tone={overThreshold ? "warn" : "muted"}
        />
        <StatCard
          label="Bénéfice net"
          value={formatFcfa(netto)}
          icon={<TrendingUp className="h-4 w-4" />}
          tone={netto >= 0 ? "primary" : "warn"}
        />
        <StatCard
          label="Parcelles"
          value={String(parcelsQ.data?.length ?? 0)}
          icon={<Sprout className="h-4 w-4" />}
          tone="muted"
        />
      </div>

      {overThreshold && (
        <div className="flex items-start gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            Vos dépenses ({formatFcfa(expensesQ.data ?? 0)}) dépassent votre seuil d'alerte
            ({formatFcfa(threshold)}).
          </div>
        </div>
      )}

      {/* Activités récentes - Timeline avec scroll */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
            Activités récentes
          </h2>
          {allEvents.length > 3 && (
            <span className="text-xs text-muted-foreground">
              {allEvents.length} activités
            </span>
          )}
        </div>
        <div className="relative max-h-[200px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-rounded-lg scrollbar-thumb-border hover:scrollbar-thumb-primary">
          <ActivityTimeline
            events={allEvents.slice(0, 5)}
            title=""
          />
        </div>
      </section>

      {/* Prix marchés locaux */}
      <section>
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">
          Prix Marchés
        </h2>
        <MarketPriceTicker />
      </section>

      <section className="grid grid-cols-2 gap-3">
        <Link
          to="/parcels"
          className="flex items-center justify-center gap-2 rounded-2xl bg-primary p-4 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
          style={{ minHeight: 48 }}
        >
          <Plus className="h-4 w-4" /> Nouvelle parcelle
        </Link>
        <Link
          to="/diagnose"
          className="flex items-center justify-center gap-2 rounded-2xl bg-accent p-4 text-sm font-semibold text-accent-foreground shadow-sm hover:bg-accent/90"
          style={{ minHeight: 48 }}
        >
          <Camera className="h-4 w-4" /> Diagnostic IA
        </Link>
      </section>

      {/* Bouton retour en haut */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-24 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all animate-in fade-in zoom-in"
          aria-label="Retour en haut"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone: "primary" | "ok" | "warn" | "muted";
}) {
  const toneClass =
    tone === "primary"
      ? "bg-primary text-primary-foreground"
      : tone === "ok"
        ? "bg-secondary text-secondary-foreground"
        : tone === "warn"
          ? "bg-destructive/10 text-destructive"
          : "bg-card text-card-foreground border border-border";
  return (
    <div className={`rounded-2xl p-4 shadow-sm ${toneClass}`}>
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide opacity-80">
        {icon} {label}
      </div>
      <div className="mt-1 text-xl font-black tracking-tight">{value}</div>
    </div>
  );
}
