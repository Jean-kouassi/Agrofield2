import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Sprout, Droplets, SprayCan, Pickaxe, Wheat, Trash2, Calendar, DollarSign } from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const EVENT_TYPES = [
  { value: "sowing", label: "Semis", icon: Sprout, color: "bg-green-100 text-green-800" },
  { value: "irrigation", label: "Irrigation", icon: Droplets, color: "bg-blue-100 text-blue-800" },
  { value: "fertilization", label: "Fertilisation", icon: SprayCan, color: "bg-yellow-100 text-yellow-800" },
  { value: "treatment", label: "Traitement", icon: SprayCan, color: "bg-purple-100 text-purple-800" },
  { value: "weeding", label: "Désherbage", icon: Pickaxe, color: "bg-orange-100 text-orange-800" },
  { value: "harvest", label: "Récolte", icon: Wheat, color: "bg-amber-100 text-amber-800" },
  { value: "other", label: "Autre", icon: Sprout, color: "bg-gray-100 text-gray-800" },
] as const;

export const Route = createFileRoute("/_authenticated/crop-events")({
  head: () => ({
    meta: [
      { title: "Suivi Cultural — AgroSphere2" },
      { name: "description", content: "Enregistrez et suivez toutes les interventions sur vos parcelles." },
      { property: "og:title", content: "Suivi Cultural — AgroSphere2" },
      { property: "og:description", content: "Enregistrez et suivez toutes les interventions sur vos parcelles." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CropEventsPage,
});

function CropEventsPage() {
  const qc = useQueryClient();
  const [user, setUser] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [selectedParcel, setSelectedParcel] = useState<string>("");
  const [eventType, setEventType] = useState<string>("sowing");
  const [eventDate, setEventDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [yieldKg, setYieldKg] = useState("");
  const [inputCost, setInputCost] = useState("");
  const [laborCost, setLaborCost] = useState("");

  // Récupérer l'utilisateur connecté
  useState(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  });

  // Charger les parcelles
  const parcelsQ = useQuery({
    queryKey: ["parcels-for-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parcels")
        .select("id, name, crop_type")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  // Charger les événements culturaux
  const eventsQ = useQuery({
    queryKey: ["crop-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crop_events")
        .select(`
          *,
          parcel:parcel_id (
            id,
            name,
            crop_type
          )
        `)
        .order("event_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  // Créer un nouvel événement
  async function createEvent(e: React.FormEvent) {
    e.preventDefault();
    
    if (!selectedParcel) {
      toast.error("Veuillez sélectionner une parcelle");
      return;
    }

    // Utiliser RPC pour contourner le cache PostgREST
    const { error } = await supabase.rpc('insert_crop_event', {
      p_user_id: user.id,
      p_parcel_id: selectedParcel,
      p_event_type: eventType,
      p_event_date: eventDate || new Date().toISOString().split("T")[0],
      p_notes: notes || undefined,
      p_yield_kg: yieldKg ? Number(yieldKg) : undefined,
      p_input_cost: inputCost ? Number(inputCost) : 0,
      p_labor_cost: laborCost ? Number(laborCost) : 0,
    });

    if (error) {
      toast.error(`Erreur: ${error.message}`);
      return;
    }

    toast.success("Événement enregistré");
    
    // Reset form
    setNotes("");
    setYieldKg("");
    setInputCost("");
    setLaborCost("");
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["crop-events"] });
  }

  // Supprimer un événement
  async function removeEvent(id: string) {
    if (!confirm("Supprimer cet événement ?")) return;
    
    const { error } = await supabase.from("crop_events").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    
    toast.success("Événement supprimé");
    qc.invalidateQueries({ queryKey: ["crop-events"] });
  }

  // Calculer le coût total
  const totalCost = useMemo(() => {
    if (!eventsQ.data) return 0;
    return eventsQ.data.reduce((sum, event) => {
      return sum + (Number(event.input_cost_fcfa) || 0) + (Number(event.labor_cost_fcfa) || 0);
    }, 0);
  }, [eventsQ.data]);

  // Calculer le rendement total
  const totalYield = useMemo(() => {
    if (!eventsQ.data) return 0;
    return eventsQ.data
      .filter(e => e.event_type === "harvest" && e.yield_kg)
      .reduce((sum, event) => sum + (Number(event.yield_kg) || 0), 0);
  }, [eventsQ.data]);

  // Icône par type d'événement
  function getEventIcon(type: string) {
    const found = EVENT_TYPES.find(et => et.value === type);
    return found ? found.icon : Sprout;
  }

  // Couleur par type d'événement
  function getEventColor(type: string) {
    const found = EVENT_TYPES.find(et => et.value === type);
    return found ? found.color : "bg-gray-100 text-gray-800";
  }

  // Formater date en français
  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("fr-FR", { 
      day: "numeric", 
      month: "short", 
      year: "numeric" 
    }).format(date);
  }

  // Formater FCFA
  function formatFcfa(amount: number | null | undefined) {
    if (!amount) return "0 FCFA";
    return new Intl.NumberFormat("fr-FR").format(Math.round(amount)) + " FCFA";
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Suivi Cultural</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Enregistrez toutes les interventions sur vos parcelles
          </p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle intervention
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Nouvelle intervention culturale</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={createEvent} className="space-y-4">
              {/* Parcelle */}
              <div className="space-y-1.5">
                <Label>Parcelle *</Label>
                <Select value={selectedParcel} onValueChange={setSelectedParcel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une parcelle" />
                  </SelectTrigger>
                  <SelectContent>
                    {(parcelsQ.data ?? []).map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} ({p.crop_type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Type d'événement */}
              <div className="space-y-1.5">
                <Label>Type d'intervention *</Label>
                <Select value={eventType} onValueChange={setEventType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map((et) => (
                      <SelectItem key={et.value} value={et.value}>
                        <span className="flex items-center gap-2">
                          <et.icon className="h-4 w-4" />
                          {et.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date */}
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input 
                  type="date" 
                  value={eventDate} 
                  onChange={(e) => setEventDate(e.target.value)} 
                />
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Textarea 
                  rows={3} 
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Détails de l'intervention..."
                />
              </div>

              {/* Champs conditionnels selon le type */}
              {eventType === "harvest" && (
                <div className="space-y-1.5">
                  <Label>Rendement (kg)</Label>
                  <Input 
                    type="number" 
                    step="0.1" 
                    min="0"
                    value={yieldKg} 
                    onChange={(e) => setYieldKg(e.target.value)}
                    placeholder="Ex: 500"
                  />
                </div>
              )}

              {/* Coûts */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Coût intrants (FCFA)</Label>
                  <Input 
                    type="number" 
                    step="100" 
                    min="0"
                    value={inputCost} 
                    onChange={(e) => setInputCost(e.target.value)}
                    placeholder="Ex: 5000"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Main d'œuvre (FCFA)</Label>
                  <Input 
                    type="number" 
                    step="100" 
                    min="0"
                    value={laborCost} 
                    onChange={(e) => setLaborCost(e.target.value)}
                    placeholder="Ex: 3000"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="submit" className="w-full">Enregistrer</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Interventions</CardTitle>
            <Sprout className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{eventsQ.data?.length ?? 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Coût Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatFcfa(totalCost)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rendement Récolté</CardTitle>
            <Wheat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalYield > 0 ? `${totalYield} kg` : "-"}</div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des événements */}
      {eventsQ.isLoading ? (
        <div className="text-sm text-muted-foreground">Chargement...</div>
      ) : (eventsQ.data ?? []).length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-10">
            <Sprout className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              Aucune intervention enregistrée
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Commencez par ajouter un semis ou une autre intervention
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {(eventsQ.data ?? []).map((event: any) => {
            const Icon = getEventIcon(event.event_type);
            const bgColor = getEventColor(event.event_type);
            const totalEventCost = (Number(event.input_cost_fcfa) || 0) + (Number(event.labor_cost_fcfa) || 0);
            
            return (
              <Card key={event.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`rounded-full p-2 ${bgColor}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base">
                          {EVENT_TYPES.find(et => et.value === event.event_type)?.label}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {event.parcel?.name} • {event.parcel?.crop_type}
                        </p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => removeEvent(event.id)}
                      className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive"
                      aria-label="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-2">
                    {/* Date */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatDate(event.event_date)}
                    </div>
                    
                    {/* Notes */}
                    {event.notes && (
                      <p className="text-sm text-muted-foreground">{event.notes}</p>
                    )}
                    
                    {/* Rendement (si récolte) */}
                    {event.event_type === "harvest" && event.yield_kg && (
                      <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                        <Wheat className="h-3 w-3 mr-1" />
                        {event.yield_kg} kg récoltés
                      </Badge>
                    )}
                    
                    {/* Coûts */}
                    {totalEventCost > 0 && (
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          Intrants: {formatFcfa(event.input_cost_fcfa)}
                        </span>
                        {event.labor_cost_fcfa > 0 && (
                          <>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-muted-foreground">
                              Main d'œuvre: {formatFcfa(event.labor_cost_fcfa)}
                            </span>
                          </>
                        )}
                        <Badge variant="outline" className="ml-2">
                          Total: {formatFcfa(totalEventCost)}
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Lien vers parcelles */}
      <div className="flex justify-center pt-4">
        <Link to="/parcels" className="text-sm text-primary hover:underline">
          → Gérer mes parcelles
        </Link>
      </div>
    </div>
  );
}
