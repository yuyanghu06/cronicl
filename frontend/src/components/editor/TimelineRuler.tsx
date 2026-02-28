import type { TimelineNode } from "@/types/node";

interface TimelineRulerProps {
  nodes: TimelineNode[];
}

export function TimelineRuler({ nodes }: TimelineRulerProps) {
  if (nodes.length === 0) return null;

  const maxX = Math.max(...nodes.map((n) => n.position.x)) + 400;

  return (
    <div
      className="h-8 border-b border-border-subtle flex items-end relative shrink-0"
      style={{ width: maxX }}
    >
      {nodes.map((node) => (
        <div
          key={node.id}
          className="absolute bottom-0 flex flex-col items-center"
          style={{ left: node.position.x + 120 }}
        >
          <span className="font-display text-[10px] text-fg-muted tracking-widest uppercase">
            {node.id}
          </span>
          <div className="w-px h-2 bg-border-strong mt-0.5" />
        </div>
      ))}
    </div>
  );
}
