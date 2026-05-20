-- Tickets soumis depuis la page publique /accueil
CREATE TABLE IF NOT EXISTS gs_tickets (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  username   text NOT NULL,
  subject    text NOT NULL,
  status     text NOT NULL DEFAULT 'open', -- open | in_progress | closed
  created_at timestamptz DEFAULT now()
);

-- Messages d'un ticket (client + staff)
CREATE TABLE IF NOT EXISTS gs_ticket_messages (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id  uuid REFERENCES gs_tickets(id) ON DELETE CASCADE,
  sender     text NOT NULL,
  message    text NOT NULL,
  is_admin   boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Désactiver RLS (auth gérée par NextAuth côté API)
ALTER TABLE gs_tickets DISABLE ROW LEVEL SECURITY;
ALTER TABLE gs_ticket_messages DISABLE ROW LEVEL SECURITY;
