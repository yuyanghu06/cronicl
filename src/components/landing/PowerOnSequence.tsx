import { motion, type Variants } from "motion/react";
import { DotMatrixText } from "@/components/ui/DotMatrixText";
import { CourierText } from "@/components/ui/CourierText";
import { SyntMonoText } from "@/components/ui/SyntMonoText";
import { Button } from "@/components/ui/Button";

export const landingMotion = {
  container: {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.35, delayChildren: 0.4 },
    },
  } satisfies Variants,

  item: {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const },
    },
  } satisfies Variants,

  powerDot: {
    hidden: { opacity: 0, scale: 0 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.15, ease: "easeOut" as const },
    },
  } satisfies Variants,
};

interface PowerOnSequenceProps {
  buttonLabel?: string;
  onButtonClick?: () => void;
  hint?: string;
}

export function PowerOnSequence({
  buttonLabel = "ENTER",
  onButtonClick,
  hint = "PRESS ENTER OR CLICK TO BEGIN",
}: PowerOnSequenceProps) {
  return (
    <motion.div
      variants={landingMotion.container}
      initial="hidden"
      animate="visible"
      className="relative z-10 flex flex-col items-center text-center px-6"
    >
      {/* Power indicator dot */}
      <motion.div variants={landingMotion.powerDot} className="mb-16">
        <div className="w-2 h-2 rounded-full bg-red shadow-glow-red" />
      </motion.div>

      {/* Wordmark */}
      <motion.div variants={landingMotion.item}>
        <DotMatrixText
          as="h1"
          className="text-5xl md:text-hero leading-none tracking-[0.2em] text-fg-max"
        >
          cronicl
        </DotMatrixText>
      </motion.div>

      {/* Tagline */}
      <motion.div variants={landingMotion.item} className="mt-8 max-w-lg">
        <CourierText className="text-lg text-fg-dim leading-relaxed">
          AI-powered narrative design for screenplay and story.
        </CourierText>
      </motion.div>

      {/* Divider + system readout */}
      <motion.div variants={landingMotion.item} className="mt-10 flex flex-col items-center gap-4">
        <div className="w-48 h-px bg-border-strong" />
        <SyntMonoText className="text-xs text-fg-muted tracking-[0.3em]">
          v0.1.0 // SYSTEM READY
        </SyntMonoText>
      </motion.div>

      {/* CTA */}
      <motion.div variants={landingMotion.item} className="mt-12">
        <Button
          variant="primary"
          size="lg"
          onClick={onButtonClick}
          className="tracking-[0.25em] text-sm px-12"
        >
          {buttonLabel}
        </Button>
      </motion.div>

      {/* Bottom flourish — keyboard hint */}
      <motion.div variants={landingMotion.item} className="mt-20">
        <SyntMonoText className="text-xs text-fg-muted/50 tracking-widest">
          {hint}
        </SyntMonoText>
      </motion.div>
    </motion.div>
  );
}
