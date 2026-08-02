'use client';

import { useRef, useState, type ChangeEvent } from 'react';
import { Camera, ImagePlus, Trash2, UserRound } from 'lucide-react';
import { createProfileAvatar } from '@/lib/profileAvatar';

type Props = {
  avatar: string | null;
  username: string;
  onChange: (avatar: string) => void;
  onRemove: () => void;
};

export function ProfileAvatarEditor({ avatar, username, onChange, onRemove }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('A foto fica salva para esta conta neste aparelho.');
  const initial = username.trim().slice(0, 1).toUpperCase() || 'B';

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setBusy(true);
    try {
      const next = await createProfileAvatar(file);
      onChange(next);
      setMessage('Foto salva. Ela continuará após sair e entrar novamente.');
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'Não foi possível salvar a foto.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="bm-v35-avatar-editor" aria-label="Foto de perfil">
      <div className="bm-v35-avatar-preview">
        {avatar ? <img src={avatar} alt="Foto de perfil atual" /> : <span>{initial}</span>}
        <i aria-hidden="true"><Camera size={15}/></i>
      </div>
      <div className="bm-v35-avatar-copy">
        <strong>Foto de perfil</strong>
        <span>{message}</span>
      </div>
      <div className="bm-v35-avatar-actions">
        <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp,image/heic,image/heif" onChange={handleFile} hidden />
        <button type="button" onClick={() => inputRef.current?.click()} disabled={busy}>
          {busy ? <UserRound size={17}/> : <ImagePlus size={17}/>} {busy ? 'Preparando…' : 'Escolher foto'}
        </button>
        {avatar && <button type="button" className="danger" onClick={onRemove}><Trash2 size={17}/> Remover</button>}
      </div>
    </section>
  );
}
