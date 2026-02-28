import { useEffect } from "react";
import { useNavigate } from "react-router";
import { setToken } from "@/lib/api.ts";
import { useAuth } from "@/lib/auth.tsx";

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("access_token");

    if (token) {
      setToken(token);
      refreshUser().then(() => {
        navigate("/home", { replace: true });
      });
    } else {
      navigate("/landing", { replace: true });
    }
  }, [navigate, refreshUser]);

  return null;
}
