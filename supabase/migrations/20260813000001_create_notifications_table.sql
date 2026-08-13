-- Migration: Create Notifications Table
-- Date: 2026-08-13
-- Description: Système de notifications pour les messages et commandes

-- Table: notifications (notifications push/in-app)
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('message', 'order', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  action_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, is_read, created_at DESC) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);

-- RLS Policies pour notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir leurs propres notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Les utilisateurs peuvent marquer leurs notifications comme lues
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());

-- Fonction pour créer une notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_action_url TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, action_url, metadata, created_at)
  VALUES (p_user_id, p_type, p_title, p_message, p_action_url, p_metadata, now())
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour compter les notifications non lues
CREATE OR REPLACE FUNCTION get_unread_notifications_count()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.notifications
  WHERE user_id = auth.uid()
  AND is_read = false;
  
  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Créer une notification quand un nouveau message est envoyé
-- Utilisation de EXECUTE pour éviter l'imbrication des $$
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages') THEN
    
    -- Créer la fonction de notification pour les messages
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

-- Trigger: Créer une notification quand une commande est créée
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
    
    -- Créer la fonction de notification pour les commandes
    CREATE OR REPLACE FUNCTION notify_new_order()
    RETURNS TRIGGER AS $func$
    DECLARE
      v_buyer_name TEXT;
    BEGIN
      SELECT COALESCE(raw_user_meta_data->>'name', email)
      INTO v_buyer_name
      FROM auth.users
      WHERE id = NEW.buyer_id;
      
      PERFORM create_notification(
        NEW.seller_id,
        'order',
        'Nouvelle commande',
        v_buyer_name || ' a passé une commande pour votre offre',
        '/marketplace/orders',
        jsonb_build_object(
          'order_id', NEW.id,
          'buyer_id', NEW.buyer_id,
          'listing_id', NEW.offer_id
        )
      );
      
      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql SECURITY DEFINER;

    DROP TRIGGER IF EXISTS trigger_notify_new_order ON public.orders;
    CREATE TRIGGER trigger_notify_new_order
      AFTER INSERT ON public.orders
      FOR EACH ROW
      EXECUTE FUNCTION notify_new_order();
      
  END IF;
END $$;
