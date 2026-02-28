import { useEffect } from "react";
import { useNavigate } from "react-router";
import { setToken } from "@/lib/api.ts";

export function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("access_token");

    if (token) {
      setToken(token);
      navigate("/home", { replace: true });
    } else {
      navigate("/landing", { replace: true });
    }
  }, [navigate]);

  return null;
}
