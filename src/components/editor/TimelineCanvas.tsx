import { useRef, useState, useCallback, type MouseEvent, type WheelEvent } from "react";
import { motion } from "motion/react";
import { TimelineNode } from "@/components/editor/TimelineNode";
import { TimelineConnector } from "@/components/editor/TimelineConnector";
import { TimelineRuler } from "@/components/editor/TimelineRuler";
import { TimelineControls } from "@/components/editor/TimelineControls";
import type { TimelineNode as TNode } from "@/types/node";

interface TimelineCanvasProps {
  nodes: TNode[];
  selectedNodeId: string | null;
  onSelectNode: (id: string | null) => void;
  onGenerateImage?: (nodeId: string) => void;
  onAddNode: () => void;
}

export function TimelineCanvas({
  nodes,
  selectedNodeId,
  onSelectNode,
  onGenerateImage,
  onAddNode,
}: TimelineCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pan, setPan] = useState({ x: -20, y: -60 });
  const [zoom, setZoom] = useState(0.85);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const panStart = useRef({ x: 0, y: 0 });

  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      // Only pan on background click (not on nodes)
      if ((e.target as HTMLElement).closest("[data-node]")) return;
      setIsDragging(true);
      dragStart.current = { x: e.clientX, y: e.clientY };
      panStart.current = { ...pan };
    },
    [pan]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      setPan({
        x: panStart.current.x + dx,
        y: panStart.current.y + dy,
      });
    },
    [isDragging]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    setZoom((prev) => Math.min(2, Math.max(0.3, prev - e.deltaY * 0.001)));
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(2, prev + 0.15));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(0.3, prev - 0.15));
  }, []);

  const handleFitView = useCallback(() => {
    setZoom(0.85);
    setPan({ x: -20, y: -60 });
  }, []);

  const handleCanvasClick = useCallback(
    (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest("[data-node]")) {
        onSelectNode(null);
      }
    },
    [onSelectNode]
  );

  return (
    <div
      ref={containerRef}
      className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onClick={handleCanvasClick}
    >
      {/* Faint grid background */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            linear-gradient(var(--color-border-subtle) 1px, transparent 1px),
            linear-gradient(90deg, var(--color-border-subtle) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
          transform: `translate(${pan.x % 40}px, ${pan.y % 40}px)`,
        }}
      />

      {/* Transformed content */}
      <div
        className="absolute"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: "0 0",
        }}
      >
        {/* Ruler */}
        <TimelineRuler nodes={nodes} />

        {/* Connectors (SVG) */}
        <TimelineConnector nodes={nodes} />

        {/* Nodes */}
        {nodes.map((node, index) => (
          <motion.div
            key={node.id}
            data-node
            initial={{ opacity: 0, scale: 0.92, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
              duration: 0.4,
              delay: index * 0.04,
              ease: [0.16, 1, 0.3, 1],
            }}
            style={{
              position: "absolute",
              left: node.position.x,
              top: node.position.y,
              transformOrigin: "center top",
            }}
          >
            <TimelineNode
              node={node}
              isSelected={selectedNodeId === node.id}
              onClick={() => onSelectNode(node.id)}
              onGenerateImage={onGenerateImage}
            />
          </motion.div>
        ))}
      </div>

      {/* Controls overlay */}
      <TimelineControls
        zoom={zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFitView={handleFitView}
        onAddNode={onAddNode}
      />
    </div>
  );
}
