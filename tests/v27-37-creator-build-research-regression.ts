import assert from 'node:assert/strict';
import type { AnalysisResult } from '../src/lib/analyzerDomain';
import {
  buildCreatorBuildConsensus,
  creatorSearchUrls,
  creatorTrainingCost,
  parseCreatorTrainingText,
  scoreCreatorSourceForResult,
  type CreatorBuildSource
} from '../src/lib/creatorBuildResearch';

const result = {
  parsed: {
    playerName: 'Lionel Messi',
    cardType: 'Epic',
    specialTag: 'Big Time 2015',
    mainPosition: 'SS',
    maxOverall: 105,
    internalId: 'messi-epic-2015'
  },
  bestPosition: { code: 'SS', label: 'SA', score: 96 },
  trainingPointsTotal: 60,
  trainingPointsUsed: 58,
  training: {
    shooting: 8, passing: 4, dribbling: 8, dexterity: 10, lowerBodyStrength: 8,
    aerialStrength: 0, defending: 0, gk1: 0, gk2: 0, gk3: 0
  }
} as unknown as AnalysisResult;

const baseSource: CreatorBuildSource = {
  id: 'source-1',
  platform: 'YOUTUBE',
  authority: 'PRO_PLAYER',
  device: 'MOBILE',
  url: 'https://www.youtube.com/watch?v=test123',
  title: 'Best Messi Build',
  channel: 'Pro Mobile',
  country: 'Brasil',
  publishedAt: '2026-07-20',
  reviewedAt: '2026-07-22',
  testedInMatches: true,
  targetPosition: 'SS',
  playstyle: 'SA criador',
  card: {
    playerName: 'Lionel Messi',
    cardType: 'Epic',
    specialTag: 'Big Time 2015',
    mainPosition: 'SS',
    maxOverall: 105,
    trainingPointsTotal: 60
  },
  training: {
    shooting: 8, passing: 4, dribbling: 8, dexterity: 10, lowerBodyStrength: 8,
    aerialStrength: 0, defending: 0, gk1: 0, gk2: 0, gk3: 0
  },
  notes: 'Testado na Divisão 1.'
};

const secondSource: CreatorBuildSource = {
  ...baseSource,
  id: 'source-2',
  authority: 'TOP_RANK',
  url: 'https://www.tiktok.com/@toprank/video/123456789',
  channel: 'Top Rank Global',
  training: { ...baseSource.training, passing: 5, dexterity: 9 }
};

const wrongCard: CreatorBuildSource = {
  ...baseSource,
  id: 'source-3',
  url: 'https://www.youtube.com/watch?v=wrong456',
  card: { ...baseSource.card, specialTag: 'Argentina 2022', maxOverall: 103, trainingPointsTotal: 56 }
};

const match = scoreCreatorSourceForResult(baseSource, result);
assert.equal(match.exactCard, true);
assert.ok(match.score >= 90);

const wrongMatch = scoreCreatorSourceForResult(wrongCard, result);
assert.equal(wrongMatch.exactCard, false);
assert.ok(wrongMatch.warnings.length >= 2);

const consensus = buildCreatorBuildConsensus(result, [baseSource, secondSource, wrongCard]);
assert.equal(consensus.sourceCount, 2);
assert.equal(consensus.exactCardCount, 2);
assert.equal(consensus.training.shooting, 8);
assert.ok([4, 5].includes(consensus.training.passing));
assert.ok(consensus.confidence > 50);

const cost = creatorTrainingCost(baseSource.training);
assert.equal(cost.totalCost, 58);
assert.equal(cost.costByBlock.dexterity, 18);


const parsedLabels = parseCreatorTrainingText('Finalização +8 Passe +4 Drible +8 Destreza +10 Força das pernas +8 Bola aérea +0 Defesa +0');
assert.equal(parsedLabels.training.shooting, 8);
assert.equal(parsedLabels.training.dexterity, 10);
assert.equal(parsedLabels.matchedKeys.length, 7);
assert.ok(parsedLabels.confidence >= 90);

const parsedSequence = parseCreatorTrainingText('+8 +4 +8 +10 +8 +0 +0');
assert.equal(parsedSequence.training.passing, 4);
assert.equal(parsedSequence.training.lowerBodyStrength, 8);
assert.equal(parsedSequence.method, 'sequence');

const urls = creatorSearchUrls(result);
assert.match(urls.youtube, /youtube\.com\/results/);
assert.match(urls.tiktok, /tiktok\.com\/search/);
assert.match(decodeURIComponent(urls.youtube), /Lionel Messi/);

console.log('✓ Pesquisa de fichas: carta exata, YouTube/TikTok, blocos, custo e consenso ponderado aprovados.');
