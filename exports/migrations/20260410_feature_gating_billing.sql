alter table public.profiles
add column if not exists billing_status text not null default 'inactive';

alter table public.cards
add column if not exists slug text not null default '',
add column if not exists owner_plan_key text not null default 'free';

create table if not exists public.upgrade_intents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  current_plan text not null check (current_plan in ('free', 'starter', 'pro')),
  target_plan text not null check (target_plan in ('free', 'starter', 'pro')),
  status text not null default 'draft' check (status in ('draft', 'pending', 'ready', 'cancelled')),
  created_at timestamptz not null default now()
);

create unique index if not exists idx_cards_slug_unique on public.cards(lower(slug)) where slug <> '';
create index if not exists idx_upgrade_intents_user_created_at on public.upgrade_intents(user_id, created_at desc);

alter table public.upgrade_intents enable row level security;

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
