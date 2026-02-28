import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/lib/auth.tsx";
import { ScanlineOverlay } from "@/components/ui/ScanlineOverlay";
import { BackgroundTexture } from "@/components/landing/BackgroundTexture";
import { PowerOnSequence } from "@/components/landing/PowerOnSequence";

export function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  // If already authenticated, go straight to home
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate("/home", { replace: true });
    }
  }, [isLoading, isAuthenticated, navigate]);

  const handleAction = isAuthenticated
    ? () => navigate("/home")
    : () => navigate("/login");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") handleAction();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleAction]);

  return (
    <div className="min-h-screen bg-bg-void flex items-center justify-center overflow-hidden relative">
      <ScanlineOverlay />
      <BackgroundTexture />
      <PowerOnSequence
        buttonLabel={isAuthenticated ? "ENTER" : "LOGIN"}
        onButtonClick={handleAction}
        hint={isAuthenticated ? "PRESS ENTER TO CONTINUE" : "PRESS ENTER TO LOGIN"}
      />
    </div>
  );
}
