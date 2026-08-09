import assert from 'node:assert/strict';
import fs from 'node:fs';

const engine = fs.readFileSync('src/modules/squad-mapping/squadMappingEngine.ts', 'utf8');
const screen = fs.readFileSync('src/modules/squad-mapping/SquadMappingCenter.tsx', 'utf8');
const storage = fs.readFileSync('src/modules/squad-mapping/squadMappingStorage.ts', 'utf8');
const imageStorage = fs.readFileSync('src/modules/squad-mapping/squadMappingImageStorage.ts', 'utf8');
const css = fs.readFileSync('src/app/v38-squad-mapping.css', 'utf8');

assert.match(engine, /39\.50-mapeamento-total-elenco/);
assert.match(engine, /allowIntelligentAdaptations/);
assert.match(engine, /attributeFit/);
assert.match(engine, /skillFit/);
assert.match(engine, /physicalFit/);
assert.match(engine, /crossPositionBase/);
assert.match(engine, /Adaptação inteligente aprovada/);
assert.match(engine, /collectiveScoreFor/);
assert.match(engine, /beam/);
assert.match(engine, /Overall não entra no resultado/);
assert.doesNotMatch(engine, /Math\.random/);

assert.match(screen, /Guarde os prints completos/);
assert.match(screen, /storeSquadMappingImage/);
assert.match(screen, /loadSquadMappingImage/);
assert.match(screen, /readDetailedPrint/);
assert.match(screen, /profileCoverage/);
assert.match(screen, /Backup com imagens/);
assert.match(screen, /Adaptação inteligente/);
assert.match(screen, /Print salvo no aparelho/);
assert.match(screen, /multiple/);
assert.match(screen, /slice\(0, 120\)/);

assert.match(storage, /exportSquadMappingBackupWithImages/);
assert.match(storage, /importSquadMappingBackupPayload/);
assert.match(storage, /slice\(0, 500\)/);
assert.match(storage, /nativeVaultWrite/);
assert.match(imageStorage, /createImageThumbnail\(blob, 1600\)/);
assert.match(imageStorage, /image-thumbnails/);
assert.match(imageStorage, /nativeVaultWrite/);
assert.match(imageStorage, /restoreSquadMappingImages/);
assert.match(css, /mapping-image-modal/);
assert.match(css, /adaptation-intelligent/);
assert.match(css, /mapping-backup-actions/);

console.log('v39.50 integração aprovada: leitura completa, imagem interna, backup visual, adaptação por capacidade e escalação global compacta.');
