import { useState, useEffect, type FormEvent } from "react";
import { useNavigate, Link } from "react-router";
import { motion } from "motion/react";
import { useAuth } from "@/lib/auth.tsx";
import { ApiError } from "@/lib/api.ts";
import { ScanlineOverlay } from "@/components/ui/ScanlineOverlay";
import { BackgroundTexture } from "@/components/landing/BackgroundTexture";
import { DotMatrixText } from "@/components/ui/DotMatrixText";
import { SyntMonoText } from "@/components/ui/SyntMonoText";
import { Button } from "@/components/ui/Button";
import { landingMotion } from "@/components/landing/PowerOnSequence";

const isDev = import.meta.env.DEV;
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, login, refreshUser } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate("/home", { replace: true });
    }
  }, [isLoading, isAuthenticated, navigate]);

  const handleEmailLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch(`${API_URL}/auth/login/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Login failed");
        return;
      }
      await refreshUser();
      navigate("/home", { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setError((err.body as { error?: string })?.error ?? "Login failed");
      } else {
        setError("Network error — try again");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full bg-bg-void border border-border-subtle rounded-xl px-3 py-2 text-fg-bright text-sm font-mono focus:outline-none focus:border-red transition-colors";

  return (
    <div className="min-h-screen bg-bg-void flex items-center justify-center overflow-hidden relative">
      <ScanlineOverlay />
      <BackgroundTexture />

      <motion.div
        variants={landingMotion.container}
        initial="hidden"
        animate="visible"
        className="relative z-10 flex flex-col items-center text-center px-6 w-full max-w-sm"
      >
        {/* Power indicator dot */}
        <motion.div variants={landingMotion.powerDot} className="mb-12">
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
        <motion.div variants={landingMotion.item} className="mt-6">
          <SyntMonoText className="text-sm text-fg-dim tracking-[0.3em]">
            IDENTIFY
          </SyntMonoText>
        </motion.div>

        {/* Divider */}
        <motion.div variants={landingMotion.item} className="mt-8">
          <div className="w-48 h-px bg-border-strong" />
        </motion.div>

        {/* Email+Password form */}
        <motion.form
          variants={landingMotion.item}
          className="mt-8 w-full space-y-4"
          onSubmit={handleEmailLogin}
        >
          <div className="text-left">
            <label className="block mb-1">
              <SyntMonoText className="text-[10px] text-fg-dim tracking-widest">
                EMAIL
              </SyntMonoText>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={inputClass}
              autoComplete="email"
            />
          </div>

          <div className="text-left">
            <label className="block mb-1">
              <SyntMonoText className="text-[10px] text-fg-dim tracking-widest">
                PASSWORD
              </SyntMonoText>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={inputClass}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <SyntMonoText className="text-xs text-red block text-left">
              {error}
            </SyntMonoText>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={submitting}
            className="tracking-[0.25em] text-sm w-full mt-2"
          >
            {submitting ? "LOGGING IN..." : "LOGIN"}
          </Button>
        </motion.form>

        {/* Divider with OR */}
        <motion.div
          variants={landingMotion.item}
          className="mt-6 flex items-center gap-4 w-full"
        >
          <div className="flex-1 h-px bg-border-subtle" />
          <SyntMonoText className="text-[10px] text-fg-muted tracking-widest">
            OR
          </SyntMonoText>
          <div className="flex-1 h-px bg-border-subtle" />
        </motion.div>

        {/* OAuth button */}
        <motion.div variants={landingMotion.item} className="mt-6 w-full">
          <Button
            variant="secondary"
            size="lg"
            onClick={login}
            className="tracking-[0.25em] text-sm w-full"
          >
            {isDev ? "DEV LOGIN" : "LOGIN WITH RAILWAY"}
          </Button>
        </motion.div>

        {/* Link to register */}
        <motion.div variants={landingMotion.item} className="mt-8">
          <Link to="/register">
            <SyntMonoText className="text-xs text-fg-muted hover:text-fg-bright transition-colors tracking-widest">
              NO ACCOUNT? REGISTER
            </SyntMonoText>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
