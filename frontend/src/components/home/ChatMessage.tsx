import { motion } from "motion/react";
import { DotMatrixText } from "@/components/ui/DotMatrixText";
import { CourierText } from "@/components/ui/CourierText";
import { SyntMonoText } from "@/components/ui/SyntMonoText";

interface ChatMessageProps {
  variant: "ai" | "user";
  content: string;
}

export function ChatMessage({ variant, content }: ChatMessageProps) {
  if (variant === "user") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="flex justify-end"
      >
        <div className="bg-bg-raised border border-border-subtle rounded-2xl px-4 py-2.5 max-w-md">
          <SyntMonoText className="text-base text-fg-bright">
            {content}
          </SyntMonoText>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-xl"
    >
      <DotMatrixText className="text-xs text-red mb-2 block tracking-[0.2em]">
        STORY_ARCHITECT
      </DotMatrixText>
      <CourierText className="text-base text-fg-bright leading-relaxed whitespace-pre-wrap">
        {content}
      </CourierText>
    </motion.div>
  );
}
