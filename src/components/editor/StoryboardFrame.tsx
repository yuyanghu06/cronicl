import { DotMatrixText } from "@/components/ui/DotMatrixText";

interface StoryboardFrameProps {
  status: "pending" | "generating";
  imageUrl?: string;
  onGenerate?: () => void;
}

export function StoryboardFrame({ status, imageUrl, onGenerate }: StoryboardFrameProps) {
  const isGenerating = status === "generating";

  const handleGenerate = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isGenerating) return;
    onGenerate?.();
  };

  return (
    <div className="w-full h-20 bg-bg-void relative flex items-center justify-center overflow-hidden">
      {/* Film-frame corner markers — always visible */}
      <span className="absolute top-1.5 left-1.5 w-2 h-2 border-l border-t border-fg-muted/30 z-10" />
      <span className="absolute top-1.5 right-1.5 w-2 h-2 border-r border-t border-fg-muted/30 z-10" />
      <span className="absolute bottom-1.5 left-1.5 w-2 h-2 border-l border-b border-fg-muted/30 z-10" />
      <span className="absolute bottom-1.5 right-1.5 w-2 h-2 border-r border-b border-fg-muted/30 z-10" />

      {/* Content */}
      {imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : isGenerating ? (
        <>
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div
              className="absolute inset-x-0 h-4 bg-gradient-to-b from-transparent via-red/10 to-transparent"
              style={{ animation: "scanline-sweep 1.5s linear infinite" }}
            />
          </div>
          <DotMatrixText className="text-[10px] text-red animate-pulse-red">
            GENERATING...
          </DotMatrixText>
        </>
      ) : (
        <DotMatrixText className="text-[10px] text-fg-muted">
          FRAME_PENDING
        </DotMatrixText>
      )}

      {/* GEN button — only when no image and not generating */}
      {!imageUrl && !isGenerating && (
        <button
          onClick={handleGenerate}
          className="absolute bottom-1.5 right-1.5 z-10 font-display text-[9px] uppercase tracking-widest text-fg-muted hover:text-red bg-bg-raised/80 border border-border-subtle rounded-lg px-1.5 py-0.5 cursor-pointer transition-colors"
        >
          GEN
        </button>
      )}
    </div>
  );
}
