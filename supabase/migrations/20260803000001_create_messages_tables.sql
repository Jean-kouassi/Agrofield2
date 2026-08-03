-- Migration: Create Internal Messaging Tables
-- Date: 2026-08-03
-- Description: Système de messagerie interne pour la marketplace

-- Table: conversations (conversations entre utilisateurs)
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participant_2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES public.marketplace_listings(id) ON DELETE SET NULL,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Contrainte : une seule conversation par paire d'utilisateurs + listing
  UNIQUE(participant_1_id, participant_2_id, listing_id)
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_conversations_participant_1 ON public.conversations(participant_1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participant_2 ON public.conversations(participant_2_id);
CREATE INDEX IF NOT EXISTS idx_conversations_listing ON public.conversations(listing_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON public.conversations(last_message_at DESC);

-- Trigger updated_at
DROP TRIGGER IF EXISTS conversations_updated_at ON public.conversations;
CREATE TRIGGER conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies pour conversations
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Les participants peuvent voir la conversation
CREATE POLICY "Participants can view conversations"
  ON public.conversations FOR SELECT
  TO authenticated
  USING (participant_1_id = auth.uid() OR participant_2_id = auth.uid());

-- Les participants peuvent créer une conversation
CREATE POLICY "Users can create conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (participant_1_id = auth.uid() OR participant_2_id = auth.uid());

-- Les participants peuvent mettre à jour (pour last_message_at)
CREATE POLICY "Participants can update conversations"
  ON public.conversations FOR UPDATE
  USING (participant_1_id = auth.uid() OR participant_2_id = auth.uid());

-- Table: messages (messages dans les conversations)
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_by_sender BOOLEAN NOT NULL DEFAULT false,
  deleted_by_receiver BOOLEAN NOT NULL DEFAULT false
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON public.messages(is_read, created_at) WHERE is_read = false;

-- Trigger updated_at (optionnel, pas de colonne updated_at ici)

-- RLS Policies pour messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Les participants peuvent voir les messages
CREATE POLICY "Participants can view messages"
  ON public.messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
      AND (c.participant_1_id = auth.uid() OR c.participant_2_id = auth.uid())
    )
  );

-- Les utilisateurs peuvent envoyer des messages
CREATE POLICY "Users can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (sender_id = auth.uid());

-- Les utilisateurs peuvent marquer leurs messages comme lus
CREATE POLICY "Users can update message read status"
  ON public.messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
      AND (c.participant_1_id = auth.uid() OR c.participant_2_id = auth.uid())
    )
  );

-- Fonction pour obtenir ou créer une conversation
CREATE OR REPLACE FUNCTION get_or_create_conversation(
  p_participant_2_id UUID,
  p_listing_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_conversation_id UUID;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  -- Essayer de trouver une conversation existante
  SELECT id INTO v_conversation_id
  FROM public.conversations
  WHERE (
    (participant_1_id = v_user_id AND participant_2_id = p_participant_2_id)
    OR
    (participant_1_id = p_participant_2_id AND participant_2_id = v_user_id)
  )
  AND (
    (listing_id IS NULL AND p_listing_id IS NULL)
    OR (listing_id = p_listing_id)
  )
  LIMIT 1;
  
  -- Si aucune conversation trouvée, en créer une nouvelle
  IF v_conversation_id IS NULL THEN
    INSERT INTO public.conversations (participant_1_id, participant_2_id, listing_id, created_at, updated_at)
    VALUES (v_user_id, p_participant_2_id, p_listing_id, now(), now())
    RETURNING id INTO v_conversation_id;
  END IF;
  
  RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour compter les messages non lus
CREATE OR REPLACE FUNCTION get_unread_messages_count()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.messages m
  JOIN public.conversations c ON m.conversation_id = c.id
  WHERE m.is_read = false
  AND m.sender_id != auth.uid()
  AND (c.participant_1_id = auth.uid() OR c.participant_2_id = auth.uid());
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE public.conversations IS 'Conversations entre utilisateurs de la marketplace';
COMMENT ON TABLE public.messages IS 'Messages échangés dans les conversations';
COMMENT ON FUNCTION public.get_or_create_conversation IS 'Obtient ou crée une conversation entre deux utilisateurs';
COMMENT ON FUNCTION public.get_unread_messages_count IS 'Compte les messages non lus pour l''utilisateur actuel';
