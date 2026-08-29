import assert from 'node:assert/strict';
import { detectV600Playstyles, canonicalizeV600DefensivePlaystyle, canonicalizeV600OffensivePlaystyle } from '../src/lib/efootballV600Playstyles';
import { inspectPlaystyleActivationR124 } from '../src/lib/efootball2027PhaseCatalogR124';

assert.deepEqual(detectV600Playstyles('Att: Basic\nDef: Attacking GK'), { offensive:'Básico', defensive:'Goleiro Ofensivo', defensiveConfirmed:true, defensiveRaw:'Attacking GK', source:'EXPLICIT_V600' });
assert.deepEqual(detectV600Playstyles('Att: High Line GK\nDef: Attacking GK'), { offensive:'High Line GK', defensive:'Goleiro Ofensivo', defensiveConfirmed:true, defensiveRaw:'Attacking GK', source:'EXPLICIT_V600' });
assert.equal(detectV600Playstyles('Basic Attacking GK').offensive,'Básico');
assert.equal(detectV600Playstyles('Basic Attacking GK').defensive,'Goleiro Ofensivo');
assert.equal(canonicalizeV600OffensivePlaystyle('Attacking GK'), null, 'GK ofensivo defensivo não pode contaminar ataque');
assert.equal(canonicalizeV600DefensivePlaystyle('Goal Poacher'), null, 'Artilheiro não pode contaminar defesa');
assert.equal(canonicalizeV600DefensivePlaystyle('Front Line Pressure'), 'Pressão no Ataque');
assert.equal(canonicalizeV600DefensivePlaystyle('Covering Role'), 'Covering Role');
assert.equal(canonicalizeV600DefensivePlaystyle('Pass Disruptor'), 'Pass Disruptor');
assert.deepEqual(detectV600Playstyles('O destruidor'), { offensive:'Básico', defensive:'Destruidor', defensiveConfirmed:true, defensiveRaw:'Destruidor', source:'LEGACY_SINGLE' });
assert.deepEqual(detectV600Playstyles('Goleiro Ofensivo'), { offensive:'Básico', defensive:'Goleiro Ofensivo', defensiveConfirmed:true, defensiveRaw:'Goleiro Ofensivo', source:'LEGACY_SINGLE' });
assert.equal(inspectPlaystyleActivationR124('Goleiro Ofensivo','DEFENSIVE','GK').status,'LIKELY_ACTIVE');
assert.equal(inspectPlaystyleActivationR124('Goleiro Ofensivo','DEFENSIVE','CF').status,'LIKELY_INACTIVE');
console.log('r124 phase catalog regression: ok');
