# 🧪 Tester les Capteurs - Guide Rapide

## Problème actuel

L'API HTTP `/api/public/sensors/ingest` n'est pas encore accessible directement car TanStack Start v8 nécessite une configuration spécifique pour les endpoints REST.

## Solutions de test (choisissez-en une)

### Option 1 : **Test via injection directe Supabase** ✅ RECOMMANDÉ

C'est la méthode la plus simple pour tester immédiatement sans configurer l'API HTTP.

**Prérequis :**
1. Avoir créé un capteur dans le dashboard (http://localhost:8081/sensors)
2. Copier la `device_key` affichée
3. Avoir accès à vos identifiants Supabase

**Étapes :**

1. **Récupérez vos credentials Supabase :**
   - Allez sur https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api
   - Copiez :
     - Project URL: `https://xxxxx.supabase.co`
     - Service Role Key: `eyJhbG...` (clé secrète, ne pas partager)

2. **Configurez les variables d'environnement :**
   ```bash
   # PowerShell (Windows)
   $env:SUPABASE_URL="https://votre-projet.supabase.co"
   $env:SUPABASE_SERVICE_ROLE_KEY="eyJhbG..."
   
   # Ou créez un fichier .env
   SUPABASE_URL=https://votre-projet.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
   ```

3. **Lancez le script de test :**
   ```bash
   cd C:\Users\Kouassi\Desktop\AgroSphere2
   node scripts/test-direct-supabase.mjs
   ```

4. **Vérifiez le résultat :**
   - Ouvrez http://localhost:8081/sensors
   - Vous devriez voir les mesures apparaître dans "Historique récent"

---

### Option 2 : **Attendre la configuration API complète**

Pour exposer une vraie API HTTP (nécessaire pour les vrais capteurs ESP32), il faut :

1. Soit utiliser Nitro server routes (dans `server/api/`)
2. Soit configurer TanStack Start server functions correctement
3. Soit déployer un Cloudflare Worker séparé

Cette configuration sera faite quand nous déploierons en production.

---

### Option 3 : **Utiliser Postman/Insomnia manuellement**

Si vous voulez tester l'endpoint manuellement :

1. Démarrez le serveur : `npm run dev`
2. Dans Postman, créez une requête POST :
   ```
   URL: http://localhost:8081/api/public/sensors/ingest
   Headers: Content-Type: application/json
   Body:
   {
     "device_key": "a49da42f637d32a72ee12f096ea8db4db0a398d61ca8b60c",
     "readings": [{
       "soil_moisture_pct": 45.5,
       "temperature_c": 28.3,
       "humidity_pct": 72,
       "ph": 6.5,
       "battery_pct": 95,
       "recorded_at": "2026-07-23T12:00:00Z"
     }]
   }
   ```

Mais actuellement, cette route n'est pas exposée en HTTP direct avec TanStack Start v8.

---

## 📊 Structure attendue des données

### Tables utilisées :

**sensor_devices** (déjà créée)
```sql
- id: UUID
- user_id: UUID
- device_key: TEXT (unique, 64 chars hex)
- name: TEXT
- connectivity_mode: 'gsm' | 'lora' | 'bluetooth' | 'wifi'
- last_seen_at: TIMESTAMPTZ
- ...
```

**sensor_readings** (déjà créée)
```sql
- id: UUID
- device_id: UUID (FK vers sensor_devices)
- soil_moisture_pct: NUMERIC
- temperature_c: NUMERIC
- humidity_pct: NUMERIC
- ph: NUMERIC
- battery_pct: NUMERIC
- recorded_at: TIMESTAMPTZ
- source: TEXT
```

---

## 🚀 Prochaines étapes

1. **Testez avec l'Option 1** (injection directe Supabase)
2. **Vérifiez que les données apparaissent** dans le dashboard
3. **Pour les vrais capteurs**, nous configurerons l'API HTTP lors du déploiement

---

## 📞 Besoin d'aide ?

Si vous rencontrez des erreurs :
1. Vérifiez que le device existe dans `sensor_devices`
2. Vérifiez que votre service role key est correct
3. Consultez les logs Supabase : Dashboard → Logs
