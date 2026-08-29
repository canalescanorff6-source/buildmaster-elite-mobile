import assert from 'node:assert/strict';
import { buildCuratedCatalogR124 } from '../src/lib/efootballCatalogDiscoveryCoreR124';
import { canonicalSkillName } from '../src/lib/officialSkillIdentity';
import { detectV600Playstyles } from '../src/lib/efootballV600Playstyles';

const stylesHtml=`
<h2>All Offensive Playing Styles</h2><table><tr><td>Future Runner</td><td>test</td></tr></table>
<h2>All Defensive Playing Styles</h2><table><tr><td>Future Shield</td><td>test</td></tr><tr><td>Solo Rumor</td><td>test</td></tr></table>
<p>Now that you have a full overview</p>`;
const skillsHtml=`
<h2>All Shooting Skills</h2><ul><li>Future Skill: test</li></ul><h2>All Passing Skills</h2><ul></ul>
<h2>All Dribbling Skills</h2><ul></ul><h2>All Defending And Goalkeeper Skills</h2><ul></ul>
<h2>All All-Purpose Skills</h2><ul></ul><h2>All eFootball 2027 Showtime Skills</h2><ul></ul><p>Join The Conversation</p>`;
const sources=new Map<string,string>([
  ['OPERATION_SPORTS_STYLES',stylesHtml],
  ['OPERATION_SPORTS_SKILLS',skillsHtml],
  ['EFOOTBALL_LAB','Future Shield appears here. Future Runner is also documented.'],
  ['GAME8_SKILLS','Future Skill appears here.']
]);
const catalog=buildCuratedCatalogR124(sources,new Date('2026-08-28T12:00:00.000Z'));
assert.ok(catalog.playstyles.some((x:any)=>x.label==='Future Shield'&&x.phase==='DEFENSIVE'&&x.status==='confirmed'));
assert.ok(catalog.playstyles.some((x:any)=>x.label==='Future Runner'&&x.phase==='OFFENSIVE'&&x.status==='confirmed'));
assert.ok(catalog.skills.some((x:any)=>x.name==='Future Skill'&&x.status==='confirmed'));
assert.ok(catalog.observedCandidates.some((x:any)=>x.name==='Solo Rumor'&&x.sources.length===1));

assert.equal(canonicalSkillName('Shadow Hunt'),'Sombra veloz');
assert.equal(canonicalSkillName('Tap Trick'),'Tap Trick');
assert.notEqual(canonicalSkillName('Speeding Bullet'),'Sombra veloz');

const legacy=detectV600Playstyles('ESTILO DE JOGO: Infiltração');
assert.equal(legacy.offensive,'Infiltração');
assert.equal(legacy.defensive,'Básico');
console.log('r124 live discovery regression: ok');
