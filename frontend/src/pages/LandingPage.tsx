import { useEffect } from "react";
import { useNavigate } from "react-router";
import { ScanlineOverlay } from "@/components/ui/ScanlineOverlay";
import { BackgroundTexture } from "@/components/landing/BackgroundTexture";
import { PowerOnSequence } from "@/components/landing/PowerOnSequence";

export function LandingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        navigate("/login");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-bg-void flex items-center justify-center overflow-hidden relative">
      <ScanlineOverlay />
      <BackgroundTexture />
      <PowerOnSequence />
    </div>
  );
}
