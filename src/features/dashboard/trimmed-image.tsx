import { useEffect, useState, type ImgHTMLAttributes } from 'react';

const cache = new Map<string, string>();

/** Trim uniform white / transparent margins so the artwork fills the frame. */
async function trimImage(src: string): Promise<string> {
  const hit = cache.get(src);
  if (hit) return hit;
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.crossOrigin = 'anonymous';
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error('load failed'));
    el.src = src;
  });
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return src;
  ctx.drawImage(img, 0, 0);
  const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const solid = (i: number) => { const r = data[i] ?? 0, g = data[i + 1] ?? 0, b = data[i + 2] ?? 0, a = data[i + 3] ?? 0; return a >= 16 && !(r > 242 && g > 242 && b > 242); };
  let top = 0, bottom = height - 1, left = 0, right = width - 1;
  scan: for (; top <= bottom; top++) for (let x = 0; x < width; x++) if (solid((top * width + x) * 4)) break scan;
  scan2: for (; bottom >= top; bottom--) for (let x = 0; x < width; x++) if (solid((bottom * width + x) * 4)) break scan2;
  scan3: for (; left <= right; left++) for (let y = top; y <= bottom; y++) if (solid((y * width + left) * 4)) break scan3;
  scan4: for (; right >= left; right--) for (let y = top; y <= bottom; y++) if (solid((y * width + right) * 4)) break scan4;
  if (right < left || bottom < top) return src;
  const w = right - left + 1, h = bottom - top + 1;
  if (w === width && h === height) { cache.set(src, src); return src; }
  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  out.getContext('2d')?.drawImage(canvas, left, top, w, h, 0, 0, w, h);
  const url = out.toDataURL('image/png');
  cache.set(src, url);
  return url;
}

export interface TrimmedImageProps extends ImgHTMLAttributes<HTMLImageElement> { src: string; }
/** Image with white/transparent margins auto-trimmed; falls back to the original on failure. */
export function TrimmedImage({ src, ...props }: TrimmedImageProps) {
  const [trimmed, setTrimmed] = useState(cache.get(src) ?? src);
  useEffect(() => {
    let live = true;
    setTrimmed(cache.get(src) ?? src);
    trimImage(src).then(url => { if (live) setTrimmed(url); }).catch(() => {});
    return () => { live = false; };
  }, [src]);
  return <img src={trimmed} {...props} />;
}
