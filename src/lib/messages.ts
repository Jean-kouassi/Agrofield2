/**
 * Messagerie Interne AgroSphere
 * Fonctions pour gérer les conversations et messages
 */

import { supabase } from '@/integrations/supabase/client';

export interface Conversation {
  id: string;
  participant1Id: string;
  participant2Id: string;
  listingId: string | null;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
  // Champs calculés
  otherParticipantName?: string;
  lastMessage?: string;
  unreadCount?: number;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  deletedBySender: boolean;
  deletedByReceiver: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'message' | 'order' | 'system';
  title: string;
  message: string;
  isRead: boolean;
  readAt: string | null;
  actionUrl: string | null;
  metadata: Record<string, any>;
  createdAt: string;
}

/**
 * Obtenir ou créer une conversation avec un autre utilisateur
 * Note: Fonction actuellement non utilisée - commentée pour référence future
 */
// export async function getOrCreateConversation(
//   participant2Id: string,
//   listingId?: string
// ): Promise<string | null> {
//   const { data, error } = await supabase.rpc('get_or_create_conversation', {
//     p_participant_2_id: participant2Id,
//     p_listing_id: listingId || null,
//   });

//   if (error) throw error;
//   return data ?? null;
// }

/**
 * Obtenir ou créer une conversation et démarrer le chat
 */
