
import assert from 'node:assert/strict';
import { buildLiveEvolutionV600R11 } from '../src/lib/liveEvolutionV600R11';
const base:any={parsed:{playstyle:'Armador criativo',offensivePlaystyle:'Armador criativo',defensivePlaystyle:'Pressão no Ataque',defensivePlaystyleConfirmed:false},recommendationExplanation:[]};
const a=buildLiveEvolutionV600R11(base);
assert.equal(a.weeklyReady,true);
assert.equal(a.playerStyles.offensive,'Armador criativo');
assert.equal(a.playerStyles.defensive,'Pressão no Ataque');
assert.equal(a.catalog.safeToWeight,false);
assert.ok(a.catalog.unknownFields.length===1);
console.log('r11 Meta Vivo Semanal aprovado.');
