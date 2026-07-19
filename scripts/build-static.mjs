import { existsSync, mkdirSync, renameSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { sanitizeUpdateSource } from './sanitize-update-source.mjs';

const tempRoot = '.buildmaster-static-disabled';
const moves = [
  ['src/app/api', `${tempRoot}/api`],
  ['middleware.ts', `${tempRoot}/middleware.ts`],
];
const moved = [];

function restoreInterruptedBuild() {
  for (const [from, backup] of moves) {
    if (!existsSync(from) && existsSync(backup)) {
      mkdirSync(from.split('/').slice(0, -1).join('/') || '.', { recursive: true });
      renameSync(backup, from);
    }
  }
}

try {
  // Remove qualquer manifesto antigo que tenha permanecido no repositório.
  sanitizeUpdateSource();
  // Se um processo anterior foi interrompido durante o build, restaura primeiro
  // os arquivos de servidor antes de limpar a pasta temporária.
  restoreInterruptedBuild();
  rmSync(tempRoot, { recursive: true, force: true });
  mkdirSync(tempRoot, { recursive: true });

  for (const [from, to] of moves) {
    if (existsSync(from)) {
      renameSync(from, to);
      moved.push([to, from]);
    }
  }

  // Next.js 16 usa Turbopack por padrão. No export estático ele evita a etapa
  // de rastreamento NFT do servidor, que não é necessária dentro do APK.
  const result = spawnSync(process.execPath, ['node_modules/next/dist/bin/next', 'build'], {
    stdio: 'inherit',
    env: { ...process.env, BUILDMASTER_ANDROID_STATIC: '1' },
  });
  if (result.status !== 0) process.exitCode = result.status ?? 1;
} finally {
  for (const [from, to] of moved.reverse()) {
    if (existsSync(from) && !existsSync(to)) renameSync(from, to);
  }
  restoreInterruptedBuild();
  rmSync(tempRoot, { recursive: true, force: true });
}
