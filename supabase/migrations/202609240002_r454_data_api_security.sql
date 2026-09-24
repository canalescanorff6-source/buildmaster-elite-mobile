-- BuildMaster Elite R454 — endurecimento do Data API para o novo modelo de grants explícitos.
-- Forward-only: corrige projetos onde as tabelas R454 já existem sem privilégios no PostgREST.

revoke all on public.gameplay_scouting_r454 from anon;
revoke all on public.gameplay_scouting_sources_r454 from anon;
revoke all on public.gameplay_user_feedback_r454 from anon;
revoke all on public.gameplay_source_conflicts_r454 from anon;

grant select, insert, update, delete on public.gameplay_scouting_r454 to authenticated;
grant select, insert, update, delete on public.gameplay_scouting_sources_r454 to authenticated;
grant select, insert, update, delete on public.gameplay_user_feedback_r454 to authenticated;
grant select, insert, update, delete on public.gameplay_source_conflicts_r454 to authenticated;

drop policy if exists gameplay_scouting_r454_owner on public.gameplay_scouting_r454;
create policy gameplay_scouting_r454_owner on public.gameplay_scouting_r454
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists gameplay_scouting_sources_r454_owner on public.gameplay_scouting_sources_r454;
create policy gameplay_scouting_sources_r454_owner on public.gameplay_scouting_sources_r454
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists gameplay_user_feedback_r454_owner on public.gameplay_user_feedback_r454;
create policy gameplay_user_feedback_r454_owner on public.gameplay_user_feedback_r454
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists gameplay_source_conflicts_r454_owner on public.gameplay_source_conflicts_r454;
create policy gameplay_source_conflicts_r454_owner on public.gameplay_source_conflicts_r454
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
