import assert from 'node:assert/strict';

const { setActiveAccountIdentity } = require('../src/lib/accountStorage');
const safety = require('../src/modules/images/imageSafety');
const modulePath = require.resolve('../src/modules/images/accountImageLibrary');
const DB_A = 'buildmaster_tactical_image_library_v1__user-A';
const DB_B = 'buildmaster_tactical_image_library_v1__user-B';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

function identity(id: string) { setActiveAccountIdentity({ id, username: id, role: 'user', mode: 'cloud' }); }

function fixture(boundary: 'validation' | 'thumbnail' | 'database') {
  const entered = deferred<void>(), release = deferred<void>();
  const rows = new Map<string, string>();
  (globalThis as any).window = { localStorage: {
    getItem: (key: string) => rows.get(key) ?? null,
    setItem: (key: string, value: string) => rows.set(key, value),
    removeItem: (key: string) => rows.delete(key),
  } };
  identity('user-A');
  safety.validateImageFile = async (file: File) => {
    if (boundary === 'validation') { entered.resolve(); await release.promise; }
    return { kind: 'png', mime: 'image/png', width: 1, height: 1, size: file.size, sanitizedBlob: file, previewAvailable: boundary === 'thumbnail' };
  };
  safety.createImageThumbnail = async () => { entered.resolve(); await release.promise; return new Blob(['thumbnail']); };
  safety.createUnavailableImageThumbnail = () => new Blob(['thumbnail']);
  const galleries = new Map<string, Array<{ id: string }>>([[DB_A, [{ id: 'original-A-image' }]], [DB_B, [{ id: 'private-B-image' }]]]);
  const opens: string[] = [], writes: string[] = [];
  (globalThis as any).indexedDB = { open: (name: string) => {
    opens.push(name);
    const db = { transaction: () => {
      const tx: any = { objectStore: () => ({
        clear: () => {
          const request: any = {};
          queueMicrotask(() => { writes.push(name); galleries.set(name, []); request.onsuccess?.(); });
          return request;
        },
        put: (item: { id: string }) => {
          const request: any = {};
          queueMicrotask(() => { writes.push(name); galleries.get(name)!.push(item); request.onsuccess?.(); tx.oncomplete?.(); });
          return request;
        },
      }) };
      return tx;
    }, close: () => undefined };
    const request: any = { result: db };
    void (async () => {
      if (boundary === 'database') { entered.resolve(); await release.promise; }
      queueMicrotask(() => request.onsuccess?.());
    })();
    return request;
  } };
  delete require.cache[modulePath];
  return { library: require(modulePath) as typeof import('../src/modules/images/accountImageLibrary'), galleries, opens, writes, entered, release };
}

async function importAfterSwitch(boundary: 'validation' | 'thumbnail' | 'database') {
  const f = fixture(boundary);
  const pending = f.library.importTacticalImageLibrary([{ id: 'private-A-image', name: 'private-A.png', originalDataUrl: 'data:image/png;base64,YQ==' }])
    .then(() => 'committed', () => 'cancelled');
  await f.entered.promise;
  identity('user-B');
  f.release.resolve();
  const result = await pending;
  assert.deepEqual(f.galleries.get(DB_B), [{ id: 'private-B-image' }], 'A late A image import must never clear or overwrite the B gallery.');
  assert.deepEqual(f.galleries.get(DB_A), [{ id: 'original-A-image' }], 'Cancellation before the write must preserve the original A gallery too.');
  assert.equal(result, 'cancelled', 'A gallery restoration must cancel when its account changes before persistence.');
  assert.deepEqual(f.writes, []);
  assert.equal(f.opens.includes(DB_B), false, 'The image database owner must be captured before any asynchronous validation.');
}

async function main() {
  const failures: unknown[] = [];
  for (const boundary of ['validation', 'thumbnail', 'database'] as const) {
    try { await importAfterSwitch(boundary); console.log(`PASS: real image import after switch during ${boundary}`); }
    catch (error) { failures.push(error); console.error(`FAIL: real image import after switch during ${boundary}`, error); }
  }
  if (failures.length) throw new AggregateError(failures, `${failures.length} image owner-isolation regressions failed.`);
}

void main().catch((error) => { console.error(error); process.exitCode = 1; });
