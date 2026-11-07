import { cn } from '@/lib/utils';
import { forwardRef, type HTMLAttributes } from 'react';

export interface BlookArtProps extends HTMLAttributes<HTMLSpanElement> { src?: string | null; alt: string; }
/** Picture-only square artwork; missing artwork stays empty. */
export const BlookArt = forwardRef<HTMLSpanElement, BlookArtProps>(function BlookArt({ src, alt, className, ...props }, ref) {
  return (
    <span ref={ref} {...props} className={cn('inline-grid aspect-square size-12 shrink-0 place-items-center overflow-hidden leading-none', className)}>
      {src && <img src={src} alt={alt} loading="lazy" draggable={false} className="size-full object-contain" />}
    </span>
  );
});
