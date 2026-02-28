import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { Button } from "@/components/ui/Button";
import { DotMatrixText } from "@/components/ui/DotMatrixText";
import { SyntMonoText } from "@/components/ui/SyntMonoText";
import { aiResponses, getInitialMessage } from "@/data/ai-responses";
import { api } from "@/lib/api.ts";
import type { BackendTimeline, BackendNode } from "@/lib/mappers.ts";

interface GhostNode {
  title: string;
  summary: string;
  tone: string;
  direction_type: string;
}

interface AISuggestResponse {
  ghost_nodes: GhostNode[];
  inline_suggestions: unknown[];
  model: string;
}

interface Message {
  id: string;
  variant: "ai" | "user";
  content: string;
}

interface AIChatRoomProps {
  onMessageCountChange: (count: number) => void;
  onTimelineCreated?: (timelineId: string) => void;
}

export function AIChatRoom({
  onMessageCountChange,
  onTimelineCreated,
}: AIChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [stage, setStage] = useState(-1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [timelineReady, setTimelineReady] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  // Store user messages for timeline creation context
  const userMessagesRef = useRef<string[]>([]);
  // Store created timeline ID so "OPEN TIMELINE" just navigates
  const createdTimelineIdRef = useRef<string | null>(null);

  const addMessage = useCallback(
    (variant: "ai" | "user", content: string) => {
      setMessages((prev) => {
        const next = [
          ...prev,
          { id: `msg-${Date.now()}-${prev.length}`, variant, content },
        ];
        onMessageCountChange(next.length);
        return next;
      });
    },
    [onMessageCountChange]
  );

  // Auto-scroll on new messages
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight;
      });
    }
  }, [messages, isProcessing, timelineReady]);

  // Initial greeting on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      addMessage("ai", getInitialMessage());
      setStage(0);
    }, 600);
    return () => clearTimeout(timer);
  }, [addMessage]);

  const handleUserMessage = useCallback(
    (text: string) => {
      addMessage("user", text);
      userMessagesRef.current.push(text);

      const nextStage = stage + 1;

      if (nextStage <= 3) {
        // AI responds with next question after a delay
        setTimeout(() => {
          addMessage("ai", aiResponses[nextStage].message);
          setStage(nextStage);
        }, 800);
      } else if (nextStage === 4) {
        // Processing state — create timeline + generate nodes via AI
        setStage(4);
        setIsProcessing(true);
        setCreateError(null);

        (async () => {
          try {
            const msgs = userMessagesRef.current;
            const title = msgs[0]?.slice(0, 100) || "Untitled Project";
            const summary = msgs.slice(1, 3).join(" ") || undefined;
            const systemPrompt = msgs.join("\n\n") || undefined;

            // 1. Create the timeline
            const timeline = await api.post<BackendTimeline>("/api/timelines", {
              title,
              summary,
              system_prompt: systemPrompt,
            });

            // 2. Try AI suggestion for ghost nodes
            let ghostNodes: GhostNode[] = [];
            try {
              const aiResult = await api.post<AISuggestResponse>("/ai/suggest", {
                system_prompt: systemPrompt,
                active_path: [{ node_id: "root", content: msgs[0] || title }],
                num_suggestions: 8,
              });
              ghostNodes = aiResult.ghost_nodes ?? [];
            } catch {
              // AI unavailable — will use placeholders below
            }

            // 3. Persist nodes — either AI-generated or placeholder
            const nodesToCreate = ghostNodes.length > 0
              ? ghostNodes.map((g) => ({ title: g.title, content: g.summary }))
              : [
                  { title: "Act I — Setup", content: "Introduce the world and protagonist." },
                  { title: "Inciting Incident", content: "The event that sets the story in motion." },
                  { title: "Act II — Confrontation", content: "Rising tension and obstacles." },
                ];

            let prevNodeId: string | null = null;
            for (let i = 0; i < nodesToCreate.length; i++) {
              const n = nodesToCreate[i];
              const created: BackendNode = await api.post<BackendNode>(
                `/api/timelines/${timeline.id}/nodes`,
                {
                  title: n.title,
                  label: n.title,
                  content: n.content,
                  parent_id: prevNodeId,
                  position_x: 200 + i * 480,
                  position_y: 300,
                  sort_order: i,
                },
              );
              prevNodeId = created.id;
            }

            createdTimelineIdRef.current = timeline.id;
            const nodeCount = nodesToCreate.length;
            const source = ghostNodes.length > 0 ? "AI-generated" : "placeholder";

            setIsProcessing(false);
            addMessage(
              "ai",
              `TIMELINE READY.\n\n${nodeCount} nodes generated (${source}). Narrative structure initialized.\n\nYour story architecture is ready for review.`,
            );
            setStage(5);
            setTimelineReady(true);
          } catch {
            setIsProcessing(false);
            setCreateError("Failed to create timeline. Try again.");
            setStage(3); // Allow retry
          }
        })();
      }
    },
    [stage, addMessage],
  );

  const handleOpenTimeline = useCallback(() => {
    const timelineId = createdTimelineIdRef.current;
    if (timelineId) {
      onTimelineCreated?.(timelineId);
    }
  }, [onTimelineCreated]);

  const inputDisabled = isProcessing || timelineReady || stage < 0;

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-6"
      >
        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            variant={msg.variant}
            content={msg.content}
          />
        ))}

        {/* Processing state */}
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3 py-4"
          >
            <DotMatrixText className="text-[10px] text-red tracking-[0.2em]">
              PROCESSING
            </DotMatrixText>
            <div className="flex gap-1.5">
              <span
                className="w-1.5 h-1.5 rounded-full bg-red animate-pulse-red"
                style={{ animationDelay: "0ms" }}
              />
              <span
                className="w-1.5 h-1.5 rounded-full bg-red animate-pulse-red"
                style={{ animationDelay: "200ms" }}
              />
              <span
                className="w-1.5 h-1.5 rounded-full bg-red animate-pulse-red"
                style={{ animationDelay: "400ms" }}
              />
            </div>
          </motion.div>
        )}

        {/* Timeline ready — open button */}
        {timelineReady && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="pt-2"
          >
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenTimeline}
            >
              OPEN TIMELINE
            </Button>
            {createError && (
              <SyntMonoText className="text-xs text-red mt-2 block">
                {createError}
              </SyntMonoText>
            )}
          </motion.div>
        )}
      </div>

      {/* Input */}
      <ChatInput onSubmit={handleUserMessage} disabled={inputDisabled} />
    </div>
  );
}
