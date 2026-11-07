ALTER TABLE public.games ADD COLUMN image_url text;
COMMENT ON COLUMN public.games.image_url IS 'Admin-uploaded application icon for the Games grid.';
COMMENT ON COLUMN public.games.play_url IS 'HTTPS embed URL opened inside the GameVerse player.';