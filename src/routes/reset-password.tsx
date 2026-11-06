import { createFileRoute } from '@tanstack/react-router';
import { PasswordForm } from '@/features/account/password-form';
export const Route = createFileRoute('/reset-password')({ head: () => ({ meta: [{ title: 'Reset password — GameVerse' }, { name: 'description', content: 'Reset password for your GameVerse account.' }, { property: 'og:title', content: 'Reset password — GameVerse' }, { property: 'og:description', content: 'Reset password for your GameVerse account.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }), component: Page });
function Page() { return <PasswordForm recovery=true />; }
