import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, Users, Wallet, TrendingUp, TrendingDown, Download, Search, ShieldCheck, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Administration — AgroField" },
      { name: "description", content: "Console super-administrateur AgroField." },
      { property: "og:title", content: "Administration — AgroField" },
      { property: "og:description", content: "Console super-administrateur AgroField." },
      { property: "og:url", content: "https://field-bloom-wise.lovable.app/admin" },
      { name: "robots", content: "noindex" },
    ],
  }),
  beforeLoad: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw redirect({ to: "/auth" });
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", u.user.id)
      .eq("role", "super_admin")
      .maybeSingle();
    if (!data) throw redirect({ to: "/dashboard" });
  },
  component: AdminPage,
});

const fmt = new Intl.NumberFormat("fr-FR");

function AdminPage() {
  const [q, setQ] = useState("");

  const profilesQ = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, phone, village, region, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const expensesQ = useQuery({
    queryKey: ["admin-expenses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expenses")
        .select("id, user_id, parcel_id, category, amount_fcfa, description, spent_at, proof_type, proof_ref, receipt_path, witness_name, witness_village, flagged_outlier, record_hash, prev_hash, created_at")
        .order("spent_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const salesQ = useQuery({
    queryKey: ["admin-sales"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales")
        .select("id, user_id, parcel_id, crop_type, quantity_kg, unit_price_fcfa, buyer, sold_at, proof_type, proof_ref, receipt_path, witness_name, witness_village, flagged_outlier, record_hash, prev_hash, created_at")
        .order("sold_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const parcelsQ = useQuery({
    queryKey: ["admin-parcels"],
    queryFn: async () => {
      const { data } = await supabase.from("parcels").select("id, name, user_id");
      return data ?? [];
    },
  });

  const profileMap = useMemo(() => {
    const m = new Map<string, any>();
    (profilesQ.data ?? []).forEach((p) => m.set(p.id, p));
    return m;
  }, [profilesQ.data]);

  const parcelMap = useMemo(() => {
    const m = new Map<string, string>();
    (parcelsQ.data ?? []).forEach((p: any) => m.set(p.id, p.name));
    return m;
  }, [parcelsQ.data]);

  const stats = useMemo(() => {
    const exp = (expensesQ.data ?? []).reduce((s, e: any) => s + Number(e.amount_fcfa), 0);
    const sal = (salesQ.data ?? []).reduce(
      (s, x: any) => s + Number(x.quantity_kg) * Number(x.unit_price_fcfa),
      0,
    );
    return {
      farmers: profilesQ.data?.length ?? 0,
      expenses: exp,
      sales: sal,
      net: sal - exp,
      expensesCount: expensesQ.data?.length ?? 0,
      salesCount: salesQ.data?.length ?? 0,
    };
  }, [expensesQ.data, salesQ.data, profilesQ.data]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return profilesQ.data ?? [];
    return (profilesQ.data ?? []).filter(
      (p: any) =>
        (p.full_name ?? "").toLowerCase().includes(s) ||
        (p.village ?? "").toLowerCase().includes(s) ||
        (p.region ?? "").toLowerCase().includes(s) ||
        (p.phone ?? "").toLowerCase().includes(s),
    );
  }, [profilesQ.data, q]);

  const perFarmer = useMemo(() => {
    const map = new Map<string, { exp: number; sal: number; ne: number; ns: number }>();
    (expensesQ.data ?? []).forEach((e: any) => {
      const v = map.get(e.user_id) ?? { exp: 0, sal: 0, ne: 0, ns: 0 };
      v.exp += Number(e.amount_fcfa);
      v.ne += 1;
      map.set(e.user_id, v);
    });
    (salesQ.data ?? []).forEach((s: any) => {
      const v = map.get(s.user_id) ?? { exp: 0, sal: 0, ne: 0, ns: 0 };
      v.sal += Number(s.quantity_kg) * Number(s.unit_price_fcfa);
      v.ns += 1;
      map.set(s.user_id, v);
    });
    return map;
  }, [expensesQ.data, salesQ.data]);

  async function exportGlobalCsv() {
    const rows: any[] = [];
    async function signed(path: string | null) {
      if (!path) return "";
      const { data } = await supabase.storage.from("agrofield-media").createSignedUrl(path, 60 * 60 * 24 * 7);
      return data?.signedUrl ?? "";
    }
    for (const e of expensesQ.data ?? []) {
      const p = profileMap.get(e.user_id);
      rows.push({
        Date: e.spent_at, Type: "Dépense",
        Agriculteur: p?.full_name ?? "", Téléphone: p?.phone ?? "",
        Village: p?.village ?? "", Région: p?.region ?? "",
        Parcelle: (e.parcel_id && parcelMap.get(e.parcel_id)) ?? "",
        Catégorie: e.category, Culture: "",
        Quantité_kg: "", Prix_unitaire_FCFA: "",
        Montant_FCFA: e.amount_fcfa, Description: e.description ?? "",
        Preuve_type: e.proof_type ?? "", Preuve_ref: e.proof_ref ?? "",
        Témoin: e.witness_name ?? "", Village_témoin: e.witness_village ?? "",
        Reçu_URL: await signed(e.receipt_path),
        Prix_atypique: e.flagged_outlier ? "OUI" : "non",
        Hash: e.record_hash ?? "", Hash_précédent: e.prev_hash ?? "",
      });
    }
    for (const s of salesQ.data ?? []) {
      const p = profileMap.get(s.user_id);
      rows.push({
        Date: s.sold_at, Type: "Vente",
        Agriculteur: p?.full_name ?? "", Téléphone: p?.phone ?? "",
        Village: p?.village ?? "", Région: p?.region ?? "",
        Parcelle: (s.parcel_id && parcelMap.get(s.parcel_id)) ?? "",
        Catégorie: "", Culture: s.crop_type,
        Quantité_kg: s.quantity_kg, Prix_unitaire_FCFA: s.unit_price_fcfa,
        Montant_FCFA: Number(s.quantity_kg) * Number(s.unit_price_fcfa),
        Description: s.buyer ? `Acheteur: ${s.buyer}` : "",
        Preuve_type: s.proof_type ?? "", Preuve_ref: s.proof_ref ?? "",
        Témoin: s.witness_name ?? "", Village_témoin: s.witness_village ?? "",
        Reçu_URL: await signed(s.receipt_path),
        Prix_atypique: s.flagged_outlier ? "OUI" : "non",
        Hash: s.record_hash ?? "", Hash_précédent: s.prev_hash ?? "",
      });
    }
    rows.sort((a, b) => (a.Date < b.Date ? 1 : -1));
    if (rows.length === 0) { toast.info("Aucune donnée à exporter."); return; }

    const headers = Object.keys(rows[0]);
    const esc = (v: any) => {
      const s = String(v ?? "");
      return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => esc(r[h])).join(","))].join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `agrofield-admin-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${rows.length} écriture${rows.length > 1 ? "s" : ""} exportée${rows.length > 1 ? "s" : ""}`);
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-black tracking-tight">Super administration</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Accès centralisé aux agriculteurs, dépenses et ventes de la plateforme.
        </p>
        <div className="mt-2 flex items-start gap-2 rounded-xl border border-primary/30 bg-primary/5 p-2.5 text-[11px] text-foreground/80">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p>
            Chaîne cryptographique active sur toutes les écritures financières. Les données affichées ici sont scellées et non modifiables.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <StatCard icon={<Users className="h-4 w-4" />} label="Agriculteurs" value={String(stats.farmers)} />
        <StatCard icon={<Wallet className="h-4 w-4" />} label="Solde net"
          value={`${fmt.format(stats.net)} FCFA`} tone={stats.net >= 0 ? "ok" : "warn"} />
        <StatCard icon={<TrendingUp className="h-4 w-4" />} label={`Ventes (${stats.salesCount})`}
          value={`${fmt.format(stats.sales)} FCFA`} tone="ok" />
        <StatCard icon={<TrendingDown className="h-4 w-4" />} label={`Dépenses (${stats.expensesCount})`}
          value={`${fmt.format(stats.expenses)} FCFA`} tone="warn" />
      </div>

      <Button className="w-full" onClick={exportGlobalCsv}>
        <Download className="h-4 w-4" /> Exporter tout le registre (CSV)
      </Button>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Agriculteurs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Nom, village, région, téléphone…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
          </div>
          {filtered.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">Aucun agriculteur.</p>
          )}
          {filtered.map((p: any) => {
            const s = perFarmer.get(p.id) ?? { exp: 0, sal: 0, ne: 0, ns: 0 };
            const net = s.sal - s.exp;
            return (
              <div key={p.id} className="rounded-xl border border-border bg-card p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{p.full_name || "(sans nom)"}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {[p.village, p.region].filter(Boolean).join(" · ") || "—"}
                      {p.phone ? ` · ${p.phone}` : ""}
                    </div>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    net >= 0 ? "bg-primary/10 text-primary" : "bg-destructive/15 text-destructive"
                  }`}>
                    {fmt.format(net)} FCFA
                  </span>
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1 text-[10px] text-muted-foreground">
                  <span className="rounded-full bg-muted px-1.5 py-0.5">Ventes : {fmt.format(s.sal)} FCFA ({s.ns})</span>
                  <span className="rounded-full bg-muted px-1.5 py-0.5">Dépenses : {fmt.format(s.exp)} FCFA ({s.ne})</span>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4 text-destructive" /> Écritures signalées
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[
            ...(expensesQ.data ?? []).filter((e: any) => e.flagged_outlier).map((e: any) => ({
              kind: "Dépense", when: e.spent_at, user: profileMap.get(e.user_id)?.full_name ?? "—",
              label: e.category, amount: Number(e.amount_fcfa),
            })),
            ...(salesQ.data ?? []).filter((s: any) => s.flagged_outlier).map((s: any) => ({
              kind: "Vente", when: s.sold_at, user: profileMap.get(s.user_id)?.full_name ?? "—",
              label: s.crop_type, amount: Number(s.quantity_kg) * Number(s.unit_price_fcfa),
            })),
          ].sort((a, b) => (a.when < b.when ? 1 : -1)).slice(0, 20).map((x, i) => (
            <div key={i} className="flex items-center justify-between rounded-xl border border-destructive/30 bg-destructive/5 p-2.5 text-xs">
              <div className="min-w-0">
                <div className="truncate font-semibold">{x.kind} · {x.label}</div>
                <div className="truncate text-muted-foreground">{x.user} · {new Date(x.when).toLocaleDateString("fr-FR")}</div>
              </div>
              <span className="font-bold text-destructive">{fmt.format(x.amount)} FCFA</span>
            </div>
          ))}
          {expensesQ.data?.every((e: any) => !e.flagged_outlier) && salesQ.data?.every((s: any) => !s.flagged_outlier) && (
            <p className="py-4 text-center text-sm text-muted-foreground">Aucune écriture signalée.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ icon, label, value, tone }: {
  icon: React.ReactNode; label: string; value: string; tone?: "ok" | "warn";
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        {icon}<span>{label}</span>
      </div>
      <div className={`mt-1 text-lg font-black tracking-tight ${
        tone === "ok" ? "text-primary" : tone === "warn" ? "text-destructive" : ""
      }`}>{value}</div>
    </div>
  );
}
