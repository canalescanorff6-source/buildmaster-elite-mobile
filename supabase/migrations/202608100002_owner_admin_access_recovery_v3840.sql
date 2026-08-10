-- BuildMaster Elite Tático v38.40 — recuperação segura da conta principal
-- Preserva o mesmo auth.users.id, Cofre, fichas e histórico.
-- Não recria nem exclui a conta do proprietário.

do $$
declare
  owner_email constant text := 'tiago@accounts.buildmaster.app';
  owner_id constant uuid := 'e0064cae-da5d-45a4-af74-439a9b66b503';
  auth_owner_id uuid;
  auth_owner_email text;
begin
  select id, email
    into auth_owner_id, auth_owner_email
    from auth.users
   where id = owner_id
      or lower(email) = owner_email
   order by case when id = owner_id then 0 else 1 end, created_at asc
   limit 1;

  if auth_owner_id is null then
    raise exception 'Conta principal % não encontrada no auth.users. Nada foi alterado.', owner_email;
  end if;

  if auth_owner_id <> owner_id or lower(coalesce(auth_owner_email, '')) <> owner_email then
    raise exception 'A identidade da conta principal não confere com o UID/e-mail esperado. Nada foi alterado.';
  end if;

  insert into public.buildmaster_profiles (
    id, username, display_name, role, status, plan, expires_at,
    max_devices, offline_grace_hours, created_by
  ) values (
    owner_id, 'tiago', 'Tiago', 'admin', 'active', 'premium', null,
    10, 12, null
  )
  on conflict (id) do update set
    username = 'tiago',
    display_name = case
      when nullif(trim(public.buildmaster_profiles.display_name), '') is null then 'Tiago'
      else public.buildmaster_profiles.display_name
    end,
    role = 'admin',
    status = 'active',
    plan = coalesce(nullif(public.buildmaster_profiles.plan, ''), 'premium'),
    expires_at = null,
    max_devices = 10,
    offline_grace_hours = 12,
    updated_at = now();

  -- Libera somente os vínculos de aparelho da conta proprietária. O histórico
  -- é mantido e nenhum jogador, ficha ou snapshot do Cofre é removido.
  update public.buildmaster_devices
     set revoked_at = coalesce(revoked_at, now())
   where user_id = owner_id
     and revoked_at is null;

  raise notice 'Conta principal % recuperada com o mesmo UID %, perfil admin ativo e vínculos antigos revogados.', owner_email, owner_id;
end $$;
