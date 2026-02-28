import { useEffect, useRef } from "react";

export function BackgroundTexture() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 8;
      const y = (e.clientY / window.innerHeight - 0.5) * 8;
      el.style.transform = `translate(${x}px, ${y}px)`;
    };

    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  return (
    <div
      ref={ref}
      className="fixed inset-[-20px] z-0 transition-transform duration-700 ease-out"
      style={{
        backgroundImage: `radial-gradient(circle, rgba(255, 255, 255, 0.035) 1px, transparent 1px)`,
        backgroundSize: "24px 24px",
      }}
    />
  );
}
