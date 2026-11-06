import { createFileRoute } from '@tanstack/react-router';
import { PasswordForm } from '@/features/account/password-form';
export const Route = createFileRoute('/forgot-password')({ head: () => ({ meta: [{ title: 'Forgot password — GameVerse' }, { name: 'description', content: 'Forgot password for your GameVerse account.' }, { property: 'og:title', content: 'Forgot password — GameVerse' }, { property: 'og:description', content: 'Forgot password for your GameVerse account.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }), component: Page });
function Page() { return <PasswordForm recovery=false />; }
