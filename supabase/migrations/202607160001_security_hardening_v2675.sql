-- BuildMaster Elite Tático v26.75
-- Endurecimento: versão mínima, MFA administrativo, prova criptográfica do aparelho,
-- redução do modo offline e rate limit atômico das ações administrativas.

alter table public.buildmaster_profiles
  alter column offline_grace_hours set default 4;

update public.buildmaster_profiles
set offline_grace_hours = case when role = 'admin' then 12 else 4 end
where offline_grace_hours is distinct from case when role = 'admin' then 12 else 4 end;

alter table public.buildmaster_devices
  add column if not exists device_public_key text,
  add column if not exists device_key_algorithm text,
  add column if not exists security_version integer not null default 1,
  add column if not exists last_proof_at bigint;

create index if not exists buildmaster_devices_user_active_idx
  on public.buildmaster_devices(user_id, revoked_at, last_seen_at desc);

-- Vínculos antigos não possuem chave pública. Eles são desconectados uma única
-- vez para liberar o limite e permitir o primeiro vínculo protegido da v26.75.
update public.buildmaster_devices
set revoked_at = coalesce(revoked_at, now())
where device_public_key is null or security_version < 2;

create table if not exists public.buildmaster_security_settings (
  id smallint primary key default 1 check (id = 1),
  min_app_version text not null default '26.75.0',
  allow_legacy_clients boolean not null default false,
  require_device_proof boolean not null default true,
  admin_mfa_required boolean not null default true,
  user_offline_grace_hours integer not null default 4 check (user_offline_grace_hours between 0 and 24),
  admin_offline_grace_hours integer not null default 12 check (admin_offline_grace_hours between 0 and 24),
  updated_at timestamptz not null default now()
);

insert into public.buildmaster_security_settings (
  id, min_app_version, allow_legacy_clients, require_device_proof,
  admin_mfa_required, user_offline_grace_hours, admin_offline_grace_hours
) values (1, '26.75.0', false, true, true, 4, 12)
on conflict (id) do update set
  min_app_version = excluded.min_app_version,
  allow_legacy_clients = excluded.allow_legacy_clients,
  require_device_proof = excluded.require_device_proof,
  admin_mfa_required = excluded.admin_mfa_required,
  user_offline_grace_hours = excluded.user_offline_grace_hours,
  admin_offline_grace_hours = excluded.admin_offline_grace_hours,
  updated_at = now();

create table if not exists public.buildmaster_admin_rate_limits (
  admin_id uuid not null references public.buildmaster_profiles(id) on delete cascade,
  action text not null,
  window_started_at timestamptz not null default now(),
  request_count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (admin_id, action)
);

