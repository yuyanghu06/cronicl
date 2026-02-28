const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

// --- Core fetch wrapper ---

async function apiFetch(
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
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
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
