ALTER TABLE public.blooks ALTER COLUMN pack_id DROP NOT NULL;
ALTER TABLE public.blooks DROP CONSTRAINT blooks_pack_id_fkey;
ALTER TABLE public.blooks ADD CONSTRAINT blooks_pack_id_fkey FOREIGN KEY (pack_id) REFERENCES public.packs(id) ON DELETE SET NULL;
COMMENT ON COLUMN public.blooks.pack_id IS 'Optional pack assignment. Deleting a pack unassigns the blook without deleting it or owned copies.';