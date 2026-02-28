const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

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

export async function apiFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (res.status === 401) {
    window.location.href = "/landing";
    throw new ApiError(401, { error: "Session expired" });
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
