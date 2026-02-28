import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { Button } from "@/components/ui/Button";
import { DotMatrixText } from "@/components/ui/DotMatrixText";
import { SyntMonoText } from "@/components/ui/SyntMonoText";
import { aiResponses, getInitialMessage } from "@/data/ai-responses";
import { api } from "@/lib/api.ts";
import type { BackendTimeline } from "@/lib/mappers.ts";

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
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  // Store user messages for timeline creation context
  const userMessagesRef = useRef<string[]>([]);

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
        // Processing state
        setStage(4);
        setIsProcessing(true);

        setTimeout(() => {
          setIsProcessing(false);
          addMessage("ai", aiResponses[5].message);
          setStage(5);
          setTimelineReady(true);
        }, 2800);
      }
    },
    [stage, addMessage]
  );

  const handleOpenTimeline = useCallback(async () => {
    setIsCreating(true);
    setCreateError(null);

    try {
      const msgs = userMessagesRef.current;
      const title = msgs[0]?.slice(0, 100) || "Untitled Project";
      const summary = msgs.slice(1, 3).join(" ") || undefined;
      const systemPrompt = msgs.join("\n\n") || undefined;

      const timeline = await api.post<BackendTimeline>("/api/timelines", {
        title,
        summary,
        system_prompt: systemPrompt,
      });

      onTimelineCreated?.(timeline.id);
    } catch {
      setCreateError("Failed to create timeline. Try again.");
      setIsCreating(false);
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
              disabled={isCreating}
            >
              {isCreating ? "CREATING..." : "OPEN TIMELINE"}
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
