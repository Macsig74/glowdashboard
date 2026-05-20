-- Table storing which users have access to which salon (page)
-- Salons: staff | servers | bbb
-- Admins (maxim, mystic) always have full access — no row needed for them.

CREATE TABLE IF NOT EXISTS gs_access (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  username   text NOT NULL,
  salon      text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (username, salon)
);
