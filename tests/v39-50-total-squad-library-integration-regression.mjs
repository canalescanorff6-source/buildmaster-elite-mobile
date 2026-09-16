import fs from "node:fs";
import assert from "node:assert/strict";

const center = fs.readFileSync("src/modules/squad-mapping/SquadMappingCenter.tsx", "utf8");
const source = fs.readFileSync("src/modules/squad-mapping/squadMappingStorage.ts", "utf8");
const images = fs.readFileSync("src/modules/squad-mapping/squadMappingImageStorage.ts", "utf8");

assert.ok(source.includes("sanitizeMappingState"));
assert.ok(source.includes("sanitizePlayer"));
assert.ok(source.includes("sanitizeTrial"));
assert.ok(source.includes("runtimeGet"));
assert.ok(source.includes("runtimePut"));
assert.ok(source.includes("isNativeVaultStorageAvailable"));
assert.ok(source.includes("nativeVaultRead"));
assert.ok(source.includes("nativeVaultWrite"));
assert.ok(source.includes("imageRef"));
assert.ok(source.includes("imageBytes"));
assert.ok(source.includes("imageStored"));
assert.ok(source.includes("linkedHistoryId"));
assert.ok(source.includes("SQUAD_MAPPING_VERSION"));

assert.ok(images.includes("createImageThumbnail"));
assert.ok(images.includes("blobToDataUrl"));
assert.ok(images.includes("nativeVaultWrite"));
assert.ok(images.includes("runtimePut"));
assert.ok(images.includes("removeSquadMappingImage"));

assert.ok(center.includes("storeSquadMappingImage"));
assert.ok(center.includes("loadSquadMappingImage"));
assert.ok(center.includes("removeSquadMappingImage"));
assert.ok(center.includes("collectSquadMappingImages"));
assert.ok(center.includes("restoreSquadMappingImages"));
assert.ok(center.includes("exportSquadMappingBackupWithImages"));
assert.ok(center.includes("importSquadMappingBackupPayload"));

if (source.includes("map(sanitizePlayer)") && source.includes("SQUAD_MAPPING_STORAGE_KEY")) {
  assert.doesNotMatch(source, /source\.players[\s\S]{0,200}\.slice\(0,\s*500\)/);
  assert.doesNotMatch(source, /source\.trials[\s\S]{0,200}\.slice\(0,\s*100\)/);
}

console.log("Regressão v39.50: biblioteca total segura, rápida e sem teto artificial de jogadores aprovada.");
