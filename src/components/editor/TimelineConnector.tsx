import type { TimelineNode } from "@/types/node";

export interface GhostConnection {
  fromId: string;
  toPosition: { x: number; y: number };
}

interface TimelineConnectorProps {
  nodes: TimelineNode[];
  ghostConnections?: GhostConnection[];
}

export function TimelineConnector({ nodes, ghostConnections }: TimelineConnectorProps) {
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

  const hasGhosts = ghostConnections && ghostConnections.length > 0;
  if (paths.length === 0 && !hasGhosts) return null;

  let maxX = nodes.length > 0 ? Math.max(...nodes.map((n) => n.position.x)) + 500 : 500;
  let maxY = nodes.length > 0 ? Math.max(...nodes.map((n) => n.position.y)) + 500 : 500;

  // Extend SVG bounds for ghost connections
  if (ghostConnections) {
    for (const gc of ghostConnections) {
      maxX = Math.max(maxX, gc.toPosition.x + 500);
      maxY = Math.max(maxY, gc.toPosition.y + 500);
    }
  }

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

      {/* Ghost connections (dashed red lines) */}
      {ghostConnections?.map((gc) => {
        const fromNode = nodeMap.get(gc.fromId);
        if (!fromNode) return null;

        const x1 = fromNode.position.x + nodeWidth;
        const y1 = fromNode.position.y + nodeHeight / 2;
        const x2 = gc.toPosition.x;
        const y2 = gc.toPosition.y + nodeHeight / 2;

        const midX = x1 + (x2 - x1) / 2;

        let d: string;
        if (Math.abs(y1 - y2) < 5) {
          d = `M ${x1} ${y1} L ${x2} ${y2}`;
        } else {
          d = `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;
        }

        return (
          <g key={`ghost-${gc.fromId}-${gc.toPosition.x}-${gc.toPosition.y}`}>
            <path
              d={d}
              fill="none"
              stroke="var(--color-red)"
              strokeWidth={1}
              strokeDasharray="6 4"
              opacity={0.4}
            />
            <circle
              cx={x1}
              cy={y1}
              r={3}
              fill="var(--color-red)"
              opacity={0.4}
            />
            <circle
              cx={x2}
              cy={y2}
              r={3}
              fill="var(--color-red)"
              opacity={0.4}
            />
          </g>
        );
      })}
    </svg>
  );
}
