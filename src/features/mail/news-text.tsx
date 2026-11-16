import { useQuery, queryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { appearanceOptions } from '@/features/dashboard/data';
import { rarityOrder } from '@/features/dashboard/blook-catalog';
import { rarityDefaults, rarityPaint } from '@/features/dashboard/appearance';
import { roleTextStyle } from '@/features/dashboard/roles';
import type { CSSProperties } from 'react';
export const newsRolesOptions = () => queryOptions({ queryKey: ['news-role-colors'], staleTime: 300000, queryFn: async () => { const r = await supabase.rpc('news_role_colors'); if (r.error) throw r.error; return r.data; } });
export interface NewsTextProps { text: string; className?: string }
export function NewsText({ text, className }: NewsTextProps) {
 const { data: colors } = useQuery(appearanceOptions());
 const { data: roles = [] } = useQuery(newsRolesOptions());
 const names = [...rarityOrder, ...roles.map(r => r.name)].sort((a,b) => b.length-a.length);
 const escaped = names.map(n => n.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));
 const parts = escaped.length ? text.split(new RegExp(`(?<![\\w])(${escaped.join('|')})(?![\\w])`,'gi')) : [text];
 return <span className={className}>{parts.map((part,i) => { const rarity = rarityOrder.find(r => r === part.toLowerCase()); const role = roles.find(r => r.name.toLowerCase() === part.toLowerCase()); const paint = rarity ? rarityPaint(colors?.[rarity],rarityDefaults[rarity] ?? 'var(--foreground)') : null; const style = paint ? { backgroundImage: paint.includes('gradient(') ? paint : `linear-gradient(${paint}, ${paint})`, color:'transparent', backgroundClip:'text', WebkitBackgroundClip:'text' } as CSSProperties : roleTextStyle(role?.colors); return <span key={i} style={style} className={rarity || role ? 'inline-block font-extrabold' : undefined}>{part}</span>; })}</span>;
}
