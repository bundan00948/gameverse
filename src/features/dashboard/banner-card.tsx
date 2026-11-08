import { forwardRef, type HTMLAttributes, type CSSProperties } from 'react';
import { cn } from '@/lib/utils';
import token from '@/assets/icons/gameverse-token.webp.asset.json';
import { safeColor, rarityDefaults } from './appearance';
import type { BannerDraft } from './banners';
export interface BannerCardProps extends HTMLAttributes<HTMLDivElement> { banner: BannerDraft; colors?: Record<string,string>; variant?: 'market' | 'preview'; size?: 'default' | 'compact' }
/** Wide banner art with a rarity label spanning the token-price footer seam. */
export const BannerCard = forwardRef<HTMLDivElement, BannerCardProps>(function BannerCard({ banner, colors = rarityDefaults, variant = 'market', size = 'default', className, style, children, ...props }, ref) {
 const color = safeColor(colors[banner.rarity], rarityDefaults[banner.rarity] ?? 'var(--secondary)');
 return <div ref={ref} {...props} data-variant={variant} data-size={size} className={cn('gv-banner-card', className)} style={{ ...style, '--banner-rarity': color } as CSSProperties}><h3 className="gv-banner-title">{banner.name || 'Untitled'}</h3><div className="gv-banner-art">{banner.image_url && <img src={banner.image_url} alt={banner.name} loading="lazy" decoding="async" />}</div><div className="gv-banner-footer"><span className="gv-banner-rarity">{banner.rarity}</span><span className="gv-banner-price"><img src={token.url} alt="Tokens" />{banner.price.toLocaleString()}</span></div>{children}</div>;
});
