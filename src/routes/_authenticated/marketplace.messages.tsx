import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft, MessageCircle, Send, Search, Clock, User,
} from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

export const Route = createFileRoute('/_authenticated/marketplace/messages')({
  ssr: false,
  component: MessagesPage,
})

interface Conversation {
  id: string
  offer_id: string
  buyer_id: string
  seller_id: string
  last_message: string
  last_message_at: string
  unread: boolean
  other_user_name: string
  offer_title: string
}

function MessagesPage() {
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      if (!data.user) {
        toast.error('Connectez-vous pour voir vos messages')
        router.navigate({ to: '/auth' })
        return
      }
      loadConversations(data.user.id)
    })
  }, [router])

  async function loadConversations(userId: string) {
    try {
      setLoading(true)
      
      // Try loading from a conversations table
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
        .order('last_message_at', { ascending: false })

      if (error) {
        // Table might not exist yet
        if (error.code === '42P01' || error.message.includes('does not exist')) {
          setConversations([])
          return
        }
        throw error
      }
      setConversations((data as any) || [])
    } catch (err: any) {
      console.error('Failed to load conversations:', err)
      // Don't show error toast if table doesn't exist
      setConversations([])
    } finally {
      setLoading(false)
    }
  }

  const filtered = conversations.filter((c) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      c.other_user_name?.toLowerCase().includes(q) ||
      c.offer_title?.toLowerCase().includes(q) ||
      c.last_message?.toLowerCase().includes(q)
    )
  })

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Skeleton className="h-32 w-64" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <Button
            variant="ghost"
            onClick={() => router.navigate({ to: '/marketplace' })}
            style={{ minHeight: 48 }}
            aria-label="Retour au marketplace"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Marketplace
          </Button>
          <h1 className="flex items-center gap-2 text-lg font-bold text-foreground">
            <MessageCircle className="h-5 w-5 text-primary" />
            Messages
          </h1>
          <div className="w-24" />
        </div>
      </header>

      <main className="container mx-auto max-w-3xl space-y-4 p-4">
        {/* Search */}
        {conversations.length > 0 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher une conversation..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-12 w-full rounded-lg border border-input bg-background pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="Rechercher une conversation"
            />
          </div>
        )}

        {/* Conversations */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="mx-auto mb-4 w-fit rounded-full bg-muted p-4">
              <MessageCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium text-foreground">Aucun message</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {search
                ? 'Aucune conversation ne correspond a votre recherche'
                : 'Vos conversations avec les acheteurs et vendeurs apparaitront ici'}
            </p>
            <Button
              className="mt-6"
              onClick={() => router.navigate({ to: '/marketplace' })}
              style={{ minHeight: 48 }}
            >
              Aller au marketplace
            </Button>
          </Card>
        ) : (
          <div className="space-y-2">
            {filtered.map((conv) => (
              <Card
                key={conv.id}
                className="cursor-pointer overflow-hidden transition-shadow hover:shadow-md"
                onClick={() => router.navigate({ to: '/marketplace/$id', params: { id: conv.offer_id } })}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <User className="h-5 w-5 text-primary" />
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate font-semibold text-foreground">
                          {conv.other_user_name || 'Utilisateur'}
                        </p>
                        {conv.unread && (
                          <Badge variant="default" className="shrink-0 text-[9px]">Non lu</Badge>
                        )}
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {conv.offer_title}
                      </p>
                      <p className="mt-1 truncate text-sm text-foreground">
                        {conv.last_message}
                      </p>
                      <p className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Clock className="h-2.5 w-2.5" />
                        {new Date(conv.last_message_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}