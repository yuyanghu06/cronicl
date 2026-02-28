import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "motion/react";
import { DotMatrixText } from "@/components/ui/DotMatrixText";
import { CourierText } from "@/components/ui/CourierText";
import { SyntMonoText } from "@/components/ui/SyntMonoText";
import { Button } from "@/components/ui/Button";
import type { TimelineNode } from "@/types/node";

interface NodeBranchTabProps {
  node: TimelineNode;
  onGenerateBranch: (fromNodeId: string, description: string) => void;
}

type Stage = "awaiting_description" | "confirmed" | "generating";

interface MiniMessage {
  id: string;
  variant: "ai" | "user";
  content: string;
}

export function NodeBranchTab({ node, onGenerateBranch }: NodeBranchTabProps) {
  const [stage, setStage] = useState<Stage>("awaiting_description");
  const [messages, setMessages] = useState<MiniMessage[]>([]);
  const [input, setInput] = useState("");
  const [description, setDescription] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Reset on node change
  useEffect(() => {
    setStage("awaiting_description");
    setMessages([
      {
        id: "init",
        variant: "ai",
        content:
          "Describe what happens in this branch. I'll generate a new node from this point.",
      },
    ]);
    setInput("");
    setDescription("");
  }, [node.id]);

  // Auto-scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight;
      });
    }
  }, [messages, stage]);

  const handleSubmit = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;

    setDescription(trimmed);
    setMessages((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, variant: "user", content: trimmed },
    ]);
    setInput("");

    // AI confirms after short delay
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          variant: "ai",
          content: `Branch concept received. New node will diverge from ${node.id}. Ready to generate when you are.`,
        },
      ]);
      setStage("confirmed");
    }, 600);
  }, [input, node.id]);

  const handleGenerate = useCallback(() => {
    setStage("generating");
    onGenerateBranch(node.id, description);
  }, [node.id, description, onGenerateBranch]);

  return (
    <div className="flex flex-col h-full">
      {/* Mini message area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-3 mb-4 min-h-0"
      >
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className={msg.variant === "user" ? "flex justify-end" : ""}
          >
            {msg.variant === "ai" ? (
              <div>
                <DotMatrixText className="text-[9px] text-red mb-1 block tracking-[0.2em]">
                  ARCHITECT
                </DotMatrixText>
                <CourierText className="text-xs text-fg-bright leading-relaxed">
                  {msg.content}
                </CourierText>
              </div>
            ) : (
              <div className="bg-bg-raised border border-border-subtle rounded-xl px-3 py-1.5 max-w-[85%]">
                <SyntMonoText className="text-xs text-fg-bright">
                  {msg.content}
                </SyntMonoText>
              </div>
            )}
          </motion.div>
        ))}

        {/* Generating state */}
        {stage === "generating" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 py-2"
          >
            <DotMatrixText className="text-[9px] text-red animate-pulse-red tracking-[0.2em]">
              GENERATING NODE...
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
          </motion.div>
        )}
      </div>

      {/* Input or generate button */}
      {stage === "awaiting_description" && (
        <div className="shrink-0 border-t border-border-subtle pt-3">
          <div className="flex items-center gap-2">
            <span className="font-system text-red text-xs shrink-0">{">"}</span>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
              }}
              placeholder="Describe the branch..."
              className="flex-1 bg-transparent border-none outline-none font-system text-xs text-fg-bright placeholder:text-fg-muted"
              autoFocus
            />
          </div>
        </div>
      )}

      {stage === "confirmed" && (
        <div className="shrink-0 border-t border-border-subtle pt-3">
          <Button variant="primary" size="sm" onClick={handleGenerate}>
            GENERATE BRANCH
          </Button>
        </div>
      )}
    </div>
  );
}
