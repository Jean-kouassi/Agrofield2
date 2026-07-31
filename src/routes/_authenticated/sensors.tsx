import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useMemo, useState } from "react";
import { Radio, Plus, Trash2, Droplets, Thermometer, Beaker, Sprout, Battery, Copy, Check, Timer, Wifi, WifiOff, AlertTriangle, CloudRain, X, Signal, Bluetooth, Satellite, HelpCircle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";


export const Route = createFileRoute("/_authenticated/sensors")({
  head: () => ({
    meta: [
      { title: "Capteurs — AgroField" },
      { name: "description", content: "Pilotez vos stations AgroField Node : sol, météo, irrigation." },
      { property: "og:title", content: "Capteurs — AgroField" },
      { property: "og:description", content: "Pilotez vos stations AgroField Node : sol, météo, irrigation." },
      { property: "og:url", content: "https://field-bloom-wise.lovable.app/sensors" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SensorsPage,
});

type ConnectivityMode = "gsm" | "lora" | "bluetooth" | "wifi";

type Device = {
  id: string;
  name: string;
  parcel_id: string | null;
  device_key: string;
  last_seen_at: string | null;
  sample_interval_seconds: number;
  moisture_alert_threshold_pct: number;
  hardware_model: string | null;
  firmware_version: string | null;
  connectivity_mode: ConnectivityMode;
  sim_iccid: string | null;
};


type Reading = {
  id: string;
  device_id: string;
  parcel_id: string | null;
  ph: number | null;
  humidity_pct: number | null;
  soil_moisture_pct: number | null;
  temperature_c: number | null;
  conductivity: number | null;
  battery_pct: number | null;
  recorded_at: string;
};

function randomKey() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function SensorsPage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [parcelId, setParcelId] = useState<string>("");
  const [interval, setIntervalSec] = useState<number>(300);
  const [mode, setMode] = useState<ConnectivityMode>("gsm");
  const [simIccid, setSimIccid] = useState<string>("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [btSyncingId, setBtSyncingId] = useState<string | null>(null);
  const [btMessage, setBtMessage] = useState<string | null>(null);


  const parcelsQ = useQuery({
    queryKey: ["parcels"],
    queryFn: async () => {
      const { data, error } = await supabase.from("parcels").select("id, name, crop_type").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const devicesQ = useQuery({
    queryKey: ["sensor-devices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sensor_devices")
        .select("id, name, parcel_id, device_key, last_seen_at, sample_interval_seconds, moisture_alert_threshold_pct, hardware_model, firmware_version, connectivity_mode, sim_iccid")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Device[];
    },
    refetchInterval: 15000,
  });

  const readingsQ = useQuery({
    queryKey: ["sensor-readings-recent"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sensor_readings")
        .select("*")
        .order("recorded_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as Reading[];
    },
    refetchInterval: 15000,
  });

  const alertsQ = useQuery({
    queryKey: ["sensor-alerts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sensor_alerts")
        .select("id, device_id, parcel_id, kind, message, created_at, resolved_at")
        .is("resolved_at", null)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 30000,
  });

  const commandsQ = useQuery({
    queryKey: ["irrigation-commands"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("irrigation_commands")
        .select("id, device_id, action, duration_seconds, status, created_at, completed_at")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 10000,
  });


  // Tick every second so "il y a Xs" restent à jour
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => setTick((n) => n + 1), 1000);
    return () => window.clearInterval(t);
  }, []);

  const createDevice = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("sensor_devices").insert({
        user_id: user.id,
        name: name.trim(),
        parcel_id: parcelId || null,
        device_key: randomKey(),
        sample_interval_seconds: interval,
        connectivity_mode: mode,
        sim_iccid: mode === "gsm" && simIccid.trim() ? simIccid.trim() : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setName("");
      setParcelId("");
      setIntervalSec(300);
      setMode("gsm");
      setSimIccid("");
      setShowForm(false);
      qc.invalidateQueries({ queryKey: ["sensor-devices"] });
    },
  });


  const updateInterval = useMutation({
    mutationFn: async ({ id, seconds }: { id: string; seconds: number }) => {
      const { error } = await supabase
        .from("sensor_devices")
        .update({ sample_interval_seconds: seconds })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sensor-devices"] }),
  });

  const deleteDevice = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sensor_devices").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sensor-devices"] });
      qc.invalidateQueries({ queryKey: ["sensor-readings-recent"] });
    },
  });

  const updateThreshold = useMutation({
    mutationFn: async ({ id, pct }: { id: string; pct: number }) => {
      const { error } = await supabase
        .from("sensor_devices")
        .update({ moisture_alert_threshold_pct: pct })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sensor-devices"] }),
  });

  const sendIrrigation = useMutation({
    mutationFn: async ({ deviceId, seconds }: { deviceId: string; seconds: number }) => {
      const { error } = await supabase.from("irrigation_commands").insert({
        user_id: user.id,
        device_id: deviceId,
        action: "start_irrigation",
        duration_seconds: seconds,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["irrigation-commands"] }),
  });

  const resolveAlert = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("sensor_alerts")
        .update({ resolved_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sensor-alerts"] }),
  });

  const latestByDevice = useMemo(() => {
    const map = new Map<string, Reading>();
    for (const r of readingsQ.data ?? []) {
      if (!map.has(r.device_id)) map.set(r.device_id, r);
    }
    return map;
  }, [readingsQ.data]);

  const historyByDevice = useMemo(() => {
    const map = new Map<string, { t: number; moisture: number | null; label: string }[]>();
    for (const r of readingsQ.data ?? []) {
      const arr = map.get(r.device_id) ?? [];
      arr.push({
        t: new Date(r.recorded_at).getTime(),
        moisture: r.soil_moisture_pct,
        label: new Date(r.recorded_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
      });
      map.set(r.device_id, arr);
    }
    for (const arr of map.values()) arr.sort((a, b) => a.t - b.t);
    return map;
  }, [readingsQ.data]);

  const pendingByDevice = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of commandsQ.data ?? []) {
      if (c.status === "pending" || c.status === "ack") {
        map.set(c.device_id, (map.get(c.device_id) ?? 0) + 1);
      }
    }
    return map;
  }, [commandsQ.data]);

  const ingestUrl = typeof window !== "undefined" ? `${window.location.origin}/api/public/sensors/ingest` : "";
  const commandsUrl = typeof window !== "undefined" ? `${window.location.origin}/api/public/sensors/commands` : "";

  async function copy(text: string, id: string) {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  // ---- Bluetooth sync (offline stations) ----------------------------------
  // Lit un lot de mesures accumulées dans la station via Web Bluetooth
  // (service UART Nordic 6E400001-...). La station DOIT publier une chaîne
  // JSON `{ device_key, readings: [...] }` sur la caractéristique TX.
  async function syncViaBluetooth(device: Device) {
    setBtMessage(null);
    const nav: any = navigator;
    if (!nav.bluetooth) {
      setBtMessage("Web Bluetooth n'est pas disponible sur cet appareil / navigateur. Utilisez Chrome sur Android.");
      return;
    }
    setBtSyncingId(device.id);
    try {
      const UART_SERVICE = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
      const UART_TX = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";
      const bt = await nav.bluetooth.requestDevice({
        filters: [{ services: [UART_SERVICE] }],
        optionalServices: [UART_SERVICE],
      });
      const server = await bt.gatt.connect();
      const service = await server.getPrimaryService(UART_SERVICE);
      const tx = await service.getCharacteristic(UART_TX);

      const buffer: string[] = [];
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("timeout")), 20000);
        tx.addEventListener("characteristicvaluechanged", (ev: any) => {
          const val = new TextDecoder().decode(ev.target.value);
          buffer.push(val);
          if (val.includes("\n") || buffer.join("").length > 32000) {
            clearTimeout(timeout);
            resolve();
          }
        });
        tx.startNotifications();
      });

      const payload = JSON.parse(buffer.join("").trim());
      const readings = Array.isArray(payload.readings) ? payload.readings : [];
      if (!readings.length) throw new Error("Aucune mesure reçue");

      const res = await fetch(ingestUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          device_key: device.device_key,
          source: "bluetooth_sync",
          readings,
        }),
      });
      if (!res.ok) throw new Error(`Serveur HTTP ${res.status}`);

      setBtMessage(`✓ ${readings.length} mesure(s) synchronisée(s) depuis « ${device.name} »`);
      qc.invalidateQueries({ queryKey: ["sensor-readings-recent"] });
      qc.invalidateQueries({ queryKey: ["sensor-devices"] });
    } catch (err: any) {
      setBtMessage(`Erreur Bluetooth : ${err?.message ?? "impossible de synchroniser"}`);
    } finally {
      setBtSyncingId(null);
    }
  }


  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Hardware IoT · Saisie automatique</p>
          <h1 className="text-2xl font-black tracking-tight">Capteurs</h1>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
        >
          <Plus className="h-4 w-4" /> Appareil
        </button>
      </div>

      {(alertsQ.data ?? []).length > 0 && (
        <div className="space-y-2 rounded-2xl border border-destructive/40 bg-destructive/5 p-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-destructive">
            <AlertTriangle className="h-4 w-4" /> Alertes actives ({alertsQ.data!.length})
          </div>
          {alertsQ.data!.map((a: any) => {
            const dev = (devicesQ.data ?? []).find((d) => d.id === a.device_id);
            return (
              <div key={a.id} className="flex items-start justify-between gap-2 rounded-lg bg-background p-2 text-xs">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{dev?.name ?? "Capteur"} · {a.kind}</div>
                  <div className="text-muted-foreground">{a.message}</div>
                  <div className="text-[10px] text-muted-foreground">{new Date(a.created_at).toLocaleString("fr-FR")}</div>
                </div>
                <button
                  onClick={() => resolveAlert.mutate(a.id)}
                  className="shrink-0 rounded-full p-1.5 text-muted-foreground hover:bg-muted"
                  aria-label="Marquer résolue"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) createDevice.mutate();
          }}
          className="space-y-3 rounded-2xl border border-border bg-card p-4"
        >
          <div>
            <label className="text-xs font-semibold uppercase text-muted-foreground">Nom de l'appareil</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Capteur parcelle A"
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-muted-foreground">Parcelle liée (optionnel)</label>
            <select
              value={parcelId}
              onChange={(e) => setParcelId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="">— Aucune —</option>
              {(parcelsQ.data ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.crop_type})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-muted-foreground">Intervalle d'échantillonnage</label>
            <select
              value={interval}
              onChange={(e) => setIntervalSec(Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            >
              <option value={60}>Toutes les 1 minute</option>
              <option value={300}>Toutes les 5 minutes</option>
              <option value={900}>Toutes les 15 minutes</option>
              <option value={1800}>Toutes les 30 minutes</option>
              <option value={3600}>Toutes les heures</option>
              <option value={21600}>Toutes les 6 heures</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-muted-foreground">Mode de connexion</label>
            <div className="mt-1 grid grid-cols-2 gap-2">
              {([
                { v: "gsm", label: "GSM / SIM", desc: "Réseau mobile — recommandé en zone rurale" },
                { v: "lora", label: "LoRa", desc: "Radio longue portée vers passerelle village" },
                { v: "bluetooth", label: "Bluetooth", desc: "Sync manuelle depuis le téléphone (hors ligne)" },
                { v: "wifi", label: "Wi-Fi", desc: "Uniquement si box / hotspot à proximité" },
              ] as { v: ConnectivityMode; label: string; desc: string }[]).map((opt) => (
                <button
                  key={opt.v}
                  type="button"
                  onClick={() => setMode(opt.v)}
                  className={`rounded-xl border p-2 text-left text-xs transition ${
                    mode === opt.v
                      ? "border-primary bg-primary/10"
                      : "border-border bg-background hover:border-primary/50"
                  }`}
                >
                  <div className="font-semibold">{opt.label}</div>
                  <div className="text-[10px] text-muted-foreground">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>
          {mode === "gsm" && (
            <div>
              <label className="text-xs font-semibold uppercase text-muted-foreground">Numéro SIM / ICCID (optionnel)</label>
              <input
                value={simIccid}
                onChange={(e) => setSimIccid(e.target.value)}
                placeholder="Ex: 89221030000000000000"
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 font-mono text-xs"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={createDevice.isPending || !name.trim()}
            className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {createDevice.isPending ? "Création…" : "Créer l'appareil"}
          </button>
        </form>
      )}

      <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-3 text-[11px] text-muted-foreground">
        Endpoint d'ingestion : <code className="font-mono">{ingestUrl}</code> · Rafraîchissement 15 s · Historique 12 mois.
      </div>

      <details className="rounded-2xl border border-primary/30 bg-primary/5 p-3 text-xs">
        <summary className="flex cursor-pointer items-center gap-2 font-semibold text-primary">
          <HelpCircle className="h-4 w-4" /> Comment connecter un vrai capteur ?
        </summary>
        <div className="mt-3 space-y-3 text-muted-foreground">
          <div className="rounded-lg bg-background p-2 text-[11px]">
            <b className="text-foreground">Étape 1: Créer l'appareil</b>
            <p className="mt-1">Cliquez sur « + Appareil », donnez-lui un nom et choisissez le mode de connexion. Une fois créé, copiez la <b>Clé</b> affichée (64 caractères).</p>
          </div>
          
          <div className="rounded-lg bg-background p-2 text-[11px]">
            <b className="text-foreground">Étape 2: Configurer le hardware</b>
            <p className="mt-1">Utilisez cette clé dans votre firmware ESP32/Arduino. Voir le guide complet : <code className="text-primary">docs/CAPTEURS_GUIDE_COMPLET.md</code></p>
          </div>
          
          <div className="rounded-lg bg-background p-2 text-[11px]">
            <b className="text-foreground">Étape 3: Tester avec le simulateur</b>
            <p className="mt-1">Lancez le script Node.js inclus :</p>
            <code className="mt-1 block bg-muted px-2 py-1 text-[10px]">
              node scripts/test-sensor-simulator.mjs --device-key VOTRE_CLE
            </code>
          </div>
          
          <div className="flex gap-2 pt-2">
            <Signal className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div>
              <b className="text-foreground">GSM / SIM (recommandé)</b> — La station embarque une carte SIM (Orange, MTN, Moov…) et pousse les mesures via le réseau mobile 2G/4G. Fonctionne partout où il y a du signal, sans installation supplémentaire.
            </div>
          </div>
          <div className="flex gap-2">
            <Satellite className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div>
              <b className="text-foreground">LoRa (village)</b> — Les stations parlent en radio longue portée (jusqu'à 10 km) à une passerelle installée au village, qui relaie via une seule SIM. Idéal pour couvrir plusieurs parcelles éloignées à moindre coût.
            </div>
          </div>
          <div className="flex gap-2">
            <Bluetooth className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div>
              <b className="text-foreground">Bluetooth (hors ligne)</b> — La station stocke localement jusqu'à 30 jours de mesures. Quand vous passez à côté avec votre téléphone, appuyez sur <i>« Synchroniser via Bluetooth »</i> sur la fiche capteur : les données sont téléchargées puis envoyées au serveur dès que vous retrouvez du réseau.
            </div>
          </div>
          <div className="flex gap-2">
            <Wifi className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div>
              <b className="text-foreground">Wi-Fi</b> — Uniquement si vous avez un routeur ou un hotspot à portée. Peu adapté aux champs isolés.
            </div>
          </div>
        </div>
      </details>

      {btMessage && (
        <div className="rounded-xl border border-primary/40 bg-primary/10 p-3 text-xs text-foreground">
          {btMessage}
        </div>
      )}




      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Mes appareils</h2>
        {devicesQ.isLoading ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : (devicesQ.data ?? []).length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            <Radio className="mx-auto mb-2 h-6 w-6 opacity-50" />
            Aucun capteur enregistré.
          </div>
        ) : (
          <div className="space-y-3">
            {(devicesQ.data ?? []).map((d) => {
              const parcel = (parcelsQ.data ?? []).find((p) => p.id === d.parcel_id);
              const last = latestByDevice.get(d.id);
              const lastSeenMs = d.last_seen_at ? Date.now() - new Date(d.last_seen_at).getTime() : null;
              const online = lastSeenMs != null && lastSeenMs < (d.sample_interval_seconds * 1000) * 2;
              return (
                <div key={d.id} className="space-y-3 rounded-2xl border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">{d.name}</span>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                            online ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
                          }`}
                        >
                          {online ? <Wifi className="h-2.5 w-2.5" /> : <WifiOff className="h-2.5 w-2.5" />}
                          {online ? "En ligne" : "Hors ligne"}
                        </span>
                        <ConnectivityBadge mode={d.connectivity_mode} />
                      </div>

                      <div className="text-xs text-muted-foreground">
                        {parcel ? `Parcelle: ${parcel.name}` : "Aucune parcelle liée"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {d.last_seen_at
                          ? `Dernière mesure ${formatAgo(lastSeenMs!)}`
                          : "Jamais reçu de données"}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm(`Supprimer "${d.name}" ?`)) deleteDevice.mutate(d.id);
                      }}
                      className="rounded-full p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      aria-label="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-2 text-xs">
                    <Timer className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Échantillonnage :</span>
                    <select
                      value={d.sample_interval_seconds}
                      onChange={(e) => updateInterval.mutate({ id: d.id, seconds: Number(e.target.value) })}
                      className="flex-1 rounded-md border border-border bg-background px-2 py-1 text-xs"
                    >
                      <option value={60}>1 min</option>
                      <option value={300}>5 min</option>
                      <option value={900}>15 min</option>
                      <option value={1800}>30 min</option>
                      <option value={3600}>1 heure</option>
                      <option value={21600}>6 heures</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-2 font-mono text-[11px]">
                    <span className="text-muted-foreground">Clé:</span>
                    <code className="flex-1 truncate">{d.device_key}</code>
                    <button
                      type="button"
                      onClick={() => copy(d.device_key, d.id)}
                      className="rounded p-1 hover:bg-background"
                      aria-label="Copier la clé"
                    >
                      {copiedId === d.id ? (
                        <Check className="h-3.5 w-3.5 text-primary" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>

                  {d.connectivity_mode === "gsm" && d.sim_iccid && (
                    <div className="rounded-lg bg-muted/40 p-2 text-[11px] text-muted-foreground">
                      SIM : <code className="font-mono">{d.sim_iccid}</code>
                    </div>
                  )}

                  {d.connectivity_mode === "bluetooth" && (
                    <button
                      type="button"
                      onClick={() => syncViaBluetooth(d)}
                      disabled={btSyncingId === d.id}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-primary/40 bg-primary/5 py-2 text-xs font-semibold text-primary hover:bg-primary/10 disabled:opacity-50"
                    >
                      <Bluetooth className="h-3.5 w-3.5" />
                      {btSyncingId === d.id ? "Synchronisation…" : "Synchroniser via Bluetooth"}
                    </button>
                  )}


                  {last ? (
                    <div className="grid grid-cols-4 gap-2">
                      <Metric icon={<Beaker className="h-3.5 w-3.5" />} label="pH" value={last.ph} />
                      <Metric icon={<Droplets className="h-3.5 w-3.5" />} label="Hum. air" value={last.humidity_pct} unit="%" />
                      <Metric icon={<Sprout className="h-3.5 w-3.5" />} label="Hum. sol" value={last.soil_moisture_pct} unit="%" />
                      <Metric icon={<Thermometer className="h-3.5 w-3.5" />} label="Temp." value={last.temperature_c} unit="°C" />
                      {last.conductivity != null && (
                        <Metric icon={<Radio className="h-3.5 w-3.5" />} label="Cond." value={last.conductivity} unit="mS" />
                      )}
                      {last.battery_pct != null && (
                        <Metric icon={<Battery className="h-3.5 w-3.5" />} label="Batt." value={last.battery_pct} unit="%" />
                      )}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-border p-3 text-center text-[11px] text-muted-foreground">
                      En attente de la première mesure du capteur…
                    </div>
                  )}

                  {/* Moisture chart (12 mois glissants) */}
                  {(historyByDevice.get(d.id)?.length ?? 0) > 1 && (
                    <div className="rounded-lg bg-muted/30 p-2">
                      <div className="mb-1 flex items-center justify-between text-[10px] uppercase text-muted-foreground">
                        <span>Humidité sol · 12 derniers mois</span>
                        <span>Seuil {d.moisture_alert_threshold_pct}%</span>
                      </div>
                      <div className="h-24">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={historyByDevice.get(d.id) ?? []}>
                            <XAxis dataKey="label" tick={{ fontSize: 9 }} interval="preserveStartEnd" />
                            <YAxis tick={{ fontSize: 9 }} width={22} domain={[0, 100]} />
                            <Tooltip
                              contentStyle={{ fontSize: 11, padding: 4 }}
                              labelStyle={{ fontSize: 10 }}
                              formatter={(v: any) => [`${v}%`, "Humidité"]}
                            />
                            <Line type="monotone" dataKey="moisture" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {/* Seuil d'alerte humidité */}
                  <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-2 text-xs">
                    <CloudRain className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Alerte si humidité &lt;</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      defaultValue={d.moisture_alert_threshold_pct}
                      onBlur={(e) => {
                        const v = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                        if (v !== d.moisture_alert_threshold_pct) updateThreshold.mutate({ id: d.id, pct: v });
                      }}
                      className="w-14 rounded-md border border-border bg-background px-2 py-1 text-xs"
                    />
                    <span className="text-muted-foreground">%</span>
                  </div>

                  {/* Irrigation manuelle */}
                  <div className="flex flex-wrap items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 p-2 text-xs">
                    <Droplets className="h-3.5 w-3.5 text-primary" />
                    <span className="font-semibold text-primary">Irrigation</span>
                    {[60, 300, 900].map((sec) => (
                      <button
                        key={sec}
                        onClick={() => sendIrrigation.mutate({ deviceId: d.id, seconds: sec })}
                        disabled={sendIrrigation.isPending}
                        className="rounded-full bg-primary px-2.5 py-1 text-[10px] font-semibold text-primary-foreground disabled:opacity-50"
                      >
                        {sec < 60 ? `${sec}s` : `${sec / 60} min`}
                      </button>
                    ))}
                    {pendingByDevice.get(d.id) ? (
                      <span className="ml-auto rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                        {pendingByDevice.get(d.id)} en attente
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Historique récent</h2>
        {(readingsQ.data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune mesure enregistrée.</p>
        ) : (
          <div className="space-y-1.5">
            {(readingsQ.data ?? []).slice(0, 20).map((r) => {
              const dev = (devicesQ.data ?? []).find((d) => d.id === r.device_id);
              return (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2 text-xs"
                >
                  <div>
                    <div className="font-semibold">{dev?.name ?? "Appareil"}</div>
                    <div className="text-muted-foreground">
                      {new Date(r.recorded_at).toLocaleString("fr-FR")}
                    </div>
                  </div>
                  <div className="flex flex-wrap justify-end gap-x-3 gap-y-0.5 text-right">
                    {r.ph != null && <span>pH {r.ph}</span>}
                    {r.humidity_pct != null && <span>💧 {r.humidity_pct}%</span>}
                    {r.soil_moisture_pct != null && <span>🌱 {r.soil_moisture_pct}%</span>}
                    {r.temperature_c != null && <span>🌡 {r.temperature_c}°C</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function formatAgo(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  if (s < 60) return `il y a ${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.floor(h / 24);
  return `il y a ${d} j`;
}

function Metric({
  icon,
  label,
  value,
  unit,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | null;
  unit?: string;
}) {
  return (
    <div className="rounded-lg bg-muted/50 p-2">
      <div className="flex items-center gap-1 text-[10px] uppercase text-muted-foreground">
        {icon} {label}
      </div>
      <div className="text-sm font-bold">
        {value != null ? `${value}${unit ?? ""}` : "—"}
      </div>
    </div>
  );
}

function ConnectivityBadge({ mode }: { mode: ConnectivityMode }) {
  const map: Record<ConnectivityMode, { label: string; icon: React.ReactNode; cls: string }> = {
    gsm: { label: "GSM", icon: <Signal className="h-2.5 w-2.5" />, cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
    lora: { label: "LoRa", icon: <Satellite className="h-2.5 w-2.5" />, cls: "bg-violet-500/10 text-violet-600 dark:text-violet-400" },
    bluetooth: { label: "Bluetooth", icon: <Bluetooth className="h-2.5 w-2.5" />, cls: "bg-sky-500/10 text-sky-600 dark:text-sky-400" },
    wifi: { label: "Wi-Fi", icon: <Wifi className="h-2.5 w-2.5" />, cls: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  };
  const cfg = map[mode] ?? map.gsm;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${cfg.cls}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

