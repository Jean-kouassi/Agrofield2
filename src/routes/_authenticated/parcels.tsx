import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CROP_TYPES, harvestAlert, daysSince } from "@/lib/agrofield";
import { toast } from "sonner";
import { Plus, Sprout, Trash2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/parcels")({
  head: () => ({
    meta: [
      { title: "Parcelles — AgroField" },
      { name: "description", content: "Cartographiez vos parcelles, cultures et calendriers de récolte." },
      { property: "og:title", content: "Parcelles — AgroField" },
      { property: "og:description", content: "Cartographiez vos parcelles, cultures et calendriers de récolte." },
      { property: "og:url", content: "https://field-bloom-wise.lovable.app/parcels" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ParcelsPage,
});

function ParcelsPage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
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
    toast.success("Parcelle enregistrée");
    setName(""); setArea(""); setSowing(""); setNotes("");
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["parcels"] });
  }

  async function remove(id: string) {
    if (!confirm("Supprimer cette parcelle ?")) return;
    const { error } = await supabase.from("parcels").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["parcels"] });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black tracking-tight">Mes parcelles</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4" /> Ajouter</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nouvelle parcelle</DialogTitle></DialogHeader>
            <form onSubmit={createParcel} className="space-y-3">
              <div className="space-y-1.5">
                <Label>Nom de la parcelle</Label>
                <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Parcelle Est" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Superficie (ha)</Label>
                  <Input type="number" step="0.01" min="0" required value={area} onChange={(e) => setArea(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Culture</Label>
                  <Select value={crop} onValueChange={setCrop}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CROP_TYPES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Date de semis</Label>
                <Input type="date" value={sowing} onChange={(e) => setSowing(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full">Enregistrer</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {parcelsQ.isLoading ? (
        <div className="text-sm text-muted-foreground">Chargement…</div>
      ) : (parcelsQ.data ?? []).length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center">
          <Sprout className="mx-auto h-10 w-10 text-primary/60" />
          <p className="mt-3 text-sm text-muted-foreground">
            Aucune parcelle. Ajoutez votre première parcelle pour démarrer.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {parcelsQ.data!.map((p) => {
            const alert = harvestAlert(p.crop_type, p.sowing_date);
            const age = daysSince(p.sowing_date);
            return (
              <div key={p.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-base font-bold">{p.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {p.crop_type} • {Number(p.area_ha)} ha
                    </div>
                  </div>
                  <button
                    onClick={() => remove(p.id)}
                    className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive"
                    aria-label="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                  {p.sowing_date && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-muted-foreground">
                      <Calendar className="h-3 w-3" /> Semis {p.sowing_date}
                      {age != null && ` • J+${age}`}
                    </span>
                  )}
                  {alert && (
                    <span
                      className={`rounded-full px-2 py-1 font-medium ${
                        alert.level === "critical"
                          ? "bg-destructive/10 text-destructive"
                          : alert.level === "warn"
                            ? "bg-accent/20 text-accent-foreground"
                            : "bg-secondary text-secondary-foreground"
                      }`}
                    >
                      {alert.label}
                    </span>
                  )}
                </div>
                {p.notes && <p className="mt-2 text-xs text-muted-foreground">{p.notes}</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
