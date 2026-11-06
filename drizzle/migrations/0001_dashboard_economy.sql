CREATE TABLE public.games (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL, description text NOT NULL DEFAULT '', emoji text NOT NULL DEFAULT '🎮', play_url text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.packs (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, emoji text NOT NULL DEFAULT '📦', color text NOT NULL DEFAULT 'tile-a', price int NOT NULL DEFAULT 20 CHECK (price >= 0), sort int NOT NULL DEFAULT 0);
CREATE TABLE public.blooks (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), pack_id uuid NOT NULL REFERENCES public.packs(id) ON DELETE CASCADE, name text NOT NULL, emoji text NOT NULL, rarity text NOT NULL DEFAULT 'common', weight int NOT NULL DEFAULT 10 CHECK (weight > 0));
CREATE TABLE public.missions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL, kind text NOT NULL CHECK (kind IN ('plays','packs','messages')), goal int NOT NULL CHECK (goal > 0), reward int NOT NULL DEFAULT 10);
CREATE TABLE public.wallets (user_id uuid PRIMARY KEY, tokens int NOT NULL DEFAULT 100, packs_opened int NOT NULL DEFAULT 0, last_claim date);
CREATE TABLE public.user_blooks (user_id uuid NOT NULL, blook_id uuid NOT NULL REFERENCES public.blooks(id) ON DELETE CASCADE, quantity int NOT NULL DEFAULT 1, PRIMARY KEY (user_id, blook_id));
CREATE TABLE public.game_plays (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE, played_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.mission_claims (user_id uuid NOT NULL, mission_id uuid NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE, claimed_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (user_id, mission_id));
CREATE TABLE public.chat_messages (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL DEFAULT auth.uid(), username text NOT NULL DEFAULT '', body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 300), created_at timestamptz NOT NULL DEFAULT now());

GRANT SELECT ON public.games, public.packs, public.blooks, public.missions TO authenticated;
GRANT SELECT ON public.wallets, public.user_blooks, public.game_plays, public.mission_claims TO authenticated;
GRANT SELECT, INSERT ON public.chat_messages TO authenticated;
GRANT ALL ON public.games, public.packs, public.blooks, public.missions, public.wallets, public.user_blooks, public.game_plays, public.mission_claims, public.chat_messages TO service_role;

ALTER TABLE public.games ENABLE ROW LEVEL SECURITY; ALTER TABLE public.packs ENABLE ROW LEVEL SECURITY; ALTER TABLE public.blooks ENABLE ROW LEVEL SECURITY; ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY; ALTER TABLE public.user_blooks ENABLE ROW LEVEL SECURITY; ALTER TABLE public.game_plays ENABLE ROW LEVEL SECURITY; ALTER TABLE public.mission_claims ENABLE ROW LEVEL SECURITY; ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read games" ON public.games FOR SELECT TO authenticated USING (true);
CREATE POLICY "read packs" ON public.packs FOR SELECT TO authenticated USING (true);
CREATE POLICY "read blooks" ON public.blooks FOR SELECT TO authenticated USING (true);
CREATE POLICY "read missions" ON public.missions FOR SELECT TO authenticated USING (true);
CREATE POLICY "own wallet" ON public.wallets FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own blooks" ON public.user_blooks FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own plays" ON public.game_plays FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own claims" ON public.mission_claims FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "read chat" ON public.chat_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "send chat" ON public.chat_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.ensure_wallet() RETURNS public.wallets LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE w public.wallets; BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
 INSERT INTO wallets(user_id) VALUES (auth.uid()) ON CONFLICT DO NOTHING;
 SELECT * INTO w FROM wallets WHERE user_id = auth.uid(); RETURN w; END $$;

CREATE OR REPLACE FUNCTION public.open_pack(_pack uuid) RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p public.packs; b public.blooks; w public.wallets; total int; pick int; BEGIN
 w := ensure_wallet();
 SELECT * INTO p FROM packs WHERE id = _pack; IF NOT FOUND THEN RAISE EXCEPTION 'Pack not found'; END IF;
 IF w.tokens < p.price THEN RAISE EXCEPTION 'Not enough tokens'; END IF;
 SELECT sum(weight) INTO total FROM blooks WHERE pack_id = _pack; IF total IS NULL THEN RAISE EXCEPTION 'Pack is empty'; END IF;
 pick := floor(random() * total)::int;
 FOR b IN SELECT * FROM blooks WHERE pack_id = _pack ORDER BY weight DESC, id LOOP pick := pick - b.weight; EXIT WHEN pick < 0; END LOOP;
 UPDATE wallets SET tokens = tokens - p.price, packs_opened = packs_opened + 1 WHERE user_id = auth.uid();
 INSERT INTO user_blooks(user_id, blook_id) VALUES (auth.uid(), b.id) ON CONFLICT (user_id, blook_id) DO UPDATE SET quantity = user_blooks.quantity + 1;
 RETURN json_build_object('name', b.name, 'emoji', b.emoji, 'rarity', b.rarity); END $$;

