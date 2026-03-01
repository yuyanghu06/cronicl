import { useEffect } from "react";
import { motion } from "motion/react";
import { DotMatrixText } from "@/components/ui/DotMatrixText";
import { CourierText } from "@/components/ui/CourierText";
import { SyntMonoText } from "@/components/ui/SyntMonoText";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { TimelineNode } from "@/types/node";
import type { SuggestionState } from "@/types/suggestion";

interface NodeSuggestTabProps {
  node: TimelineNode;
  suggestions: SuggestionState;
  onRequestSuggestions: (nodeId: string) => void;
  onAcceptGhostNode: (ghostId: string) => void;
  onDismissGhostNode: (ghostId: string) => void;
  onDismissSuggestions: () => void;
}

export function NodeSuggestTab({
  node,
  suggestions,
  onRequestSuggestions,
  onAcceptGhostNode,
  onDismissGhostNode,
  onDismissSuggestions,
}: NodeSuggestTabProps) {
  // Reset when source node changes
  useEffect(() => {
    if (suggestions.sourceNodeId && suggestions.sourceNodeId !== node.id && suggestions.status !== "idle") {
      onDismissSuggestions();
    }
  }, [node.id, suggestions.sourceNodeId, suggestions.status, onDismissSuggestions]);

  // --- Idle state ---
  if (suggestions.status === "idle" || suggestions.sourceNodeId !== node.id) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <SyntMonoText className="text-xs text-fg-muted text-center">
          Generate AI suggestions for what happens next from this node.
        </SyntMonoText>
        <Button
          variant="primary"
          size="sm"
          onClick={() => onRequestSuggestions(node.id)}
        >
          SUGGEST NEXT
        </Button>
      </div>
    );
  }

  // --- Loading state ---
  if (suggestions.status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <DotMatrixText className="text-[9px] text-red animate-pulse-red tracking-[0.2em]">
          CONSULTING ARCHITECT...
        </DotMatrixText>
        <div className="flex gap-1">
          <span
            className="w-1 h-1 rounded-full bg-red animate-pulse-red"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="w-1 h-1 rounded-full bg-red animate-pulse-red"
            style={{ animationDelay: "200ms" }}
          />
          <span
            className="w-1 h-1 rounded-full bg-red animate-pulse-red"
            style={{ animationDelay: "400ms" }}
          />
        </div>
      </div>
    );
  }

  // --- Error state ---
  if (suggestions.status === "error") {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <SyntMonoText className="text-xs text-red">
          {suggestions.error || "Suggestion generation failed."}
        </SyntMonoText>
        <Button
          variant="primary"
          size="sm"
          onClick={() => onRequestSuggestions(node.id)}
        >
          RETRY
        </Button>
      </div>
    );
  }

  // --- Ready state ---
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-3 min-h-0">
        <DotMatrixText className="text-[9px] text-red mb-2 block tracking-[0.2em]">
          ARCHITECT SUGGESTIONS
        </DotMatrixText>

        {suggestions.ghostNodes.map((ghost, index) => (
          <motion.div
            key={ghost.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: index * 0.08 }}
            className="border border-dashed border-red/30 rounded-xl p-3 space-y-2"
          >
            <div className="flex items-center justify-between">
              <DotMatrixText className="text-xs text-fg-bright tracking-[0.1em]">
                {ghost.title}
              </DotMatrixText>
              <Badge variant={ghost.direction_type === "exploratory" ? "active" : "default"}>
                {ghost.direction_type === "exploratory" ? "EXPL" : "ALGN"}
              </Badge>
            </div>

            <CourierText className="text-xs text-fg-dim leading-relaxed">
              {ghost.summary}
            </CourierText>

            <SyntMonoText className="text-[10px] text-fg-muted">
              tone: {ghost.tone}
            </SyntMonoText>

            <div className="flex gap-2 pt-1">
              <Button
                variant="primary"
                size="sm"
                onClick={() => onAcceptGhostNode(ghost.id)}
              >
                ACCEPT
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDismissGhostNode(ghost.id)}
              >
                DISMISS
              </Button>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="shrink-0 border-t border-border-subtle pt-3 mt-3">
        <Button
          variant="ghost"
          size="sm"
          className="text-red"
          onClick={onDismissSuggestions}
        >
          DISMISS ALL
        </Button>
      </div>
    </div>
  );
}
