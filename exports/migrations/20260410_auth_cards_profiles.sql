alter table public.cards
add column if not exists user_id uuid references auth.users(id) on delete cascade;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null default '',
  display_name text not null default '',
  plan_key text not null default 'free' check (plan_key in ('free', 'starter', 'pro')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

-- Backfill existing cards to the correct auth.users.id before enabling NOT NULL:
-- update public.cards set user_id = '<auth-user-uuid>' where id in (...);

-- After backfill:
-- alter table public.cards alter column user_id set not null;

-- Then apply the full RLS/policy set from exports/supabase-schema.sql.
