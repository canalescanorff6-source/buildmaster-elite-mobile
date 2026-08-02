import assert from 'node:assert/strict';

export function parseInternalVersion(value: string) {
  const match = String(value).trim().match(/^v?(\d+)\.(\d+)(?:\.(\d+))?/i);
  assert.ok(match, `Versão interna inválida: ${value}`);
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3] ?? 0),
    release: `${Number(match[1])}.${String(Number(match[2])).padStart(2, '0')}`
  };
}

export function internalVersionAtLeast(value: string, minimumMajor: number, minimumMinor: number, minimumPatch = 0) {
  const version = parseInternalVersion(value);
  if (version.major !== minimumMajor) return version.major > minimumMajor;
  if (version.minor !== minimumMinor) return version.minor > minimumMinor;
  return version.patch >= minimumPatch;
}

export function assertInternalVersionAtLeast(
  value: string,
  minimumMajor: number,
  minimumMinor: number,
  label: string,
  minimumPatch = 0
) {
  assert.ok(
    internalVersionAtLeast(value, minimumMajor, minimumMinor, minimumPatch),
    `${label} deve permanecer na v${minimumMajor}.${String(minimumMinor).padStart(2, '0')} ou posterior: ${value}`
  );
}
