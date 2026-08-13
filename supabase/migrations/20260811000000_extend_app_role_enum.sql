-- ============================================================
-- Migration: Étendre l'enum app_role (SÉPARÉ pour commit indépendant)
-- Date: 2026-08-11
-- Risk: 🟡 MEDIUM
-- Description: Ajoute les nouvelles valeurs à l'enum app_role
--              Doit être appliqué AVANT la migration roles_and_rls
-- ============================================================

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'producer';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'wholesaler';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'retailer';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'cooperative_manager';