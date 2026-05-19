/**
 * Frontend API client — talks to the Express backend via /api
 * All Supabase / localStorage calls should go through here.
 */

const BASE = "http://localhost:3001/api";

function getToken(): string | null {
  return localStorage.getItem("larodec_token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  if (!text) throw new Error(`HTTP ${res.status}: empty response`);
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON from server: ${text.substring(0, 100)}`);
  }
  if (!res.ok) throw new Error(data.error || data.detail || `HTTP ${res.status}`);
  return data as T;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  login: (email: string, password: string) =>
    request<{ token: string; user: any }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: (data: Record<string, string>) =>
    request<{ token: string; user: any }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  me: () => request<any>("/auth/me"),

  updateMe: (data: Record<string, string>) =>
    request<any>("/auth/me", { method: "PUT", body: JSON.stringify(data) }),
};

// ─── Users ────────────────────────────────────────────────────────────────────

export const usersApi = {
  getAll: () => request<any[]>("/users"),
  create: (data: any) => request<any>("/users", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: any) => request<any>(`/users/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: number) => request<any>(`/users/${id}`, { method: "DELETE" }),
};

// ─── Publications ─────────────────────────────────────────────────────────────

export const publicationsApi = {
  getAll: (params?: { statut?: string; chercheur_id?: number }) => {
    const qs = params ? "?" + new URLSearchParams(params as any).toString() : "";
    return request<any[]>(`/publications${qs}`);
  },
  create: (data: any) => request<any>("/publications", { method: "POST", body: JSON.stringify(data) }),
  updateStatut: (id: number, statut: string) =>
    request<any>(`/publications/${id}/statut`, { method: "PUT", body: JSON.stringify({ statut }) }),
  update: (id: number, data: any) =>
    request<any>(`/publications/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: number) => request<any>(`/publications/${id}`, { method: "DELETE" }),
};

// ─── Scraper ──────────────────────────────────────────────────────────────────

export const scraperApi = {
  search: (authorName: string) =>
    request<{ results: any[]; total: number }>("/scraper/search", {
      method: "POST",
      body: JSON.stringify({ authorName }),
    }),
  import: (papers: any[], chercheurId?: number) =>
    request<{ imported: number; message: string }>("/scraper/import", {
      method: "POST",
      body: JSON.stringify({ papers, chercheurId }),
    }),
  autoAll: () => request<{ summary: any[] }>("/scraper/auto", { method: "POST" }),
};

// ─── Événements ───────────────────────────────────────────────────────────────

export const evenementsApi = {
  getAll: () => request<any[]>("/evenements"),
  create: (data: any) => request<any>("/evenements", { method: "POST", body: JSON.stringify(data) }),
  updateStatut: (id: number, statut: string) =>
    request<any>(`/evenements/${id}/statut`, { method: "PUT", body: JSON.stringify({ statut }) }),
  delete: (id: number) => request<any>(`/evenements/${id}`, { method: "DELETE" }),
};

// ─── Misc ─────────────────────────────────────────────────────────────────────

export const ouvragesApi = {
  getAll: () => request<any[]>("/ouvrages"),
  getFromArticles: (params?: { type_filter?: string; search?: string; limit?: number; offset?: number }) => {
    const qs = params ? "?" + new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)]))).toString() : "";
    return request<{ items: any[]; total: number }>(`/ouvrages${qs}`);
  },
  create: (data: any) => request<any>("/ouvrages", { method: "POST", body: JSON.stringify(data) }),
  delete: (id: number) => request<any>(`/ouvrages/${id}`, { method: "DELETE" }),
};

export const thesesApi = {
  getAll: () => request<any[]>("/chercheur/theses"),
  create: (data: any) => request<any>("/chercheur/theses", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: any) => request<any>(`/chercheur/theses/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: number) => request<any>(`/chercheur/theses/${id}`, { method: "DELETE" }),
};

export const conventionsApi = {
  getAll: () => request<any[]>("/conventions"),
  create: (data: any) => request<any>("/conventions", { method: "POST", body: JSON.stringify(data) }),
  delete: (id: number) => request<any>(`/conventions/${id}`, { method: "DELETE" }),
};

export const statsApi = {
  get: () => request<any>("/stats"),
};

export const publicApi = {
  getEvents: () =>
    fetch("http://localhost:3001/api/public/events")
      .then(r => r.ok ? r.json() : [])
      .catch(() => []) as Promise<any[]>,
  getStats: () =>
    fetch("http://localhost:3001/api/public/stats")
      .then(r => r.ok ? r.json() : {})
      .catch(() => ({})) as Promise<any>,
  getConventions: () =>
    fetch("http://localhost:3001/api/public/conventions")
      .then(r => r.ok ? r.json() : [])
      .catch(() => []) as Promise<any[]>,
};

export const rapportApi = {
  get: (annee: number) => request<any>(`/rapport/${annee}`),
};

// ─── Real articles (scraped DB) ───────────────────────────────────────────────

export const articlesApi = {
  getAll: (params?: { chercheur?: string; annee?: number; search?: string; source?: string; limit?: number; offset?: number }) => {
    const qs = params ? "?" + new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)]))).toString() : "";
    return request<{ items: any[]; total: number; limit: number; offset: number }>(`/articles${qs}`);
  },
  getStats: () => request<any>("/articles/stats"),
  getChercheurs: () => request<any[]>("/articles/chercheurs"),
};

// ─── Real researchers (registry tables) ──────────────────────────────────────

export const researchersApi = {
  getAll: (params?: { categorie?: string; search?: string }) => {
    const qs = params
      ? "?" + Object.entries(params)
          .filter(([, v]) => v !== undefined && v !== "")
          .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v as string)}`)
          .join("&")
      : "";
    return request<any[]>(`/researchers${qs}`);
  },
  getStats: () => request<any>("/researchers/stats"),
  getProfile: (nomPrenom: string) =>
    request<{ profile: any; publications: any[]; nb_publications: number }>(
      `/researchers/profile/${encodeURIComponent(nomPrenom)}`
    ),
};
