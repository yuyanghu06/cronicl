import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/lib/auth.tsx";

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  useEffect(() => {
    refreshUser().then(() => navigate("/home", { replace: true }));
  }, [navigate, refreshUser]);

  return null;
}
