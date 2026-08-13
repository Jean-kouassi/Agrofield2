import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { analyzePlantImage } from "@/lib/analyze-plant.functions";
import { CROP_TYPES } from "@/lib/agrosphere";
import { toast } from "sonner";
import { Camera, Loader2, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/diagnose")({
  head: () => ({
    meta: [
      { title: "Diagnostic IA des cultures — AgroSphere" },
      { name: "description", content: "Analysez une photo de plante pour détecter maladies et carences grâce à l'IA." },
      { property: "og:title", content: "Diagnostic IA des cultures — AgroSphere" },
      { property: "og:description", content: "Analysez une photo de plante pour détecter maladies et carences grâce à l'IA." },
      { property: "og:url", content: "https://field-bloom-wise.lovable.app/diagnose" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DiagnosePage,
});

type Result = {
  disease_name: string;
  severity: string;
  confidence: string;
  treatment: string;
  prevention: string;
  is_plant: boolean;
  notes: string;
};

function DiagnosePage() {
  const analyze = useServerFn(analyzePlantImage);
  const inputRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [crop, setCrop] = useState<string>("");

  const historyQ = useQuery({
    queryKey: ["disease-history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("disease_analyses")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
  });

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setResult(null);
    const reader = new FileReader();
    reader.onload = () => setPreview(String(reader.result));
    reader.readAsDataURL(file);
  }

  async function runAnalysis() {
    if (!preview) return toast.error("Choisissez d'abord une photo");
    setLoading(true);
    try {
      const res = await analyze({
        data: { imageBase64: preview, mimeType: "image/jpeg", cropHint: crop || undefined },
      });
      setResult(res.analysis as Result);
      qc.invalidateQueries({ queryKey: ["disease-history"] });
      toast.success("Analyse terminée");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Analyse impossible");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="space-y-5 p-4 max-w-3xl mx-auto">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Diagnostic IA</h1>
          <p className="text-sm text-muted-foreground">
            Prenez une photo nette de la feuille malade. L'IA identifie la maladie en quelques secondes.
          </p>
        </div>

      <div className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="space-y-1.5">
          <Label>Culture concernée (optionnel)</Label>
          <Select value={crop} onValueChange={setCrop}>
            <SelectTrigger><SelectValue placeholder="Choisir une culture" /></SelectTrigger>
            <SelectContent>
              {CROP_TYPES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={onFile}
          className="hidden"
        />

        {preview ? (
          <div className="overflow-hidden rounded-xl border border-border">
            <img src={preview} alt="Aperçu de la plante à diagnostiquer" className="max-h-72 w-full object-cover" />
          </div>
        ) : (
          <button
            onClick={() => inputRef.current?.click()}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-8 text-primary hover:bg-primary/10"
          >
            <Camera className="h-8 w-8" />
            <span className="text-sm font-semibold">Prendre / choisir une photo</span>
          </button>
        )}

        {preview && (
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => { setPreview(null); setResult(null); }}>
              Changer
            </Button>
            <Button onClick={runAnalysis} disabled={loading}>
              {loading ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Analyse…</> : "Analyser"}
            </Button>
          </div>
        )}
      </div>

      {result && <ResultCard r={result} />}

      <section>
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">
          Historique
        </h2>
        {(historyQ.data ?? []).length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
            Aucune analyse pour l'instant.
          </div>
        ) : (
          <div className="space-y-2">
            {historyQ.data!.map((h) => (
              <div key={h.id} className="rounded-xl border border-border bg-card p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-semibold">{h.disease_name}</div>
                  <SeverityBadge value={h.severity ?? "inconnu"} />
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(h.created_at).toLocaleString("fr-FR")}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      </div>
    </div>
  );
}

function ResultCard({ r }: { r: Result }) {
  const Icon = r.severity === "critique" ? AlertTriangle : r.severity === "faible" ? CheckCircle2 : Info;
  return (
    <div className="space-y-3 rounded-2xl border border-primary/30 bg-primary/5 p-4">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-primary p-2 text-primary-foreground">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-black">{r.disease_name}</h3>
            <SeverityBadge value={r.severity} />
          </div>
          <div className="text-xs text-muted-foreground">Confiance : {r.confidence}</div>
        </div>
      </div>
      {r.treatment && (
        <Block title="Traitement recommandé" body={r.treatment} />
      )}
      {r.prevention && (
        <Block title="Prévention" body={r.prevention} />
      )}
      {r.notes && <Block title="Notes" body={r.notes} />}
    </div>
  );
}

function Block({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl bg-background/70 p-3">
      <div className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{title}</div>
      <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{body}</p>
    </div>
  );
}

function SeverityBadge({ value }: { value: string }) {
  const cls =
    value === "critique" ? "bg-destructive/15 text-destructive"
      : value === "moyen" ? "bg-accent/20 text-accent-foreground"
        : value === "faible" ? "bg-secondary text-secondary-foreground"
          : "bg-muted text-muted-foreground";
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${cls}`}>{value}</span>;
}
