-- Migration: Fix Marketplace Issues
-- Date: 2026-08-13 11:00
-- Description: Corriger modification des offres et statistiques

-- ============================================
-- PARTIE 1: Fonction pour récupérer les statistiques complètes
-- ============================================

CREATE OR REPLACE FUNCTION get_seller_stats(p_seller_id UUID)
RETURNS TABLE (
  total_offers BIGINT,
  active_offers BIGINT,
  sold_offers BIGINT,
  total_revenue BIGINT,
  total_views BIGINT,
  total_contacts BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) FILTER (WHERE TRUE) as total_offers,
    COUNT(*) FILTER (WHERE status = 'available') as active_offers,
    COUNT(*) FILTER (WHERE status = 'sold') as sold_offers,
    COALESCE(SUM(price * quantity) FILTER (WHERE status = 'sold'), 0)::BIGINT as total_revenue,
    COALESCE(SUM(views), 0)::BIGINT as total_views,
    COALESCE(SUM(contacts), 0)::BIGINT as total_contacts
  FROM marketplace_listings
  WHERE seller_id = p_seller_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PARTIE 2: Trigger pour mettre à jour automatiquement les statistiques
-- ============================================

-- Table pour stocker les statistiques agrégées (optionnel, pour performance)
CREATE TABLE IF NOT EXISTS seller_statistics (
  seller_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_offers BIGINT DEFAULT 0,
  active_offers BIGINT DEFAULT 0,
  sold_offers BIGINT DEFAULT 0,
  total_revenue BIGINT DEFAULT 0,
  total_views BIGINT DEFAULT 0,
  total_contacts BIGINT DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT now()
);

-- Fonction pour mettre à jour les statistiques
CREATE OR REPLACE FUNCTION update_seller_statistics()
RETURNS TRIGGER AS $$
DECLARE
  v_seller_id UUID;
BEGIN
  -- Déterminer le seller_id concerné
  IF TG_OP = 'DELETE' THEN
    v_seller_id := OLD.seller_id;
  ELSE
    v_seller_id := NEW.seller_id;
  END IF;
  
  -- Mettre à jour les statistiques
  INSERT INTO seller_statistics (seller_id, total_offers, active_offers, sold_offers, total_revenue, total_views, total_contacts, last_updated)
  SELECT 
    seller_id,
    COUNT(*) FILTER (WHERE TRUE),
    COUNT(*) FILTER (WHERE status = 'available'),
    COUNT(*) FILTER (WHERE status = 'sold'),
    COALESCE(SUM(price * quantity) FILTER (WHERE status = 'sold'), 0)::BIGINT,
    COALESCE(SUM(views), 0)::BIGINT,
    COALESCE(SUM(contacts), 0)::BIGINT,
    now()
  FROM marketplace_listings
  WHERE seller_id = v_seller_id
  GROUP BY seller_id
  ON CONFLICT (seller_id) DO UPDATE SET
    total_offers = EXCLUDED.total_offers,
    active_offers = EXCLUDED.active_offers,
    sold_offers = EXCLUDED.sold_offers,
    total_revenue = EXCLUDED.total_revenue,
    total_views = EXCLUDED.total_views,
    total_contacts = EXCLUDED.total_contacts,
    last_updated = EXCLUDED.last_updated;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Attacher le trigger aux marketplace_listings
DROP TRIGGER IF EXISTS trg_update_seller_statistics ON marketplace_listings;
CREATE TRIGGER trg_update_seller_statistics
  AFTER INSERT OR UPDATE OR DELETE ON marketplace_listings
  FOR EACH ROW
  EXECUTE FUNCTION update_seller_statistics();

-- ============================================
-- PARTIE 3: Vue pour les statistiques détaillées par offre
-- ============================================

CREATE OR REPLACE VIEW marketplace_listing_stats AS
SELECT 
  ml.id,
  ml.title,
  ml.seller_id,
  ml.status,
  ml.price,
  ml.quantity,
  ml.views,
  ml.contacts,
  ml.created_at,
  ml.updated_at,
  -- Calcul du revenu potentiel/actuel
  CASE 
    WHEN ml.status = 'sold' THEN ml.price * ml.quantity
    ELSE 0
  END as actual_revenue,
  CASE 
    WHEN ml.status = 'sold' THEN ml.price * ml.quantity
    ELSE ml.price * ml.quantity
  END as potential_revenue
FROM marketplace_listings ml;

-- ============================================
-- PARTIE 4: Policies RLS pour seller_statistics
-- ============================================

ALTER TABLE seller_statistics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own statistics" ON seller_statistics;
CREATE POLICY "Users can view their own statistics"
  ON seller_statistics FOR SELECT
  TO authenticated
  USING (seller_id = auth.uid());

COMMENT ON TABLE seller_statistics IS 'Statistiques agrégées pour les vendeurs marketplace';
COMMENT ON FUNCTION get_seller_stats(UUID) IS 'Récupère les statistiques complètes d''un vendeur';
