import { describe, expect, it } from 'vitest';
import { gameEmbedUrl } from '@/features/dashboard/game-embed';
describe('Game embed links', () => {
  it('accepts HTTPS game links with query parameters', () => {
    expect(gameEmbedUrl(' https://example.org/play?game=2048 ')).toBe('https://example.org/play?game=2048');
  });
  it.each(['javascript:alert(1)', 'data:text/html,hello', 'http://example.org', 'https://user:pass@example.org', 'not a url'])('rejects unsafe embed link %s', value => {
    expect(gameEmbedUrl(value)).toBeNull();
  });
});