import { existsSync, mkdirSync, renameSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const tempRoot = '.buildmaster-static-disabled';
const moves = [
  ['src/app/api', `${tempRoot}/api`],
  ['middleware.ts', `${tempRoot}/middleware.ts`],
];
const moved = [];

try {
  rmSync(tempRoot, { recursive: true, force: true });
  mkdirSync(tempRoot, { recursive: true });

  for (const [from, to] of moves) {
    if (existsSync(from)) {
      renameSync(from, to);
      moved.push([to, from]);
    }
  }

  const result = spawnSync(process.execPath, ['node_modules/next/dist/bin/next', 'build', '--webpack'], {
    stdio: 'inherit',
    env: { ...process.env, BUILDMASTER_ANDROID_STATIC: '1' },
  });
  if (result.status !== 0) process.exitCode = result.status ?? 1;
} finally {
  for (const [from, to] of moved.reverse()) {
    if (existsSync(from) && !existsSync(to)) renameSync(from, to);
  }
  rmSync(tempRoot, { recursive: true, force: true });
}
