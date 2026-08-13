import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, Send, MessageCircle, Trash2, User } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import {
  getUserConversations,
  getConversationMessages,
  sendMessage,
  markConversationAsRead,
  subscribeToMessages,
  type Conversation,
  type Message,
} from '@/lib/messages'

export const Route = createFileRoute('/_authenticated/marketplace/messages')({
  ssr: false,
  component: MessagesPage,
})

function MessagesPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      if (!data.user) {
        toast.error('Vous devez être connecté')
        router.navigate({ to: '/auth' })
        return
      }
      loadConversations(data.user.id)
    })
  }, [])

  useEffect(() => {
    if (selectedConv && user) {
      loadMessages(selectedConv.id)
      markConversationAsRead(selectedConv.id, user.id)
      
      // S'abonner aux nouveaux messages
      const unsubscribe = subscribeToMessages(selectedConv.id, (msg) => {
        setMessages(prev => [...prev, msg])
        scrollToBottom()
      })
      
      return () => unsubscribe()
    }
  }, [selectedConv?.id])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  async function loadConversations(userId: string) {
    try {
      setLoading(true)
      const convs = await getUserConversations(userId)
      setConversations(convs)
    } catch (err: any) {
      console.error('Failed to load conversations:', err)
      toast.error('Erreur lors du chargement des conversations')
    } finally {
      setLoading(false)
    }
  }

  async function loadMessages(conversationId: string) {
    try {
      const msgs = await getConversationMessages(conversationId)
      setMessages(msgs)
      scrollToBottom()
    } catch (err: any) {
      console.error('Failed to load messages:', err)
      toast.error('Erreur lors du chargement des messages')
    }
  }

  function scrollToBottom() {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  async function handleSendMessage() {
    if (!newMessage.trim() || !selectedConv || !user) return

    setSending(true)
    try {
      await sendMessage(selectedConv.id, user.id, newMessage.trim())
      setNewMessage('')
      // Le message sera ajouté via le subscription en temps réel
    } catch (err: any) {
      toast.error('Erreur: ' + err.message)
    } finally {
      setSending(false)
    }
  }

  function handleSelectConversation(conv: Conversation) {
    setSelectedConv(conv)
  }

  function getOtherParticipantName(conv: Conversation): string {
    // Pour l'instant on utilise un nom générique
    // Plus tard on pourra faire un join avec profiles
    return conv.otherParticipantName || 'Utilisateur'
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Skeleton className="h-32 w-64" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-green-600 text-white p-4 shadow-lg sticky top-0 z-10">
        <div className="container mx-auto flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.navigate({ to: '/marketplace' })}
            className="text-white hover:bg-green-700"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Marketplace
          </Button>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Messagerie
          </h1>
          <div className="w-20" /> {/* Spacer pour centrer le titre */}
        </div>
      </header>

      <main className="container mx-auto p-4 max-w-6xl h-[calc(100vh-80px)]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
          {/* Liste des conversations */}
          <Card className="md:col-span-1 overflow-hidden flex flex-col">
            <div className="p-4 border-b bg-gray-50">
              <h2 className="font-semibold text-gray-700">Conversations</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="space-y-3 p-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : conversations.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Aucune conversation</p>
                  <p className="text-sm mt-1">Contactez un vendeur pour commencer</p>
                </div>
              ) : (
                conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedConv?.id === conv.id ? 'bg-green-50 border-green-200' : ''
                    }`}
                    onClick={() => handleSelectConversation(conv)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white flex-shrink-0">
                        <User className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {getOtherParticipantName(conv)}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {conv.lastMessage || 'Nouvelle conversation'}
                        </p>
                        {conv.listingId && (
                          <Badge variant="secondary" className="text-xs mt-1">
                            Offre #{conv.listingId.slice(0, 8)}
                          </Badge>
                        )}
                      </div>
                      {conv.lastMessageAt && (
                        <span className="text-xs text-gray-400 whitespace-nowrap">
                          {new Date(conv.lastMessageAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Zone de chat */}
          <Card className="md:col-span-2 overflow-hidden flex flex-col">
            {selectedConv ? (
              <>
                {/* Header du chat */}
                <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold">{getOtherParticipantName(selectedConv)}</p>
                      {selectedConv.listingId && (
                        <p className="text-xs text-gray-500">
                          Concernant une offre marketplace
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedConv(null)}
                    className="md:hidden"
                  >
                    Retour
                  </Button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                  {messages.map((msg) => {
                    const isOwn = msg.senderId === user.id
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg px-4 py-2 ${
                            isOwn
                              ? 'bg-green-600 text-white'
                              : 'bg-white border border-gray-200'
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                          <p
                            className={`text-xs mt-1 ${
                              isOwn ? 'text-green-100' : 'text-gray-400'
                            }`}
                          >
                            {new Date(msg.createdAt).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t bg-white">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      handleSendMessage()
                    }}
                    className="flex gap-2"
                  >
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Écrivez votre message..."
                      className="flex-1"
                      disabled={sending}
                    />
                    <Button
                      type="submit"
                      size="icon"
                      disabled={sending || !newMessage.trim()}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Send className="w-5 h-5" />
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Sélectionnez une conversation</p>
                  <p className="text-sm mt-1">ou contactez un vendeur depuis le marketplace</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  )
}