CREATE OR REPLACE FUNCTION public.claim_daily() RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE w public.wallets; BEGIN w := ensure_wallet();
 IF w.last_claim = current_date THEN RAISE EXCEPTION 'Already claimed today'; END IF;
 UPDATE wallets SET tokens = tokens + 50, last_claim = current_date WHERE user_id = auth.uid(); RETURN 50; END $$;

CREATE OR REPLACE FUNCTION public.record_play(_game uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN PERFORM ensure_wallet(); INSERT INTO game_plays(user_id, game_id) VALUES (auth.uid(), _game); END $$;

CREATE OR REPLACE FUNCTION public.mission_progress(_kind text) RETURNS int LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT CASE _kind WHEN 'plays' THEN (SELECT count(*)::int FROM game_plays WHERE user_id = auth.uid())
  WHEN 'packs' THEN coalesce((SELECT packs_opened FROM wallets WHERE user_id = auth.uid()), 0)
  ELSE (SELECT count(*)::int FROM chat_messages WHERE user_id = auth.uid()) END $$;

CREATE OR REPLACE FUNCTION public.claim_mission(_mission uuid) RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE m public.missions; BEGIN PERFORM ensure_wallet();
 SELECT * INTO m FROM missions WHERE id = _mission; IF NOT FOUND THEN RAISE EXCEPTION 'Mission not found'; END IF;
 IF mission_progress(m.kind) < m.goal THEN RAISE EXCEPTION 'Mission not complete yet'; END IF;
 INSERT INTO mission_claims(user_id, mission_id) VALUES (auth.uid(), _mission);
 UPDATE wallets SET tokens = tokens + m.reward WHERE user_id = auth.uid(); RETURN m.reward; END $$;

REVOKE EXECUTE ON FUNCTION public.ensure_wallet, public.open_pack, public.claim_daily, public.record_play, public.mission_progress, public.claim_mission FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ensure_wallet, public.open_pack, public.claim_daily, public.record_play, public.mission_progress, public.claim_mission TO authenticated;

INSERT INTO public.games(title, description, emoji, play_url) VALUES
 ('Star Dash','Dodge asteroids and race through space.','🚀',''),('Block Stack','Stack falling blocks as high as you can.','🧱',''),('Quiz Rush','Answer quick-fire trivia questions.','❓',''),('Tower Guard','Defend your base from waves of invaders.','🏰','');
WITH p AS (INSERT INTO public.packs(name, emoji, color, price, sort) VALUES ('Space Pack','🪐','tile-a',25,1),('Ocean Pack','🌊','tile-b',20,2),('Jungle Pack','🌴','tile-c',20,3),('Snack Pack','🍩','tile-d',15,4) RETURNING id, name)
INSERT INTO public.blooks(pack_id, name, emoji, rarity, weight) SELECT p.id, v.n, v.e, v.r, v.w FROM p JOIN (VALUES
 ('Space Pack','Alien','👽','common',50),('Space Pack','Robot','🤖','uncommon',30),('Space Pack','Comet','☄️','rare',15),('Space Pack','Galaxy','🌌','legendary',5),
 ('Ocean Pack','Fish','🐟','common',50),('Ocean Pack','Crab','🦀','uncommon',30),('Ocean Pack','Octopus','🐙','rare',15),('Ocean Pack','Whale','🐋','legendary',5),
 ('Jungle Pack','Parrot','🦜','common',50),('Jungle Pack','Monkey','🐒','uncommon',30),('Jungle Pack','Tiger','🐅','rare',15),('Jungle Pack','Dragon','🐉','legendary',5),
 ('Snack Pack','Cookie','🍪','common',50),('Snack Pack','Pizza','🍕','uncommon',30),('Snack Pack','Cupcake','🧁','rare',15),('Snack Pack','Golden Donut','🍩','legendary',5)
) AS v(pk,n,e,r,w) ON v.pk = p.name;
INSERT INTO public.missions(title, kind, goal, reward) VALUES ('Play 3 games','plays',3,20),('Open 2 packs','packs',2,25),('Send 5 chat messages','messages',5,15),('Play 10 games','plays',10,60);