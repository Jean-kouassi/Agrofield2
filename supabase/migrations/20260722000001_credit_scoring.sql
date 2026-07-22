-- Migration: Credit Scoring System
-- Date: 2026-07-22
-- Description: Tables pour credit_scores et loan_applications

-- ============================================
-- Table: credit_scores
-- ============================================
CREATE TABLE IF NOT EXISTS public.credit_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 1000),
  score_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  factors JSONB,
  recommendation TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_credit_scores_user ON credit_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_scores_date ON credit_scores(score_date DESC);
CREATE INDEX IF NOT EXISTS idx_credit_scores_score ON credit_scores(score DESC);

-- RLS
ALTER TABLE public.credit_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credit score" 
ON credit_scores FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "System can insert credit scores" 
ON credit_scores FOR INSERT 
TO authenticated 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own credit score" 
ON credit_scores FOR UPDATE 
TO authenticated 
USING (user_id = auth.uid());


-- ============================================
-- Table: loan_applications
-- ============================================
CREATE TABLE IF NOT EXISTS public.loan_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_xof INTEGER NOT NULL CHECK (amount_xof > 0),
  purpose TEXT NOT NULL,
  duration_months INTEGER NOT NULL CHECK (duration_months > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  credit_score_at_application INTEGER,
  lender_id UUID,
  decision_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_loan_applications_user ON loan_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_loan_applications_status ON loan_applications(status);
CREATE INDEX IF NOT EXISTS idx_loan_applications_created ON loan_applications(created_at DESC);

-- RLS
ALTER TABLE public.loan_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own applications" 
ON loan_applications FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "Users can create own applications" 
ON loan_applications FOR INSERT 
TO authenticated 
WITH CHECK (user_id = auth.uid());

-- Les lenders peuvent voir les demandes qui leur sont adressées
CREATE POLICY "Lenders can view assigned applications" 
ON loan_applications FOR SELECT 
TO authenticated 
USING (lender_id = auth.uid());

CREATE POLICY "Lenders can update assigned applications" 
ON loan_applications FOR UPDATE 
TO authenticated 
USING (lender_id = auth.uid());


-- ============================================
-- Trigger: updated_at pour credit_scores
-- ============================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN 
  NEW.updated_at = NOW(); 
  RETURN NEW; 
END;
$$;

DROP TRIGGER IF EXISTS credit_scores_updated ON public.credit_scores;
CREATE TRIGGER credit_scores_updated 
  BEFORE UPDATE ON public.credit_scores 
  FOR EACH ROW 
  EXECUTE FUNCTION public.set_updated_at();


-- ============================================
-- Trigger: updated_at pour loan_applications
-- ============================================
DROP TRIGGER IF EXISTS loan_applications_updated ON public.loan_applications;
CREATE TRIGGER loan_applications_updated 
  BEFORE UPDATE ON loan_applications 
  FOR EACH ROW 
  EXECUTE FUNCTION public.set_updated_at();


-- ============================================
-- Données de test (optionnel)
-- ============================================
-- À exécuter manuellement si besoin pour tester
/*
INSERT INTO public.credit_scores (user_id, score, score_date, factors, recommendation, expires_at)
SELECT 
  id as user_id,
  750 as score,
  NOW() as score_date,
  '{"transactionHistory": 80, "repaymentHistory": 85, "incomeStability": 70, "debtRatio": 75, "accountAge": 60}'::jsonb as factors,
  'Très bon profil. Continuez ainsi pour améliorer encore votre score.' as recommendation,
  NOW() + INTERVAL '90 days' as expires_at
FROM auth.users
LIMIT 1;
*/
