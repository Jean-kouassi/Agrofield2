import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profil — AgroField" },
      { name: "description", content: "Gérez vos informations personnelles et paramètres AgroField." },
      { property: "og:title", content: "Profil — AgroField" },
      { property: "og:description", content: "Gérez vos informations personnelles et paramètres AgroField." },
      { property: "og:url", content: "https://field-bloom-wise.lovable.app/profile" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();

  const profileQ = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      return data;
    },
  });

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [village, setVillage] = useState("");
  const [region, setRegion] = useState("");
  const [threshold, setThreshold] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profileQ.data) {
      setFullName(profileQ.data.full_name ?? "");
      setPhone(profileQ.data.phone ?? "");
      setVillage(profileQ.data.village ?? "");
      setRegion(profileQ.data.region ?? "");
      setThreshold(String(profileQ.data.expense_alert_threshold ?? 0));
    }
  }, [profileQ.data]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      full_name: fullName,
      phone,
      village,
      region,
      expense_alert_threshold: Number(threshold || 0),
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Profil mis à jour");
    qc.invalidateQueries({ queryKey: ["profile"] });
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-black tracking-tight">Mon profil</h1>

      <form onSubmit={save} className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="space-y-1.5">
          <Label>Nom complet</Label>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Téléphone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Village</Label>
            <Input value={village} onChange={(e) => setVillage(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Région</Label>
          <Input value={region} onChange={(e) => setRegion(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Seuil d'alerte de dépenses (FCFA)</Label>
          <Input inputMode="numeric" value={threshold} onChange={(e) => setThreshold(e.target.value)} />
          <p className="text-xs text-muted-foreground">
            Vous serez alerté quand vos dépenses cumulées dépasseront ce seuil. Mettez 0 pour désactiver.
          </p>
        </div>
        <Button type="submit" className="w-full" disabled={saving}>
          {saving ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </form>

      <div className="rounded-2xl border border-border bg-card p-4 text-sm">
        <div className="text-xs text-muted-foreground">Compte</div>
        <div className="font-mono text-sm">{user.email}</div>
      </div>
    </div>
  );
}
