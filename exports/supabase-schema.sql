create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null default '',
  display_name text not null default '',
  plan_key text not null default 'free' check (plan_key in ('free', 'starter', 'pro')),
  billing_status text not null default 'inactive' check (billing_status in ('inactive', 'pending_upgrade', 'active', 'past_due')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  slug text not null default '',
  owner_plan_key text not null default 'free' check (owner_plan_key in ('free', 'starter', 'pro')),
  card_name text not null,
  status text not null default 'draft' check (status in ('draft', 'published')),
  template_key text not null,
  theme_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.upgrade_intents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  current_plan text not null check (current_plan in ('free', 'starter', 'pro')),
  target_plan text not null check (target_plan in ('free', 'starter', 'pro')),
  status text not null default 'draft' check (status in ('draft', 'pending', 'ready', 'cancelled')),
  created_at timestamptz not null default now()
);

create table if not exists public.checkout_placeholders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  intent_id uuid not null references public.upgrade_intents(id) on delete cascade,
  current_plan text not null check (current_plan in ('free', 'starter', 'pro')),
  target_plan text not null check (target_plan in ('free', 'starter', 'pro')),
  status text not null default 'pending_intent'
    check (status in ('pending_intent', 'checkout_ready', 'pending_payment', 'upgrade_pending', 'completed', 'cancelled')),
  provider text not null default 'placeholder',
  checkout_url text,
  session_token text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.card_profile (
  card_id uuid primary key references public.cards(id) on delete cascade,
  display_name text not null,
  english_name text not null default '',
  job_title text not null default '',
  bio text not null default '',
  company_name text not null default '',
  address text not null default '',
  email text not null default '',
  phone text not null default '',
  line_url text not null default '',
  website_url text not null default ''
);

create table if not exists public.card_media (
  card_id uuid primary key references public.cards(id) on delete cascade,
  avatar_url text not null default '',
  logo_url text not null default '',
  cover_url text not null default ''
);

create table if not exists public.card_buttons (
  card_id uuid primary key references public.cards(id) on delete cascade,
  primary_button_label text not null default '',
  primary_button_url text not null default '',
  secondary_button_label text not null default '',
  secondary_button_url text not null default ''
);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name, plan_key)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(coalesce(new.email, ''), '@', 1), ''),
    'free'
  )
  on conflict (id) do update
  set email = excluded.email,
      display_name = coalesce(nullif(excluded.display_name, ''), public.profiles.display_name),
      updated_at = now();

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists trg_cards_updated_at on public.cards;
create trigger trg_cards_updated_at
before update on public.cards
for each row
execute function public.set_updated_at();

drop trigger if exists trg_checkout_placeholders_updated_at on public.checkout_placeholders;
create trigger trg_checkout_placeholders_updated_at
before update on public.checkout_placeholders
for each row
execute function public.set_updated_at();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

create index if not exists idx_cards_user_id on public.cards(user_id);
create index if not exists idx_cards_user_id_updated_at on public.cards(user_id, updated_at desc);
create index if not exists idx_cards_public_published on public.cards(status, updated_at desc);
create unique index if not exists idx_cards_slug_unique on public.cards(lower(slug)) where slug <> '';
create index if not exists idx_upgrade_intents_user_created_at on public.upgrade_intents(user_id, created_at desc);
create index if not exists idx_checkout_placeholders_user_updated_at on public.checkout_placeholders(user_id, updated_at desc);
create unique index if not exists idx_checkout_placeholders_intent_unique on public.checkout_placeholders(intent_id);

alter table public.profiles enable row level security;
alter table public.cards enable row level security;
alter table public.card_profile enable row level security;
alter table public.card_media enable row level security;
alter table public.card_buttons enable row level security;
alter table public.upgrade_intents enable row level security;
alter table public.checkout_placeholders enable row level security;

drop policy if exists "profiles select own" on public.profiles;
create policy "profiles select own"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "profiles insert own" on public.profiles;
create policy "profiles insert own"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "upgrade intents select own" on public.upgrade_intents;
create policy "upgrade intents select own"
on public.upgrade_intents
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "upgrade intents insert own" on public.upgrade_intents;
create policy "upgrade intents insert own"
on public.upgrade_intents
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "upgrade intents update own" on public.upgrade_intents;
create policy "upgrade intents update own"
on public.upgrade_intents
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "checkout placeholders select own" on public.checkout_placeholders;
create policy "checkout placeholders select own"
on public.checkout_placeholders
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "checkout placeholders insert own" on public.checkout_placeholders;
create policy "checkout placeholders insert own"
on public.checkout_placeholders
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "checkout placeholders update own" on public.checkout_placeholders;
create policy "checkout placeholders update own"
on public.checkout_placeholders
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "cards read own" on public.cards;
create policy "cards read own"
on public.cards
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "cards read published public" on public.cards;
create policy "cards read published public"
on public.cards
for select
to anon, authenticated
using (status = 'published');

