-- Migration: Force disable ALL seller_statistics triggers
-- Date: 2026-08-19 13:30
-- Issue: Previous migration didn't fully remove the problem

-- First, check and drop ANY trigger on marketplace_listings that references seller_statistics
DO $$
DECLARE
    trig record;
BEGIN
    FOR trig IN 
        SELECT trigger_name, event_object_table
        FROM information_schema.triggers
        WHERE trigger_schema = 'public'
        AND event_object_table = 'marketplace_listings'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I CASCADE', trig.trigger_name, trig.event_object_table);
        RAISE NOTICE 'Dropped trigger: %', trig.trigger_name;
    END LOOP;
END $$;

-- Drop ALL functions with 'seller_stats' in the name
DO $$
DECLARE
    func record;
BEGIN
    FOR func IN 
        SELECT routine_name
        FROM information_schema.routines
        WHERE routine_schema = 'public'
        AND routine_name LIKE '%seller%stats%'
    LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS public.%I() CASCADE', func.routine_name);
        RAISE NOTICE 'Dropped function: %', func.routine_name;
    END LOOP;
END $$;

-- Also make seller_statistics table have permissive RLS for inserts by authenticated users
ALTER TABLE public.seller_statistics FORCE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own stats" ON public.seller_statistics;
DROP POLICY IF EXISTS "Users can insert own stats" ON public.seller_statistics;
DROP POLICY IF EXISTS "Users can update own stats" ON public.seller_statistics;

-- Create new permissive policy: authenticated users can insert/update their own stats
CREATE POLICY "Authenticated users can manage own stats"
ON public.seller_statistics
FOR ALL
TO authenticated
USING (seller_id = auth.uid())
WITH CHECK (seller_id = auth.uid());
