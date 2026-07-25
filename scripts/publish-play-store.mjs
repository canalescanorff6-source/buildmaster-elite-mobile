import fs from 'node:fs';

const required = (name) => {
  const value = String(process.env[name] || '').trim();
  if (!value) throw new Error(`${name} não configurado.`);
  return value;
};
const token = required('GOOGLE_OAUTH_ACCESS_TOKEN');
const packageName = required('PLAY_PACKAGE_NAME');
const aabPath = required('AAB_PATH');
const track = required('PLAY_TRACK');
const status = String(process.env.PLAY_RELEASE_STATUS || 'draft');
const fraction = Math.max(0.01, Math.min(1, Number(process.env.PLAY_USER_FRACTION || 1)));
const notesPath = process.env.PLAY_RELEASE_NOTES_FILE;
const notes = notesPath && fs.existsSync(notesPath) ? fs.readFileSync(notesPath, 'utf8').trim().slice(0, 500) : 'Atualização do BuildMaster Elite Tático.';
const headers = { Authorization: `Bearer ${token}` };
async function json(url, options = {}) {
  const response = await fetch(url, { ...options, headers: { ...headers, 'Content-Type': 'application/json', ...(options.headers || {}) } });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`${response.status} ${JSON.stringify(payload)}`);
  return payload;
}
const base = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(packageName)}`;
const edit = await json(`${base}/edits`, { method: 'POST', body: '{}' });
try {
  const uploadUrl = `https://androidpublisher.googleapis.com/upload/androidpublisher/v3/applications/${encodeURIComponent(packageName)}/edits/${edit.id}/bundles?uploadType=media`;
  const upload = await fetch(uploadUrl, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/octet-stream' }, body: fs.readFileSync(aabPath) });
  const bundle = await upload.json().catch(() => null);
  if (!upload.ok || !bundle?.versionCode) throw new Error(`Upload AAB falhou: ${upload.status} ${JSON.stringify(bundle)}`);
  const release = {
    versionCodes: [String(bundle.versionCode)], status,
    releaseNotes: [{ language: 'pt-BR', text: notes }],
    inAppUpdatePriority: Number(process.env.PLAY_UPDATE_PRIORITY || 3)
  };
  if (status === 'inProgress') release.userFraction = fraction;
  await json(`${base}/edits/${edit.id}/tracks/${encodeURIComponent(track)}`, { method: 'PUT', body: JSON.stringify({ track, releases: [release] }) });
  const committed = await json(`${base}/edits/${edit.id}:commit`, { method: 'POST', body: '{}' });
  console.log(JSON.stringify({ editId: committed.id, versionCode: bundle.versionCode, track, status, userFraction: release.userFraction || 1 }, null, 2));
} catch (error) {
  await fetch(`${base}/edits/${edit.id}`, { method: 'DELETE', headers }).catch(() => undefined);
  throw error;
}
