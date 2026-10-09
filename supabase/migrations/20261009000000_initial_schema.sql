-- ============================================================================
-- 0001 · Esquema multi-tenant base — SaaS Fidelización Fruppy
-- ============================================================================
-- Requisito: Supabase/Postgres con esquema `auth` (auth.users) para
-- organization_members.user_id. En Postgres plano, crear un stub:
--   create schema auth; create table auth.users(id uuid primary key);
--
-- Reglas de diseño:
--  * Toda tabla de negocio lleva organization_id (o cuelga de una que lo tiene).
--  * RLS ON en todo. SIN policies en esta migración → deny-all por defecto.
--    Las policies y funciones security definer llegan en Fase 2.
--  * Ledger append-only: loyalty_transactions prohibe UPDATE/DELETE.
--  * Dinero en unidades menores (bigint), nunca float. Fechas en UTC.
-- ============================================================================

-- ---------- utilidades ------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Ledger inmutable: nadie (ni siquiera service_role vía Data API) edita/borra
-- movimientos. Las correcciones son movimientos compensatorios.
create or replace function public.prevent_ledger_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'loyalty_transactions es append-only: use un movimiento compensatorio';
end;
$$;

-- ---------- organizaciones y membresía -------------------------------------

create table public.organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 2 and 120),
  slug        text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,62}$'),
  status      text not null default 'trial'
              check (status in ('trial','active','suspended')),
  timezone    text not null default 'America/Bogota',
  currency    text not null default 'COP' check (char_length(currency) = 3),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger organizations_updated_at before update on public.organizations
  for each row execute function public.set_updated_at();

create table public.organization_members (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  role            text not null default 'staff'
                  check (role in ('owner','admin','manager','staff')),
  status          text not null default 'active'
                  check (status in ('invited','active','suspended')),
  created_at      timestamptz not null default now(),
  unique (organization_id, user_id)
);
create index organization_members_user_idx
  on public.organization_members (user_id, status);

