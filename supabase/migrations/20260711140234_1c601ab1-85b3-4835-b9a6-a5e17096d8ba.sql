
REVOKE EXECUTE ON FUNCTION public.grant_super_admin_if_target() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sensor_low_moisture_check() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.compute_expense_hash() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.compute_sale_hash() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
