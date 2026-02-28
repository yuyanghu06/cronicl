import { useState, useEffect } from "react";
import { DotMatrixText } from "@/components/ui/DotMatrixText";
import { Button } from "@/components/ui/Button";
import type { TimelineNode } from "@/types/node";

interface NodeEditTabProps {
  node: TimelineNode;
  onSave: (nodeId: string, updates: { label: string; plotSummary: string }) => void;
  onDiscard: () => void;
}

export function NodeEditTab({ node, onSave, onDiscard }: NodeEditTabProps) {
  const [label, setLabel] = useState(node.label);
  const [plotSummary, setPlotSummary] = useState(node.plotSummary);

  // Reset when node changes
  useEffect(() => {
    setLabel(node.label);
    setPlotSummary(node.plotSummary);
  }, [node.id, node.label, node.plotSummary]);

  return (
    <div className="space-y-5">
      {/* Label input */}
      <div>
        <DotMatrixText
          as="label"
          className="text-[10px] text-fg-dim mb-2 block tracking-[0.2em]"
        >
          LABEL
        </DotMatrixText>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="w-full bg-bg-void border border-border-subtle rounded px-3 py-2 font-narrative text-sm text-fg-bright outline-none focus:border-border-strong transition-colors"
        />
      </div>

      {/* Plot summary textarea */}
      <div>
        <DotMatrixText
          as="label"
          className="text-[10px] text-fg-dim mb-2 block tracking-[0.2em]"
        >
          PLOT SUMMARY
        </DotMatrixText>
        <textarea
          value={plotSummary}
          onChange={(e) => setPlotSummary(e.target.value)}
          rows={6}
          className="w-full bg-bg-void border border-border-subtle rounded px-3 py-2 font-narrative text-sm text-fg-bright leading-relaxed outline-none focus:border-border-strong transition-colors resize-y"
        />
      </div>

      <div className="h-px bg-border-subtle" />

      {/* Read-only metadata */}
      <div>
        <DotMatrixText
          as="h3"
          className="text-[10px] text-fg-dim mb-3 tracking-[0.2em]"
        >
          METADATA
        </DotMatrixText>
        <div className="space-y-1.5">
          <MetaRow label="id" value={node.id} />
          <MetaRow label="type" value={node.type} />
          <MetaRow label="words" value={String(node.metadata.wordCount)} />
          {node.metadata.branchHash && (
            <MetaRow label="branch" value={node.metadata.branchHash} />
          )}
          <MetaRow label="created" value={node.metadata.createdAt} />
          <MetaRow label="status" value={node.status} />
        </div>
      </div>

      {/* Parameters */}
      {node.metadata.parameters &&
        Object.keys(node.metadata.parameters).length > 0 && (
          <>
            <div className="h-px bg-border-subtle" />
            <div>
              <DotMatrixText
                as="h3"
                className="text-[10px] text-fg-dim mb-3 tracking-[0.2em]"
              >
                PARAMETERS
              </DotMatrixText>
              <div className="space-y-1.5">
                {Object.entries(node.metadata.parameters).map(([key, value]) => (
                  <MetaRow key={key} label={key} value={value} />
                ))}
              </div>
            </div>
          </>
        )}

      <div className="h-px bg-border-subtle" />

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button
          variant="primary"
          size="sm"
          onClick={() => onSave(node.id, { label, plotSummary })}
        >
          SAVE CHANGES
        </Button>
        <Button variant="ghost" size="sm" onClick={onDiscard}>
          DISCARD
        </Button>
      </div>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4 font-system text-xs">
      <span className="text-fg-muted w-20 shrink-0">{label}</span>
      <span className="text-fg-dim">{value}</span>
    </div>
  );
}