export async function startConversationWithUser(
  sellerId: string,
  listingId: string,
  currentUserId: string
): Promise<{ conversationId: string; isNew: boolean }> {
  // Validation des UUIDs
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  
  if (!uuidRegex.test(sellerId)) {
    throw new Error(`Invalid seller ID format: ${sellerId}`);
  }
  
  if (!uuidRegex.test(currentUserId)) {
    throw new Error(`Invalid user ID format: ${currentUserId}`);
  }
  
  try {
    // D'abord, vérifions s'il existe déjà une conversation
    const { data: existingConv, error: fetchError } = await supabase
      .from('conversations')
      .select('id')
      .or(`and(participant_1_id.eq.${currentUserId},participant_2_id.eq.${sellerId}),and(participant_1_id.eq.${sellerId},participant_2_id.eq.${currentUserId})`)
      .eq('listing_id', listingId)
      .single();

    if (existingConv && !fetchError) {
      return { conversationId: existingConv.id, isNew: false };
    }

    // Créer une nouvelle conversation
    const { data: newConv, error: createError } = await supabase
      .from('conversations')
      .insert({
        participant_1_id: currentUserId,
        participant_2_id: sellerId,
        listing_id: listingId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (createError) throw createError;
    return { conversationId: newConv.id, isNew: true };
  } catch (error: any) {
    console.error('Error starting conversation:', error);
    throw error;
  }
}

/**
 * Récupérer toutes les conversations d'un utilisateur
 */
export async function getUserConversations(userId: string): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from('conversations')
    .select(`
      *,
      messages (
        content,
        created_at,
        sender_id
      )
    `)
    .or(`participant_1_id.eq.${userId},participant_2_id.eq.${userId}`)
    .order('last_message_at', { ascending: false, nullsFirst: false });

  if (error) throw error;

  return (data || []).map((conv: any) => {
    const lastMsg = conv.messages?.[0];
    return {
      id: conv.id,
      participant1Id: conv.participant_1_id,
      participant2Id: conv.participant_2_id,
      listingId: conv.listing_id,
      lastMessageAt: conv.last_message_at,
      createdAt: conv.created_at,
      updatedAt: conv.updated_at,
      otherParticipantName: conv.participant_1_id === userId ? 'Vendeur' : 'Acheteur',
      lastMessage: lastMsg?.content || '',
      unreadCount: 0, // Sera calculé séparément
    };
  });
}

/**
 * Récupérer les messages d'une conversation
 */
export async function getConversationMessages(conversationId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .eq('deleted_by_sender', false)
    .eq('deleted_by_receiver', false)
    .order('created_at', { ascending: true });

  if (error) throw error;

  return (data || []).map((msg: any) => ({
    id: msg.id,
    conversationId: msg.conversation_id,
    senderId: msg.sender_id,
    content: msg.content,
    isRead: msg.is_read,
    readAt: msg.read_at,
    createdAt: msg.created_at,
    deletedBySender: msg.deleted_by_sender,
    deletedByReceiver: msg.deleted_by_receiver,
  }));
}

/**
 * Envoyer un message
 */
export async function sendMessage(
  conversationId: string,
  senderId: string,
  content: string
): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .insert([{
      conversation_id: conversationId,
      sender_id: senderId,
      content,
      is_read: false,
      created_at: new Date().toISOString(),
    }])
    .select()
    .single();

  if (error) throw error;

  // Mettre à jour last_message_at de la conversation
  await supabase
    .from('conversations')
    .update({
      last_message_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', conversationId);

  return {
    id: data.id,
    conversationId: data.conversation_id,
    senderId: data.sender_id,
    content: data.content,
    isRead: data.is_read,
    readAt: data.read_at,
    createdAt: data.created_at,
    deletedBySender: data.deleted_by_sender,
    deletedByReceiver: data.deleted_by_receiver,
  };
}

/**
 * Marquer un message comme lu
 */
export async function markMessageAsRead(messageId: string): Promise<void> {
  await supabase
    .from('messages')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq('id', messageId);
}

/**
 * Marquer tous les messages d'une conversation comme lus
 */
export async function markConversationAsRead(conversationId: string, userId: string): Promise<void> {
  await supabase
    .from('messages')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq('conversation_id', conversationId)
    .eq('is_read', false)
    .neq('sender_id', userId);
}

/**
 * Obtenir le compteur de messages non lus
 */
export async function getUnreadMessagesCount(): Promise<number> {
  const { data, error } = await supabase.rpc('get_unread_messages_count');

  if (error) throw error;
  return data as number;
}

/**
 * Supprimer un message (soft delete)
 */
export async function deleteMessage(
  messageId: string,
  userId: string,
  isSender: boolean
): Promise<void> {
  const field = isSender ? 'deleted_by_sender' : 'deleted_by_receiver';
  
  await supabase
    .from('messages')
    .update({ [field]: true } as any)
    .eq('id', messageId);
}

/**
 * S'abonner aux nouveaux messages en temps réel
 */
export function subscribeToMessages(
  conversationId: string,
  callback: (message: Message) => void
) {
  const channel = supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        const newMessage = payload.new as any;
        callback({
          id: newMessage.id,
          conversationId: newMessage.conversation_id,
          senderId: newMessage.sender_id,
          content: newMessage.content,
          isRead: newMessage.is_read,
          readAt: newMessage.read_at,
          createdAt: newMessage.created_at,
          deletedBySender: newMessage.deleted_by_sender,
          deletedByReceiver: newMessage.deleted_by_receiver,
        });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * S'abonner aux nouvelles conversations
 */
export function subscribeToConversations(
  userId: string,
  callback: (conversation: Conversation) => void
) {
  const channel = supabase
    .channel(`conversations:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'conversations',
        filter: `participant_1_id=eq.${userId}ORparticipant_2_id=eq.${userId}`,
      },
      (payload) => {
        const newConv = payload.new as any;
        callback({
          id: newConv.id,
          participant1Id: newConv.participant_1_id,
          participant2Id: newConv.participant_2_id,
          listingId: newConv.listing_id,
          lastMessageAt: newConv.last_message_at,
          createdAt: newConv.created_at,
          updatedAt: newConv.updated_at,
        });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Récupérer les notifications d'un utilisateur
 */
export async function getUserNotifications(userId: string, limit: number = 20): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data || []).map((notif: any) => ({
    id: notif.id,
    userId: notif.user_id,
    type: notif.type,
    title: notif.title,
    message: notif.message,
    isRead: notif.is_read,
    readAt: notif.read_at,
    actionUrl: notif.action_url,
    metadata: notif.metadata || {},
    createdAt: notif.created_at,
  }));
}

/**
 * Obtenir le compteur de notifications non lues
 */
export async function getUnreadNotificationsCount(): Promise<number> {
  const { data, error } = await supabase.rpc('get_unread_notifications_count');

  if (error) throw error;
  return data as number;
}

/**
 * Marquer une notification comme lue
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  await supabase
    .from('notifications')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq('id', notificationId);
}

/**
 * Marquer toutes les notifications comme lues
 */
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  await supabase
    .from('notifications')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('is_read', false);
}

/**
 * S'abonner aux nouvelles notifications en temps réel
 */
export function subscribeToNotifications(
  userId: string,
  callback: (notification: Notification) => void
) {
  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        const newNotif = payload.new as any;
        callback({
          id: newNotif.id,
          userId: newNotif.user_id,
          type: newNotif.type,
          title: newNotif.title,
          message: newNotif.message,
          isRead: newNotif.is_read,
          readAt: newNotif.read_at,
          actionUrl: newNotif.action_url,
          metadata: newNotif.metadata || {},
          createdAt: newNotif.created_at,
        });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
