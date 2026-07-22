-- Revoke public EXECUTE on SECURITY DEFINER functions that should not be callable
-- directly via the Data API. Trigger and cron functions never need EXECUTE by
-- anon/authenticated. has_role keeps EXECUTE for authenticated because it is
-- invoked from RLS policies.

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.grant_super_admin_if_target() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.block_ledger_mutation() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sensor_low_moisture_check() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.compute_sale_hash() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.compute_expense_hash() FROM PUBLIC, anon, authenticated;

-- has_role: allow authenticated (needed by RLS policies), block anon.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
