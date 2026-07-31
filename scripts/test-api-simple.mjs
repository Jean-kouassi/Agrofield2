#!/usr/bin/env node

// Test simple de l'API sensors/ingest

const DEVICE_KEY = "a49da42f637d32a72ee12f096ea8db4db0a398d61ca8b60c";
const API_URL = "http://localhost:8081/api/public/sensors/ingest";

console.log("🧪 Test API AgroField");
console.log("=====================");
console.log("URL:", API_URL);
console.log("Device Key:", DEVICE_KEY.slice(0, 16) + "...");
console.log();

const payload = {
  device_key: DEVICE_KEY,
  source: "test",
  firmware_version: "test-1.0",
  readings: [
    {
      recorded_at: new Date().toISOString(),
      soil_moisture_pct: 45.5,
      temperature_c: 28.3,
      humidity_pct: 72,
      ph: 6.5,
      battery_pct: 95
    }
  ]
};

async function test() {
  try {
    console.log("Envoi des données...");
    console.log("Payload:", JSON.stringify(payload, null, 2));
    console.log();
    
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    
    const text = await response.text();
    console.log("Status HTTP:", response.status, response.statusText);
    console.log("Response:", text);
    
    if (response.ok) {
      console.log("\n✅ SUCCÈS ! Les données ont été envoyées.");
      console.log("Vérifiez dans le dashboard : http://localhost:8081/sensors");
    } else {
      console.log("\n❌ ÉCHEC - Code:", response.status);
      try {
        const json = JSON.parse(text);
        console.log("Erreur:", json.error);
      } catch {
        console.log("Réponse non-JSON:", text.substring(0, 200));
      }
    }
  } catch (err) {
    console.error("\n💥 ERREUR RÉSEAU:", err.message);
    console.error("\nVérifiez que:");
    console.error("1. Le serveur tourne (npm run dev)");
    console.error("2. L'URL est correcte (http://localhost:8081)");
    console.error("3. Le device_key existe dans Supabase");
  }
}

test();
