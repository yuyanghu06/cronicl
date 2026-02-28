import { useState, useCallback } from "react";
import { DotMatrixText } from "@/components/ui/DotMatrixText";

interface StoryboardFrameProps {
  status: "pending" | "generating";
  onGenerate?: () => void;
}

export function StoryboardFrame({ status, onGenerate }: StoryboardFrameProps) {
  const [localState, setLocalState] = useState<
    "idle" | "generating" | "complete"
  >("idle");

  const handleGenerate = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (localState === "generating") return;
      setLocalState("generating");
      onGenerate?.();
      setTimeout(() => {
        setLocalState("complete");
      }, 3000);
    },
    [localState, onGenerate]
  );

  const isGenerating = status === "generating" || localState === "generating";

  return (
    <div className="w-full h-20 bg-bg-void relative flex items-center justify-center">
      {/* Film-frame corner markers */}
      <span className="absolute top-1.5 left-1.5 w-2 h-2 border-l border-t border-fg-muted/30" />
      <span className="absolute top-1.5 right-1.5 w-2 h-2 border-r border-t border-fg-muted/30" />
      <span className="absolute bottom-1.5 left-1.5 w-2 h-2 border-l border-b border-fg-muted/30" />
      <span className="absolute bottom-1.5 right-1.5 w-2 h-2 border-r border-b border-fg-muted/30" />

      {/* Content */}
      {isGenerating ? (
        <>
          {/* Scanline sweep */}
          <div
            className="absolute inset-0 overflow-hidden pointer-events-none"
          >
            <div
              className="absolute inset-x-0 h-4 bg-gradient-to-b from-transparent via-red/10 to-transparent"
              style={{ animation: "scanline-sweep 1.5s linear infinite" }}
            />
          </div>
          <DotMatrixText className="text-[10px] text-red animate-pulse-red">
            GENERATING...
          </DotMatrixText>
        </>
      ) : localState === "complete" ? (
        /* Cinematic placeholder gradient */
        <div className="absolute inset-0 bg-gradient-to-br from-bg-raised via-bg-hover to-bg-active" />
      ) : (
        <DotMatrixText className="text-[10px] text-fg-muted">
          FRAME_PENDING
        </DotMatrixText>
      )}

      {/* GEN button */}
      {!isGenerating && localState !== "complete" && (
        <button
          onClick={handleGenerate}
          className="absolute bottom-1.5 right-1.5 font-display text-[9px] uppercase tracking-widest text-fg-muted hover:text-red bg-bg-raised/80 border border-border-subtle rounded-lg px-1.5 py-0.5 cursor-pointer transition-colors"
        >
          GEN
        </button>
      )}
    </div>
  );
}
