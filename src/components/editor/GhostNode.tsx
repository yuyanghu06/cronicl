import React from "react";
import { DotMatrixText } from "@/components/ui/DotMatrixText";
import { CourierText } from "@/components/ui/CourierText";
import { SyntMonoText } from "@/components/ui/SyntMonoText";
import { Badge } from "@/components/ui/Badge";
import type { GhostNode as GhostNodeType } from "@/types/suggestion";

interface GhostNodeProps {
  ghost: GhostNodeType;
  onClick: () => void;
}

export const GhostNode = React.memo(function GhostNode({ ghost, onClick }: GhostNodeProps) {
  return (
    <div
      data-node
      onClick={onClick}
      className="w-60 opacity-60 bg-bg-raised border border-dashed border-red/40 rounded-2xl cursor-pointer transition-all duration-200 select-none overflow-hidden hover:opacity-80 hover:border-red/60"
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <DotMatrixText className="text-[11px] text-fg-dim">
            GHOST
          </DotMatrixText>
          <Badge variant={ghost.direction_type === "exploratory" ? "active" : "default"}>
            {ghost.direction_type === "exploratory" ? "EXPLORATORY" : "ALIGNED"}
          </Badge>
        </div>

        {/* Title */}
        <DotMatrixText
          as="div"
          className="text-xs text-fg-bright mb-2 tracking-[0.15em]"
        >
          {ghost.title}
        </DotMatrixText>

        {/* Summary */}
        <CourierText className="text-xs text-fg-dim leading-relaxed line-clamp-3 mb-3">
          {ghost.summary}
        </CourierText>

        {/* Divider + tone */}
        <div className="h-px bg-border-subtle mb-2" />
        <SyntMonoText className="text-[10px]">{ghost.tone}</SyntMonoText>
      </div>
    </div>
  );
});
