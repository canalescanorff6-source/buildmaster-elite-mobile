import { existsSync, renameSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const moves = [
  ['src/app/api', 'src/app/_api_desativada_no_apk'],
  ['middleware.ts', 'middleware.desativado-no-apk.ts'],
];
const moved = [];
try {
  for (const [from, to] of moves) {
    if (existsSync(from) && !existsSync(to)) {
      renameSync(from, to);
      moved.push([to, from]);
    }
  }
  const result = spawnSync(process.execPath, ['node_modules/next/dist/bin/next', 'build'], {
    stdio: 'inherit',
    env: { ...process.env, BUILDMASTER_ANDROID_STATIC: '1' },
  });
  if (result.status !== 0) process.exitCode = result.status ?? 1;
} finally {
  for (const [from, to] of moved.reverse()) {
    if (existsSync(from) && !existsSync(to)) renameSync(from, to);
  }
}
