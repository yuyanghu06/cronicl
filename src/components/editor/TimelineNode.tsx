import React from "react";
import { cn } from "@/lib/cn";
import { DotMatrixText } from "@/components/ui/DotMatrixText";
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

      {/* Caption + metadata */}
      <div className="px-2.5 py-1.5">
        <DotMatrixText
          as="div"
          className="text-[11px] text-fg-bright tracking-[0.15em] truncate"
        >
          {node.label}
        </DotMatrixText>
        <div className="flex items-center gap-1.5 mt-1">
          <SyntMonoText className="text-[9px]">{node.type}</SyntMonoText>
          <SyntMonoText className="text-[9px] text-fg-muted">//</SyntMonoText>
          <SyntMonoText className="text-[9px]">{node.metadata.wordCount}w</SyntMonoText>
          <SyntMonoText className="text-[9px] text-fg-muted">//</SyntMonoText>
          <SyntMonoText className="text-[9px]">{node.status}</SyntMonoText>
          {node.status === "generating" && <Badge variant="generating">GEN</Badge>}
          {node.type === "branch" && <Badge variant="active">BRANCH</Badge>}
        </div>
      </div>
    </div>
  );
});
