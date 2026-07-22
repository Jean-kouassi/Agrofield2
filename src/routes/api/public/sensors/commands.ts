import { createFileRoute } from "@tanstack/react-router";

// GET /api/public/sensors/commands?device_key=… → renvoie les commandes en attente
// POST /api/public/sensors/commands (body: { device_key, command_id, status }) → ack
export const Route = createFileRoute("/api/public/sensors/commands")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const deviceKey = (url.searchParams.get("device_key") ?? "").trim();
        if (!deviceKey) return json({ error: "device_key required" }, 400);

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: device } = await supabaseAdmin
          .from("sensor_devices")
          .select("id")
          .eq("device_key", deviceKey)
          .maybeSingle();

        if (!device) return json({ error: "Unknown device" }, 401);

        const { data: commands, error } = await supabaseAdmin
          .from("irrigation_commands")
          .select("id, action, duration_seconds, created_at")
          .eq("device_id", device.id)
          .eq("status", "pending")
          .order("created_at", { ascending: true })
          .limit(10);

        if (error) return json({ error: error.message }, 500);

        // Mark as ack so hardware knows to execute (idempotent)
        if (commands && commands.length > 0) {
          await supabaseAdmin
            .from("irrigation_commands")
            .update({ status: "ack", acked_at: new Date().toISOString() })
            .in("id", commands.map((c) => c.id));
        }

        return json({ commands: commands ?? [] });
      },
      POST: async ({ request }) => {
        let body: any;
        try {
          body = await request.json();
        } catch {
          return json({ error: "Invalid JSON" }, 400);
        }

        const deviceKey = typeof body?.device_key === "string" ? body.device_key.trim() : "";
        const commandId = typeof body?.command_id === "string" ? body.command_id : "";
        const status = body?.status === "done" || body?.status === "failed" ? body.status : null;

        if (!deviceKey || !commandId || !status) {
          return json({ error: "device_key, command_id, status required" }, 400);
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: device } = await supabaseAdmin
          .from("sensor_devices")
          .select("id")
          .eq("device_key", deviceKey)
          .maybeSingle();
        if (!device) return json({ error: "Unknown device" }, 401);

        const { error } = await supabaseAdmin
          .from("irrigation_commands")
          .update({ status, completed_at: new Date().toISOString() })
          .eq("id", commandId)
          .eq("device_id", device.id);

        if (error) return json({ error: error.message }, 500);
        return json({ ok: true });
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
