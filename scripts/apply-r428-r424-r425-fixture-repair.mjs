import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const R428_R424_R425_FIXTURE_REPAIR_VERSION = '40.80-r428-r424-r425-fixture-repair-v1';

const TARGET = 'tests/v40-80-r424-final-requirements-closure-regression.mjs';
const LEGACY_FIXTURE = "w('supabase/migrations/202607160001_security_hardening_v2675.sql','R425_AUTHORIZATION_METADATA_FAIL_CLOSED');";
const SECURE_FIXTURE = "w('supabase/migrations/202607160001_security_hardening_v2675.sql','R425_AUTHORIZATION_METADATA_FAIL_CLOSED revoke all on function public.buildmaster_take_admin_rate_limit grant execute on function public.buildmaster_take_admin_rate_limit revoke all on function public.buildmaster_register_secure_device grant execute on function public.buildmaster_register_secure_device');";

export function patchR424R425FixtureR428(source) {
  if (source.includes(SECURE_FIXTURE)) return source;
  const occurrences = source.split(LEGACY_FIXTURE).length - 1;
  if (occurrences !== 1) {
    throw new Error(`R428: fixture R424/R425 inesperada; ocorrências=${occurrences}.`);
  }
  return source.replace(LEGACY_FIXTURE, SECURE_FIXTURE);
}

export function applyR428R424R425FixtureRepair(rootDirectory = process.cwd()) {
  const root = path.resolve(rootDirectory);
  const file = path.resolve(root, TARGET);
  if (!fs.existsSync(file)) throw new Error(`R428: arquivo obrigatório ausente: ${TARGET}`);

  const before = fs.readFileSync(file, 'utf8');
  const after = patchR424R425FixtureR428(before);
  const changed = after !== before;
  if (changed) fs.writeFileSync(file, after, 'utf8');

  const final = fs.readFileSync(file, 'utf8');
  for (const marker of [
    'R425_AUTHORIZATION_METADATA_FAIL_CLOSED',
    'revoke all on function public.buildmaster_take_admin_rate_limit',
    'grant execute on function public.buildmaster_take_admin_rate_limit',
    'revoke all on function public.buildmaster_register_secure_device',
    'grant execute on function public.buildmaster_register_secure_device',
  ]) {
    if (!final.includes(marker)) throw new Error(`R428: fixture R424 não representa o contrato R425 atual: ${marker}`);
  }

  return { changed, patched: changed ? [TARGET] : [], version: R428_R424_R425_FIXTURE_REPAIR_VERSION };
}

const invoked = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : '';
if (invoked === import.meta.url) {
  const result = applyR428R424R425FixtureRepair(process.cwd());
  console.log(result.changed
    ? 'R428 corrigiu a fixture R424 para o contrato R425 SECURITY DEFINER atual.'
    : 'R428: fixture R424/R425 já estava convergida.');
}
