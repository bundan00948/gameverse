import { Link } from '@tanstack/react-router';
import { queryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Identity } from '@/features/dashboard/roles';
import { PlayerAvatar, PlayerName } from '@/features/dashboard/player-identity';
import { cn } from '@/lib/utils';

export type CreditRow = { id: string; user_id: string; description: string; sort: number };
export const creditsOptions = () => queryOptions({ queryKey: ['credits'], staleTime: 60_000, queryFn: async () => {
  const r = await supabase.from('credits').select('id, user_id, description, sort').order('sort').order('created_at');
  if (r.error) throw new Error(r.error.message);
  return r.data as CreditRow[];
} });

export interface CreditPlateProps { identity?: Identity | undefined; description: string; size: 'big' | 'medium' | 'small' }
/** A credited player's nameplate: banner background, picture, name and short description; links to their stats. */
export function CreditPlate({ identity, description, size }: CreditPlateProps) {
  const name = identity?.displayName || identity?.username || 'Player';
  const avatar = size === 'big' ? 'size-24 md:size-28' : size === 'medium' ? 'size-20' : 'size-14';
  const body = <div className={cn('relative flex h-full items-center gap-4 overflow-hidden rounded-2xl border-4 border-white/40 bg-tile-a p-4 text-white shadow-lg transition-transform hover:-translate-y-0.5', size === 'small' ? 'min-h-28' : 'min-h-44 md:min-h-56')}
    style={identity?.bannerImage ? { backgroundImage: `url(${identity.bannerImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}>
    <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent" />
    <PlayerAvatar name={name} identity={identity} className={cn('relative', avatar)} />
    <div className="relative min-w-0">
      <p className={cn('truncate drop-shadow', size === 'big' ? 'text-3xl md:text-4xl' : size === 'medium' ? 'text-2xl' : 'text-xl')}><PlayerName name={name} identity={identity} /></p>
      {description && <p className={cn('mt-1 line-clamp-3 font-semibold text-white/90', size === 'small' ? 'text-sm' : 'text-base')}>{description}</p>}
    </div>
  </div>;
  return identity?.codeId ? <Link to="/stats/view/$id" params={{ id: identity.codeId }} preload={false} className="block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring">{body}</Link> : body;
}
