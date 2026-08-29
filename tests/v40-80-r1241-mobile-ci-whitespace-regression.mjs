import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const config = readFileSync(resolve('supabase/config.toml'), 'utf8');
if (!config.endsWith('\n')) throw new Error('supabase/config.toml deve terminar com uma quebra de linha.');
if (config.endsWith('\n\n')) throw new Error('supabase/config.toml não pode terminar com linha em branco extra.');
if (/[^\S\r\n]+$/m.test(config)) throw new Error('supabase/config.toml contém whitespace no fim de linha.');
console.log('r124.1 mobile CI whitespace regression: OK');
