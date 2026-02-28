import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'
import { Sun, Moon } from 'lucide-react'

export default function LandingPage() {
  const navigate = useNavigate()
  const { theme, toggle } = useTheme()
  const [prompt, setPrompt] = useState('')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 300)
    return () => clearTimeout(t)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim()) return
    sessionStorage.setItem('cronicl-system-prompt', prompt.trim())
    navigate('/home')
  }

  return (
    <div className="dot-grid relative min-h-screen flex flex-col">
      {/* Top bar — minimal */}
      <div
        className="animate-fade-in flex items-center justify-between px-8 py-5"
        style={{ animationDelay: '100ms' }}
      >
        <div className="flex items-center gap-3">
          {/* Accent dot */}
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-accent)' }} />
          <span
            className="text-[11px] tracking-[0.04em]"
            style={{ fontFamily: 'var(--font-system)', color: 'var(--color-muted)' }}
          >
            {ready ? 'System ready' : 'Initializing...'}
          </span>
        </div>
        <button
          onClick={toggle}
          className="flex items-center justify-center w-8 h-8 rounded-full cursor-pointer"
          style={{ color: 'var(--color-muted)', background: 'none', border: 'none' }}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={14} strokeWidth={1.5} /> : <Moon size={14} strokeWidth={1.5} />}
        </button>
      </div>

      {/* Main — vertically centered */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-lg">
          {/* Wordmark */}
          <div className="animate-fade-in-up mb-16 text-center" style={{ animationDelay: '200ms' }}>
            <h1
              className="text-[28px] md:text-[36px] tracking-[0.3em] uppercase leading-none mb-4"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)' }}
            >
              cronicl
            </h1>
            <p
              className="text-[13px] tracking-[0.02em] leading-relaxed"
              style={{ fontFamily: 'var(--font-system)', color: 'var(--color-muted)' }}
            >
              A persistent imagination engine
            </p>
          </div>

          {/* Prompt input */}
          <form onSubmit={handleSubmit}>
            <div
              className="animate-fade-in-up"
              style={{ animationDelay: '400ms' }}
            >
              <label
                className="block text-[11px] tracking-[0.15em] uppercase mb-3"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--color-muted)' }}
              >
                Define your world
              </label>

              <div
                className="relative overflow-hidden rounded-lg"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <textarea
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  placeholder="Describe the creative universe you want to explore..."
                  rows={4}
                  className="w-full px-5 py-4 text-[14px] leading-relaxed resize-none focus:outline-none placeholder-[var(--color-muted)]"
                  style={{
                    fontFamily: 'var(--font-narrative)',
                    backgroundColor: 'transparent',
                    color: 'var(--color-primary)',
                  }}
                />
              </div>
            </div>

            {/* Footer row */}
            <div
              className="animate-fade-in-up flex items-center justify-between mt-4"
              style={{ animationDelay: '550ms' }}
            >
              <span
                className="text-[11px]"
                style={{ fontFamily: 'var(--font-system)', color: 'var(--color-muted)' }}
              >
                {prompt.length > 0 ? `${prompt.length} characters` : 'scope · tone · style · constraints'}
              </span>

              <button
                type="submit"
                disabled={!prompt.trim()}
                className="flex items-center gap-2.5 px-5 py-2.5 text-[12px] tracking-[0.04em] rounded-md transition-all duration-200 cursor-pointer disabled:opacity-25 disabled:cursor-default"
                style={{
                  fontFamily: 'var(--font-system)',
                  backgroundColor: prompt.trim() ? 'var(--color-accent)' : 'transparent',
                  color: prompt.trim() ? '#000' : 'var(--color-muted)',
                  border: prompt.trim() ? 'none' : '1px solid var(--color-border)',
                }}
              >
                Begin exploring
                <ArrowRight size={13} strokeWidth={2} />
              </button>
            </div>
          </form>

          {/* Ambient hint text */}
          <div
            className="animate-fade-in mt-20 text-center"
            style={{ animationDelay: '700ms' }}
          >
            <p
              className="text-[11px] leading-loose"
              style={{ fontFamily: 'var(--font-narrative)', color: 'var(--color-border-mid)' }}
            >
              "The visible tree is a projection. Each node represents a creative state transition."
            </p>
          </div>
        </div>
      </div>

      {/* Bottom version */}
      <div
        className="animate-fade-in px-8 py-5 flex justify-center"
        style={{ animationDelay: '800ms' }}
      >
        <span
          className="text-[10px] tracking-[0.15em] uppercase"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--color-border)' }}
        >
          v0.1.0
        </span>
      </div>
    </div>
  )
}
