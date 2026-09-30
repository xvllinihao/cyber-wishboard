-- Images on wishes and comments, stored in Supabase Storage ---------------
alter table public.wishes
  add column image_paths text[] not null default '{}'
    check (cardinality(image_paths) <= 4);
alter table public.comments add column image_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('images', 'images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do nothing;

-- Users upload into a folder named after their own id: <uid>/<file>.
create policy "users upload own images" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "users delete own images" on storage.objects
  for delete to authenticated
  using (bucket_id = 'images' and (storage.foldername(name))[1] = auth.uid()::text);

-- Reports: 3 reports hide a wish or comment from everyone but its author ---
alter table public.wishes add column report_count integer not null default 0;
alter table public.comments add column report_count integer not null default 0;

drop policy "wishes are public" on public.wishes;
create policy "wishes are public unless reported" on public.wishes
  for select using (report_count < 3 or author_id = auth.uid());

drop policy "comments are public" on public.comments;
create policy "comments are public unless reported" on public.comments
  for select using (report_count < 3 or author_id = auth.uid());

revoke update on public.comments from anon, authenticated;

create table public.wish_reports (
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  wish_id uuid not null references public.wishes (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, wish_id)
);

create table public.comment_reports (
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  comment_id uuid not null references public.comments (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, comment_id)
);

alter table public.wish_reports enable row level security;
alter table public.comment_reports enable row level security;

create policy "users see own wish reports" on public.wish_reports
  for select to authenticated using (auth.uid() = user_id);
create policy "users report wishes as themselves" on public.wish_reports
  for insert to authenticated with check (auth.uid() = user_id);
create policy "users see own comment reports" on public.comment_reports
  for select to authenticated using (auth.uid() = user_id);
create policy "users report comments as themselves" on public.comment_reports
  for insert to authenticated with check (auth.uid() = user_id);

create function public.bump_wish_report_count()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  update public.wishes set report_count = report_count + 1 where id = new.wish_id;
  return null;
end;
$$;

create trigger wish_reports_count
  after insert on public.wish_reports
  for each row execute function public.bump_wish_report_count();

create function public.bump_comment_report_count()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  update public.comments set report_count = report_count + 1 where id = new.comment_id;
  return null;
end;
$$;

create trigger comment_reports_count
  after insert on public.comment_reports
  for each row execute function public.bump_comment_report_count();

revoke execute on function public.bump_wish_report_count() from public, anon, authenticated;
revoke execute on function public.bump_comment_report_count() from public, anon, authenticated;
