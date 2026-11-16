import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { usePlayer } from '@/features/account/session';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { NewsText } from './news-text';
import { NewsInteractions } from './news-interactions';
export function NewsPopup() {
 const user=usePlayer();const cache=useQueryClient();
 const {data}=useQuery({queryKey:['login-news',user?.id],enabled:!!user,staleTime:Infinity,queryFn:async()=>{const [m,d]=await Promise.all([supabase.from('mail').select('id,title,body,image_url,poll_options,question_enabled').eq('popup',true).eq('kind','system').order('created_at',{ascending:false}).limit(50),supabase.from('news_popup_dismissals').select('mail_id')]);if(m.error)throw m.error;if(d.error)throw d.error;return m.data.filter(n=>!d.data.some(x=>x.mail_id===n.id));}});
 const notice=data?.[0];
 const dismiss=useMutation({mutationFn:async()=>{if(!user || !notice)return;const r=await supabase.from('news_popup_dismissals').upsert({mail_id:notice.id,user_id:user.id},{ignoreDuplicates:true});if(r.error)throw r.error;},onSuccess:()=>void cache.invalidateQueries({queryKey:['login-news']})});
 if(!notice)return null;
 return <Dialog open onOpenChange={open=>{if(!open)dismiss.mutate();}}><DialogContent aria-describedby={undefined} className="max-h-[85dvh] overflow-y-auto border-surface-border bg-surface"><DialogTitle><NewsText text={notice.title}/></DialogTitle>{notice.image_url && <img src={notice.image_url} alt="" className="w-full rounded-md"/>}<p className="whitespace-pre-line"><NewsText text={notice.body}/></p><NewsInteractions id={notice.id} options={notice.poll_options} question={notice.question_enabled}/>{dismiss.error && <p role="alert" className="text-destructive">{dismiss.error.message}</p>}<Button onClick={()=>dismiss.mutate()} disabled={dismiss.isPending}>Dismiss</Button></DialogContent></Dialog>;
}
