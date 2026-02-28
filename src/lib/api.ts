const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

// --- Token storage ---

export function getToken(): string | null {
  return localStorage.getItem("access_token");
}

export function setToken(token: string): void {
  localStorage.setItem("access_token", token);
}

export function clearToken(): void {
  localStorage.removeItem("access_token");
}

// --- Error type ---

export class ApiError extends Error {
  public status: number;
  public body: unknown;

  constructor(status: number, body: unknown) {
    super(`API error ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

// --- Core fetch wrapper ---

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (isRefreshing && refreshPromise) return refreshPromise;
  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) return false;
      const data = await res.json();
      if (data.accessToken) {
        setToken(data.accessToken);
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

export async function apiFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const token = getToken();
  const headers = new Headers(options.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  // On 401, try refresh once
  if (res.status === 401 && token) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      const retryHeaders = new Headers(options.headers);
      retryHeaders.set("Authorization", `Bearer ${getToken()!}`);
      if (options.body && !retryHeaders.has("Content-Type")) {
        retryHeaders.set("Content-Type", "application/json");
      }
      res = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: retryHeaders,
        credentials: "include",
      });
    } else {
      clearToken();
      window.location.href = "/landing";
      throw new ApiError(401, { error: "Session expired" });
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new ApiError(res.status, body);
  }

  return res;
}

// --- Convenience methods ---

export const api = {
  async get<T = unknown>(path: string): Promise<T> {
    const res = await apiFetch(path);
    return res.json() as Promise<T>;
  },

  async post<T = unknown>(path: string, body?: unknown): Promise<T> {
    const res = await apiFetch(path, {
      method: "POST",
      body: body != null ? JSON.stringify(body) : undefined,
    });
    return res.json() as Promise<T>;
  },

  async patch<T = unknown>(path: string, body?: unknown): Promise<T> {
    const res = await apiFetch(path, {
      method: "PATCH",
      body: body != null ? JSON.stringify(body) : undefined,
    });
    return res.json() as Promise<T>;
  },

  async put<T = unknown>(path: string, body?: unknown): Promise<T> {
    const res = await apiFetch(path, {
      method: "PUT",
      body: body != null ? JSON.stringify(body) : undefined,
    });
    return res.json() as Promise<T>;
  },

  async delete<T = unknown>(path: string): Promise<T> {
    const res = await apiFetch(path, { method: "DELETE" });
    return res.json() as Promise<T>;
  },
};
