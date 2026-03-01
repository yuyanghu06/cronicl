import { useState, type FormEvent } from "react";
import { useNavigate, Navigate, Link } from "react-router";
import { useAuth } from "@/contexts/AuthContext";
import { DotMatrixText } from "@/components/ui/DotMatrixText";
import { SyntMonoText } from "@/components/ui/SyntMonoText";
import { Button } from "@/components/ui/Button";
import { ScanlineOverlay } from "@/components/ui/ScanlineOverlay";
import { BackgroundTexture } from "@/components/landing/BackgroundTexture";

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/home" replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/home");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg-void flex items-center justify-center overflow-hidden relative">
      <ScanlineOverlay />
      <BackgroundTexture />

      <form
        onSubmit={handleSubmit}
        className="relative z-10 flex flex-col items-center w-full max-w-sm px-6"
      >
        <DotMatrixText
          as="h1"
          className="text-3xl tracking-[0.2em] text-fg-max mb-12"
        >
          cronicl
        </DotMatrixText>

        <div className="w-full space-y-4">
          <div className="flex items-center gap-3 border-b border-border-subtle pb-2">
            <span className="font-system text-red text-sm shrink-0 select-none">
              {">"}
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="EMAIL"
              required
              className="flex-1 bg-transparent border-none outline-none font-system text-sm text-fg-bright placeholder:text-fg-muted"
              autoFocus
            />
          </div>

          <div className="flex items-center gap-3 border-b border-border-subtle pb-2">
            <span className="font-system text-red text-sm shrink-0 select-none">
              {">"}
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="PASSWORD"
              required
              className="flex-1 bg-transparent border-none outline-none font-system text-sm text-fg-bright placeholder:text-fg-muted"
            />
          </div>
        </div>

        {error && (
          <SyntMonoText className="text-xs text-red mt-4">{error}</SyntMonoText>
        )}

        <Button
          type="submit"
          variant="primary"
          size="md"
          disabled={submitting}
          className="mt-8 w-full tracking-[0.25em] text-sm"
        >
          {submitting ? "LOGGING IN..." : "LOG IN"}
        </Button>

        <div className="mt-8 flex items-center gap-2">
          <SyntMonoText className="text-xs text-fg-muted">
            No account?
          </SyntMonoText>
          <Link
            to="/register"
            className="font-system text-xs text-red hover:text-fg-bright transition-colors tracking-widest uppercase"
          >
            REGISTER
          </Link>
        </div>
      </form>
    </div>
  );
}
