# Correction Messages & Commandes

**Date:** 2026-08-13 10:05  
**Statut:** ✅ Tables créées

## Problèmes Identifiés

### 1. ❌ Erreur lors de l'envoi de message
**Erreur:** `relation "public.conversations" does not exist`

**Cause:** Les tables `conversations` et `messages` n'existaient pas dans la base de données, même si la migration était marquée comme appliquée.

**Solution:** Migration `20260813100001_recreate_messages_tables.sql` créée et déployée.

### 2. ❌ Les commandes n'apparaissent pas dans la section "Mes commandes"
**Cause possible:** 
- Table `orders` mal configurée
- Colonnes manquantes (`buyer_id`, `seller_id`)
- Problème de RLS (Row Level Security)

## Actions Effectuées

### ✅ Migration des tables de messages déployée

```bash
npx supabase db push
```

**Tables créées:**
- ✅ `public.conversations` - Conversations entre utilisateurs
- ✅ `public.messages` - Messages dans les conversations
- ✅ Index de performance
- ✅ Policies RLS configurées
- ✅ Fonction `get_or_create_conversation()`
- ✅ Trigger de notification (si table notifications existe)

### 📋 Structure des tables

#### Table: conversations
```sql
- id UUID (PK)
- participant_1_id UUID
- participant_2_id UUID
- listing_id UUID (référence marketplace_listings)
- last_message_at TIMESTAMPTZ
- created_at TIMESTAMPTZ
- updated_at TIMESTAMPTZ
```

#### Table: messages
```sql
- id UUID (PK)
- conversation_id UUID (FK → conversations)
- sender_id UUID
- content TEXT
- is_read BOOLEAN
- read_at TIMESTAMPTZ
- created_at TIMESTAMPTZ
- deleted_by_sender BOOLEAN
- deleted_by_receiver BOOLEAN
```

## Tests à Effectuer

### Test 1: Envoyer un message ✅ À TESTER
1. Ouvrir une offre marketplace
2. Cliquer sur "Contacter" le vendeur
3. Une conversation devrait se créer
4. Envoyer un message
5. Vérifier qu'aucune erreur n'apparaît

### Test 2: Voir les commandes ✅ À TESTER
1. Créer une commande depuis une offre
2. Aller dans "Mes commandes"
3. Vérifier que la commande apparaît

### Test 3: Commande à soi-même ✅ À TESTER
1. Publier une offre
2. Commander votre propre offre avec un autre compte (ou le même)
3. Vérifier que la commande apparaît dans les deux onglets (Acheteur/Vendeur)

## Diagnostic Avancé

Si les commandes n'apparaissent toujours pas, exécutez ces requêtes dans le dashboard Supabase :

```sql
-- 1. Vérifier la structure de la table orders
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders' 
ORDER BY ordinal_position;

-- 2. Vérifier s'il y a des données
SELECT COUNT(*) FROM orders;

-- 3. Voir les dernières commandes
SELECT * FROM orders ORDER BY created_at DESC LIMIT 5;

-- 4. Vérifier les policies RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'orders';
```

## Fichiers de Migration

### Nouvelles migrations créées
1. `20260813000001_create_notifications_table.sql` - Table de notifications
2. `20260813100001_recreate_messages_tables.sql` - Tables messages & conversations

### Migrations existantes à vérifier
- `20260730000001_create_marketplace_tables.sql` - Devrait contenir la table `orders`
- `202608082300_marketplace_rls.sql` - Policies RLS pour marketplace

## Prochaines Étapes

1. **Tester l'envoi de message** - Ne devrait plus y avoir d'erreur
2. **Vérifier la table orders** - Exécuter les requêtes de diagnostic
3. **Créer une commande test** - Vérifier qu'elle apparaît
4. **Ajouter des jointures** - Si besoin, améliorer l'affichage avec les noms des produits

## Notes Techniques

### RLS (Row Level Security)
Les policies sont configurées pour que :
- Seul le participant puisse voir la conversation
- Seul l'expéditeur puisse envoyer des messages
- L'acheteur et le vendeur puissent voir les commandes les concernant

### Notifications
Quand un message est envoyé :
1. Le message est inséré dans `messages`
2. Le trigger `trigger_notify_new_message` se déclenche
3. Une notification est créée pour le destinataire
4. La notification apparaît dans son fil

## Support

Si vous rencontrez toujours des erreurs :
1. Ouvrez la console navigateur (F12)
2. Copiez l'erreur complète
3. Vérifiez les logs Supabase dans le dashboard
