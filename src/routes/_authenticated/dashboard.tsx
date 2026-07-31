import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatFcfa, harvestAlert } from "@/lib/agrofield";
import { Sprout, TrendingUp, TrendingDown, AlertTriangle, Camera, Plus, ShoppingCart, Calendar, Droplets, SprayCan, Pickaxe, Wheat, Paperclip } from "lucide-react";
import { MarketplaceFab } from "@/components/ui/marketplace-fab";
import { ActivityTimeline } from "@/components/ui/activity-timeline";
import { WeatherMiniCard } from "@/components/ui/weather-mini-card";

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
      { title: "Tableau de bord — AgroField" },
      { name: "description", content: "Vue d'ensemble de vos parcelles, alertes IA et performance financière agricole." },
      { property: "og:title", content: "Tableau de bord — AgroField" },
      { property: "og:description", content: "Vue d'ensemble de vos parcelles, alertes IA et performance financière agricole." },
      { property: "og:url", content: "https://field-bloom-wise.lovable.app/dashboard" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = Route.useRouteContext();

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
      const activities = [];
      
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
          const proofCount = (sale.proof_photos as any[])?.length || 0;
          
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
          const proofCount = (expense.proof_photos as any[])?.length || 0;
          
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
    timestamp: `Récolte dans ${a!.daysUntilHarvest} jours`,
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
        .from("market_offers")
        .select("*")
        .eq("user_id", user.id)
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
      {/* En-tête avec salutation */}
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Bonjour</p>
        <h1 className="text-2xl font-black tracking-tight">
          {profileQ.data?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || "Agriculteur"}
        </h1>
      </div>

      {/* Weather Mini Card - Météo locale */}
      <WeatherMiniCard
        temperature={32}
        condition="partly-cloudy"
        rainProbability={45}
        location="Ouagadougou"
      />

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
          {allEvents.length > 4 && (
            <span className="text-xs text-muted-foreground">
              {allEvents.length} activités
            </span>
          )}
        </div>
        <div className="relative max-h-[420px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-rounded-lg scrollbar-thumb-border hover:scrollbar-thumb-primary">
          <ActivityTimeline
            events={allEvents}
            title=""
          />
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <Link
          to="/parcels"
          className="flex items-center justify-center gap-2 rounded-2xl bg-primary p-4 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Nouvelle parcelle
        </Link>
        <Link
          to="/diagnose"
          className="flex items-center justify-center gap-2 rounded-2xl bg-accent p-4 text-sm font-semibold text-accent-foreground shadow-sm hover:bg-accent/90"
        >
          <Camera className="h-4 w-4" /> Diagnostic IA
        </Link>
      </section>

      {/* Bouton flottant Marketplace */}
      <MarketplaceFab />
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
