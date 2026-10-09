-- ============================================================================
-- Fase 7 — Dashboard y configuración del comercio
--
--  * organizations.brand: branding de la tarjeta ({color, logo_url}).
--  * organization_invites: invitar personal por email SIN conocer su
--    user_id de antemano. El usuario reclama la invitación al entrar
--    (claim_invites) — patrón estándar Supabase.
-- ============================================================================

alter table public.organizations
  add column if not exists brand jsonb not null default '{}'::jsonb;

comment on column public.organizations.brand is
  'Branding de tarjeta/UI: {"color": "#hex", "logo_url": "https://..."}';

create table public.organization_invites (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email           text not null check (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  role            text not null default 'staff'
                  check (role in ('admin','manager','staff')),
  token           text not null unique default replace(gen_random_uuid()::text, '-', ''),
  status          text not null default 'pending'
                  check (status in ('pending','accepted','expired','cancelled')),
  invited_by      uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  accepted_at     timestamptz,
  unique (organization_id, email)
);
create index org_invites_email_idx on public.organization_invites (lower(email), status);

alter table public.organization_invites enable row level security;

-- Miembros con rol manager+ ven las invitaciones de su org; staff no.
create policy invites_select on public.organization_invites
  for select to authenticated
  using (public.current_user_has_role(
           organization_id, array['owner','admin','manager']));

create policy invites_insert on public.organization_invites
  for insert to authenticated
  with check (public.current_user_has_role(
                organization_id, array['owner','admin','manager']));

create policy invites_update on public.organization_invites
  for update to authenticated
  using (public.current_user_has_role(
           organization_id, array['owner','admin','manager']));

grant select, insert, update on public.organization_invites to authenticated;
-- Sin DELETE: cancelar = status 'cancelled' (historial auditable).

-- ---------- claim_invites: reclamar invitaciones pendientes ------------------
-- Se llama tras login/signup. En Supabase el email viene del JWT
-- (auth.jwt()->>'email'); en el stub de tests, del GUC app.user_email.

create or replace function public.current_user_email()
returns text
language sql stable
security definer
set search_path = ''
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email',
    nullif(current_setting('app.user_email', true), '')
  );
$$;

create or replace function public.claim_invites()
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email  text;
  v_claimed int := 0;
  v_inv    record;
begin
  v_email := lower(public.current_user_email());
  if v_email is null then return 0; end if;

  for v_inv in
    select i.id, i.organization_id, i.role
      from public.organization_invites i
     where lower(i.email) = v_email and i.status = 'pending'
  loop
    insert into public.organization_members (organization_id, user_id, role, status)
    values (v_inv.organization_id, auth.uid(), v_inv.role, 'active')
    on conflict (organization_id, user_id) do nothing;

    update public.organization_invites
       set status = 'accepted', accepted_at = now()
     where id = v_inv.id;
    v_claimed := v_claimed + 1;
  end loop;
  return v_claimed;
end;
$$;

revoke all on function public.current_user_email() from public, anon;
revoke all on function public.claim_invites()       from public, anon;
grant execute on function public.current_user_email() to authenticated;
grant execute on function public.claim_invites()       to authenticated;
