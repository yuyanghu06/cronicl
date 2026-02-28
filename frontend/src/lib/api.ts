const BASE_URL = import.meta.env.VITE_API_URL ?? "";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

// ---------- Timeline types (backend shapes) ----------

export interface ApiTimeline {
  id: string;
  userId?: string;
  title: string;
  summary: string | null;
  systemPrompt: string | null;
  tags: string[] | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  nodeCount?: number;
  branchCount?: number;
  nodes?: ApiNode[];
  branches?: unknown[];
}

export interface ApiNode {
  id: string;
  timelineId: string;
  parentId: string | null;
  label: string | null;
  title: string;
  content: string;
  status: string;
  positionX: number;
  positionY: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface GhostNode {
  title: string;
  summary: string;
  tone: string;
  direction_type: "aligned" | "exploratory";
}

// ---------- Timeline CRUD ----------

export function listTimelines() {
  return request<ApiTimeline[]>("/api/timelines");
}

export function getTimeline(id: string) {
  return request<ApiTimeline>(`/api/timelines/${id}`);
}

export function createTimeline(data: {
  title: string;
  summary?: string;
  system_prompt?: string;
  tags?: string[];
  status?: string;
}) {
  return request<ApiTimeline>("/api/timelines", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateTimeline(
  id: string,
  data: {
    title?: string;
    summary?: string;
    system_prompt?: string;
    tags?: string[];
    status?: string;
  }
) {
  return request<ApiTimeline>(`/api/timelines/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteTimeline(id: string) {
  return request<{ deleted: boolean }>(`/api/timelines/${id}`, {
    method: "DELETE",
  });
}

// ---------- Node CRUD ----------

export function createNode(
  timelineId: string,
  data: {
    title: string;
    content?: string;
    label?: string;
    parent_id?: string | null;
    status?: string;
    position_x?: number;
    position_y?: number;
    sort_order?: number;
  }
) {
  return request<ApiNode>(`/api/timelines/${timelineId}/nodes`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateNode(
  timelineId: string,
  nodeId: string,
  data: {
    title?: string;
    content?: string;
    label?: string;
    status?: string;
    parent_id?: string | null;
    position_x?: number;
    position_y?: number;
    sort_order?: number;
  }
) {
  return request<ApiNode>(`/api/timelines/${timelineId}/nodes/${nodeId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteNode(timelineId: string, nodeId: string) {
  return request<{ deleted: boolean }>(
    `/api/timelines/${timelineId}/nodes/${nodeId}`,
    { method: "DELETE" }
  );
}

// ---------- AI endpoints ----------

export function suggestFromTimeline(data: {
  timelineId: string;
  nodeId: string;
  branchId?: string;
  numSuggestions?: number;
}) {
  return request<{
    ghost_nodes: GhostNode[];
    inline_suggestions: unknown[];
    model: string;
  }>("/ai/suggest-from-timeline", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function expandFromTimeline(data: {
  timelineId: string;
  nodeId: string;
  expansionType: "expand" | "rewrite" | "alternatives";
  numVariants?: number;
  branchId?: string;
}) {
  return request<{
    expansions: { content: string; approach: string; tone: string }[];
    model: string;
  }>("/ai/expand-from-timeline", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
