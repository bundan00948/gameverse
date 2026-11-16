import { describe, expect, it } from 'vitest';
import { auditDuration, auditChangedFields } from '@/lib/admin-audit';

describe('Ban and panel action history', () => {
  it('shows the recorded ban duration', () => {
    expect(auditDuration({ duration_hours: 24, permanent: false })).toBe('24 hours');
    expect(auditDuration({ duration_hours: 168, permanent: false })).toBe('168 hours');
  });
  it('keeps permanent bans distinct from timed bans', () => {
    expect(auditDuration({ duration_hours: null, permanent: true })).toBe('Permanent');
  });
  it('includes all recorded change fields', () => {
    expect(auditChangedFields({ username: { before: 'Old', after: 'New' }, tokens: { before: 5, after: 10 } })).toEqual(['username', 'tokens']);
  });
});