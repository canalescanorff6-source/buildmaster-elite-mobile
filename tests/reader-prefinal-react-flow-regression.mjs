import assert from 'node:assert/strict';
import http from 'node:http';
import { createRequire } from 'node:module';
import path from 'node:path';
import { buildReaderReviewHarness } from './helpers/reader-prefinal-react-harness.mjs';

const require = createRequire(import.meta.url);
let playwright;
try { playwright = require('playwright'); }
catch { playwright = require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, 'playwright')); }
const bundle = await buildReaderReviewHarness();
const server = http.createServer((_request, response) => {
  response.setHeader('Content-Type', 'text/html; charset=utf-8');
  response.end('<!doctype html><html><body><div id="root"></div><script>' + bundle.replaceAll('</script', '<\\/script') + '</script></body></html>');
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const url = `http://127.0.0.1:${server.address().port}`;
const browser = await playwright.chromium.launch({headless:true, executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH});
const attributes = {
  offensiveAwareness:'90',ballControl:'88',dribbling:'87',tightPossession:'82',lowPass:'71',loftedPass:'63',
  finishing:'96',heading:'88',placeKicking:'83',curl:'80',defensiveAwareness:'45',defensiveEngagement:'52',
  tackling:'43',aggression:'44',goalkeeperAwareness:'41',goalkeeperCatching:'41',goalkeeperParrying:'41',
  goalkeeperReflexes:'41',goalkeeperReach:'41',speed:'75',acceleration:'79',kickingPower:'94',jump:'92',
  physicalContact:'88',balance:'86',stamina:'85',
};
const originalPreview = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="20" height="30"><rect width="20" height="30" fill="blue"/></svg>');
const fixture = {
  confirmation:{playerName:'D. Drogba',level:'32',points:'62',preview:originalPreview,mainPosition:'CF',uncertainKeys:[]},
  manualFields:{playerName:'D. Drogba',level:'32',trainingPointsTotal:'62',attributes,nativeSkills:[]},position:'CF',
};
async function openReview(overrides={}) {
  const page = await browser.newPage();
  await page.addInitScript(input => {window.__reviewFixture=input;window.__reviewControl={requests:[]};}, {...fixture,...overrides});
  await page.goto(url);
  await page.getByRole('heading', {name:'Confira antes de gerar a ficha'}).waitFor();
  return page;
}
async function requests(page) { return page.evaluate(() => window.__reviewControl.requests); }
async function resolve(page, outcome) { await page.evaluate(value => window.__reviewControl.resolve(value), outcome); }

try {
  // Reinstating the eager-clear effect hides the form while this promise is pending.
  const pending = await openReview();
  await pending.getByRole('textbox', {name:'Nome do jogador',exact:true}).fill('Drogba conferido');
  await pending.getByRole('button', {name:'Gerar ficha',exact:true}).click();
  await pending.waitForFunction(() => window.__reviewControl.requests.length === 1);
  assert.equal((await requests(pending))[0].confirmed, true, 'Dados completos devem seguir a confirmação final protegida.');
  assert.equal(await pending.getByRole('heading', {name:'Confira antes de gerar a ficha'}).count(), 1, 'A conferência deve permanecer visível durante a geração assíncrona.');
  const busyButton = pending.getByRole('button', {name:'Gerando ficha...'});
  assert.equal(await busyButton.isDisabled(), true, 'Geração pendente deve mostrar progresso e bloquear novo envio.');
  assert.equal(await pending.getByAltText('Print original usado na leitura').getAttribute('src'), originalPreview);
  await resolve(pending, {status:'review',persistenceStarted:false});
  await pending.getByRole('button', {name:'Gerar ficha',exact:true}).waitFor();
  assert.equal(await pending.getByRole('textbox', {name:'Nome do jogador',exact:true}).inputValue(), 'Drogba conferido', 'Revisão deve conservar o nome confirmado, mesmo se a análise reidratar campos.');
  await pending.getByRole('textbox', {name:'Nome do jogador',exact:true}).fill('Drogba corrigido');
  await pending.getByRole('button', {name:'Gerar ficha',exact:true}).click();
  await pending.waitForFunction(() => window.__reviewControl.requests.length === 2);
  assert.equal((await requests(pending))[1].fields.playerName, 'Drogba corrigido', 'Nova tentativa deve usar a edição atual.');
  await resolve(pending, {status:'completed',persistenceStarted:true});
  await pending.getByText('Ficha gerada', {exact:true}).waitFor();
  assert.equal(await pending.getByRole('heading', {name:'Confira antes de gerar a ficha'}).count(), 0);
  await pending.close();

  const failed = await openReview();
  await failed.getByRole('button', {name:'Gerar ficha',exact:true}).click();
  await failed.waitForFunction(() => window.__reviewControl.requests.length === 1);
  await resolve(failed, {status:'failed',persistenceStarted:false});
  await failed.getByRole('button', {name:'Gerar ficha',exact:true}).waitFor();
  assert.equal(await failed.getByRole('button', {name:'Gerar ficha',exact:true}).isEnabled(), true, 'Falha anterior à persistência deve permitir nova tentativa.');
  assert.equal(await failed.getByRole('textbox', {name:'Nome do jogador',exact:true}).inputValue(), 'D. Drogba');
  await failed.close();

  const uncertainPersistence = await openReview();
  await uncertainPersistence.getByRole('button', {name:'Gerar ficha',exact:true}).click();
  await uncertainPersistence.waitForFunction(() => window.__reviewControl.requests.length === 1);
  await resolve(uncertainPersistence, {status:'failed',persistenceStarted:true});
  await uncertainPersistence.getByText(/A gravação da ficha já começou/).waitFor();
  assert.equal(await uncertainPersistence.getByRole('button', {name:'Gerar ficha',exact:true}).isDisabled(), true, 'Persistência iniciada deve impedir uma confirmação duplicada.');
  await uncertainPersistence.close();

  const thrown = await openReview();
  await thrown.getByRole('textbox', {name:'Nome do jogador',exact:true}).fill('Nome preservado após erro');
  await thrown.getByRole('button', {name:'Gerar ficha',exact:true}).click();
  await thrown.waitForFunction(() => window.__reviewControl.requests.length === 1);
  await thrown.evaluate(() => window.__reviewControl.reject(new Error('Resposta interrompida')));
  await thrown.getByText(/Não foi possível confirmar a geração/).first().waitFor();
  assert.equal(await thrown.getByRole('textbox', {name:'Nome do jogador',exact:true}).inputValue(), 'Nome preservado após erro');
  assert.equal(await thrown.getByRole('button', {name:'Gerar ficha',exact:true}).isDisabled(), true, 'Erro sem resultado explícito não pode reenviar uma geração de persistência desconhecida.');
  await thrown.close();

  for (const outcome of ['review','error']) {
    const changed = await openReview();
    await changed.getByRole('button', {name:'Gerar ficha',exact:true}).click();
    await changed.waitForFunction(() => window.__reviewControl.requests.length === 1);
    await changed.evaluate(() => window.__reviewControl.closeReview());
    await changed.getByRole('heading', {name:'Confira antes de gerar a ficha'}).waitFor({state:'detached'});
    await changed.evaluate(input => window.__reviewControl.openReview(input), {
      ...fixture, confirmation:{...fixture.confirmation,playerName:'Nova carta'},
      manualFields:{...fixture.manualFields,playerName:'Nova carta',attributes:{...attributes,finishing:'91'}},
    });
    await changed.getByRole('heading', {name:'Confira antes de gerar a ficha'}).waitFor();
    await changed.getByText('Atributos da carta: 26/26', {exact:true}).click();
    if (outcome === 'review') await resolve(changed, {status:'review',persistenceStarted:false});
    else await changed.evaluate(() => window.__reviewControl.reject(new Error('Resposta antiga interrompida')));
    await changed.evaluate(() => new Promise(requestAnimationFrame));
    assert.equal(await changed.getByRole('textbox', {name:'Finalização',exact:true}).inputValue(), '91', 'Resposta de uma conferência desmontada não pode restaurar atributos na carta seguinte.');
    assert.equal(await changed.getByRole('region', {name:'Confirmação antes da ficha'}).getByRole('status').textContent(), 'Nova carta em conferência.', 'Erro de leitura antiga não pode substituir o estado da nova carta.');
    await changed.close();
  }

  // Concatenating slash-separated level digits would send 132 instead of max 32.
  const edits = await openReview();
  await edits.getByRole('textbox', {name:/^Nível máximo da carta/}).fill('1/32');
  assert.equal(await edits.getByRole('textbox', {name:/^Nível máximo da carta/}).inputValue(), '32');
  assert.equal(await edits.getByRole('textbox', {name:'Pontos de progressão disponíveis',exact:true}).inputValue(), '62');
  await edits.getByRole('textbox', {name:'Pontos de progressão disponíveis',exact:true}).fill('60');
  await edits.getByRole('textbox', {name:/^Nível máximo da carta/}).fill('34');
  assert.equal(await edits.getByRole('textbox', {name:'Pontos de progressão disponíveis',exact:true}).inputValue(), '60', 'Alterar nível deve preservar os pontos corrigidos pelo usuário.');
  await edits.getByRole('button', {name:'Gerar ficha',exact:true}).click();
  assert.equal((await requests(edits)).length, 0, 'Orçamento divergente exige conferência explícita antes de gerar.');
  await edits.getByRole('checkbox', {name:/Conferi o nível e os pontos/}).check();
  await edits.getByRole('button', {name:'Gerar ficha',exact:true}).click();
  await edits.waitForFunction(() => window.__reviewControl.requests.length === 1);
  assert.equal((await requests(edits))[0].fields.level, '34');
  assert.equal((await requests(edits))[0].fields.trainingPointsTotal, '60');
  await resolve(edits, {status:'completed',persistenceStarted:true});
  await edits.close();

  const partial = await openReview({manualFields:{...fixture.manualFields,attributes:{...attributes,goalkeeperCatching:'',goalkeeperReach:''}}});
  assert.match(await partial.getByRole('group', {name:'Conferência de atributos incompletos'}).textContent(), /Sem leitura: Firmeza de GO, Alcance de GO/);
  await partial.getByRole('checkbox', {name:/Aceito gerar uma prévia incompleta/}).check();
  await partial.getByRole('button', {name:'Gerar prévia',exact:true}).click();
  await partial.waitForFunction(() => window.__reviewControl.requests.length === 1);
  assert.equal((await requests(partial))[0].confirmed, false, '24/26 atributos devem abrir prévia sem tentar salvar como ficha final.');
  await resolve(partial, {status:'preview',persistenceStarted:false});
  await partial.getByText('Prévia da ficha', {exact:true}).waitFor();
  assert.equal(await partial.getByRole('heading', {name:'Confira antes de gerar a ficha'}).count(), 0, 'Prévia concluída deve sair da conferência, sem ficar presa no aviso de certificação.');
  await partial.close();

  const repaired = await openReview({manualFields:{...fixture.manualFields,attributes:{...attributes,goalkeeperCatching:'',goalkeeperReach:''}}});
  await repaired.getByText('Atributos da carta: 24/26', {exact:true}).click();
  await repaired.getByRole('textbox', {name:'Firmeza de GO',exact:true}).fill('41');
  await repaired.getByRole('textbox', {name:'Alcance de GO',exact:true}).fill('41');
  assert.equal(await repaired.getByRole('group', {name:'Conferência de atributos incompletos'}).count(), 0, 'Lista de ausentes deve desaparecer após corrigir todos os atributos.');
  await repaired.getByRole('button', {name:'Gerar ficha',exact:true}).click();
  await repaired.waitForFunction(() => window.__reviewControl.requests.length === 1);
  assert.equal((await requests(repaired))[0].confirmed, true);
  await resolve(repaired, {status:'completed',persistenceStarted:true});
  await repaired.getByText('Ficha gerada', {exact:true}).waitFor();
  await repaired.close();

  const cleared = await openReview();
  await cleared.getByText('Atributos da carta: 26/26', {exact:true}).click();
  await cleared.getByRole('textbox', {name:'Finalização',exact:true}).fill('');
  await cleared.getByText(/Ficha provisória: 25 de 26 atributos/).waitFor();
  await cleared.getByRole('checkbox', {name:/Aceito gerar uma prévia incompleta/}).check();
  await cleared.getByRole('button', {name:'Gerar prévia',exact:true}).click();
  await cleared.waitForFunction(() => window.__reviewControl.requests.length === 1);
  assert.equal((await requests(cleared))[0].fields.attributes.finishing, '', 'Atributo apagado na conferência deve chegar vazio ao gerador.');
  await resolve(cleared, {status:'review',persistenceStarted:false});
  await cleared.getByRole('button', {name:'Gerar prévia',exact:true}).waitFor();
  assert.equal(await cleared.getByRole('textbox', {name:'Finalização',exact:true}).inputValue(), '');
  await cleared.close();

  const incomplete = await openReview({
    confirmation:{...fixture.confirmation,mainPosition:'',uncertainKeys:['mainPosition','attributes']},
    manualFields:{...fixture.manualFields,attributes:{}},position:'AUTO',
  });
  await incomplete.getByRole('button', {name:'Gerar prévia',exact:true}).click();
  assert.equal((await requests(incomplete)).length, 0, 'Posição natural ausente deve impedir geração silenciosa.');
  await incomplete.getByLabel('Posição natural da carta', {exact:true}).selectOption('CF');
  await incomplete.getByLabel('Onde o jogador vai jogar?', {exact:true}).selectOption('LWF');
  await incomplete.getByRole('button', {name:'Gerar prévia',exact:true}).click();
  assert.equal((await requests(incomplete)).length, 0, 'Atributos insuficientes devem impedir geração silenciosa.');
  await incomplete.getByText('Atributos da carta: 0/26',{exact:true}).click();
  for (const [label,value] of [['Talento ofensivo','90'],['Controle de bola','88'],['Drible','87'],['Condução firme','82'],['Passe rasteiro','71'],['Passe alto','63'],['Finalização','96'],['Cabeçada','88'],['Bola parada','83'],['Curva','80']]) await incomplete.getByRole('textbox',{name:label,exact:true}).fill(value);
  await incomplete.getByText(/Ficha provisória: 10 de 26 atributos/).waitFor();
  await incomplete.getByRole('button', {name:'Gerar prévia',exact:true}).click();
  assert.equal((await requests(incomplete)).length, 0, 'Ficha incompleta exige aceite visível.');
  await incomplete.getByRole('checkbox', {name:/Aceito gerar uma prévia incompleta/}).check();
  await incomplete.getByRole('button', {name:'Gerar prévia',exact:true}).click();
  await incomplete.waitForFunction(() => window.__reviewControl.requests.length === 1);
  assert.equal((await requests(incomplete))[0].naturalPosition, 'CF');
  assert.equal((await requests(incomplete))[0].targetPosition, 'LWF');
  assert.equal((await requests(incomplete))[0].fields.attributes.finishing, '96');
  await resolve(incomplete, {status:'review',persistenceStarted:false});
  await incomplete.close();
  console.log('Pré-ficha React: geração pendente, preservação, retry, nível/PP, posição e atributos conferidos.');
} finally {
  await browser.close();
  await new Promise((resolve,reject) => server.close(error => error ? reject(error) : resolve()));
}