create table public.locations (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name            text not null check (char_length(name) between 1 and 120),
  address         text,
  timezone        text,
  status          text not null default 'active' check (status in ('active','inactive')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index locations_org_idx on public.locations (organization_id);
create trigger locations_updated_at before update on public.locations
  for each row execute function public.set_updated_at();

-- ---------- CRM -------------------------------------------------------------

create table public.customers (
  id                   uuid primary key default gen_random_uuid(),
  organization_id      uuid not null references public.organizations(id) on delete cascade,
  external_ref         text not null default gen_random_uuid()::text,
  first_name           text not null check (char_length(first_name) between 1 and 80),
  last_name            text check (char_length(last_name) <= 80),
  email                text check (email is null or email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone                text check (phone is null or char_length(phone) <= 32),
  birth_date           date,
  marketing_consent_at timestamptz,
  status               text not null default 'active' check (status in ('active','inactive')),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (organization_id, external_ref)
);
create index customers_org_idx on public.customers (organization_id, status);
create index customers_org_phone_idx on public.customers (organization_id, phone) where phone is not null;
create index customers_org_email_idx on public.customers (organization_id, email) where email is not null;
create trigger customers_updated_at before update on public.customers
  for each row execute function public.set_updated_at();

-- ---------- programas y ledger de fidelización ------------------------------

create table public.loyalty_programs (
  id                       uuid primary key default gen_random_uuid(),
  organization_id          uuid not null references public.organizations(id) on delete cascade,
  name                     text not null check (char_length(name) between 1 and 120),
  program_type             text not null check (program_type in ('points','stamps')),
  status                   text not null default 'active' check (status in ('draft','active','archived')),
  points_per_currency_unit numeric(12,4) check (points_per_currency_unit is null or points_per_currency_unit >= 0),
  stamp_goal               int check (stamp_goal is null or stamp_goal between 1 and 1000),
  reward_description       text,
  expiration_policy        jsonb,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  -- coherencia del tipo de programa con sus reglas
  check (program_type <> 'stamps'  or stamp_goal is not null),
  check (program_type <> 'points'  or points_per_currency_unit is not null)
);
create index loyalty_programs_org_idx on public.loyalty_programs (organization_id, status);
create trigger loyalty_programs_updated_at before update on public.loyalty_programs
  for each row execute function public.set_updated_at();

-- Proyección de saldo: SOLO se actualiza dentro de la transacción que inserta
-- el movimiento en loyalty_transactions (funciones RPC de Fase 4). Nunca a mano.
create table public.loyalty_accounts (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  customer_id     uuid not null references public.customers(id) on delete cascade,
  program_id      uuid not null references public.loyalty_programs(id) on delete cascade,
  current_points  bigint not null default 0 check (current_points >= 0),
  current_stamps  int not null default 0 check (current_stamps >= 0),
  version         bigint not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (organization_id, customer_id, program_id)
);
create index loyalty_accounts_org_idx on public.loyalty_accounts (organization_id);
create trigger loyalty_accounts_updated_at before update on public.loyalty_accounts
  for each row execute function public.set_updated_at();

create table public.loyalty_transactions (
  id                       uuid primary key default gen_random_uuid(),
  organization_id          uuid not null references public.organizations(id) on delete restrict,
  account_id               uuid not null references public.loyalty_accounts(id) on delete restrict,
  transaction_type         text not null
                           check (transaction_type in ('earn','redeem','adjustment','expire','reversal')),
  points_delta             bigint not null default 0,
  stamps_delta             int not null default 0,
  amount_minor             bigint check (amount_minor is null or amount_minor >= 0),
  location_id              uuid references public.locations(id) on delete set null,
  performed_by             uuid references auth.users(id) on delete set null,
  idempotency_key          text,
  reference_transaction_id uuid references public.loyalty_transactions(id),
  reason                   text check (reason is null or char_length(reason) <= 500),
  created_at               timestamptz not null default now(),
  -- un reintento con la misma clave NO puede duplicar el movimiento
  unique (organization_id, idempotency_key)
);
create index loyalty_tx_org_idx on public.loyalty_transactions (organization_id, created_at desc);
create index loyalty_tx_account_idx on public.loyalty_transactions (account_id, created_at desc);
create trigger loyalty_tx_no_update before update or delete on public.loyalty_transactions
  for each row execute function public.prevent_ledger_mutation();

-- ---------- recompensas y canjes --------------------------------------------

create table public.rewards (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  program_id      uuid not null references public.loyalty_programs(id) on delete cascade,
  name            text not null check (char_length(name) between 1 and 120),
  description     text,
  cost_points     bigint check (cost_points is null or cost_points > 0),
  cost_stamps     int check (cost_stamps is null or cost_stamps > 0),
  status          text not null default 'active' check (status in ('active','inactive')),
  terms           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  check (num_nonnulls(cost_points, cost_stamps) = 1)
);
create index rewards_org_idx on public.rewards (organization_id, status);
create trigger rewards_updated_at before update on public.rewards
  for each row execute function public.set_updated_at();

create table public.redemptions (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  customer_id     uuid not null references public.customers(id) on delete restrict,
  reward_id       uuid not null references public.rewards(id) on delete restrict,
  account_id      uuid not null references public.loyalty_accounts(id) on delete restrict,
  location_id     uuid references public.locations(id) on delete set null,
  performed_by    uuid references auth.users(id) on delete set null,
  status          text not null default 'completed' check (status in ('completed','reversed')),
  idempotency_key text,
  created_at      timestamptz not null default now(),
  reversed_at     timestamptz,
  unique (organization_id, idempotency_key)
);
create index redemptions_org_idx on public.redemptions (organization_id, created_at desc);

-- ---------- visitas ----------------------------------------------------------

create table public.customer_visits (
  id                    uuid primary key default gen_random_uuid(),
  organization_id       uuid not null references public.organizations(id) on delete restrict,
  customer_id           uuid not null references public.customers(id) on delete restrict,
  location_id           uuid references public.locations(id) on delete set null,
  performed_by          uuid references auth.users(id) on delete set null,
  source                text not null default 'manual' check (source in ('staff_qr','manual','pos')),
  purchase_amount_minor bigint check (purchase_amount_minor is null or purchase_amount_minor >= 0),
  idempotency_key       text,
  created_at            timestamptz not null default now(),
  unique (organization_id, idempotency_key)
);
create index customer_visits_org_idx on public.customer_visits (organization_id, created_at desc);
create index customer_visits_customer_idx on public.customer_visits (customer_id, created_at desc);

-- ---------- wallet (espejo, nunca fuente de verdad) --------------------------

create table public.wallet_passes (
  id                   uuid primary key default gen_random_uuid(),
  organization_id      uuid not null references public.organizations(id) on delete cascade,
  customer_id          uuid not null references public.customers(id) on delete cascade,
  program_id           uuid not null references public.loyalty_programs(id) on delete cascade,
  provider             text not null check (provider in ('apple','google','passkit')),
  provider_object_id   text,
  serial_number        text,
  status               text not null default 'pending'
                       check (status in ('pending','active','revoked','error')),
  last_synced_at       timestamptz,
  last_sync_error_code text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (organization_id, provider, serial_number)
);
create index wallet_passes_org_idx on public.wallet_passes (organization_id);
create trigger wallet_passes_updated_at before update on public.wallet_passes
  for each row execute function public.set_updated_at();

-- ---------- auditoría --------------------------------------------------------

create table public.audit_logs (
  id              bigint generated always as identity primary key,
  organization_id uuid references public.organizations(id) on delete set null,
  actor_user_id   uuid references auth.users(id) on delete set null,
  action          text not null,
  entity_type     text not null,
  entity_id       text,
  metadata        jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now()
);
create index audit_logs_org_idx on public.audit_logs (organization_id, created_at desc);

-- ---------- RLS: activado en TODO, deny-all hasta Fase 2 ----------------------

alter table public.organizations          enable row level security;
alter table public.organization_members   enable row level security;
alter table public.locations              enable row level security;
alter table public.customers              enable row level security;
alter table public.loyalty_programs       enable row level security;
alter table public.loyalty_accounts       enable row level security;
alter table public.loyalty_transactions   enable row level security;
alter table public.rewards                enable row level security;
alter table public.redemptions            enable row level security;
alter table public.customer_visits        enable row level security;
alter table public.wallet_passes          enable row level security;
alter table public.audit_logs             enable row level security;

-- El ledger tampoco acepta UPDATE/DELETE por privilegios (defensa en profundidad
-- junto al trigger). service_role pasa por el Data API pero estos revoke se
-- aplican a los roles de la API; las funciones de Fase 4 serán security definer.
revoke update, delete on public.loyalty_transactions from anon, authenticated;
revoke update, delete on public.audit_logs from anon, authenticated;
