import { useState, useRef, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { PanelRightOpen, PanelRightClose, GitBranch, Sparkles, Send } from 'lucide-react'

/* ═══════════════════════════════════════════
   Mock data
   ═══════════════════════════════════════════ */

interface TimelineNode {
  id: string
  label: string
  title: string
  content: string
  status: 'draft' | 'approved' | 'rendered'
  hasBranches: boolean
  x: number
  y: number
  parentId: string | null
}

const MOCK_NODES: TimelineNode[] = [
  { id: '1', label: 'NODE_001', title: 'The Awakening', content: 'INT. UNDERGROUND LAB — NIGHT\n\nA massive chamber lit by rows of flickering monitors. SAYA (28, cybernetic arm, worn leather jacket) opens her eyes inside a medical pod. Fluid drains. She gasps.\n\nThe monitors display a single message: PROTOCOL NINE ACTIVATED.', status: 'rendered', hasBranches: false, x: 0, y: 0, parentId: null },
  { id: '2', label: 'NODE_002', title: 'First Contact', content: 'EXT. NEON DISTRICT — CONTINUOUS\n\nSaya stumbles into a rain-soaked alley. Holographic advertisements flicker overhead. She reaches for a comm device on her wrist — dead.\n\nA DRONE sweeps the alley with a searchlight. She presses against the wall.', status: 'approved', hasBranches: true, x: 320, y: 0, parentId: '1' },
  { id: '3', label: 'NODE_003', title: 'The Underground', content: 'INT. RESISTANCE HQ — LATER\n\nA converted subway station. Makeshift terminals. KAEL (35, scarred, quiet authority) looks up from a holographic map.\n\nKAEL: You shouldn\'t be alive.\n\nSAYA: That makes two of us.', status: 'draft', hasBranches: false, x: 640, y: 0, parentId: '2' },
  { id: '4', label: 'NODE_004', title: 'The Plan', content: 'INT. RESISTANCE HQ — WAR ROOM\n\nKael activates a 3D projection of the corporate tower. Red zones pulse.\n\nKAEL: Protocol Nine was supposed to end the war. Instead it started a new one.', status: 'draft', hasBranches: false, x: 960, y: 0, parentId: '3' },
  { id: '5', label: 'NODE_002B', title: 'Corporate Route', content: 'INT. CORP TOWER — LOBBY\n\nSaya walks through pristine white corridors. Her cybernetic arm triggers no alarms — it\'s company hardware.\n\nA HOLOGRAM RECEPTIONIST: Welcome back, Agent Saya.', status: 'draft', hasBranches: false, x: 640, y: 200, parentId: '2' },
]

/* ═══════════════════════════════════════════
   Timeline Page
   ═══════════════════════════════════════════ */

export default function TimelinePage() {
  const { id } = useParams()
  const [selectedNode, setSelectedNode] = useState<TimelineNode | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [promptText, setPromptText] = useState('')
  const [canvasOffset, setCanvasOffset] = useState({ x: 80, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef({ x: 0, y: 0 })

  useEffect(() => {
    if (selectedNode) setPanelOpen(true)
  }, [selectedNode])

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-node]')) return
    setIsDragging(true)
    dragStart.current = { x: e.clientX - canvasOffset.x, y: e.clientY - canvasOffset.y }
  }
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    setCanvasOffset({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y })
  }
  const handleMouseUp = () => setIsDragging(false)

  return (
    <div className="min-h-screen pt-14 flex overflow-hidden">
      {/* ═══ Canvas ═══ */}
      <div
        className="dot-grid flex-1 relative cursor-grab active:cursor-grabbing overflow-hidden"
        style={{ backgroundColor: 'var(--color-bg)' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Title overlay */}
        <div className="animate-fade-in absolute top-5 left-7 z-10" style={{ animationDelay: '100ms' }}>
          <p
            className="text-[10px] tracking-[0.12em] uppercase mb-1"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-muted)' }}
          >
            TL_{(id || '1').padStart(3, '0')}
          </p>
          <h2
            className="text-[15px] tracking-[0.08em] uppercase"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)' }}
          >
            Neon Dynasty
          </h2>
        </div>

        {/* Panel toggle */}
        <button
          onClick={() => setPanelOpen(!panelOpen)}
          className="absolute top-5 right-5 z-10 w-8 h-8 flex items-center justify-center cursor-pointer rounded-lg transition-colors"
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-muted)',
          }}
        >
          {panelOpen ? <PanelRightClose size={14} strokeWidth={1.5} /> : <PanelRightOpen size={14} strokeWidth={1.5} />}
        </button>

        {/* Canvas */}
        <div
          className="absolute inset-0"
          style={{ transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px)` }}
        >
          <div style={{ position: 'absolute', top: '38%' }}>
            {/* Branch lines */}
            <svg className="absolute inset-0 pointer-events-none" style={{ overflow: 'visible' }}>
              {MOCK_NODES.filter(n => n.parentId).map(node => {
                const parent = MOCK_NODES.find(p => p.id === node.parentId)
                if (!parent) return null
                const x1 = parent.x + 268
                const y1 = parent.y + 70
                const x2 = node.x
                const y2 = node.y + 70
                const isActive = selectedNode?.id === node.id || selectedNode?.id === parent.id
                /* Curved path for branches */
                const mx = (x1 + x2) / 2
                const d = `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`
                return (
                  <path
                    key={`line-${parent.id}-${node.id}`}
                    d={d}
                    fill="none"
                    stroke={isActive ? 'var(--color-accent)' : 'var(--color-border)'}
                    strokeWidth={1.5}
                    className="transition-all duration-200"
                    strokeDasharray={isActive ? 'none' : '4 4'}
                  />
                )
              })}
            </svg>

            {/* Nodes */}
            {MOCK_NODES.map((node, i) => (
              <div
                key={node.id}
                data-node
                className="animate-fade-in-up absolute cursor-pointer"
                style={{
                  animationDelay: `${200 + i * 80}ms`,
                  left: node.x,
                  top: node.y,
                  width: 268,
                }}
                onClick={() => setSelectedNode(node)}
              >
                <div
                  className="p-4 rounded-lg transition-all duration-200"
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    border: `1.5px solid ${selectedNode?.id === node.id ? 'var(--color-accent)' : node.status === 'rendered' ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  }}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className="text-[9px] tracking-[0.1em] uppercase"
                      style={{ fontFamily: 'var(--font-display)', color: 'var(--color-muted)' }}
                    >
                      {node.label}
                    </span>
                    <NodeStatus status={node.status} hasBranches={node.hasBranches} />
                  </div>

                  {/* Image placeholder */}
                  <div
                    className="w-full aspect-video mb-3 rounded-sm flex items-center justify-center"
                    style={{
                      backgroundColor: 'var(--color-bg)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <span
                      className="text-[9px] tracking-[0.08em] uppercase"
                      style={{ fontFamily: 'var(--font-display)', color: 'var(--color-border-mid)' }}
                    >
                      {node.status === 'rendered' ? '■ Rendered' : '○ Pending'}
                    </span>
                  </div>

                  {/* Title — Courier */}
                  <h4
                    className="text-[13px] mb-1.5"
                    style={{ fontFamily: 'var(--font-narrative)', color: 'var(--color-primary)' }}
                  >
                    {node.title}
                  </h4>

                  {/* Content preview — Courier */}
                  <p
                    className="text-[11px] leading-relaxed line-clamp-2"
                    style={{ fontFamily: 'var(--font-narrative)', color: 'var(--color-secondary)' }}
                  >
                    {node.content.split('\n')[0]}
                  </p>

                  {/* Branch diamond */}
                  {node.hasBranches && (
                    <div className="flex justify-center mt-3">
                      <div
                        className="w-2 h-2 rotate-45 rounded-[1px]"
                        style={{ backgroundColor: 'var(--color-accent)' }}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-7 py-2.5"
          style={{ borderTop: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)' }}
        >
          <span className="text-[10px]" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-muted)' }}>
            {MOCK_NODES.length} nodes · 2 branches
          </span>
          <span className="text-[10px]" style={{ fontFamily: 'var(--font-system)', color: 'var(--color-muted)' }}>
            Drag to pan
          </span>
        </div>
      </div>

      {/* ═══ Side Panel ═══ */}
      {panelOpen && (
        <aside
          className="animate-slide-in-right flex-shrink-0 flex flex-col overflow-hidden"
          style={{
            width: 380,
            backgroundColor: 'var(--color-surface)',
            borderLeft: '1px solid var(--color-border)',
          }}
        >
          {selectedNode ? (
            <>
              {/* Header */}
              <div className="px-6 pt-6 pb-5" style={{ borderBottom: '1px solid var(--color-border)' }}>
                <span
                  className="text-[9px] tracking-[0.1em] uppercase block mb-2"
                  style={{ fontFamily: 'var(--font-display)', color: 'var(--color-accent)' }}
                >
                  {selectedNode.label}
                </span>
                <h3
                  className="text-[17px]"
                  style={{ fontFamily: 'var(--font-narrative)', color: 'var(--color-primary)' }}
                >
                  {selectedNode.title}
                </h3>
              </div>

              {/* Content — Courier Prime for narrative */}
              <div className="flex-1 overflow-y-auto px-6 py-5">
                <label
                  className="text-[10px] tracking-[0.1em] uppercase block mb-3"
                  style={{ fontFamily: 'var(--font-display)', color: 'var(--color-muted)' }}
                >
                  Narrative
                </label>
                <div
                  className="text-[13px] leading-[1.8] whitespace-pre-wrap"
                  style={{ fontFamily: 'var(--font-narrative)', color: 'var(--color-primary)' }}
                >
                  {selectedNode.content}
                </div>

                {/* Ghost suggestion */}
                <div
                  className="mt-8 px-4 py-3 rounded-md"
                  style={{
                    backgroundColor: 'var(--color-bg)',
                    border: '1px dashed var(--color-border)',
                  }}
                >
                  <p
                    className="text-[9px] tracking-[0.1em] uppercase mb-2"
                    style={{ fontFamily: 'var(--font-display)', color: 'var(--color-muted)' }}
                  >
                    Suggestion
                  </p>
                  <p
                    className="text-[12px] leading-relaxed italic"
                    style={{ fontFamily: 'var(--font-narrative)', color: 'var(--color-border-mid)' }}
                  >
                    "Explore a darker tone — what if the monitors display a countdown instead of a message?"
                  </p>
                </div>

                {/* Actions */}
                <div className="mt-6 flex flex-col gap-2">
                  <ActionButton icon={<GitBranch size={13} strokeWidth={1.5} />} label="New Branch" accent />
                  <ActionButton icon={<Sparkles size={13} strokeWidth={1.5} />} label="Expand Details" />
                </div>
              </div>

              {/* Command terminal — ABC Synt Mono */}
              <div className="px-6 py-5" style={{ borderTop: '1px solid var(--color-border)' }}>
                <label
                  className="text-[9px] tracking-[0.1em] uppercase block mb-2"
                  style={{ fontFamily: 'var(--font-display)', color: 'var(--color-muted)' }}
                >
                  Command
                </label>
                <div
                  className="flex items-center overflow-hidden rounded-md"
                  style={{
                    backgroundColor: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  {/* Orange accent bar */}
                  <div className="w-[2px] self-stretch" style={{ backgroundColor: 'var(--color-accent)' }} />
                  <input
                    type="text"
                    value={promptText}
                    onChange={e => setPromptText(e.target.value)}
                    placeholder="Explore direction..."
                    className="flex-1 px-3 py-2.5 text-[12px] focus:outline-none placeholder-[var(--color-muted)]"
                    style={{
                      fontFamily: 'var(--font-system)',
                      backgroundColor: 'transparent',
                      color: 'var(--color-primary)',
                    }}
                  />
                  <button
                    className="px-3 cursor-pointer"
                    style={{ background: 'none', border: 'none', color: promptText ? 'var(--color-accent)' : 'var(--color-muted)' }}
                  >
                    <Send size={14} strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center px-8">
              <p
                className="text-[11px] tracking-[0.12em] uppercase mb-2 text-center"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--color-muted)' }}
              >
                Select a node
              </p>
              <p
                className="text-[12px] text-center leading-relaxed"
                style={{ fontFamily: 'var(--font-narrative)', color: 'var(--color-secondary)' }}
              >
                Click any node on the canvas to view and edit its content.
              </p>
            </div>
          )}
        </aside>
      )}
    </div>
  )
}

/* ═══ Sub-components ═══ */

function NodeStatus({ status, hasBranches }: { status: string; hasBranches: boolean }) {
  if (hasBranches) return <div className="w-2 h-2 rotate-45 rounded-[1px]" style={{ backgroundColor: 'var(--color-accent)' }} />
  if (status === 'rendered') return <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-primary)' }} />
  if (status === 'approved') return <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-secondary)' }} />
  return <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-muted)' }} />
}

function ActionButton({ icon, label, accent }: { icon: React.ReactNode; label: string; accent?: boolean }) {
  return (
    <button
      className="flex items-center gap-2.5 px-4 py-2.5 text-[12px] tracking-[0.04em] rounded-md transition-all duration-200 cursor-pointer w-full text-left"
      style={{
        fontFamily: 'var(--font-system)',
        backgroundColor: 'transparent',
        border: `1px solid ${accent ? 'var(--color-accent)' : 'var(--color-border)'}`,
        color: accent ? 'var(--color-accent)' : 'var(--color-secondary)',
      }}
      onMouseEnter={e => {
        if (!accent) {
          e.currentTarget.style.borderColor = 'var(--color-border-mid)'
          e.currentTarget.style.color = 'var(--color-primary)'
        }
      }}
      onMouseLeave={e => {
        if (!accent) {
          e.currentTarget.style.borderColor = 'var(--color-border)'
          e.currentTarget.style.color = 'var(--color-secondary)'
        }
      }}
    >
      {icon}
      {label}
    </button>
  )
}
