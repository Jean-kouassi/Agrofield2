import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CROP_TYPES, harvestAlert, daysSince } from "@/lib/agrosphere";
import { toast } from "sonner";
import {
  Plus, Sprout, Trash2, Calendar, MapPin, Ruler, FileText,
  AlertTriangle, Edit3, Loader2, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { CropProgressCard } from "@/components/ui/crop-progress-card";
import { EmptyState } from "@/components/ui/empty-state";

export const Route = createFileRoute("/_authenticated/parcels")({
  head: () => ({
    meta: [
      { title: "Parcelles — AgroSphere" },
      { name: "description", content: "Cartographiez vos parcelles, cultures et calendriers de récolte." },
    ],
  }),
  component: ParcelsPage,
});

function getCropCycleDays(cropType: string): number {
  const cycles: Record<string, number> = {
    'Mil': 90, 'Sorgho': 120, 'Maïs': 100, 'Riz': 130,
    'Niébé': 75, 'Arachide': 120, 'Sésame': 90, 'Coton': 160,
    'Tomate': 80, 'Oignon': 120, 'Manioc': 180, 'Igname': 200,
  };
  return cycles[cropType] || 100;
}

function getCurrentGrowthStage(cropType: string, age: number, totalDays: number): string {
  const progress = (age / totalDays) * 100;
  if (progress < 15) return 'Germination';
  if (progress < 35) return 'Croissance végétative';
  if (progress < 60) return 'Floraison';
  if (progress < 85) return 'Fructification';
  if (progress < 100) return 'Maturation';
  return 'Prêt à récolter';
}

function ParcelsPage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [crop, setCrop] = useState<string>(CROP_TYPES[0]);
  const [sowing, setSowing] = useState("");
  const [notes, setNotes] = useState("");

  const parcelsQ = useQuery({
    queryKey: ["parcels"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parcels")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  async function createParcel(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("parcels").insert({
      user_id: user.id,
      name,
      area_ha: Number(area || 0),
      crop_type: crop,
      sowing_date: sowing || null,
      notes: notes || null,
    });
    if (error) return toast.error(error.message);
    toast.success("✅ Parcelle enregistrée");
    setName(""); setArea(""); setSowing(""); setNotes("");
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["parcels"] });
  }

  async function remove(id: string, parcelName: string) {
    if (!confirm(`Supprimer la parcelle "${parcelName}" ?\n\nCette action est irréversible.`)) return;

    setDeleting(id);
    try {
      const { error } = await supabase
        .from("parcels")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id); // Filtre user_id pour respecter RLS

      if (error) {
        if (error.code === "42501") {
          toast.error("❌ Permission refusée. Exécutez le script SQL fix_parcels_rls_delete.sql dans Supabase SQL Editor.");
        } else {
          throw error;
        }
        return;
      }

      toast.success("✅ Parcelle supprimée");
      qc.invalidateQueries({ queryKey: ["parcels"] });
    } catch (err: any) {
      console.error("Delete error:", err);
      toast.error("❌ Erreur: " + (err?.message || "Échec de la suppression"));
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">Mes parcelles</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {parcelsQ.data?.length ?? 0} parcelle{(parcelsQ.data?.length ?? 0) > 1 ? "s" : ""} • Suivi cultural et alertes
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" style={{ minHeight: 44 }}>
              <Plus className="h-4 w-4" /> Ajouter
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sprout className="h-5 w-5 text-primary" />
                Nouvelle parcelle
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={createParcel} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="parcel-name">Nom de la parcelle</Label>
                <Input
                  id="parcel-name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Parcelle Est"
                  className="h-12"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="parcel-area">Superficie (ha)</Label>
                  <Input
                    id="parcel-area"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="Ex: 2.5"
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Culture</Label>
                  <Select value={crop} onValueChange={setCrop}>
                    <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CROP_TYPES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="parcel-sowing">Date de semis</Label>
                <Input
                  id="parcel-sowing"
                  type="date"
                  value={sowing}
                  onChange={(e) => setSowing(e.target.value)}
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="parcel-notes">Notes (optionnel)</Label>
                <Textarea
                  id="parcel-notes"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Sols argileux, exposition sud..."
                />
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full" style={{ minHeight: 48 }}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Enregistrer
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Content */}
      {parcelsQ.isLoading ? (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : (parcelsQ.data ?? []).length === 0 ? (
        <EmptyState
          icon={<Sprout className="h-12 w-12 text-primary/60" />}
          title="Aucune parcelle encore"
          description="Créez votre première parcelle pour commencer le suivi cultural et les alertes de récolte."
          action={
            <Button onClick={() => setOpen(true)} style={{ minHeight: 48 }}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle parcelle
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {parcelsQ.data!.map((p) => {
            const alert = harvestAlert(p.crop_type, p.sowing_date);
            const age = daysSince(p.sowing_date) ?? 0;
            const cropCycleDays = getCropCycleDays(p.crop_type);
            const stage = getCurrentGrowthStage(p.crop_type, age, cropCycleDays);
            const progress = Math.min(100, Math.round((age / cropCycleDays) * 100));

            return (
              <div key={p.id} className="space-y-2">
                <Card className="overflow-hidden transition-shadow hover:shadow-md">
                  <CardContent className="p-4">
                    {/* Top row: name + delete */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-bold text-foreground">{p.name}</h3>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Sprout className="h-3 w-3 text-primary" /> {p.crop_type}
                          </span>
                          <span className="flex items-center gap-1">
                            <Ruler className="h-3 w-3" /> {Number(p.area_ha)} ha
                          </span>
                          {p.sowing_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Semis {new Date(p.sowing_date).toLocaleDateString('fr-FR')}
                              {age != null && age > 0 && ` • J+${age}`}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => remove(p.id, p.name)}
                        disabled={deleting === p.id}
                        className="rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                        style={{ minHeight: 40, minWidth: 40 }}
                        aria-label={`Supprimer ${p.name}`}
                      >
                        {deleting === p.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>

                    {/* Progress bar inline */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                        <span>{stage}</span>
                        <span>{progress}% • J{age}/{cropCycleDays}</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Alerts + notes */}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {alert && (
                        <Badge
                          variant={
                            alert.level === "critical" ? "destructive" :
                            alert.level === "warn" ? "default" : "secondary"
                          }
                          className="text-[10px]"
                        >
                          <AlertTriangle className="mr-1 h-3 w-3" />
                          {alert.label}
                        </Badge>
                      )}
                      {progress >= 100 && (
                        <Badge variant="default" className="text-[10px]">
                          <CheckCircle2 className="mr-1 h-3 w-3" /> Prêt à récolter
                        </Badge>
                      )}
                    </div>

                    {p.notes && (
                      <div className="mt-2 flex items-start gap-1.5 rounded-md bg-muted/50 px-2 py-1.5">
                        <FileText className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">{p.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Crop progress card */}
                <CropProgressCard
                  cropName={p.crop_type}
                  currentDay={age}
                  totalDays={cropCycleDays}
                  stage={stage}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}