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

create index if not exists idx_checkout_placeholders_user_updated_at
on public.checkout_placeholders(user_id, updated_at desc);

create unique index if not exists idx_checkout_placeholders_intent_unique
on public.checkout_placeholders(intent_id);

drop trigger if exists trg_checkout_placeholders_updated_at on public.checkout_placeholders;
create trigger trg_checkout_placeholders_updated_at
before update on public.checkout_placeholders
for each row
execute function public.set_updated_at();

alter table public.checkout_placeholders enable row level security;

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
