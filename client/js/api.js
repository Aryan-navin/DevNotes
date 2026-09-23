const API_BASE = String(window.DEVNOTES_API_BASE || "/api").replace(/\/$/, "");

async function apiFetch(path, options = {}) {
  const config = { credentials: "include", ...options };
  config.headers = { ...(options.headers || {}) };
  if (config.body && typeof config.body !== "string") { config.headers["Content-Type"] = "application/json"; config.body = JSON.stringify(config.body); }
  const response = await fetch(`${API_BASE}${path}`, config);
  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await response.json() : await response.text();
  if (!response.ok) { const message = typeof data === "object" && data?.message ? data.message : `Request failed (${response.status})`; const error = new Error(message); error.status = response.status; error.data = data; throw error; }
  return data;
}
window.DevNotesAPI = { request: apiFetch, health: () => apiFetch("/health"), auth: { register: p => apiFetch("/auth/register", { method: "POST", body: p }), login: p => apiFetch("/auth/login", { method: "POST", body: p }), forgotPassword: p => apiFetch("/auth/forgot-password", { method: "POST", body: p }), resetPassword: p => apiFetch("/auth/reset-password", { method: "POST", body: p }), changePassword: p => apiFetch("/auth/change-password", { method: "POST", body: p }), logout: () => apiFetch("/auth/logout", { method: "POST" }), me: () => apiFetch("/auth/me") }, notes: { list: p => { const q = new URLSearchParams(); Object.entries(p || {}).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== "") q.set(k, v) }); return apiFetch(`/notes${q.toString() ? `?${q}` : ""}`) }, get: id => apiFetch(`/notes/${encodeURIComponent(id)}`), create: p => apiFetch("/notes", { method: "POST", body: p }), update: (id, p) => apiFetch(`/notes/${encodeURIComponent(id)}`, { method: "PATCH", body: p }), remove: (id, permanent = false) => apiFetch(`/notes/${encodeURIComponent(id)}${permanent ? "?permanent=true" : ""}`, { method: "DELETE" }), versions: id => apiFetch(`/notes/${encodeURIComponent(id)}/versions`), restoreVersion: (id, versionId) => apiFetch(`/notes/${encodeURIComponent(id)}/versions/${encodeURIComponent(versionId)}/restore`, { method: "POST" }), categories: () => apiFetch("/notes/categories"), tags: () => apiFetch("/notes/tags"), exportAll: () => apiFetch("/notes/export"), importAll: p => apiFetch("/notes/import", { method: "POST", body: p }) }, users: { profile: () => apiFetch("/users/profile"), preferences: p => apiFetch("/users/preferences", { method: "PATCH", body: p }) } };
