import { useEffect } from "react";
import { useNavigate } from "react-router";
import { ScanlineOverlay } from "@/components/ui/ScanlineOverlay";
import { BackgroundTexture } from "@/components/landing/BackgroundTexture";
import { PowerOnSequence } from "@/components/landing/PowerOnSequence";

export function LandingPage() {
  const navigate = useNavigate();

  const handleAction = () => navigate("/home");

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
        buttonLabel="ENTER"
        onButtonClick={handleAction}
        hint="PRESS ENTER TO CONTINUE"
      />
    </div>
  );
}
