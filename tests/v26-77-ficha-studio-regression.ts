import assert from 'node:assert/strict';
import fs from 'node:fs';
import { readLegacyCssBundle } from './helpers/readLegacyCssBundle';

const app = fs.readFileSync('src/components/CardVisionApp.tsx', 'utf8');
const css = [readLegacyCssBundle(), fs.readFileSync('src/app/globals.css', 'utf8'), fs.readFileSync('src/app/design-system-v2710.css', 'utf8')].join('\n');

assert.match(app, /creation-studio-hero/);
assert.match(app, /Build Studio/);
assert.match(app, /creation-live-summary/);
assert.match(app, /creation-essential-grid/);
assert.match(app, /creation-advanced-details/);
assert.match(app, /Contexto tático opcional/);
assert.match(app, /creation-action-dock/);
assert.match(app, /creation-readiness-chips/);
assert.match(app, /creation-blueprint/);
assert.match(app, /Prontidão para auditoria/);
assert.match(app, /mainSection !== 'inicio' && !isCreationSection/);
assert.doesNotMatch(app, /Reabrir auditoria Elite/);

assert.match(css, /Ficha Studio: criação premium/);
assert.match(css, /\.creation-studio-topline/);
assert.match(css, /\.creation-blueprint-grid/);
assert.match(css, /\.creation-advanced-details/);
assert.match(css, /\.creation-primary-cta/);
assert.match(css, /@media \(max-width: 680px\)/);

console.log('✓ v26.77 Motor de Identidade e Formações: criação premium, contexto tático em camada opcional e prévia viva aprovados.');
