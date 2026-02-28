import type { TimelineNode } from "@/types/node";

interface TimelineConnectorProps {
  nodes: TimelineNode[];
}

export function TimelineConnector({ nodes }: TimelineConnectorProps) {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const paths: { from: TimelineNode; to: TimelineNode }[] = [];

  for (const node of nodes) {
    for (const connId of node.connections) {
      const target = nodeMap.get(connId);
      if (target) {
        paths.push({ from: node, to: target });
      }
    }
  }

  if (paths.length === 0) return null;

  const maxX = Math.max(...nodes.map((n) => n.position.x)) + 500;
  const maxY = Math.max(...nodes.map((n) => n.position.y)) + 500;

  // Node card dimensions
  const nodeWidth = 240;
  const nodeHeight = 240;

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      style={{ width: maxX, height: maxY }}
    >
      {paths.map(({ from, to }) => {
        const x1 = from.position.x + nodeWidth;
        const y1 = from.position.y + nodeHeight / 2;
        const x2 = to.position.x;
        const y2 = to.position.y + nodeHeight / 2;

        // Circuit trace: right-angle paths
        const midX = x1 + (x2 - x1) / 2;

        let d: string;
        if (Math.abs(y1 - y2) < 5) {
          // Straight horizontal
          d = `M ${x1} ${y1} L ${x2} ${y2}`;
        } else {
          // Right-angle with midpoint
          d = `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;
        }

        return (
          <g key={`${from.id}-${to.id}`}>
            <path
              d={d}
              fill="none"
              stroke="var(--color-border-strong)"
              strokeWidth={1}
            />
            {/* Joint circles */}
            <circle
              cx={x1}
              cy={y1}
              r={3}
              fill="var(--color-fg-muted)"
            />
            <circle
              cx={x2}
              cy={y2}
              r={3}
              fill="var(--color-fg-muted)"
            />
          </g>
        );
      })}
    </svg>
  );
}