drop policy if exists "cards insert own" on public.cards;
create policy "cards insert own"
on public.cards
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "cards update own" on public.cards;
create policy "cards update own"
on public.cards
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "cards delete own" on public.cards;
create policy "cards delete own"
on public.cards
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "card_profile select by card scope" on public.card_profile;
create policy "card_profile select by card scope"
on public.card_profile
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.cards
    where public.cards.id = public.card_profile.card_id
      and (public.cards.user_id = auth.uid() or public.cards.status = 'published')
  )
);

drop policy if exists "card_profile insert own" on public.card_profile;
create policy "card_profile insert own"
on public.card_profile
for insert
to authenticated
with check (
  exists (
    select 1
    from public.cards
    where public.cards.id = public.card_profile.card_id
      and public.cards.user_id = auth.uid()
  )
);

drop policy if exists "card_profile update own" on public.card_profile;
create policy "card_profile update own"
on public.card_profile
for update
to authenticated
using (
  exists (
    select 1
    from public.cards
    where public.cards.id = public.card_profile.card_id
      and public.cards.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.cards
    where public.cards.id = public.card_profile.card_id
      and public.cards.user_id = auth.uid()
  )
);

drop policy if exists "card_profile delete own" on public.card_profile;
create policy "card_profile delete own"
on public.card_profile
for delete
to authenticated
using (
  exists (
    select 1
    from public.cards
    where public.cards.id = public.card_profile.card_id
      and public.cards.user_id = auth.uid()
  )
);

drop policy if exists "card_media select by card scope" on public.card_media;
create policy "card_media select by card scope"
on public.card_media
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.cards
    where public.cards.id = public.card_media.card_id
      and (public.cards.user_id = auth.uid() or public.cards.status = 'published')
  )
);

drop policy if exists "card_media insert own" on public.card_media;
create policy "card_media insert own"
on public.card_media
for insert
to authenticated
with check (
  exists (
    select 1
    from public.cards
    where public.cards.id = public.card_media.card_id
      and public.cards.user_id = auth.uid()
  )
);

drop policy if exists "card_media update own" on public.card_media;
create policy "card_media update own"
on public.card_media
for update
to authenticated
using (
  exists (
    select 1
    from public.cards
    where public.cards.id = public.card_media.card_id
      and public.cards.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.cards
    where public.cards.id = public.card_media.card_id
      and public.cards.user_id = auth.uid()
  )
);

drop policy if exists "card_media delete own" on public.card_media;
create policy "card_media delete own"
on public.card_media
for delete
to authenticated
using (
  exists (
    select 1
    from public.cards
    where public.cards.id = public.card_media.card_id
      and public.cards.user_id = auth.uid()
  )
);

drop policy if exists "card_buttons select by card scope" on public.card_buttons;
create policy "card_buttons select by card scope"
on public.card_buttons
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.cards
    where public.cards.id = public.card_buttons.card_id
      and (public.cards.user_id = auth.uid() or public.cards.status = 'published')
  )
);

drop policy if exists "card_buttons insert own" on public.card_buttons;
create policy "card_buttons insert own"
on public.card_buttons
for insert
to authenticated
with check (
  exists (
    select 1
    from public.cards
    where public.cards.id = public.card_buttons.card_id
      and public.cards.user_id = auth.uid()
  )
);

drop policy if exists "card_buttons update own" on public.card_buttons;
create policy "card_buttons update own"
on public.card_buttons
for update
to authenticated
using (
  exists (
    select 1
    from public.cards
    where public.cards.id = public.card_buttons.card_id
      and public.cards.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.cards
    where public.cards.id = public.card_buttons.card_id
      and public.cards.user_id = auth.uid()
  )
);

drop policy if exists "card_buttons delete own" on public.card_buttons;
create policy "card_buttons delete own"
on public.card_buttons
for delete
to authenticated
using (
  exists (
    select 1
    from public.cards
    where public.cards.id = public.card_buttons.card_id
      and public.cards.user_id = auth.uid()
  )
);

insert into storage.buckets (id, name, public)
values ('card-media', 'card-media', true)
on conflict (id) do nothing;

drop policy if exists "public card-media read" on storage.objects;
create policy "public card-media read"
on storage.objects
for select
using (bucket_id = 'card-media');

drop policy if exists "authenticated card-media upload" on storage.objects;
create policy "authenticated card-media upload"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'card-media');

drop policy if exists "authenticated card-media update" on storage.objects;
create policy "authenticated card-media update"
on storage.objects
for update
to authenticated
using (bucket_id = 'card-media');
