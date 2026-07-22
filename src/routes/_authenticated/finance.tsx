import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CROP_TYPES, EXPENSE_CATEGORIES, formatFcfa } from "@/lib/agrofield";
import { toast } from "sonner";
import {
  Plus, ShieldCheck, TrendingDown, TrendingUp, Wallet, Lock,
  Receipt, Smartphone, Users, AlertTriangle, FileWarning, Camera,
  Download, Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/finance")({
  head: () => ({
    meta: [
      { title: "Finance agricole — AgroField" },
      { name: "description", content: "Suivi des dépenses et ventes en FCFA avec registre certifié infalsifiable." },
      { property: "og:title", content: "Finance agricole — AgroField" },
      { property: "og:description", content: "Suivi des dépenses et ventes en FCFA avec registre certifié infalsifiable." },
      { property: "og:url", content: "https://field-bloom-wise.lovable.app/finance" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: FinancePage,
});

const PROOF_TYPES = [
  { value: "receipt", label: "Reçu papier", icon: Receipt },
  { value: "mobile_money", label: "SMS Mobile Money", icon: Smartphone },
  { value: "coop_slip", label: "Bon coopérative", icon: Receipt },
  { value: "witness", label: "Témoin", icon: Users },
  { value: "none", label: "Aucune preuve", icon: FileWarning },
] as const;

type ProofType = typeof PROOF_TYPES[number]["value"];

function proofMeta(t: string | null | undefined) {
  return PROOF_TYPES.find((p) => p.value === t);
}

function FinancePage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();

  const parcelsQ = useQuery({
    queryKey: ["parcels"],
    queryFn: async () => {
      const { data } = await supabase.from("parcels").select("id, name, crop_type");
      return data ?? [];
    },
  });

  const expensesQ = useQuery({
    queryKey: ["expenses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("expenses").select("*").order("spent_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const salesQ = useQuery({
    queryKey: ["sales"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sales").select("*").order("sold_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const priceRefsQ = useQuery({
    queryKey: ["price-references"],
    staleTime: 1000 * 60 * 60,
    queryFn: async () => {
      const { data, error } = await supabase.from("price_references").select("*");
      if (error) throw error;
      return data ?? [];
    },
  });

  const refMap = useMemo(() => {
    const m = new Map<string, { min: number; max: number; unit: string; note: string | null }>();
    (priceRefsQ.data ?? []).forEach((r: any) => {
      m.set(`${r.kind}:${r.key}`, { min: r.min_fcfa, max: r.max_fcfa, unit: r.unit, note: r.note });
    });
    return m;
  }, [priceRefsQ.data]);

  const totalExp = (expensesQ.data ?? []).reduce((s, r: any) => s + Number(r.amount_fcfa || 0), 0);
  const totalSales = (salesQ.data ?? []).reduce((s, r: any) => s + Number(r.quantity_kg || 0) * Number(r.unit_price_fcfa || 0), 0);
  const netto = totalSales - totalExp;

  const allRecords = [...(expensesQ.data ?? []), ...(salesQ.data ?? [])];
  const withProof = allRecords.filter((r: any) => r.receipt_path || (r.proof_type && r.proof_type !== "none")).length;
  const outliers = allRecords.filter((r: any) => r.flagged_outlier).length;

  async function uploadReceipt(file: File | null): Promise<string | null> {
    if (!file) return null;
    const ext = file.name.split(".").pop() || "jpg";
    const path = `receipts/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from("agrofield-media").upload(path, file, {
      cacheControl: "3600", upsert: false,
    });
    if (error) {
      toast.error("Échec upload photo : " + error.message);
      return null;
    }
    return path;
  }

  async function addExpense(payload: {
    category: string; amount: string; description: string; parcel_id: string | null; date: string;
    proof_type: ProofType; proof_ref: string; witness_name: string; witness_village: string;
    receipt_file: File | null; flagged: boolean;
  }) {
    const receipt_path = await uploadReceipt(payload.receipt_file);
    const { error } = await supabase.from("expenses").insert({
      user_id: user.id,
      parcel_id: payload.parcel_id,
      category: payload.category,
      amount_fcfa: Number(payload.amount || 0),
      description: payload.description || null,
      spent_at: payload.date || new Date().toISOString().slice(0, 10),
      receipt_path,
      proof_type: payload.proof_type,
      proof_ref: payload.proof_ref || null,
      witness_name: payload.witness_name || null,
      witness_village: payload.witness_village || null,
      flagged_outlier: payload.flagged,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Dépense enregistrée et scellée");
    qc.invalidateQueries({ queryKey: ["expenses"] });
  }

  async function addSale(payload: {
    crop: string; qty: string; price: string; buyer: string; parcel_id: string | null; date: string;
    proof_type: ProofType; proof_ref: string; witness_name: string; witness_village: string;
    receipt_file: File | null; flagged: boolean;
  }) {
    const receipt_path = await uploadReceipt(payload.receipt_file);
    const { error } = await supabase.from("sales").insert({
      user_id: user.id,
      parcel_id: payload.parcel_id,
      crop_type: payload.crop,
      quantity_kg: Number(payload.qty || 0),
      unit_price_fcfa: Number(payload.price || 0),
      buyer: payload.buyer || null,
      sold_at: payload.date || new Date().toISOString().slice(0, 10),
      receipt_path,
      proof_type: payload.proof_type,
      proof_ref: payload.proof_ref || null,
      witness_name: payload.witness_name || null,
      witness_village: payload.witness_village || null,
      flagged_outlier: payload.flagged,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Vente enregistrée et scellée");
    qc.invalidateQueries({ queryKey: ["sales"] });
  }

  const parcels = parcelsQ.data ?? [];

  async function exportCsv() {
    const parcelMap = new Map(parcels.map((p: any) => [p.id, p.name]));
    const rows: any[] = [];

    async function signed(path: string | null) {
      if (!path) return "";
      const { data } = await supabase.storage.from("agrofield-media").createSignedUrl(path, 60 * 60 * 24 * 7);
      return data?.signedUrl ?? "";
    }

    for (const e of expensesQ.data ?? []) {
      rows.push({
        Date: e.spent_at, Type: "Dépense",
        Parcelle: (e.parcel_id && parcelMap.get(e.parcel_id)) ?? "",
        Catégorie: e.category, Culture: "",
        Quantité_kg: "", Prix_unitaire_FCFA: "",
        Montant_FCFA: e.amount_fcfa, Description: e.description ?? "",
        Preuve_type: e.proof_type ?? "", Preuve_référence: e.proof_ref ?? "",
        Témoin: e.witness_name ?? "", Village_témoin: e.witness_village ?? "",
        Reçu_URL: await signed(e.receipt_path),
        Prix_atypique: e.flagged_outlier ? "OUI" : "non",
        Crédibilité: credibilityScore(e),
        Hash: e.record_hash ?? "", Hash_précédent: e.prev_hash ?? "",
      });
    }
    for (const s of salesQ.data ?? []) {
      rows.push({
        Date: s.sold_at, Type: "Vente",
        Parcelle: (s.parcel_id && parcelMap.get(s.parcel_id)) ?? "",
        Catégorie: "", Culture: s.crop_type,
        Quantité_kg: s.quantity_kg, Prix_unitaire_FCFA: s.unit_price_fcfa,
        Montant_FCFA: Number(s.quantity_kg) * Number(s.unit_price_fcfa),
        Description: s.buyer ? `Acheteur: ${s.buyer}` : "",
        Preuve_type: s.proof_type ?? "", Preuve_référence: s.proof_ref ?? "",
        Témoin: s.witness_name ?? "", Village_témoin: s.witness_village ?? "",
        Reçu_URL: await signed(s.receipt_path),
        Prix_atypique: s.flagged_outlier ? "OUI" : "non",
        Crédibilité: credibilityScore(s),
        Hash: s.record_hash ?? "", Hash_précédent: s.prev_hash ?? "",
      });
    }
    rows.sort((a, b) => (a.Date < b.Date ? 1 : -1));

    if (rows.length === 0) { toast.info("Aucune écriture à exporter."); return; }

    const headers = Object.keys(rows[0]);
    const escape = (v: any) => {
      const s = String(v ?? "");
      return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `agrofield-registre-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${rows.length} écriture${rows.length > 1 ? "s" : ""} exportée${rows.length > 1 ? "s" : ""}`);
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black tracking-tight">Finances</h1>
        <p className="text-sm text-muted-foreground">Suivez vos dépenses et vos ventes en FCFA.</p>
        <div className="mt-2 flex items-start gap-2 rounded-xl border border-primary/30 bg-primary/5 p-2.5 text-[11px] text-foreground/80">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p>
            <span className="font-semibold text-foreground">Registre certifié :</span> chaque écriture est scellée par une empreinte cryptographique chaînée. Ajoutez une photo de reçu, un SMS Mobile Money ou un témoin pour renforcer la crédibilité auprès des services financiers.
          </p>
        </div>
        {allRecords.length > 0 && (
          <Button variant="outline" size="sm" className="mt-3 w-full" onClick={exportCsv}>
            <Download className="h-4 w-4" /> Télécharger l'historique (CSV)
          </Button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <MiniStat icon={<TrendingUp className="h-4 w-4" />} label="Ventes" value={formatFcfa(totalSales)} tone="ok" />
        <MiniStat icon={<TrendingDown className="h-4 w-4" />} label="Dépenses" value={formatFcfa(totalExp)} tone="warn" />
        <MiniStat icon={<Wallet className="h-4 w-4" />} label="Bénéfice" value={formatFcfa(netto)} tone={netto >= 0 ? "primary" : "warn"} />
      </div>

      {allRecords.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-3 text-[11px]">
          <div className="font-semibold text-foreground">Qualité du registre</div>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
            <span>{allRecords.length} écriture{allRecords.length > 1 ? "s" : ""} scellée{allRecords.length > 1 ? "s" : ""}</span>
            <span>· {withProof} avec justificatif</span>
            {outliers > 0 && <span className="text-destructive">· {outliers} prix atypique{outliers > 1 ? "s" : ""}</span>}
          </div>
        </div>
      )}

      <Tabs defaultValue="expenses">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="expenses">Dépenses</TabsTrigger>
          <TabsTrigger value="sales">Ventes</TabsTrigger>
        </TabsList>

        <TabsContent value="expenses" className="space-y-3">
          <ExpenseForm parcels={parcels} onSubmit={addExpense} refMap={refMap} />
          {(expensesQ.data ?? []).map((e: any) => (
            <Row
              key={e.id}
              title={e.category}
              subtitle={`${e.spent_at}${e.description ? " — " + e.description : ""}`}
              amount={`- ${formatFcfa(Number(e.amount_fcfa))}`}
              tone="warn"
              hash={e.record_hash}
              record={e}
            />
          ))}
        </TabsContent>

        <TabsContent value="sales" className="space-y-3">
          <SaleForm parcels={parcels} onSubmit={addSale} refMap={refMap} />
          {(salesQ.data ?? []).map((s: any) => (
            <Row
              key={s.id}
              title={`${s.crop_type} — ${Number(s.quantity_kg)} kg`}
              subtitle={`${s.sold_at}${s.buyer ? " — " + s.buyer : ""}`}
              amount={`+ ${formatFcfa(Number(s.quantity_kg) * Number(s.unit_price_fcfa))}`}
              tone="ok"
              hash={s.record_hash}
              record={s}
            />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MiniStat({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: string }) {
  const cls =
    tone === "primary" ? "bg-primary text-primary-foreground"
      : tone === "ok" ? "bg-secondary text-secondary-foreground"
        : tone === "warn" ? "bg-destructive/10 text-destructive"
          : "bg-muted";
  return (
    <div className={`rounded-2xl p-3 ${cls}`}>
      <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide opacity-80">{icon}{label}</div>
      <div className="mt-1 text-sm font-black leading-tight">{value}</div>
    </div>
  );
}

function credibilityScore(r: any) {
  let s = 0;
  if (r.receipt_path) s++;
  if (r.proof_type && r.proof_type !== "none") s++;
  if (r.parcel_id) s++;
  if (r.flagged_outlier) s = Math.max(0, s - 1);
  return s;
}

function Row({ title, subtitle, amount, tone, hash, record }: {
  title: string; subtitle: string; amount: string; tone: "ok" | "warn";
  hash?: string | null; record: any;
}) {
  const pm = proofMeta(record.proof_type);
  const Icon = pm?.icon;
  const score = credibilityScore(record);

  async function viewReceipt() {
    if (!record.receipt_path) return;
    const { data, error } = await supabase.storage
      .from("agrofield-media")
      .createSignedUrl(record.receipt_path, 300);
    if (error || !data?.signedUrl) { toast.error("Reçu introuvable"); return; }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3">
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold">{title}</div>
        <div className="truncate text-xs text-muted-foreground">{subtitle}</div>
        <div className="mt-1 flex flex-wrap items-center gap-1">
          {hash && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-1.5 py-0.5 font-mono text-[9px] text-primary">
              <Lock className="h-2.5 w-2.5" />
              {hash.slice(0, 8)}…
            </span>
          )}
          {pm && Icon && (
            <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${
              pm.value === "none" ? "bg-muted text-muted-foreground" : "bg-secondary text-secondary-foreground"
            }`}>
              <Icon className="h-2.5 w-2.5" />
              {pm.label}
            </span>
          )}
          {record.receipt_path && (
            <button
              type="button"
              onClick={viewReceipt}
              className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold text-primary hover:bg-primary/20"
            >
              <Eye className="h-2.5 w-2.5" /> Voir le reçu
            </button>
          )}
          {record.flagged_outlier && (
            <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-1.5 py-0.5 text-[9px] font-semibold text-destructive">
              <AlertTriangle className="h-2.5 w-2.5" />
              Prix atypique
            </span>
          )}
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-semibold text-muted-foreground">
            Crédibilité {score}/3
          </span>
        </div>
      </div>
      <span className={`text-sm font-bold shrink-0 ${tone === "ok" ? "text-primary" : "text-destructive"}`}>
        {amount}
      </span>
    </div>
  );
}

function ProofFields({
  proofType, setProofType, proofRef, setProofRef,
  witnessName, setWitnessName, witnessVillage, setWitnessVillage,
  receiptFile, setReceiptFile,
}: {
  proofType: ProofType; setProofType: (v: ProofType) => void;
  proofRef: string; setProofRef: (v: string) => void;
  witnessName: string; setWitnessName: (v: string) => void;
  witnessVillage: string; setWitnessVillage: (v: string) => void;
  receiptFile: File | null; setReceiptFile: (f: File | null) => void;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-dashed border-border p-3">
      <div className="text-xs font-semibold text-foreground">Justificatif (recommandé pour le crédit)</div>
      <div className="space-y-1.5">
        <Label>Type de preuve</Label>
        <Select value={proofType} onValueChange={(v) => setProofType(v as ProofType)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {PROOF_TYPES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="flex items-center gap-1"><Camera className="h-3.5 w-3.5" /> Photo (reçu, SMS, bon, balance…)</Label>
        <Input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => setReceiptFile(e.target.files?.[0] ?? null)}
        />
        {receiptFile && <p className="text-[10px] text-muted-foreground">{receiptFile.name}</p>}
      </div>

      {proofType === "mobile_money" && (
        <div className="space-y-1.5">
          <Label>N° transaction Mobile Money</Label>
          <Input value={proofRef} onChange={(e) => setProofRef(e.target.value)} placeholder="Orange Money / Wave / Moov" />
        </div>
      )}

      {proofType === "witness" && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Nom témoin</Label>
            <Input value={witnessName} onChange={(e) => setWitnessName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Village</Label>
            <Input value={witnessVillage} onChange={(e) => setWitnessVillage(e.target.value)} />
          </div>
        </div>
      )}

      {proofType === "coop_slip" && (
        <div className="space-y-1.5">
          <Label>Référence bon coop</Label>
          <Input value={proofRef} onChange={(e) => setProofRef(e.target.value)} />
        </div>
      )}
    </div>
  );
}

function OutlierAlert({ min, max, unit, actual, label }: { min: number; max: number; unit: string; actual: number; label: string }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-2.5 text-[11px] text-destructive">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <p>
        <span className="font-semibold">Prix inhabituel</span> — {label} : fourchette usuelle {formatFcfa(min)} à {formatFcfa(max)} ({unit}). Votre valeur : {formatFcfa(actual)}. L'écriture sera enregistrée et signalée comme atypique.
      </p>
    </div>
  );
}

function ExpenseForm({ parcels, onSubmit, refMap }: {
  parcels: Array<{ id: string; name: string }>;
  onSubmit: (p: any) => Promise<void>;
  refMap: Map<string, { min: number; max: number; unit: string; note: string | null }>;
}) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [parcelId, setParcelId] = useState<string>("none");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [proofType, setProofType] = useState<ProofType>("receipt");
  const [proofRef, setProofRef] = useState("");
  const [witnessName, setWitnessName] = useState("");
  const [witnessVillage, setWitnessVillage] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const ref = refMap.get(`expense:${category}`);
  const amountNum = Number(amount || 0);
  const outlier = ref && amountNum > 0 && (amountNum < ref.min || amountNum > ref.max);

  function reset() {
    setAmount(""); setDescription(""); setProofRef("");
    setWitnessName(""); setWitnessVillage(""); setReceiptFile(null);
    setProofType("receipt");
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button className="w-full"><Plus className="h-4 w-4" /> Ajouter une dépense</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Nouvelle dépense</DialogTitle></DialogHeader>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setSubmitting(true);
            await onSubmit({
              category, amount, description,
              parcel_id: parcelId === "none" ? null : parcelId, date,
              proof_type: proofType, proof_ref: proofRef,
              witness_name: witnessName, witness_village: witnessVillage,
              receipt_file: receiptFile, flagged: !!outlier,
            });
            setSubmitting(false); setOpen(false); reset();
          }}
          className="space-y-3"
        >
          <div className="space-y-1.5">
            <Label>Catégorie</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{EXPENSE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
            {ref && (
              <p className="text-[10px] text-muted-foreground">
                Fourchette usuelle : {formatFcfa(ref.min)} – {formatFcfa(ref.max)}{ref.note ? ` · ${ref.note}` : ""}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Montant (FCFA)</Label>
              <Input inputMode="numeric" required value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          {outlier && ref && <OutlierAlert min={ref.min} max={ref.max} unit={ref.unit} actual={amountNum} label={category} />}
          <div className="space-y-1.5">
            <Label>Parcelle liée</Label>
            <Select value={parcelId} onValueChange={setParcelId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucune</SelectItem>
                {parcels.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <ProofFields
            proofType={proofType} setProofType={setProofType}
            proofRef={proofRef} setProofRef={setProofRef}
            witnessName={witnessName} setWitnessName={setWitnessName}
            witnessVillage={witnessVillage} setWitnessVillage={setWitnessVillage}
            receiptFile={receiptFile} setReceiptFile={setReceiptFile}
          />
          <DialogFooter>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SaleForm({ parcels, onSubmit, refMap }: {
  parcels: Array<{ id: string; name: string; crop_type?: string }>;
  onSubmit: (p: any) => Promise<void>;
  refMap: Map<string, { min: number; max: number; unit: string; note: string | null }>;
}) {
  const [open, setOpen] = useState(false);
  const [crop, setCrop] = useState<string>(CROP_TYPES[0]);
  const [qty, setQty] = useState("");
  const [price, setPrice] = useState("");
  const [buyer, setBuyer] = useState("");
  const [parcelId, setParcelId] = useState<string>("none");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [proofType, setProofType] = useState<ProofType>("receipt");
  const [proofRef, setProofRef] = useState("");
  const [witnessName, setWitnessName] = useState("");
  const [witnessVillage, setWitnessVillage] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const ref = refMap.get(`sale:${crop}`);
  const priceNum = Number(price || 0);
  const outlier = ref && priceNum > 0 && (priceNum < ref.min || priceNum > ref.max);

  function reset() {
    setQty(""); setPrice(""); setBuyer(""); setProofRef("");
    setWitnessName(""); setWitnessVillage(""); setReceiptFile(null);
    setProofType("receipt");
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button className="w-full"><Plus className="h-4 w-4" /> Ajouter une vente</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Nouvelle vente</DialogTitle></DialogHeader>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setSubmitting(true);
            await onSubmit({
              crop, qty, price, buyer,
              parcel_id: parcelId === "none" ? null : parcelId, date,
              proof_type: proofType, proof_ref: proofRef,
              witness_name: witnessName, witness_village: witnessVillage,
              receipt_file: receiptFile, flagged: !!outlier,
            });
            setSubmitting(false); setOpen(false); reset();
          }}
          className="space-y-3"
        >
          <div className="space-y-1.5">
            <Label>Culture</Label>
            <Select value={crop} onValueChange={setCrop}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CROP_TYPES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
            {ref && (
              <p className="text-[10px] text-muted-foreground">
                Prix usuel : {formatFcfa(ref.min)} – {formatFcfa(ref.max)} / kg{ref.note ? ` · ${ref.note}` : ""}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Quantité (kg)</Label>
              <Input inputMode="numeric" required value={qty} onChange={(e) => setQty(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Prix / kg (FCFA)</Label>
              <Input inputMode="numeric" required value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
          </div>
          {outlier && ref && <OutlierAlert min={ref.min} max={ref.max} unit={ref.unit} actual={priceNum} label={`${crop} (prix/kg)`} />}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Acheteur</Label>
              <Input value={buyer} onChange={(e) => setBuyer(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Parcelle liée</Label>
            <Select value={parcelId} onValueChange={setParcelId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucune</SelectItem>
                {parcels.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <ProofFields
            proofType={proofType} setProofType={setProofType}
            proofRef={proofRef} setProofRef={setProofRef}
            witnessName={witnessName} setWitnessName={setWitnessName}
            witnessVillage={witnessVillage} setWitnessVillage={setWitnessVillage}
            receiptFile={receiptFile} setReceiptFile={setReceiptFile}
          />
          <DialogFooter>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
