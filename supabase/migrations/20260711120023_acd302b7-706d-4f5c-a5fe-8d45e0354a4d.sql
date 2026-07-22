
ALTER FUNCTION public.block_ledger_mutation() SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.compute_expense_hash() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.compute_sale_hash() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.block_ledger_mutation() FROM PUBLIC, anon, authenticated;
