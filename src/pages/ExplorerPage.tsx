import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, GitBranch, Clock, Filter } from 'lucide-react'

interface TimelineEntry {
  id: string
  title: string
  summary: string
  nodeCount: number
  branchCount: number
  lastEdited: string
  tags: string[]
  status: 'draft' | 'approved' | 'rendered'
}

const MOCK_TIMELINES: TimelineEntry[] = [
  {
    id: '1', title: 'Neon Dynasty', summary: 'A cyberpunk epic where corporate families wage shadow wars through AI-controlled mechs in a rain-soaked Tokyo of 2087.',
    nodeCount: 24, branchCount: 3, lastEdited: '2 hours ago', tags: ['ACT I', 'SCI-FI'], status: 'draft',
  },
  {
    id: '2', title: 'The Last Lighthouse', summary: 'A solitary keeper tends the final lighthouse as the ocean rises. Each night, a different ghost appears with a message from the past.',
    nodeCount: 12, branchCount: 1, lastEdited: '1 day ago', tags: ['HORROR', 'DRAMA'], status: 'approved',
  },
  {
    id: '3', title: 'Echoes of Mars', summary: 'The first generation born on Mars discovers ancient alien structures beneath the red dust, triggering a solar system-wide crisis.',
    nodeCount: 48, branchCount: 7, lastEdited: '3 days ago', tags: ['SCI-FI', 'EPIC'], status: 'rendered',
  },
  {
    id: '4', title: "The Cartographer's Dream", summary: "A 16th century mapmaker begins drawing lands that don't exist — until explorers start finding them exactly where she drew them.",
    nodeCount: 8, branchCount: 2, lastEdited: '1 week ago', tags: ['FANTASY', 'HISTORICAL'], status: 'draft',
  },
  {
    id: '5', title: 'Signal Loss', summary: 'A deep space communications officer intercepts a transmission from Earth — from 200 years in the future.',
    nodeCount: 16, branchCount: 4, lastEdited: '2 weeks ago', tags: ['SCI-FI', 'THRILLER'], status: 'draft',
  },
]

