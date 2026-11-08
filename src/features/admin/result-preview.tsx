import { forwardRef, type HTMLAttributes, type CSSProperties } from 'react';
import { BlookArt } from '@/features/dashboard/blook-art';
import { safeColor } from '@/features/dashboard/appearance';
import tokenIcon from '@/assets/icons/gameverse-token.webp.asset.json';
import { cn } from '@/lib/utils';

export interface ResultPreviewProps extends HTMLAttributes<HTMLElement> {
  variant?: 'pack' | 'art';
  name: string;
  image?: string | null;
  pattern?: string | null;
  start?: string;
  end?: string;
  price?: number;
}
/** Non-interactive preview of the current unsaved artwork and appearance. */
export const ResultPreview = forwardRef<HTMLElement, ResultPreviewProps>(function ResultPreview({ variant = 'art', name, image, pattern, start, end, price, children, className, ...props }, ref) {
  return <figure ref={ref} {...props} className={cn('min-w-0 space-y-3', className)}>
    <figcaption className="flex flex-wrap items-center justify-between gap-2 text-sm font-bold">Result <span className="text-xs font-normal text-muted-foreground">Unsaved preview</span></figcaption>
    {variant === 'pack' ? <div className="market-pack mx-auto w-full max-w-64" style={{ '--pack-start': safeColor(start, 'var(--market-start)'), '--pack-end': safeColor(end, 'var(--market-end)') } as CSSProperties}>
      <span className="market-pack-art">{pattern && <img src={pattern} alt="" className="market-pack-pattern" />}<BlookArt src={image ?? null} alt={name} className="market-pack-picture" />{!image && <span className="market-pack-name">{name}</span>}</span>
      <span className="market-pack-price"><img src={tokenIcon.url} alt="Tokens" className="size-8 object-contain" />{price ?? 0}</span>
    </div> : <div className="flex min-w-0 flex-col items-center gap-3 py-3"><BlookArt src={image ?? null} alt={name} className="size-32" /><span className="max-w-full break-words text-center font-bold">{name}</span></div>}
    {children}
  </figure>;
});