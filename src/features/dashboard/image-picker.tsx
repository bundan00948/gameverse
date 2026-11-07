import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BlookArt } from './blook-art';
import { Button } from '@/components/ui/button';

export interface ImagePickerProps { value: string | null; label: string; onChange: (url: string | null) => void; }
export function ImagePicker({ value, label, onChange }: ImagePickerProps) {
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const upload = async (file: File) => {
    setBusy(true); setErr('');
    try {
      const path = `${crypto.randomUUID()}.${file.name.split('.').pop() || 'png'}`;
      const up = await supabase.storage.from('art').upload(path, file, { contentType: file.type });
      if (up.error) throw up.error;
      const signed = await supabase.storage.from('art').createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
      if (signed.error) throw signed.error;
      onChange(signed.data.signedUrl);
    } catch (e) { setErr(e instanceof Error ? e.message : 'Upload failed'); } finally { setBusy(false); }
  };
  return <div className="flex flex-wrap items-end gap-2 text-xs"><span className="w-full font-bold">{label}</span>
    <BlookArt src={value} alt="Picture preview" className="size-16 rounded-md bg-surface" />
    <label className="cursor-pointer rounded-md bg-tile-b px-3 py-2 font-bold text-primary-foreground focus-within:ring-2 focus-within:ring-ring">{busy ? 'Uploading…' : value ? 'Change picture' : 'Upload picture'}
      <input type="file" aria-label={label} accept="image/png,image/jpeg,image/webp,image/gif" className="sr-only" disabled={busy} onChange={e => { const file = e.target.files?.[0]; if (file) upload(file); e.target.value = ''; }} /></label>
    {value && <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}>Remove</Button>}
    {err && <span role="alert" className="text-destructive">{err}</span>}
  </div>;
}