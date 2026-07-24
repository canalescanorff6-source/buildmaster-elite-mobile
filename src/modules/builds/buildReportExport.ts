import type { AnalysisResult } from '@/lib/analyzer';

const trainingLabels: Record<string, string> = {
  shooting: 'Finalização',
  passing: 'Passe',
  dribbling: 'Drible',
  dexterity: 'Destreza',
  lowerBodyStrength: 'Força pernas',
  aerialStrength: 'Bola aérea',
  defending: 'Defesa',
  gk1: 'Goleiro 1',
  gk2: 'Goleiro 2',
  gk3: 'Goleiro 3'
};

const teamMapLabels: Record<string, string> = {
  marcacao: 'Marcação',
  cobertura: 'Cobertura',
  saidaDeBola: 'Saída de bola',
  passe: 'Passe',
  criacao: 'Criação',
  aceleracao: 'Aceleração',
  finalizacao: 'Ataque/finalização',
  jogoAereo: 'Jogo aéreo',
  fisico: 'Físico'
};

export function downloadBlobFile(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function buildProfessionalReportHtml(result: AnalysisResult, notes = '', autoPrint = false) {
  const trainingRows = Object.entries(result.training)
    .filter(([, value]) => Number(value) > 0)
    .map(([key, value]) => `<tr><td>${escapeHtml(trainingLabels[key] ?? key)}</td><td>+${escapeHtml(value)}</td><td>${escapeHtml(result.trainingCost[key as keyof typeof result.trainingCost] ?? 0)} pts</td></tr>`)
    .join('');
  const skills = result.recommendedSkills.slice(0, 5).map((skill, index) => `<li><b>${index + 1}.</b> ${escapeHtml(skill)}</li>`).join('');
  const avoid = result.avoidSkills.slice(0, 7).map((skill) => `<span>${escapeHtml(skill)}</span>`).join('');
  const impetos = result.recommendedImpetos.filter((item) => item.tier !== 'evitar').slice(0, 5).map((item) => `<li><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.reason)}</small></li>`).join('');
  const tips = result.usageTips.slice(0, 6).map((tip) => `<li>${escapeHtml(tip)}</li>`).join('');
  const explanation = result.recommendationExplanation.slice(0, 6).map((line) => `<li>${escapeHtml(line)}</li>`).join('');
  const teamMap = result.teamMap?.sectorScores ? Object.entries(result.teamMap.sectorScores).map(([key, value]) => `<div><span>${escapeHtml(teamMapLabels[key] ?? key)}</span><b>${escapeHtml(value)}/100</b></div>`).join('') : '';

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>BuildMaster Elite — ${escapeHtml(result.parsed.playerName)}</title>
<style>
  :root { color-scheme: dark; --bg:#030712; --panel:#0b1220; --muted:#9fb1c8; --text:#f8fafc; --accent:#34d399; --gold:#f7c76b; --stroke:#243044; }
  * { box-sizing: border-box; }
  body { margin:0; font-family: Inter, Arial, sans-serif; background: radial-gradient(circle at top, #12332b, #030712 45%, #020617); color: var(--text); padding: 28px; }
  .sheet { max-width: 920px; margin: 0 auto; border: 1px solid var(--stroke); border-radius: 28px; overflow: hidden; background: linear-gradient(145deg, rgba(15,23,42,.98), rgba(2,6,23,.98)); box-shadow: 0 26px 80px rgba(0,0,0,.35); }
  header { padding: 30px; background: linear-gradient(135deg, rgba(52,211,153,.18), rgba(247,199,107,.12)); display:grid; gap: 16px; }
  .brand { text-transform: uppercase; letter-spacing: .14em; color: var(--gold); font-size: 12px; font-weight: 900; }
  h1 { margin: 0; font-size: clamp(30px, 5vw, 52px); line-height: .95; }
  .subtitle { margin:0; color: var(--muted); font-size: 15px; }
  .metrics { display:grid; grid-template-columns: repeat(4, 1fr); gap: 10px; padding: 18px 30px; background: rgba(255,255,255,.035); border-block: 1px solid var(--stroke); }
  .metric { padding: 14px; border-radius: 18px; border: 1px solid var(--stroke); background: rgba(255,255,255,.04); }
  .metric span { display:block; color: var(--muted); font-size: 12px; font-weight: 800; }
  .metric b { display:block; font-size: 20px; margin-top: 4px; color: #fff; }
  section { padding: 22px 30px; border-bottom: 1px solid var(--stroke); }
  h2 { margin: 0 0 14px; font-size: 20px; }
  table { width:100%; border-collapse: collapse; overflow: hidden; border-radius: 16px; }
  td, th { padding: 12px; border-bottom: 1px solid var(--stroke); text-align:left; }
  th { color: var(--gold); font-size: 12px; text-transform: uppercase; letter-spacing: .08em; }
  ul { margin:0; padding-left: 18px; }
  li { margin: 8px 0; }
  .skills { list-style: none; padding:0; display:grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  .skills li { margin:0; padding: 12px 14px; border:1px solid rgba(52,211,153,.25); border-radius: 16px; background: rgba(52,211,153,.08); }
  .skills b { color: var(--accent); margin-right: 8px; }
  .impetos { list-style:none; padding:0; display:grid; gap: 10px; }
  .impetos li { padding: 12px 14px; border:1px solid var(--stroke); border-radius: 16px; background: rgba(255,255,255,.04); }
  .impetos small { display:block; color: var(--muted); margin-top: 5px; }
  .avoid { display:flex; flex-wrap:wrap; gap: 8px; }
  .avoid span { border:1px solid rgba(248,113,113,.32); color:#fecaca; background: rgba(127,29,29,.22); padding: 8px 11px; border-radius: 999px; font-weight: 800; font-size: 12px; }
  .team { display:grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
  .team div { padding:12px; border:1px solid var(--stroke); border-radius: 16px; background: rgba(255,255,255,.04); }
  .team span { display:block; color: var(--muted); font-size: 12px; }
  .team b { font-size: 18px; }
  .notes { white-space: pre-wrap; color: var(--muted); }
  footer { padding: 18px 30px; color: var(--muted); font-size: 12px; display:flex; justify-content: space-between; gap: 12px; }
  @media print { body { background:#fff; color:#111827; padding:0; } .sheet { box-shadow:none; border:0; border-radius:0; max-width:none; } header, section, .metrics, footer { break-inside: avoid; } }
  @media (max-width: 720px) { body { padding: 12px; } .metrics, .team, .skills { grid-template-columns: 1fr; } header, section, .metrics, footer { padding-inline: 18px; } }
</style>
</head>
<body>
<main class="sheet">
  <header>
    <div class="brand">BuildMaster Elite Tático • Relatório profissional</div>
    <h1>${escapeHtml(result.parsed.playerName)}</h1>
    <p class="subtitle">${escapeHtml(result.teamMap?.functionLabel ?? result.buildName)} • ${escapeHtml(result.parsed.mainPositionPt)} • ${escapeHtml(result.parsed.playstyle ?? 'Estilo não informado')}</p>
  </header>
  <div class="metrics">
    <div class="metric"><span>Posição escolhida</span><b>${escapeHtml(result.bestPosition.label)}</b></div>
    <div class="metric"><span>Pontos</span><b>${escapeHtml(result.trainingPointsUsed)}/${escapeHtml(result.trainingPointsTotal)}</b></div>
    <div class="metric"><span>PRI em campo</span><b>${escapeHtml(result.pri.GER)}</b></div>
    <div class="metric"><span>Confiança</span><b>${escapeHtml(result.parsed.confidence)}%</b></div>
  </div>
  <section><h2>Ficha de treino</h2><table><thead><tr><th>Atributo</th><th>Treino</th><th>Custo</th></tr></thead><tbody>${trainingRows || '<tr><td colspan="3">Sem pontos distribuídos.</td></tr>'}</tbody></table></section>
  <section><h2>Top 5 habilidades adicionais</h2><ul class="skills">${skills || '<li>Nenhuma habilidade segura encontrada.</li>'}</ul></section>
  <section><h2>Ímpetos recomendados</h2><ul class="impetos">${impetos || '<li>Nenhum ímpeto recomendado com segurança.</li>'}</ul></section>
  <section><h2>Evitar nesta função</h2><div class="avoid">${avoid || '<span>Nenhum alerta crítico.</span>'}</div></section>
  <section><h2>Mapa do jogador no time</h2><div class="team">${teamMap || '<div><span>Mapa</span><b>Não disponível</b></div>'}</div></section>
  <section><h2>Como usar em campo</h2><ul>${tips}</ul></section>
  <section><h2>Por que esta ficha?</h2><ul>${explanation}</ul></section>
  ${notes ? `<section><h2>Observações pessoais</h2><div class="notes">${escapeHtml(notes)}</div></section>` : ''}
  <footer><span>Gerado em ${new Date().toLocaleString('pt-BR')}</span><span>Ficha validada para desempenho real em campo</span></footer>
</main>
${autoPrint ? `<script>window.addEventListener('load',()=>window.setTimeout(()=>window.print(),350),{once:true});</script>` : ''}
</body>
</html>`;
}

export function buildProfessionalCardSvg(result: AnalysisResult) {
  const training = Object.entries(result.training)
    .filter(([, value]) => Number(value) > 0)
    .slice(0, 8)
    .map(([key, value]) => `${trainingLabels[key] ?? key} +${value}`);
  const skills = result.recommendedSkills.slice(0, 5);
  const impetos = result.recommendedImpetos.filter((item) => item.tier !== 'evitar').slice(0, 3).map((item) => item.name);
  const safeTraining = training.length ? training : ['Sem pontos distribuídos'];
  const safeSkills = skills.length ? skills : ['Nenhuma habilidade segura'];
  const safeImpetos = impetos.length ? impetos : ['Nenhum ímpeto seguro'];
  const row = (text: string, y: number, color = '#e5e7eb') => `<text x="70" y="${y}" fill="${color}" font-size="28" font-weight="700">${escapeHtml(text)}</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#052e2b"/><stop offset="0.42" stop-color="#071323"/><stop offset="1" stop-color="#020617"/></linearGradient>
      <linearGradient id="gold" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f7c76b"/><stop offset="1" stop-color="#34d399"/></linearGradient>
      <filter id="shadow"><feDropShadow dx="0" dy="22" stdDeviation="22" flood-color="#000" flood-opacity="0.45"/></filter>
    </defs>
    <rect width="1080" height="1350" rx="54" fill="url(#bg)"/>
    <circle cx="930" cy="110" r="250" fill="#34d399" opacity="0.13"/>
    <circle cx="80" cy="1260" r="280" fill="#f7c76b" opacity="0.10"/>
    <rect x="46" y="44" width="988" height="1262" rx="44" fill="rgba(15,23,42,.72)" stroke="#2c3d55" stroke-width="2" filter="url(#shadow)"/>
    <text x="70" y="106" fill="#f7c76b" font-size="24" font-weight="900" letter-spacing="4">BUILDMASTER ELITE TÁTICO</text>
    <text x="70" y="178" fill="#ffffff" font-size="62" font-weight="900">${escapeHtml(result.parsed.playerName)}</text>
    <text x="70" y="226" fill="#9fb1c8" font-size="28" font-weight="700">${escapeHtml(result.teamMap?.functionLabel ?? result.buildName)} • ${escapeHtml(result.bestPosition.label)}</text>
    <rect x="70" y="270" width="940" height="148" rx="28" fill="rgba(255,255,255,.06)" stroke="#26374f"/>
    <text x="106" y="328" fill="#9fb1c8" font-size="22" font-weight="800">PONTOS</text><text x="106" y="376" fill="#fff" font-size="42" font-weight="900">${escapeHtml(result.trainingPointsUsed)}/${escapeHtml(result.trainingPointsTotal)}</text>
    <text x="372" y="328" fill="#9fb1c8" font-size="22" font-weight="800">PRI</text><text x="372" y="376" fill="#fff" font-size="42" font-weight="900">${escapeHtml(result.pri.GER)}</text>
    <text x="566" y="328" fill="#9fb1c8" font-size="22" font-weight="800">ESTILO</text><text x="566" y="376" fill="#fff" font-size="32" font-weight="900">${escapeHtml(result.parsed.playstyle ?? '—')}</text>
    <text x="70" y="480" fill="#34d399" font-size="30" font-weight="900">Ficha de treino</text>
    ${safeTraining.map((item, i) => row(item, 535 + i * 42)).join('')}
    <text x="70" y="910" fill="#34d399" font-size="30" font-weight="900">Top 5 habilidades</text>
    ${safeSkills.map((item, i) => row(`${i + 1}. ${item}`, 965 + i * 42)).join('')}
    <text x="570" y="910" fill="#f7c76b" font-size="30" font-weight="900">Ímpetos</text>
    ${safeImpetos.map((item, i) => `<text x="570" y="${965 + i * 42}" fill="#e5e7eb" font-size="28" font-weight="700">${escapeHtml(item)}</text>`).join('')}
    <rect x="70" y="1180" width="940" height="76" rx="24" fill="url(#gold)" opacity="0.96"/>
    <text x="102" y="1228" fill="#03110d" font-size="27" font-weight="900">${escapeHtml((result.usageTips[0] ?? 'Use conforme a função real em campo.').slice(0, 78))}</text>
  </svg>`;
}

export function formatReportMarkdown(result: AnalysisResult, notes = '') {
  const training = Object.entries(result.training)
    .filter(([, value]) => Number(value) > 0)
    .map(([key, value]) => `- ${trainingLabels[key] ?? key}: +${value} (${result.trainingCost[key as keyof typeof result.trainingCost]} pts)`)
    .join('\n');
  return [
    `# BuildMaster Elite — ${result.parsed.playerName}`,
    '',
    `**Função real:** ${result.teamMap?.functionLabel ?? result.buildName}`,
    `**Posição da carta:** ${result.parsed.mainPositionPt}`,
    `**Posição escolhida:** ${result.bestPosition.label}`,
    `**Estilo:** ${result.parsed.playstyle ?? 'Não informado'}`,
    `**Pontos:** ${result.trainingPointsUsed}/${result.trainingPointsTotal}`,
    '',
    '## Ficha de treino',
    training || '- Sem pontos distribuídos.',
    '',
    '## Top 5 habilidades adicionais',
    ...(result.recommendedSkills.slice(0, 5).map((skill) => `- ${skill}`)),
    '',
    '## Ímpetos recomendados',
    ...(result.recommendedImpetos.filter((item) => item.tier !== 'evitar').slice(0, 5).map((item) => `- ${item.name}: ${item.reason}`)),
    '',
    '## Evitar',
    ...(result.avoidSkills.slice(0, 6).map((skill) => `- ${skill}`)),
    '',
    '## Como usar em campo',
    ...(result.usageTips.slice(0, 6).map((tip) => `- ${tip}`)),
    '',
    notes ? `## Observações\n${notes}` : ''
  ].join('\n');
}
