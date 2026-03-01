import React from "react";
import { cn } from "@/lib/cn";
import { DotMatrixText } from "@/components/ui/DotMatrixText";
import { CourierText } from "@/components/ui/CourierText";
import { SyntMonoText } from "@/components/ui/SyntMonoText";
import { Badge } from "@/components/ui/Badge";
import { StoryboardFrame } from "./StoryboardFrame";
import type { TimelineNode as TNode } from "@/types/node";

interface TimelineNodeProps {
  node: TNode;
  isSelected: boolean;
  onClick: () => void;
  onGenerateImage?: (nodeId: string) => void;
}

export const TimelineNode = React.memo(function TimelineNode({ node, isSelected, onClick, onGenerateImage }: TimelineNodeProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "w-60 bg-bg-raised border rounded-2xl cursor-pointer transition-all duration-200 select-none overflow-hidden",
        isSelected
          ? "border-red shadow-glow-red"
          : "border-border-subtle hover:border-border-strong"
      )}
    >
      {/* Storyboard frame */}
      <StoryboardFrame
        status={node.status === "generating" ? "generating" : "pending"}
        imageUrl={node.imageUrl}
        onGenerate={onGenerateImage ? () => onGenerateImage(node.id) : undefined}
      />

      {/* Node content */}
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <DotMatrixText className="text-[11px] text-fg-dim">
            {node.id}
          </DotMatrixText>
          {node.status === "generating" && (
            <Badge variant="generating">GEN</Badge>
          )}
          {node.type === "branch" && (
            <Badge variant="active">BRANCH</Badge>
          )}
          {node.type === "merge" && (
            <Badge variant="active">MERGE</Badge>
          )}
        </div>

        {/* Label */}
        {node.type === "chapter" && (
          <DotMatrixText
            as="div"
            className="text-xs text-fg-bright mb-2 tracking-[0.15em]"
          >
            {node.label}
          </DotMatrixText>
        )}

        {/* Plot summary */}
        <CourierText className="text-xs text-fg-dim leading-relaxed line-clamp-3 mb-3">
          {node.plotSummary}
        </CourierText>

        {/* Divider + metadata */}
        <div className="h-px bg-border-subtle mb-2" />
        <div className="flex items-center gap-2">
          <SyntMonoText className="text-[10px]">{node.type}</SyntMonoText>
          <SyntMonoText className="text-[10px] text-fg-muted">//</SyntMonoText>
          <SyntMonoText className="text-[10px]">
            {node.metadata.wordCount}w
          </SyntMonoText>
          <SyntMonoText className="text-[10px] text-fg-muted">//</SyntMonoText>
          <SyntMonoText className="text-[10px]">{node.status}</SyntMonoText>
        </div>
      </div>
    </div>
  );
});
