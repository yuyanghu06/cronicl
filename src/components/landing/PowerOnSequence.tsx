import { motion, type Variants } from "motion/react";
import { DotMatrixText } from "@/components/ui/DotMatrixText";
import { CourierText } from "@/components/ui/CourierText";
import { SyntMonoText } from "@/components/ui/SyntMonoText";
import { Button } from "@/components/ui/Button";
import { useNavigate } from "react-router";

const container: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.35, delayChildren: 0.4 },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const },
  },
};

const powerDot: Variants = {
  hidden: { opacity: 0, scale: 0 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.15, ease: "easeOut" as const },
  },
};

export function PowerOnSequence() {
  const navigate = useNavigate();

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="visible"
      className="relative z-10 flex flex-col items-center text-center px-6"
    >
      {/* Power indicator dot */}
      <motion.div variants={powerDot} className="mb-16">
        <div className="w-2 h-2 rounded-full bg-red shadow-glow-red" />
      </motion.div>

      {/* Wordmark */}
      <motion.div variants={item}>
        <DotMatrixText
          as="h1"
          className="text-5xl md:text-hero leading-none tracking-[0.2em] text-fg-max"
        >
          cronicl
        </DotMatrixText>
      </motion.div>

      {/* Tagline */}
      <motion.div variants={item} className="mt-8 max-w-lg">
        <CourierText className="text-lg text-fg-dim leading-relaxed">
          AI-powered narrative design for screenplay and story.
        </CourierText>
      </motion.div>

      {/* Divider + system readout */}
      <motion.div variants={item} className="mt-10 flex flex-col items-center gap-4">
        <div className="w-48 h-px bg-border-strong" />
        <SyntMonoText className="text-xs text-fg-muted tracking-[0.3em]">
          v0.1.0 // SYSTEM READY
        </SyntMonoText>
      </motion.div>

      {/* CTA */}
      <motion.div variants={item} className="mt-12">
        <Button
          variant="primary"
          size="lg"
          onClick={() => navigate("/home")}
          className="tracking-[0.25em] text-sm px-12"
        >
          ENTER
        </Button>
      </motion.div>

      {/* Bottom flourish — keyboard hint */}
      <motion.div variants={item} className="mt-20">
        <SyntMonoText className="text-xs text-fg-muted/50 tracking-widest">
          PRESS ENTER OR CLICK TO BEGIN
        </SyntMonoText>
      </motion.div>
    </motion.div>
  );
}
