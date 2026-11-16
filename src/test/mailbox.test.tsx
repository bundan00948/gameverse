import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Mailbox } from '@/features/mail/mailbox';
vi.mock('@/features/mail/news-text', () => ({ NewsText: ({ text }: { text: string }) => <span>{text}</span> }));
afterEach(cleanup);
it('opens legacy cached system messages without poll fields', () => {
 const client = new QueryClient({defaultOptions:{queries:{retry:false}}});
 client.setQueryData(['mail'], [{id:'legacy',user_id:null,kind:'system',title:'Older notice',body:'Existing message',image_url:null,created_at:new Date().toISOString(),read:true}]);
 render(<QueryClientProvider client={client}><Mailbox /></QueryClientProvider>);
 fireEvent.click(screen.getByRole('button',{name:'Mail'}));
 expect(screen.getByRole('dialog')).toBeInTheDocument();
 expect(screen.getByRole('heading',{name:'Older notice'})).toBeInTheDocument();
 client.clear();
});