import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatFcfa, harvestAlert } from "@/lib/agrofield";
import { Sprout, TrendingUp, TrendingDown, AlertTriangle, Camera, Plus } from "lucide-react";

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

  const netto = (salesQ.data ?? 0) - (expensesQ.data ?? 0);
  const threshold = Number(profileQ.data?.expense_alert_threshold ?? 0);
  const overThreshold = threshold > 0 && (expensesQ.data ?? 0) > threshold;

  const alerts = (parcelsQ.data ?? [])
    .map((p) => ({ p, a: harvestAlert(p.crop_type, p.sowing_date) }))
    .filter((x) => x.a && x.a.level !== "info");

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Bonjour</p>
        <h1 className="text-2xl font-black tracking-tight">
          {profileQ.data?.full_name || "Agriculteur"}
        </h1>
      </div>

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

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
            Alertes des cultures
          </h2>
        </div>
        {alerts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
            Aucune alerte. Vos cultures suivent leur cours.
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.map(({ p, a }) => (
              <div
                key={p.id}
                className={`rounded-2xl border p-3 ${
                  a!.level === "critical"
                    ? "border-destructive/40 bg-destructive/5"
                    : "border-accent/40 bg-accent/10"
                }`}
              >
                <div className="text-sm font-semibold">{p.name} — {p.crop_type}</div>
                <div className="text-xs text-muted-foreground">{a!.label}</div>
              </div>
            ))}
          </div>
        )}
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
