import { DotMatrixText } from "@/components/ui/DotMatrixText";
import { CourierText } from "@/components/ui/CourierText";
import { SyntMonoText } from "@/components/ui/SyntMonoText";
import type { TimelineNode } from "@/types/node";

interface NodeDetailPanelProps {
  node: TimelineNode;
}

export function NodeDetailPanel({ node }: NodeDetailPanelProps) {
  return (
    <div className="space-y-6">
      {/* Node ID + type */}
      <div>
        <DotMatrixText as="h2" className="text-xl text-fg-max mb-2">
          {node.id}
        </DotMatrixText>
        <SyntMonoText className="text-xs">
          {node.type}
          {node.metadata.chapterIndex != null &&
            ` // ACT ${node.metadata.chapterIndex}`}
        </SyntMonoText>
      </div>

      <div className="h-px bg-border-subtle" />

      {/* Plot summary */}
      <div>
        <DotMatrixText
          as="h3"
          className="text-xs text-fg-dim mb-3 tracking-[0.2em]"
        >
          PLOT SUMMARY
        </DotMatrixText>
        <CourierText className="text-sm text-fg-bright leading-relaxed whitespace-pre-wrap">
          {node.plotSummary}
        </CourierText>
      </div>

      <div className="h-px bg-border-subtle" />

      {/* Metadata */}
      <div>
        <DotMatrixText
          as="h3"
          className="text-xs text-fg-dim mb-3 tracking-[0.2em]"
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
                className="text-xs text-fg-dim mb-3 tracking-[0.2em]"
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
