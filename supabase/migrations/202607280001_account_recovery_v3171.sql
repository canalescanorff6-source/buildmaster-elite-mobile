-- BuildMaster Elite Tático v31.71 — Recuperação do sistema de contas

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
    update public.buildmaster_profiles set role = 'admin', status = 'active', expires_at = null, updated_at = now() where id = sole_profile;
  end if;
end
$$;

-- R425_MFA_FAIL_CLOSED: a ausência de fator cadastrado não pode desligar a política administrativa.
update public.buildmaster_security_settings
set admin_mfa_required = true, updated_at = now()
where id = 1;

create index if not exists buildmaster_profiles_role_status_idx on public.buildmaster_profiles(role, status, created_at desc);
