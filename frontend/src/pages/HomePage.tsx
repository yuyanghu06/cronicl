import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Send, Upload, FileText, ArrowRight } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'system'
  content: string
  timestamp: string
  isTimeline?: boolean
  timelineId?: string
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: '0',
    role: 'system',
    content: 'Welcome to cronicl. Describe the world you want to explore — or upload a text file with your story.',
    timestamp: 'now',
  },
]

export default function HomePage() {
  const navigate = useNavigate()
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES)
  const [input, setInput] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const addMessage = (role: 'user' | 'system', content: string, extra?: Partial<Message>) => {
    const msg: Message = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      ...extra,
    }
    setMessages(prev => [...prev, msg])
    return msg
  }

  const handleSend = () => {
    if (!input.trim()) return
    const text = input.trim()
    setInput('')
    addMessage('user', text)

    /* Simulate AI response → creates a new timeline */
    setIsThinking(true)
    setTimeout(() => {
      const timelineId = Date.now().toString()
      addMessage('system', `Timeline created from your prompt. I've identified key narrative beats and structured an initial node graph. Click below to open it.`, {
        isTimeline: true,
        timelineId,
      })
      sessionStorage.setItem('cronicl-system-prompt', text)
      setIsThinking(false)
    }, 1200)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const preview = text.length > 200 ? text.slice(0, 200) + '...' : text
      addMessage('user', `📄 Uploaded: ${file.name}\n\n${preview}`)

      setIsThinking(true)
      setTimeout(() => {
        const timelineId = Date.now().toString()
        addMessage('system', `I've parsed "${file.name}" and extracted the narrative structure. ${Math.floor(text.length / 500)} potential nodes identified. Click below to begin exploring.`, {
          isTimeline: true,
          timelineId,
        })
        sessionStorage.setItem('cronicl-system-prompt', text.slice(0, 2000))
        setIsThinking(false)
      }, 1500)
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="dot-grid min-h-screen pt-14 flex flex-col">
      {/* Chat area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-10">
          {/* Header */}
          <div className="animate-fade-in-up mb-12 text-center" style={{ animationDelay: '100ms' }}>
            <h1
              className="text-2xl tracking-[0.2em] uppercase mb-3"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)' }}
            >
              cronicl
            </h1>
            <p
              className="text-sm"
              style={{ fontFamily: 'var(--font-system)', color: 'var(--color-muted)' }}
            >
              Describe your world. Upload your story. Begin exploring.
            </p>
          </div>

          {/* Messages */}
          <div className="flex flex-col gap-5">
            {messages.map((msg, i) => (
              <div
                key={msg.id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${150 + i * 50}ms` }}
              >
                {msg.role === 'system' ? (
                  <SystemMessage msg={msg} onOpenTimeline={() => navigate(`/timeline/${msg.timelineId || '1'}`)} />
                ) : (
                  <UserMessage msg={msg} />
                )}
              </div>
            ))}

            {/* Thinking indicator */}
            {isThinking && (
              <div className="animate-fade-in flex items-start gap-3">
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}
                >
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--color-accent)', animation: 'glow-pulse 1.2s ease infinite' }} />
                </div>
                <div
                  className="px-4 py-3 rounded-xl text-sm"
                  style={{
                    fontFamily: 'var(--font-system)',
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-muted)',
                  }}
                >
                  Processing narrative structure...
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Input bar — fixed bottom */}
      <div
        className="sticky bottom-0"
        style={{
          backgroundColor: 'var(--color-bg)',
          borderTop: '1px solid var(--color-border)',
        }}
      >
        <div className="max-w-2xl mx-auto px-6 py-4">
          <div
            className="flex items-end gap-3 p-3 rounded-2xl"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
            }}
          >
            {/* File upload */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.fountain,.fdx"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center w-9 h-9 rounded-xl cursor-pointer transition-colors flex-shrink-0"
              style={{
                backgroundColor: 'var(--color-surface-2)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-muted)',
              }}
              title="Upload story file (.txt, .md, .fountain)"
            >
              <Upload size={15} strokeWidth={1.5} />
            </button>

            {/* Text input */}
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe your world or paste your story..."
              rows={1}
              className="flex-1 resize-none text-sm py-2 px-1 focus:outline-none placeholder-[var(--color-muted)] min-h-[36px] max-h-[120px]"
              style={{
                fontFamily: 'var(--font-narrative)',
                backgroundColor: 'transparent',
                color: 'var(--color-primary)',
                lineHeight: '1.6',
              }}
              onInput={e => {
                const el = e.target as HTMLTextAreaElement
                el.style.height = 'auto'
                el.style.height = Math.min(el.scrollHeight, 120) + 'px'
              }}
            />

            {/* Send */}
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="flex items-center justify-center w-9 h-9 rounded-xl cursor-pointer transition-all flex-shrink-0 disabled:opacity-25 disabled:cursor-default"
              style={{
                backgroundColor: input.trim() ? 'var(--color-accent)' : 'var(--color-surface-2)',
                border: input.trim() ? 'none' : '1px solid var(--color-border)',
                color: input.trim() ? '#000' : 'var(--color-muted)',
              }}
            >
              <Send size={15} strokeWidth={1.5} />
            </button>
          </div>

          <p
            className="text-center mt-2.5 text-xs"
            style={{ fontFamily: 'var(--font-system)', color: 'var(--color-border-mid)' }}
          >
            Upload .txt, .md, or .fountain files · Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  )
}

/* ═══ Message Components ═══ */

function SystemMessage({ msg, onOpenTimeline }: { msg: Message; onOpenTimeline: () => void }) {
  return (
    <div className="flex items-start gap-3">
      {/* Avatar */}
      <div
        className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ backgroundColor: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}
      >
        <span
          className="text-[8px]"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--color-accent)' }}
        >
          C
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <p
          className="text-sm leading-relaxed"
          style={{ fontFamily: 'var(--font-system)', color: 'var(--color-secondary)' }}
        >
          {msg.content}
        </p>

        {/* Timeline card */}
        {msg.isTimeline && (
          <button
            onClick={onOpenTimeline}
            className="mt-3 flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all group w-full text-left"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--color-accent)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--color-border)'
            }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)' }}
            >
              <FileText size={14} strokeWidth={1.5} style={{ color: 'var(--color-accent)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)' }}>
                New Timeline Ready
              </p>
              <p className="text-xs mt-0.5" style={{ fontFamily: 'var(--font-system)', color: 'var(--color-muted)' }}>
                Open in timeline editor
              </p>
            </div>
            <ArrowRight size={14} strokeWidth={1.5} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--color-accent)' }} />
          </button>
        )}
      </div>
    </div>
  )
}

function UserMessage({ msg }: { msg: Message }) {
  return (
    <div className="flex justify-end">
      <div
        className="max-w-[85%] px-4 py-3 rounded-2xl rounded-br-sm"
        style={{
          backgroundColor: 'var(--color-surface-2)',
          border: '1px solid var(--color-border)',
        }}
      >
        <p
          className="text-sm leading-relaxed whitespace-pre-wrap"
          style={{ fontFamily: 'var(--font-narrative)', color: 'var(--color-primary)' }}
        >
          {msg.content}
        </p>
      </div>
    </div>
  )
}
