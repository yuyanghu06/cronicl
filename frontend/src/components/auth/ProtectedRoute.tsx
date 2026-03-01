import { Navigate } from "react-router";
import { useAuth } from "@/contexts/AuthContext";
import { SyntMonoText } from "@/components/ui/SyntMonoText";
import type { ReactNode } from "react";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-void flex items-center justify-center">
        <SyntMonoText className="text-xs text-fg-muted tracking-[0.3em] animate-pulse">
          AUTHENTICATING...
        </SyntMonoText>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return children;
}
