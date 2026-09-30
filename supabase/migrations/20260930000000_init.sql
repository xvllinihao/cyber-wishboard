-- 愿望实现机 / Wish Machine: initial schema

-- Profiles ---------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique check (char_length(username) between 2 and 32),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles are public" on public.profiles
  for select using (true);
create policy "users update own profile" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Create a profile automatically when a user signs up.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  base text := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'username'), ''),
    split_part(new.email, '@', 1)
  );
  candidate text := left(base, 32);
begin
  if char_length(candidate) < 2 then
    candidate := 'user_' || left(new.id::text, 8);
  end if;
  if exists (select 1 from public.profiles where username = candidate) then
    candidate := left(base, 23) || '_' || left(new.id::text, 8);
  end if;
  insert into public.profiles (id, username) values (new.id, candidate);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Wishes -----------------------------------------------------------------
create table public.wishes (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  content text not null check (char_length(content) between 1 and 5000),
  like_count integer not null default 0,
  comment_count integer not null default 0,
  score integer generated always as (like_count + comment_count) stored,
  created_at timestamptz not null default now()
);

create index wishes_score_idx on public.wishes (score desc, created_at desc);
create index wishes_created_idx on public.wishes (created_at desc);
create index wishes_author_idx on public.wishes (author_id, created_at desc);

alter table public.wishes enable row level security;

create policy "wishes are public" on public.wishes
  for select using (true);
create policy "users create own wishes" on public.wishes
  for insert to authenticated with check (auth.uid() = author_id);
create policy "users delete own wishes" on public.wishes
  for delete to authenticated using (auth.uid() = author_id);

-- Counters are maintained by triggers; clients may only edit text fields.
revoke update on public.wishes from anon, authenticated;
grant update (title, content) on public.wishes to authenticated;
create policy "users update own wishes" on public.wishes
  for update to authenticated using (auth.uid() = author_id) with check (auth.uid() = author_id);

-- Likes ------------------------------------------------------------------
create table public.likes (
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  wish_id uuid not null references public.wishes (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, wish_id)
);

create index likes_wish_idx on public.likes (wish_id);
create index likes_user_idx on public.likes (user_id, created_at desc);

alter table public.likes enable row level security;

create policy "likes are public" on public.likes
  for select using (true);
create policy "users like as themselves" on public.likes
  for insert to authenticated with check (auth.uid() = user_id);
create policy "users unlike as themselves" on public.likes
  for delete to authenticated using (auth.uid() = user_id);

-- Comments ---------------------------------------------------------------
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  wish_id uuid not null references public.wishes (id) on delete cascade,
  author_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  link text check (link is null or link ~* '^https?://'),
  created_at timestamptz not null default now()
);

create index comments_wish_idx on public.comments (wish_id, created_at);
create index comments_author_idx on public.comments (author_id, created_at desc);

alter table public.comments enable row level security;

create policy "comments are public" on public.comments
  for select using (true);
create policy "users comment as themselves" on public.comments
  for insert to authenticated with check (auth.uid() = author_id);
create policy "users delete own comments" on public.comments
  for delete to authenticated using (auth.uid() = author_id);

-- Counter triggers -------------------------------------------------------
create function public.bump_like_count()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.wishes set like_count = like_count + 1 where id = new.wish_id;
  else
    update public.wishes set like_count = greatest(like_count - 1, 0) where id = old.wish_id;
  end if;
  return null;
end;
$$;

create trigger likes_count
  after insert or delete on public.likes
  for each row execute function public.bump_like_count();

create function public.bump_comment_count()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.wishes set comment_count = comment_count + 1 where id = new.wish_id;
  else
    update public.wishes set comment_count = greatest(comment_count - 1, 0) where id = old.wish_id;
  end if;
  return null;
end;
$$;

create trigger comments_count
  after insert or delete on public.comments
  for each row execute function public.bump_comment_count();
