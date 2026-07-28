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

do $$
declare
  has_verified_admin_factor boolean := false;
begin
  if to_regclass('auth.mfa_factors') is not null then
    execute $query$
      select exists (
        select 1 from auth.mfa_factors factor
        join public.buildmaster_profiles profile on profile.id = factor.user_id
        where profile.role = 'admin' and profile.status = 'active' and factor.status::text = 'verified'
      )
    $query$ into has_verified_admin_factor;
  end if;
  update public.buildmaster_security_settings set admin_mfa_required = has_verified_admin_factor, updated_at = now() where id = 1;
end
$$;

create index if not exists buildmaster_profiles_role_status_idx on public.buildmaster_profiles(role, status, created_at desc);
