-- BuildMaster Elite Tático R426 — fechamento forward-only de segurança Supabase.
-- R426_FORWARD_SECURITY_FINALIZATION
-- Esta migration não reescreve migrations históricas já aplicadas: ela converge o banco atual.

begin;

-- Política fail-closed. Mesmo uma Edge Function antiga não pode rebaixar estes três controles.
insert into public.buildmaster_security_settings (
  id, min_app_version, allow_legacy_clients, require_device_proof,
  admin_mfa_required, user_offline_grace_hours, admin_offline_grace_hours, updated_at
) values (
  1, '40.80.0', false, true, true, 4, 12, now()
)
on conflict (id) do update set
  allow_legacy_clients = false,
  require_device_proof = true,
  admin_mfa_required = true,
  updated_at = now();

update public.buildmaster_security_settings
set allow_legacy_clients = false,
    require_device_proof = true,
    admin_mfa_required = true,
    updated_at = now()
where id = 1;

alter table public.buildmaster_security_settings
  drop constraint if exists buildmaster_security_admin_mfa_fail_closed;
alter table public.buildmaster_security_settings
  add constraint buildmaster_security_admin_mfa_fail_closed
  check (admin_mfa_required is true) not valid;
alter table public.buildmaster_security_settings
  validate constraint buildmaster_security_admin_mfa_fail_closed;

alter table public.buildmaster_security_settings
  drop constraint if exists buildmaster_security_device_proof_fail_closed;
alter table public.buildmaster_security_settings
  add constraint buildmaster_security_device_proof_fail_closed
  check (require_device_proof is true) not valid;
alter table public.buildmaster_security_settings
  validate constraint buildmaster_security_device_proof_fail_closed;

alter table public.buildmaster_security_settings
  drop constraint if exists buildmaster_security_no_legacy_clients;
alter table public.buildmaster_security_settings
  add constraint buildmaster_security_no_legacy_clients
  check (allow_legacy_clients is false) not valid;
alter table public.buildmaster_security_settings
  validate constraint buildmaster_security_no_legacy_clients;

-- Novas contas nunca recebem autorização/licença de raw_user_meta_data.
create or replace function public.buildmaster_handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  requested_username text;
begin
  requested_username := lower(coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)));
  insert into public.buildmaster_profiles (
    id, username, display_name, role, status, plan, expires_at, max_devices, offline_grace_hours
  ) values (
    new.id,
    requested_username,
    coalesce(nullif(new.raw_user_meta_data->>'display_name', ''), requested_username),
    'user',
    case when coalesce(new.raw_app_meta_data->>'buildmaster_managed', 'false') = 'true' then 'active' else 'suspended' end,
    'premium',
    null,
    1,
    4
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function public.buildmaster_handle_new_auth_user() from public, anon, authenticated;

-- RLS permanece habilitado nas tabelas acessadas pelo Data API.
alter table public.buildmaster_profiles enable row level security;
alter table public.buildmaster_devices enable row level security;
alter table public.user_vault_snapshots enable row level security;
alter table public.buildmaster_admin_audit enable row level security;
alter table public.buildmaster_commercial_plans enable row level security;
alter table public.buildmaster_commercial_licenses enable row level security;
alter table public.buildmaster_commercial_coupons enable row level security;
alter table public.buildmaster_commercial_ledger enable row level security;
alter table public.buildmaster_terms_acceptances enable row level security;
alter table public.buildmaster_lgpd_requests enable row level security;
alter table public.buildmaster_community_profiles enable row level security;
alter table public.buildmaster_community_packages enable row level security;
alter table public.buildmaster_community_ratings enable row level security;
alter table public.buildmaster_community_comments enable row level security;
alter table public.buildmaster_community_reports enable row level security;
alter table public.buildmaster_public_deletion_requests enable row level security;
alter table public.buildmaster_public_request_limits enable row level security;
alter table public.buildmaster_play_integrity_audit enable row level security;

-- Data API: primeiro revoga tudo, depois libera somente operações cobertas por policies.
revoke all on table
  public.buildmaster_profiles,
  public.buildmaster_devices,
  public.user_vault_snapshots,
  public.buildmaster_admin_audit,
  public.buildmaster_security_settings,
  public.buildmaster_admin_rate_limits,
  public.buildmaster_release_governance,
  public.buildmaster_release_history,
  public.buildmaster_commercial_plans,
  public.buildmaster_commercial_licenses,
  public.buildmaster_commercial_coupons,
  public.buildmaster_commercial_ledger,
  public.buildmaster_terms_acceptances,
  public.buildmaster_lgpd_requests,
  public.buildmaster_community_profiles,
  public.buildmaster_community_packages,
  public.buildmaster_community_ratings,
  public.buildmaster_community_comments,
  public.buildmaster_community_reports,
  public.buildmaster_public_deletion_requests,
  public.buildmaster_public_request_limits,
  public.buildmaster_play_integrity_audit
from anon, authenticated;

grant select on table
  public.buildmaster_profiles,
  public.buildmaster_devices,
  public.buildmaster_admin_audit,
  public.buildmaster_commercial_plans,
  public.buildmaster_commercial_licenses,
  public.buildmaster_commercial_ledger,
  public.buildmaster_public_deletion_requests,
  public.buildmaster_play_integrity_audit
to authenticated;

grant select, insert, update, delete on table
  public.user_vault_snapshots,
  public.buildmaster_terms_acceptances,
  public.buildmaster_community_profiles,
  public.buildmaster_community_packages,
  public.buildmaster_community_ratings
to authenticated;

grant select, insert on table
  public.buildmaster_lgpd_requests,
  public.buildmaster_community_comments,
  public.buildmaster_community_reports
to authenticated;

-- Funções SECURITY DEFINER sensíveis só podem ser chamadas pelo serviço privilegiado.
revoke all on function public.buildmaster_take_admin_rate_limit(uuid, text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.buildmaster_take_admin_rate_limit(uuid, text, integer, integer)
  to service_role;

revoke all on function public.buildmaster_register_secure_device(uuid, text, text, text, text, text, integer, bigint, integer)
  from public, anon, authenticated;
grant execute on function public.buildmaster_register_secure_device(uuid, text, text, text, text, text, integer, bigint, integer)
  to service_role;

revoke all on function public.buildmaster_validate_license_and_register_device(text, text, text)
  from public, anon, authenticated;

-- Reasserta leitura administrativa AAL2 mesmo em bancos que passaram pela recuperação v31.71/v31.73.
drop policy if exists buildmaster_profile_self_select on public.buildmaster_profiles;
create policy buildmaster_profile_self_select on public.buildmaster_profiles
for select to authenticated using (
  id = auth.uid()
  or (public.buildmaster_is_admin() and coalesce(auth.jwt()->>'aal', 'aal1') = 'aal2')
);

drop policy if exists buildmaster_device_self_select on public.buildmaster_devices;
create policy buildmaster_device_self_select on public.buildmaster_devices
for select to authenticated using (
  user_id = auth.uid()
  or (public.buildmaster_is_admin() and coalesce(auth.jwt()->>'aal', 'aal1') = 'aal2')
);

drop policy if exists buildmaster_audit_admin_select on public.buildmaster_admin_audit;
create policy buildmaster_audit_admin_select on public.buildmaster_admin_audit
for select to authenticated using (
  public.buildmaster_is_admin() and coalesce(auth.jwt()->>'aal', 'aal1') = 'aal2'
);

commit;
