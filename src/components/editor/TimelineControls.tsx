import { Button } from "@/components/ui/Button";
import { SyntMonoText } from "@/components/ui/SyntMonoText";
import { Plus, Minus, Maximize2, GitBranch, CirclePlus } from "lucide-react";

interface TimelineControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
  onAddNode: () => void;
}

export function TimelineControls({
  zoom,
  onZoomIn,
  onZoomOut,
  onFitView,
  onAddNode,
}: TimelineControlsProps) {
  return (
    <div className="absolute bottom-4 left-4 z-20 flex items-center gap-1 bg-bg-base/80 backdrop-blur-sm border border-border-subtle rounded-2xl p-2">
      <Button variant="ghost" size="sm" onClick={onZoomOut} className="px-2 py-1">
        <Minus size={14} strokeWidth={1.5} />
      </Button>
      <SyntMonoText className="text-[11px] text-fg-dim w-12 text-center">
        {Math.round(zoom * 100)}%
      </SyntMonoText>
      <Button variant="ghost" size="sm" onClick={onZoomIn} className="px-2 py-1">
        <Plus size={14} strokeWidth={1.5} />
      </Button>
      <div className="w-px h-4 bg-border-subtle mx-1" />
      <Button variant="ghost" size="sm" onClick={onFitView} className="px-2 py-1">
        <Maximize2 size={14} strokeWidth={1.5} />
      </Button>
      <div className="w-px h-4 bg-border-subtle mx-1" />
      <Button variant="ghost" size="sm" className="px-2 py-1 text-red hover:text-red">
        <GitBranch size={14} strokeWidth={1.5} />
      </Button>
      <div className="w-px h-4 bg-border-subtle mx-1" />
      <Button variant="ghost" size="sm" onClick={onAddNode} className="px-2 py-1">
        <CirclePlus size={14} strokeWidth={1.5} />
      </Button>
    </div>
  );
}