create or replace function public.buildmaster_take_admin_rate_limit(
  p_admin_id uuid,
  p_action text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  allowed boolean;
begin
  if p_admin_id is null or coalesce(trim(p_action), '') = '' then
    return false;
  end if;
  if p_limit < 1 or p_window_seconds < 1 then
    return false;
  end if;

  insert into public.buildmaster_admin_rate_limits (
    admin_id, action, window_started_at, request_count, updated_at
  ) values (
    p_admin_id, left(p_action, 80), now(), 1, now()
  )
  on conflict (admin_id, action) do update set
    window_started_at = case
      when public.buildmaster_admin_rate_limits.window_started_at <= now() - make_interval(secs => p_window_seconds)
        then now()
      else public.buildmaster_admin_rate_limits.window_started_at
    end,
    request_count = case
      when public.buildmaster_admin_rate_limits.window_started_at <= now() - make_interval(secs => p_window_seconds)
        then 1
      else public.buildmaster_admin_rate_limits.request_count + 1
    end,
    updated_at = now()
  returning request_count <= p_limit into allowed;

  return coalesce(allowed, false);
end;
$$;

revoke all on public.buildmaster_security_settings from anon, authenticated;
revoke all on public.buildmaster_admin_rate_limits from anon, authenticated;
revoke all on function public.buildmaster_take_admin_rate_limit(uuid, text, integer, integer) from public, anon, authenticated;
grant execute on function public.buildmaster_take_admin_rate_limit(uuid, text, integer, integer) to service_role;

-- As Edge Functions usam service_role para ler as configurações e aplicar os limites.
-- Para reverter uma implantação, publique novamente as funções anteriores antes de alterar a versão mínima.

-- O RPC antigo aceitava apenas um texto gerado pelo cliente. Ele é desativado
-- para impedir que APKs antigos ou clientes modificados contornem a prova ECDSA.
revoke all on function public.buildmaster_validate_license_and_register_device(text, text, text)
  from public, anon, authenticated;

-- Registro atômico do aparelho. O bloqueio da linha do perfil serializa logins
-- concorrentes da mesma conta e impede ultrapassar max_devices em uma corrida.
create or replace function public.buildmaster_register_secure_device(
  p_user_id uuid,
  p_device_id text,
  p_device_name text,
  p_platform text,
  p_public_key text,
  p_algorithm text,
  p_security_version integer,
  p_proof_at bigint,
  p_max_devices integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_device public.buildmaster_devices%rowtype;
  existing_found boolean := false;
  active_devices integer := 0;
begin
  if p_user_id is null or coalesce(trim(p_device_id), '') = '' then
    return jsonb_build_object('ok', false, 'code', 'DEVICE_MISSING');
  end if;
  if p_security_version < 2 or coalesce(trim(p_public_key), '') = '' or p_proof_at is null then
    return jsonb_build_object('ok', false, 'code', 'SECURE_DEVICE_REQUIRED');
  end if;

  -- O lock é por usuário e cobre contagem + vínculo + reativação do aparelho.
  perform 1 from public.buildmaster_profiles where id = p_user_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'code', 'PROFILE_MISSING');
  end if;

  select * into existing_device
  from public.buildmaster_devices
  where user_id = p_user_id and device_id = p_device_id;
  existing_found := found;

  if existing_found and existing_device.device_public_key is not null
     and existing_device.device_public_key <> p_public_key then
    return jsonb_build_object('ok', false, 'code', 'DEVICE_CLONE_BLOCKED');
  end if;
  if existing_found and existing_device.last_proof_at is not null
     and p_proof_at <= existing_device.last_proof_at then
    return jsonb_build_object('ok', false, 'code', 'DEVICE_REPLAY_BLOCKED');
  end if;

  if not existing_found or existing_device.revoked_at is not null then
    select count(*) into active_devices
    from public.buildmaster_devices
    where user_id = p_user_id and revoked_at is null;
    if active_devices >= greatest(1, least(10, coalesce(p_max_devices, 1))) then
      return jsonb_build_object('ok', false, 'code', 'DEVICE_LIMIT');
    end if;
  end if;

  insert into public.buildmaster_devices (
    user_id, device_id, device_name, platform, first_seen_at, last_seen_at,
    revoked_at, device_public_key, device_key_algorithm, security_version, last_proof_at
  ) values (
    p_user_id,
    p_device_id,
    left(coalesce(nullif(trim(p_device_name), ''), 'Aparelho'), 120),
    left(coalesce(nullif(trim(p_platform), ''), 'unknown'), 240),
    now(), now(), null,
    p_public_key,
    left(coalesce(p_algorithm, ''), 40),
    greatest(2, coalesce(p_security_version, 2)),
    p_proof_at
  )
  on conflict (user_id, device_id) do update set
    device_name = excluded.device_name,
    platform = excluded.platform,
    last_seen_at = now(),
    revoked_at = null,
    device_public_key = excluded.device_public_key,
    device_key_algorithm = excluded.device_key_algorithm,
    security_version = excluded.security_version,
    last_proof_at = excluded.last_proof_at;

  return jsonb_build_object('ok', true, 'activeDevices', active_devices + case when not existing_found or existing_device.revoked_at is not null then 1 else 0 end);
end;
$$;

revoke all on function public.buildmaster_register_secure_device(uuid, text, text, text, text, text, integer, bigint, integer)
  from public, anon, authenticated;
grant execute on function public.buildmaster_register_secure_device(uuid, text, text, text, text, text, integer, bigint, integer)
  to service_role;

-- A leitura administrativa direta pelo REST também exige AAL2. Isso impede
-- contornar o painel MFA usando apenas um token aal1.
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

-- Novas contas externas continuam suspensas e recebem somente quatro horas
-- caso sejam posteriormente ativadas pelo administrador.
create or replace function public.buildmaster_handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
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
    coalesce(nullif(new.raw_user_meta_data->>'plan', ''), 'premium'),
    nullif(new.raw_user_meta_data->>'expires_at', '')::timestamptz,
    greatest(1, least(10, coalesce((new.raw_user_meta_data->>'max_devices')::integer, 1))),
    greatest(0, least(24, coalesce((new.raw_user_meta_data->>'offline_grace_hours')::integer, 4)))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
