import { useEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { useAuth } from "@/lib/auth.tsx";
import { ScanlineOverlay } from "@/components/ui/ScanlineOverlay";
import { BackgroundTexture } from "@/components/landing/BackgroundTexture";
import { DotMatrixText } from "@/components/ui/DotMatrixText";
import { SyntMonoText } from "@/components/ui/SyntMonoText";
import { Button } from "@/components/ui/Button";
import { landingMotion } from "@/components/landing/PowerOnSequence";

export function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, login } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate("/home", { replace: true });
    }
  }, [isLoading, isAuthenticated, navigate]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") login();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [login]);

  return (
    <div className="min-h-screen bg-bg-void flex items-center justify-center overflow-hidden relative">
      <ScanlineOverlay />
      <BackgroundTexture />

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

        {/* Subheading */}
        <motion.div variants={landingMotion.item} className="mt-8">
          <SyntMonoText className="text-sm text-fg-dim tracking-[0.3em]">
            IDENTIFY
          </SyntMonoText>
        </motion.div>

        {/* Divider */}
        <motion.div variants={landingMotion.item} className="mt-10">
          <div className="w-48 h-px bg-border-strong" />
        </motion.div>

        {/* OAuth button */}
        <motion.div variants={landingMotion.item} className="mt-12">
          <Button
            variant="primary"
            size="lg"
            onClick={login}
            className="tracking-[0.25em] text-sm px-12"
          >
            LOGIN WITH RAILWAY
          </Button>
        </motion.div>

        {/* Hint */}
        <motion.div variants={landingMotion.item} className="mt-20">
          <SyntMonoText className="text-xs text-fg-muted/50 tracking-widest">
            SECURE OAUTH 2.0 // PRESS ENTER
          </SyntMonoText>
        </motion.div>
      </motion.div>
    </div>
  );
}
