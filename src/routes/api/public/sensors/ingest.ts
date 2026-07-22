import { createFileRoute } from "@tanstack/react-router";

// Accepte soit une lecture unique {device_key, ph, ...},
// soit un batch {device_key, readings: [{recorded_at, ph, ...}, ...]}
export const Route = createFileRoute("/api/public/sensors/ingest")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: any;
        try {
          body = await request.json();
        } catch {
          return json({ error: "Invalid JSON" }, 400);
        }

        const deviceKey = typeof body?.device_key === "string" ? body.device_key.trim() : "";
        if (!deviceKey) return json({ error: "device_key required" }, 400);

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: device, error: devErr } = await supabaseAdmin
          .from("sensor_devices")
          .select("id, user_id, parcel_id")
          .eq("device_key", deviceKey)
          .maybeSingle();

        if (devErr || !device) return json({ error: "Unknown device" }, 401);

        const num = (v: unknown) =>
          v == null || v === "" || Number.isNaN(Number(v)) ? null : Number(v);

        const items: any[] = Array.isArray(body.readings) ? body.readings : [body];
        const topSource = typeof body.source === "string" ? body.source : null;
        const allowedSources = new Set(["auto", "bluetooth_sync", "manual"]);

        const rows = items.map((r) => {
          const rawSource = (typeof r.source === "string" ? r.source : topSource) ?? "auto";
          const source = allowedSources.has(rawSource) ? rawSource : "auto";
          return {
            user_id: device.user_id,
            device_id: device.id,
            parcel_id: device.parcel_id,
            ph: num(r.ph),
            humidity_pct: num(r.humidity_pct),
            soil_moisture_pct: num(r.soil_moisture_pct),
            soil_moisture_surface_pct: num(r.soil_moisture_surface_pct),
            soil_moisture_root_pct: num(r.soil_moisture_root_pct),
            temperature_c: num(r.temperature_c),
            soil_temperature_c: num(r.soil_temperature_c),
            conductivity: num(r.conductivity),
            light_lux: num(r.light_lux),
            battery_pct: num(r.battery_pct),
            rain_mm: num(r.rain_mm),
            weather_summary: typeof r.weather_summary === "string" ? r.weather_summary : null,
            recorded_at: typeof r.recorded_at === "string" ? r.recorded_at : new Date().toISOString(),
            source,
          };
        });


        const { error: insErr } = await supabaseAdmin.from("sensor_readings").insert(rows);
        if (insErr) {
          console.error("[sensors/ingest] insert failed", insErr);
          return json({ error: "Insert failed" }, 500);
        }

        // Update firmware info + last_seen
        const patch: any = { last_seen_at: new Date().toISOString() };
        if (typeof body.firmware_version === "string") patch.firmware_version = body.firmware_version;
        if (typeof body.hardware_model === "string") patch.hardware_model = body.hardware_model;
        await supabaseAdmin.from("sensor_devices").update(patch).eq("id", device.id);

        return json({ ok: true, inserted: rows.length });
      },
    },
  },
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
