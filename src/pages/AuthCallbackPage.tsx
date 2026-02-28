import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { setToken } from "@/lib/api.ts";
import { useAuth } from "@/lib/auth.tsx";

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshUser } = useAuth();

  useEffect(() => {
    const token = searchParams.get("access_token");
    if (token) {
      setToken(token);
      refreshUser().then(() => navigate("/home", { replace: true }));
    } else {
      navigate("/landing", { replace: true });
    }
  }, [searchParams, navigate, refreshUser]);

  return null;
}
