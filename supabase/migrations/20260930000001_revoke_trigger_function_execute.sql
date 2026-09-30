-- Trigger functions are never meant to be called over the REST API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.bump_like_count() from public, anon, authenticated;
revoke execute on function public.bump_comment_count() from public, anon, authenticated;
