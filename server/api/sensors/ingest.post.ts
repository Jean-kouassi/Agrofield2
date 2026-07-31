import { defineEventHandler, readBody, createError } from "h3";

export default defineEventHandler(async (event) => {
  // Lire le body JSON
  let body: any;
  try {
    body = await readBody(event);
  } catch {
    throw createError({
      statusCode: 400,
      message: "Invalid JSON",
    });
  }

  const deviceKey = typeof body?.device_key === "string" ? body.device_key.trim() : "";
  if (!deviceKey) {
    throw createError({
      statusCode: 400,
      message: "device_key required",
    });
  }

  // Import Supabase admin
  const { createClient } = await import("@supabase/supabase-js");
  
  const supabaseUrl = process.env.SUPABASE_URL || "";
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  
  if (!supabaseUrl || !supabaseKey) {
    console.error("[sensors/ingest] Missing Supabase credentials");
    throw createError({
      statusCode: 500,
      message: "Server configuration error",
    });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

  // Vérifier le device
  const { data: device, error: devErr } = await supabaseAdmin
    .from("sensor_devices")
    .select("id, user_id, parcel_id")
    .eq("device_key", deviceKey)
    .maybeSingle();

  if (devErr || !device) {
    console.warn("[sensors/ingest] Unknown device:", deviceKey);
    throw createError({
      statusCode: 401,
      message: "Unknown device",
    });
  }

  // Helper pour convertir les valeurs
  const num = (v: unknown) =>
    v == null || v === "" || Number.isNaN(Number(v)) ? null : Number(v);

  // Support batch ou lecture unique
  const items: any[] = Array.isArray(body.readings) ? body.readings : [body];
  const topSource = typeof body.source === "string" ? body.source : null;
  const allowedSources = new Set(["auto", "bluetooth_sync", "manual", "test"]);

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

  // Insertion dans sensor_readings
  const { error: insErr } = await supabaseAdmin.from("sensor_readings").insert(rows);
  
  if (insErr) {
    console.error("[sensors/ingest] insert failed", insErr);
    throw createError({
      statusCode: 500,
      message: "Insert failed",
    });
  }

  // Mettre à jour last_seen_at et firmware info
  const patch: any = { last_seen_at: new Date().toISOString() };
  if (typeof body.firmware_version === "string") {
    patch.firmware_version = body.firmware_version;
  }
  if (typeof body.hardware_model === "string") {
    patch.hardware_model = body.hardware_model;
  }
  
  await supabaseAdmin.from("sensor_devices").update(patch).eq("id", device.id);

  console.log(`[sensors/ingest] ✅ ${rows.length} reading(s) from device ${deviceKey.slice(0, 8)}...`);

  return {
    ok: true,
    inserted: rows.length,
  };
});
