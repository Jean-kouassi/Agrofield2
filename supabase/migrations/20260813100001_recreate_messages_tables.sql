-- Migration: Recreate Messages and Conversations Tables
-- Date: 2026-08-13 10:00
-- Description: Recréer les tables de messagerie qui manquent dans la base

-- ============================================
-- TABLE: conversations
-- ============================================
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

DROP POLICY IF EXISTS "Participants can view conversations" ON public.conversations;
CREATE POLICY "Participants can view conversations"
  ON public.conversations FOR SELECT
  TO authenticated
  USING (participant_1_id = auth.uid() OR participant_2_id = auth.uid());

DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
CREATE POLICY "Users can create conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (participant_1_id = auth.uid() OR participant_2_id = auth.uid());

DROP POLICY IF EXISTS "Participants can update conversations" ON public.conversations;
CREATE POLICY "Participants can update conversations"
  ON public.conversations FOR UPDATE
  USING (participant_1_id = auth.uid() OR participant_2_id = auth.uid());

-- ============================================
-- TABLE: messages
-- ============================================
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

-- RLS Policies pour messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants can view messages" ON public.messages;
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

DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "Users can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (sender_id = auth.uid());

DROP POLICY IF EXISTS "Users can update message read status" ON public.messages;
CREATE POLICY "Users can update message read status"
  ON public.messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
      AND (c.participant_1_id = auth.uid() OR c.participant_2_id = auth.uid())
    )
  );

-- ============================================
-- FONCTION: get_or_create_conversation
-- ============================================
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

-- ============================================
-- FONCTION: get_unread_messages_count
-- ============================================
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
  
  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGER: notify_new_message (si notifications existe)
-- ============================================
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications') THEN
    
    CREATE OR REPLACE FUNCTION notify_new_message()
    RETURNS TRIGGER AS $func$
    DECLARE
      v_conversation RECORD;
      v_recipient_id UUID;
      v_sender_name TEXT;
    BEGIN
      SELECT * INTO v_conversation
      FROM public.conversations
      WHERE id = NEW.conversation_id;
      
      IF v_conversation.participant_1_id = NEW.sender_id THEN
        v_recipient_id := v_conversation.participant_2_id;
      ELSE
        v_recipient_id := v_conversation.participant_1_id;
      END IF;
      
      SELECT COALESCE(raw_user_meta_data->>'name', email)
      INTO v_sender_name
      FROM auth.users
      WHERE id = NEW.sender_id;
      
      PERFORM create_notification(
        v_recipient_id,
        'message',
        'Nouveau message',
        v_sender_name || ' vous a envoyé un message',
        '/marketplace/messages?id=' || v_conversation.id::text,
        jsonb_build_object(
          'conversation_id', v_conversation.id,
          'sender_id', NEW.sender_id,
          'listing_id', v_conversation.listing_id
        )
      );
      
      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql SECURITY DEFINER;

    DROP TRIGGER IF EXISTS trigger_notify_new_message ON public.messages;
    CREATE TRIGGER trigger_notify_new_message
      AFTER INSERT ON public.messages
      FOR EACH ROW
      EXECUTE FUNCTION notify_new_message();
      
  END IF;
END $$;

COMMENT ON TABLE public.conversations IS 'Conversations entre utilisateurs pour la marketplace';
COMMENT ON TABLE public.messages IS 'Messages dans les conversations';
