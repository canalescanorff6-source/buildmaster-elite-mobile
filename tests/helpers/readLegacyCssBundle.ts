import fs from 'node:fs';
import path from 'node:path';

/**
 * Loads the legacy compatibility stylesheet exactly as the app receives it:
 * the entry file plus every split part in deterministic order.
 */
export function readLegacyCssBundle(): string {
  const entryPath = path.join('src', 'app', 'legacy-compat.css');
  const partsDirectory = path.join('src', 'app', 'legacy-compat');
  const parts = fs
    .readdirSync(partsDirectory)
    .filter((fileName) => /^part-\d+\.css$/u.test(fileName))
    .sort((left, right) => left.localeCompare(right, 'en'))
    .map((fileName) => fs.readFileSync(path.join(partsDirectory, fileName), 'utf8'));

  return [fs.readFileSync(entryPath, 'utf8'), ...parts].join('\n');
}
