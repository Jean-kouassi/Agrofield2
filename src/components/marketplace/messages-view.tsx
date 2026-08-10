import { useState } from 'react'
import { ArrowLeft, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  MOCK_CONVERSATIONS,
  type MarketplaceConversation,
  type ChatMessage,
  initials,
} from '@/lib/marketplace-data'

interface MessagesViewProps {
  conversations?: MarketplaceConversation[]
}

export function MessagesView({
  conversations: initial = MOCK_CONVERSATIONS,
}: MessagesViewProps) {
  const [conversations, setConversations] =
    useState<MarketplaceConversation[]>(initial)
  const [activeId, setActiveId] = useState<string | null>(
    conversations[0]?.id || null
  )
  const [draft, setDraft] = useState('')

  const active = conversations.find((c) => c.id === activeId)

  function send() {
    if (!draft.trim() || !activeId) return
    const text = draft.trim()
    setConversations((cs) =>
      cs.map((c) =>
        c.id === activeId
          ? {
              ...c,
              messages: [
                ...c.messages,
                { from: 'me', text, time: "à l'instant" } as ChatMessage,
              ],
              last: text,
              unread: 0,
            }
          : c
      )
    )
    setDraft('')
  }

  return (
    <div className="af-msg-height max-w-5xl mx-auto md:px-6 md:py-6 flex af-card md:rounded-2xl overflow-hidden">
      <div
        className={`w-full md:w-72 border-r flex-col ${active ? 'hidden md:flex' : 'flex'}`}
        style={{ borderColor: 'var(--agro-border)' }}
      >
        <div className="p-4 border-b af-display font-bold">Messages</div>
        <div className="overflow-y-auto flex-1">
          {conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveId(c.id)}
              className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/50"
              style={{
                background: activeId === c.id ? 'var(--agro-pale)' : 'transparent',
              }}
            >
              <div className="relative shrink-0">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center af-display font-bold text-white text-sm"
                  style={{ background: 'var(--agro-primary)' }}
                >
                  {initials(c.name)}
                </div>
                {c.online && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white bg-green-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold truncate">{c.name}</span>
                  <span className="af-text-11 shrink-0 text-muted-foreground">{c.time}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs truncate text-muted-foreground">{c.last}</span>
                  {c.unread > 0 && (
                    <Badge className="ml-1 rounded-full h-5 min-w-5 px-1 flex items-center justify-center text-[10px]">
                      {c.unread}
                    </Badge>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {active && (
        <div className="flex-1 flex flex-col">
          <div className="p-3 border-b flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setActiveId(null)}
              className="md:hidden -ml-2"
            >
              <ArrowLeft size={18} />
            </Button>
            <div className="w-9 h-9 rounded-full flex items-center justify-center af-display font-bold text-white text-xs"
              style={{ background: 'var(--agro-primary)' }}
            >
              {initials(active.name)}
            </div>
            <div>
              <div className="text-sm font-semibold">{active.name}</div>
              <div className="text-xs text-muted-foreground">
                {active.online ? 'En ligne' : 'Hors ligne'}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
            {active.messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                  m.from === 'me'
                    ? 'af-bubble-me self-end rounded-br-sm'
                    : 'af-bubble-them self-start rounded-bl-sm'
                }`}
              >
                {m.text}
                <div
                  className={`af-text-10 mt-1 ${
                    m.from === 'me' ? 'text-white/70' : 'text-muted-foreground'
                  }`}
                >
                  {m.time}
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 border-t flex items-center gap-2">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="Écrire un message..."
              className="af-input rounded-full px-4 py-2.5 text-sm flex-1"
            />
            <Button onClick={send} className="af-btn-primary rounded-full w-11 h-11 p-0">
              <Send size={17} />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
