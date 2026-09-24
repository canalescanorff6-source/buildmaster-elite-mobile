import assert from 'node:assert/strict';
import fs from 'node:fs';

const migration = fs.readFileSync('supabase/migrations/202609240002_r454_data_api_security.sql', 'utf8');

for (const table of [
  'gameplay_scouting_r454',
  'gameplay_scouting_sources_r454',
  'gameplay_user_feedback_r454',
  'gameplay_source_conflicts_r454'
]) {
  assert.match(migration, new RegExp(`revoke all on public\\.${table} from anon;`));
  assert.match(migration, new RegExp(`grant select, insert, update, delete on public\\.${table} to authenticated;`));
  assert.match(migration, new RegExp(`create policy ${table.replace('gameplay_', 'gameplay_').replace('_sources_', '_sources_').replace('_user_', '_user_').replace('_source_', '_source_')}.*for all to authenticated`, 's'));
}
assert.ok((migration.match(/using \(\(select auth\.uid\(\)\) = user_id\)/g) ?? []).length >= 4);
assert.ok((migration.match(/with check \(\(select auth\.uid\(\)\) = user_id\)/g) ?? []).length >= 4);
console.log('R454 Data API: grants explícitos + RLS owner-only autenticado OK.');
