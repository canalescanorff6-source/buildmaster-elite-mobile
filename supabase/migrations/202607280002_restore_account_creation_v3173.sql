-- BuildMaster Elite Tático v31.73 — restauração definitiva da criação de contas
-- Recupera o comportamento administrativo anterior: usuário + senha + prazo,
-- sem exigir MFA para abrir o painel. O MFA continua disponível como opção.

insert into public.buildmaster_security_settings (
  id,
  min_app_version,
  allow_legacy_clients,
  require_device_proof,
  admin_mfa_required,
  user_offline_grace_hours,
  admin_offline_grace_hours,
  updated_at
) values (
  1,
  '29.00.0',
  false,
  true,
  false,
  4,
  12,
  now()
)
on conflict (id) do update set
  admin_mfa_required = false,
  require_device_proof = true,
  updated_at = now();

-- Garante que a instalação com apenas um perfil mantenha esse perfil como admin.
do $$
declare
  profile_count integer;
  admin_count integer;
  sole_profile uuid;
begin
  select count(*) into profile_count from public.buildmaster_profiles;
  select count(*) into admin_count from public.buildmaster_profiles where role = 'admin';

  if admin_count = 0 and profile_count = 1 then
    select id into sole_profile from public.buildmaster_profiles limit 1;
    update public.buildmaster_profiles
       set role = 'admin',
           status = 'active',
           expires_at = null,
           updated_at = now()
     where id = sole_profile;
  end if;
end
$$;
