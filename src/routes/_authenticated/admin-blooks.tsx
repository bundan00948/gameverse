import { createFileRoute, redirect } from '@tanstack/react-router';
import { meta } from '@/features/dashboard/page';

export const Route = createFileRoute('/_authenticated/admin-blooks')({
  head: () => meta('Blooks Admin', 'Manage GameVerse blooks inside the Admin Panel.'),
  beforeLoad: () => { throw redirect({ to: '/admin', search: { tab: 'Blooks' }, replace: true }); },
});
