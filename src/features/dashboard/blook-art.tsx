import { cn } from '@/lib/utils';

/** Square, blook-sized picture frame. Shows the uploaded image, falling back to the old emoji. */
export function BlookArt({ src, emoji, alt, className }: { src?: string | null; emoji?: string | null; alt: string; className?: string }) {
  return (
    <span className={cn('inline-grid aspect-square size-12 shrink-0 place-items-center overflow-hidden leading-none', className)}>
      {src ? <img src={src} alt={alt} loading="lazy" draggable={false} className="size-full object-contain [image-rendering:auto]" /> : <span aria-label={alt} className="text-[0.75em]">{emoji}</span>}
    </span>
  );
}
