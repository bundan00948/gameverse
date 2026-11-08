import { roleTextStyle, type Identity } from './roles';
import { cn } from '@/lib/utils';

export interface PlayerAvatarProps { name: string; identity?: Identity | undefined; className?: string }
/** Player picture: their chosen blook, or their first initial. */
export function PlayerAvatar({ name, identity, className }: PlayerAvatarProps) {
  if (identity?.avatar) return <img src={identity.avatar} alt="" className={cn('size-9 shrink-0 rounded-lg border-2 border-border/60 bg-glass object-cover', className)} />;
  return <span aria-hidden className={cn('font-display grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground', className)}>{name[0]?.toUpperCase()}</span>;
}

export interface BadgeRowProps { identity?: Identity | undefined; size?: 'sm' | 'lg' }
export function BadgeList({ identity, size = 'sm' }: BadgeRowProps) {
  if (!identity?.badges.length) return null;
  const s = size === 'lg' ? 'size-7' : 'size-4';
  return <span className="inline-flex flex-wrap items-center gap-1">{identity.badges.map(b => b.image_url
    ? <img key={b.id} src={b.image_url} alt={b.name} title={b.name} className={`${s} object-contain`} />
    : <span key={b.id} title={b.name} className="rounded bg-glass-hover px-1 text-[10px] font-bold">{b.name}</span>)}</span>;
}

export interface PlayerNameProps { name: string; identity?: Identity | undefined; className?: string }
/** Name painted in the player's highest role colors. */
export function PlayerName({ name, identity, className }: PlayerNameProps) {
  return <span className={cn('font-display', className)} style={roleTextStyle(identity?.role?.colors)}>{name}</span>;
}