export default function ExplorerPage() {
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<string | null>(null)

  const allTags = [...new Set(MOCK_TIMELINES.flatMap(t => t.tags))]

  const filtered = MOCK_TIMELINES.filter(t => {
    const matchesSearch = !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.summary.toLowerCase().includes(search.toLowerCase())
    const matchesTag = !activeFilter || t.tags.includes(activeFilter)
    return matchesSearch && matchesTag
  })

  return (
    <div className="dot-grid min-h-screen pt-14">
      <div className="max-w-3xl mx-auto px-8 py-16">

        {/* Header */}
        <div className="animate-fade-in-up mb-10" style={{ animationDelay: '100ms' }}>
          <h1
            className="text-[22px] tracking-[0.2em] uppercase mb-2"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)' }}
          >
            Explore
          </h1>
          <p
            className="text-[13px]"
            style={{ fontFamily: 'var(--font-system)', color: 'var(--color-muted)' }}
          >
            Browse all timelines
          </p>
        </div>

        {/* Search */}
        <div className="animate-fade-in-up mb-5" style={{ animationDelay: '200ms' }}>
          <div
            className="relative flex items-center rounded-lg"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
            }}
          >
            <Search size={14} strokeWidth={1.5} className="absolute left-4" style={{ color: 'var(--color-muted)' }} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search timelines..."
              className="w-full pl-11 pr-4 py-3 text-[13px] rounded-lg focus:outline-none placeholder-[var(--color-muted)]"
              style={{
                fontFamily: 'var(--font-system)',
                backgroundColor: 'transparent',
                color: 'var(--color-primary)',
              }}
            />
          </div>
        </div>

        {/* Tag filters */}
        <div className="animate-fade-in-up flex items-center gap-2 mb-8 flex-wrap" style={{ animationDelay: '280ms' }}>
          <Filter size={12} strokeWidth={1.5} style={{ color: 'var(--color-muted)' }} className="mr-1" />
          <FilterPill active={!activeFilter} onClick={() => setActiveFilter(null)} label="All" />
          {allTags.map(tag => (
            <FilterPill
              key={tag}
              active={activeFilter === tag}
              onClick={() => setActiveFilter(activeFilter === tag ? null : tag)}
              label={tag}
            />
          ))}
        </div>

        {/* Count */}
        <div className="animate-fade-in mb-5" style={{ animationDelay: '340ms' }}>
          <span
            className="text-[11px]"
            style={{ fontFamily: 'var(--font-system)', color: 'var(--color-muted)' }}
          >
            {filtered.length} timeline{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Results */}
        <div className="flex flex-col gap-3">
          {filtered.map((timeline, i) => (
            <Link
              key={timeline.id}
              to={`/timeline/${timeline.id}`}
              className="animate-fade-in-up block group rounded-lg transition-all duration-200"
              style={{
                animationDelay: `${400 + i * 60}ms`,
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--color-border-mid)'
                e.currentTarget.style.backgroundColor = 'var(--color-surface-2)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--color-border)'
                e.currentTarget.style.backgroundColor = 'var(--color-surface)'
              }}
            >
              <div className="px-5 py-5">
                {/* Title row */}
                <div className="flex items-center gap-3 mb-2">
                  <span
                    className="text-[10px] tracking-[0.1em] uppercase"
                    style={{ fontFamily: 'var(--font-display)', color: 'var(--color-muted)' }}
                  >
                    TL_{timeline.id.padStart(3, '0')}
                  </span>
                  <h3
                    className="text-[15px] flex-1"
                    style={{ fontFamily: 'var(--font-narrative)', color: 'var(--color-primary)' }}
                  >
                    {timeline.title}
                  </h3>
                  {timeline.tags.map(tag => (
                    <span
                      key={tag}
                      className="px-2.5 py-0.5 text-[9px] tracking-[0.06em] uppercase"
                      style={{
                        fontFamily: 'var(--font-system)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '999px',
                        color: 'var(--color-muted)',
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Summary */}
                <p
                  className="text-[13px] leading-relaxed mb-3 line-clamp-2"
                  style={{ fontFamily: 'var(--font-narrative)', color: 'var(--color-secondary)' }}
                >
                  {timeline.summary}
                </p>

                {/* Meta */}
                <div
                  className="flex items-center gap-4 text-[11px]"
                  style={{ fontFamily: 'var(--font-system)', color: 'var(--color-muted)' }}
                >
                  <span className="flex items-center gap-1.5">
                    <GitBranch size={11} strokeWidth={1.5} />
                    {timeline.branchCount} branch{timeline.branchCount !== 1 ? 'es' : ''}
                  </span>
                  <span>{timeline.nodeCount} nodes</span>
                  <span className="flex items-center gap-1.5">
                    <Clock size={11} strokeWidth={1.5} />
                    {timeline.lastEdited}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24">
            <p
              className="text-[11px] tracking-[0.12em] uppercase mb-2"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--color-muted)' }}
            >
              No timelines found
            </p>
            <p
              className="text-[13px]"
              style={{ fontFamily: 'var(--font-narrative)', color: 'var(--color-secondary)' }}
            >
              Try adjusting your search or filters.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function FilterPill({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1 text-[10px] tracking-[0.04em] uppercase cursor-pointer transition-all duration-200"
      style={{
        fontFamily: 'var(--font-system)',
        border: '1px solid',
        borderColor: active ? 'var(--color-accent)' : 'var(--color-border)',
        color: active ? 'var(--color-accent)' : 'var(--color-muted)',
        borderRadius: '999px',
        backgroundColor: active ? 'rgba(255,128,0,0.06)' : 'transparent',
      }}
    >
      {label}
    </button>
  )
}
