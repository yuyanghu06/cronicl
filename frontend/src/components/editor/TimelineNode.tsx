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
}

export function TimelineNode({ node, isSelected, onClick }: TimelineNodeProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "absolute w-60 bg-bg-raised border rounded-lg cursor-pointer transition-all duration-200 select-none overflow-hidden",
        isSelected
          ? "border-red shadow-glow-red"
          : "border-border-subtle hover:border-border-strong"
      )}
      style={{
        left: node.position.x,
        top: node.position.y,
      }}
    >
      {/* Storyboard frame */}
      <StoryboardFrame
        imageUrl={node.imageUrl}
        status={node.status === "generating" ? "generating" : "pending"}
      />

      {/* Node content */}
      <div className="p-3">
        {/* Label */}
        <DotMatrixText
          as="div"
          className="text-xs text-fg-bright mb-2 tracking-[0.15em] line-clamp-2"
        >
          {node.label}
        </DotMatrixText>

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
          {node.status === "generating" && (
            <Badge variant="generating">GEN</Badge>
          )}
          {node.type === "branch" && (
            <Badge variant="active">BRANCH</Badge>
          )}
        </div>
      </div>
    </div>
  );
}
