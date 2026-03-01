import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { DotMatrixText } from "@/components/ui/DotMatrixText";
import { SyntMonoText } from "@/components/ui/SyntMonoText";
import { NodeEditTab } from "./NodeEditTab";
import { NodeBranchTab } from "./NodeBranchTab";
import type { TimelineNode } from "@/types/node";

type Tab = "EDIT" | "GENERATE";

interface NodePanelProps {
  node: TimelineNode;
  onSave: (nodeId: string, updates: { label: string; plotSummary: string }) => void | Promise<void>;
  onDelete: (nodeId: string) => void;
  onGenerateBranch: (fromNodeId: string, description: string) => void | Promise<void>;
  onPreviewImage?: () => void;
}

export function NodePanel({ node, onSave, onDelete, onGenerateBranch, onPreviewImage }: NodePanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>("EDIT");

  // Reset to EDIT tab on node change
  useEffect(() => {
    setActiveTab("EDIT");
  }, [node.id]);

  const tabs: Tab[] = ["EDIT", "GENERATE"];

  return (
    <div className="flex flex-col h-full">
      {/* Image preview */}
      {node.imageUrl && (
        <button
          type="button"
          onClick={onPreviewImage}
          className="w-full mb-4 rounded-lg overflow-hidden cursor-pointer bg-transparent border-none p-0 group"
        >
          <img
            src={node.imageUrl}
            alt=""
            className="w-full h-[180px] object-cover rounded-lg transition-[filter] duration-200 group-hover:brightness-110"
          />
        </button>
      )}

      {/* Node header */}
      <div className="mb-4">
        <DotMatrixText as="h2" className="text-lg text-fg-max mb-1">
          {node.id}
        </DotMatrixText>
        <SyntMonoText className="text-xs">
          {node.type}
          {node.metadata.chapterIndex != null &&
            ` // ACT ${node.metadata.chapterIndex}`}
        </SyntMonoText>
      </div>

      <div className="h-px bg-border-subtle mb-4" />

      {/* Tab bar */}
      <div className="flex gap-0 mb-5 border-b border-border-subtle relative">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="relative px-4 pb-2 cursor-pointer bg-transparent border-none"
          >
            <DotMatrixText
              className={`text-[10px] tracking-[0.15em] ${
                activeTab === tab ? "text-fg-max" : "text-fg-muted"
              }`}
            >
              {tab}
            </DotMatrixText>
            {activeTab === tab && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-px bg-red"
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0">
        {activeTab === "EDIT" ? (
          <NodeEditTab
            node={node}
            onSave={onSave}
            onDelete={() => onDelete(node.id)}
          />
        ) : (
          <NodeBranchTab
            node={node}
            onGenerateBranch={onGenerateBranch}
          />
        )}
      </div>
    </div>
  );
}
