(() => {
  "use strict";

  const API_BASE = window.DEVNOTES_API_BASE || (/^(localhost|127\.0\.0\.1)$/.test(window.location.hostname) ? "http://127.0.0.1:5000/api" : `${window.location.origin}/api`);
  const THEME_KEY = "devnotes-theme";
  const ICONS = {
    "arrow-left": '<path d="M19 12H5M12 19l-7-7 7-7"/>',
    "pen-line": '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z"/>',
    "sun": '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42"/>',
    "moon": '<path d="M21 12.8A8.5 8.5 0 1 1 11.2 3 6.5 6.5 0 0 0 21 12.8Z"/>',
    "save": '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11Z"/><path d="M17 21v-8H7v8M7 3v5h8"/>',
    "file-text": '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v6h6M8 13h8M8 17h6"/>',
    "code": '<path d="m8 9-4 3 4 3M16 9l4 3-4 3M14 5l-4 14"/>',
    "bug": '<path d="M8 2v3M16 2v3M9 5h6M7 9H3M21 9h-4M7 15H3M21 15h-4M12 5v14"/><rect x="7" y="5" width="10" height="14" rx="5"/>',
    "terminal": '<path d="m4 17 6-5-6-5M12 19h8"/>',
    "book": '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/>',
    "bulb": '<path d="M9 18h6M10 22h4M8 14a6 6 0 1 1 8 0c-1.2 1-2 2.2-2 4h-4c0-1.8-.8-3-2-4Z"/>',
    "folder": '<path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/>',
    "tags": '<path d="M20.59 13.41 13 21l-9-9V4h8l8.59 8.59a2 2 0 0 1 0 2.82Z"/><circle cx="8" cy="8" r="1"/>',
    "file-code": '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M10 13l-2 2 2 2M14 17l2-2-2-2"/>',
    "columns": '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 3v18"/>',
    "pencil": '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z"/>',
    "eye": '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/>',
    "code-square": '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="m9 9-3 3 3 3M15 9l3 3-3 3M14 7l-4 10"/>',
    "list": '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    "quote": '<path d="M3 21c3.5-1 5.5-3.3 5.5-7H4V8h6v6c0 3.7-2.1 6.2-7 7ZM13 21c3.5-1 5.5-3.3 5.5-7H14V8h6v6c0 3.7-2.1 6.2-7 7Z"/>',
    "link": '<path d="M10 13a5 5 0 0 0 7.54.54l2-2a5 5 0 0 0-7.07-7.07l-1.14 1.14M14 11a5 5 0 0 0-7.54-.54l-2 2a5 5 0 0 0 7.07 7.07l1.14-1.14"/>',
    "minus": '<path d="M5 12h14"/>',
    "undo": '<path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 6 6v1"/>',
    "redo": '<path d="m15 14 5-5-5-5"/><path d="M20 9H10a6 6 0 0 0-6 6v1"/>',
    "sparkles": '<path d="m12 3-1.2 3.8L7 8l3.8 1.2L12 13l1.2-3.8L17 8l-3.8-1.2Z"/><path d="m19 13-.7 2.3L16 16l2.3.7L19 19l.7-2.3L22 16l-2.3-.7ZM5 15l-.7 2.3L2 18l2.3.7L5 21l.7-2.3L8 18l-2.3-.7Z"/>',
    "info": '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    "alert": '<path d="m10.3 3.7-8 14A2 2 0 0 0 4 20.7h16a2 2 0 0 0 1.7-3l-8-14a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/>',
    "copy": '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    "check": '<path d="m5 12 4 4L19 6"/>',
    "keyboard": '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 9h.01M11 9h.01M15 9h.01M19 9h.01M7 13h10M8 16h8"/>',
    "save-draft": '<path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><path d="M7 3v6h10V3M7 21v-6h10v6"/>',
    "history": '<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/><path d="M12 7v5l3 2"/>',
    "download": '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"'
  };

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const els = {
    loading: $("#loading"), form: $("#editorForm"), title: $("#noteTitle"), content: $("#noteContent"), category: $("#noteCategory"), tags: $("#noteTags"), type: $("#noteType"), typeGrid: $("#typeGrid"), selectedType: $("#selectedType"), titleCount: $("#titleCount"), preview: $("#previewContent"), layout: $("#editorLayout"), description: $("#description"), headerState: $("#headerState"), headerStateText: $("#headerStateText"), statusMain: $("#statusMain"), statusText: $("#statusText"), wordCount: $("#wordCount"), charCount: $("#charCount"), updatedLabel: $("#updatedLabel"), modeLabel: $("#modeLabel"), saveBtn: $("#saveBtn"), themeToggle: $("#themeToggle"), sunIcon: $("#sunIcon"), moonIcon: $("#moonIcon"), backBtn: $("#backBtn"), toastWrap: $("#toastWrap"), leaveModal: $("#leaveModal"), stayBtn: $("#stayBtn"), leaveBtn: $("#leaveBtn"), categoryList: $("#categoryList"), codeLanguage: $("#codeLanguage"), shortcutsBtn: $("#shortcutsBtn"), shortcutModal: $("#shortcutModal"), shortcutClose: $("#shortcutClose"), draftStatus: $("#draftStatus"), draftModal: $("#draftModal"), restoreDraftBtn: $("#restoreDraftBtn"), discardDraftBtn: $("#discardDraftBtn"), draftMeta: $("#draftMeta"), historyBtn: $("#historyBtn"), exportMarkdownBtn: $("#exportMarkdownBtn"), exportPdfBtn: $("#exportPdfBtn"), historyModal: $("#historyModal"), historyClose: $("#historyClose"), historyList: $("#historyList")
  };

  let noteId = new URLSearchParams(location.search).get("id");
  let currentNote = null;
  let dirty = false;
  let saving = false;
  let leaving = false;
  let history = [];
  let historyIndex = -1;
  let historyTimer = null;
  let draftTimer = null;
  let draftKey = "";
  let selectedCodeLanguage = "js";

  function iconSvg(name) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24"); svg.setAttribute("fill", "none"); svg.setAttribute("stroke", "currentColor"); svg.setAttribute("stroke-width", "2"); svg.setAttribute("stroke-linecap", "round"); svg.setAttribute("stroke-linejoin", "round"); svg.setAttribute("aria-hidden", "true");
    svg.innerHTML = ICONS[name] || '<circle cx="12" cy="12" r="8"/>';
    return svg;
  }

  function renderIcons(root = document) {
    root.querySelectorAll("[data-icon]").forEach((node) => {
      const name = node.getAttribute("data-icon");
      if (node.dataset.iconReady === "true") return;
      node.replaceChildren(iconSvg(name));
      node.dataset.iconReady = "true";
    });
  }

  function escapeHtml(value = "") {
    return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
  }

  function safeUrl(url) {
    try { const parsed = new URL(url); return ["http:", "https:"].includes(parsed.protocol) ? parsed.href : ""; } catch { return ""; }
  }

  function renderMarkdown(markdown = "") {
    if (!markdown.trim()) return '<div class="preview-empty"><div class="empty-icon"><span class="icon" data-icon="file-text"></span></div><strong>Your preview will appear here</strong><span>Start writing on the left.</span></div>';

    let source = escapeHtml(markdown).replace(/\r\n?/g, "\n");
    const blocks = [];
    source = source.replace(/```([\w+-]*)\n?([\s\S]*?)```/g, (_, language, body) => {
      const index = blocks.length;
      blocks.push(`<div class="code-block-wrap"><pre>${language ? `<span class="code-language">${escapeHtml(language)}</span>` : ""}<code>${body.replace(/^\n|\n$/g, "")}</code></pre><button class="code-copy" type="button" data-copy-code="${index}"><span class="icon" data-icon="copy"></span><span>Copy</span></button></div>`);
      return `\n@@CODE_${index}@@\n`;
    });

    const lines = source.split("\n");
    let html = "";
    let paragraph = [];
    let listType = null;

    const closeList = () => { if (listType) { html += `</${listType}>`; listType = null; } };
    const flushParagraph = () => { if (paragraph.length) { html += `<p>${paragraph.join("<br>")}</p>`; paragraph = []; } };

    for (const rawLine of lines) {
      const line = rawLine.trimEnd();
      if (/^@@CODE_\d+@@$/.test(line.trim())) { flushParagraph(); closeList(); html += line.trim(); continue; }
      if (/^#{1,3}\s+/.test(line)) { flushParagraph(); closeList(); const match = line.match(/^(#{1,3})\s+(.*)$/); const level = match[1].length; html += `<h${level}>${match[2]}</h${level}>`; continue; }
      if (/^>\s?/.test(line)) { flushParagraph(); closeList(); html += `<blockquote>${line.replace(/^>\s?/, "")}</blockquote>`; continue; }
      if (/^[-*]\s+/.test(line)) { flushParagraph(); if (listType !== "ul") { closeList(); html += "<ul>"; listType = "ul"; } html += `<li>${line.replace(/^[-*]\s+/, "")}</li>`; continue; }
      if (/^\d+\.\s+/.test(line)) { flushParagraph(); if (listType !== "ol") { closeList(); html += "<ol>"; listType = "ol"; } html += `<li>${line.replace(/^\d+\.\s+/, "")}</li>`; continue; }
      if (/^---+$/.test(line.trim())) { flushParagraph(); closeList(); html += "<hr>"; continue; }
      if (!line.trim()) { flushParagraph(); closeList(); continue; }
      paragraph.push(line);
    }
    flushParagraph(); closeList();

    html = html.replace(/@@CODE_(\d+)@@/g, (_, index) => blocks[Number(index)] || "");
    html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_, label, url) => { const safe = safeUrl(url); return safe ? `<a href="${escapeHtml(safe)}" target="_blank" rel="noopener noreferrer">${label}</a>` : label; });
    html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
    html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, "<em>$1</em>");

    return `<div class="preview-content">${html}</div>`;
  }

  function setTheme(theme, persist = true) {
    const next = theme === "dark" ? "dark" : "light";
    const root = document.documentElement;
    root.dataset.theme = next;
    els.sunIcon.classList.toggle("active", next === "light");
    els.moonIcon.classList.toggle("active", next === "dark");
    els.themeToggle.setAttribute("aria-pressed", String(next === "dark"));
    els.themeToggle.setAttribute("aria-label", next === "dark" ? "Switch to light mode" : "Switch to dark mode");
    els.themeToggle.title = next === "dark" ? "Switch to light mode" : "Switch to dark mode";
    if (persist) { try { localStorage.setItem(THEME_KEY, next); } catch { } }
  }

  function loadTheme() {
    let saved = document.documentElement.dataset.theme || "";
    try { saved = localStorage.getItem(THEME_KEY) || saved; } catch { }
    if (saved !== "dark" && saved !== "light") saved = window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    setTheme(saved, false);
  }

  async function api(path, options = {}) {
    const config = { credentials: "include", ...options, headers: { ...(options.headers || {}) } };
    if (config.body && typeof config.body !== "string") { config.headers["Content-Type"] = "application/json"; config.body = JSON.stringify(config.body); }
    let response;
    try { response = await fetch(`${API_BASE}${path}`, config); } catch { throw new Error("Cannot connect to DevNotes API. Make sure the server is running on port 5000."); }
    const type = response.headers.get("content-type") || "";
    const data = type.includes("application/json") ? await response.json() : await response.text();
    if (!response.ok) { const error = new Error(data?.message || `Request failed (${response.status})`); error.status = response.status; throw error; }
    return data;
  }

  function toast(message, error = false) {
    const node = document.createElement("div"); node.className = `toast${error ? " error" : ""}`; node.innerHTML = `<span class="icon" data-icon="${error ? "alert" : "save"}"></span><span>${escapeHtml(message)}</span>`; els.toastWrap.appendChild(node); renderIcons(node); setTimeout(() => node.remove(), 2800);
  }

  function setSaveState(state) {
    const labels = { ready: "Ready to write", dirty: "Unsaved changes", saving: "Saving…", saved: "Saved just now" };
    els.headerState.dataset.state = state; els.headerStateText.textContent = labels[state] || labels.ready;
    els.statusMain.dataset.state = state; els.statusText.textContent = labels[state] || labels.ready;
  }

  function markDirty(value = true) { dirty = value; setSaveState(value ? "dirty" : (currentNote ? "saved" : "ready")); }

  function updateStats() {
    const text = els.content.value.trim(); const words = text ? text.split(/\s+/).length : 0;
    els.wordCount.textContent = `${words} ${words === 1 ? "word" : "words"}`; els.charCount.textContent = `${els.content.value.length} characters`;
  }

  function updateTitleCount() { els.titleCount.textContent = `${els.title.value.length} / 120`; }

  function refreshPreview() { els.preview.innerHTML = renderMarkdown(els.content.value); renderIcons(els.preview); updateStats(); }

  function pushHistory(force = false) {
    const value = els.content.value; if (!force && history[historyIndex] === value) return;
    history = history.slice(0, historyIndex + 1); history.push(value); if (history.length > 80) history.shift(); historyIndex = history.length - 1;
  }

  function restoreHistory(index) { if (index < 0 || index >= history.length) return; historyIndex = index; els.content.value = history[index]; markDirty(true); scheduleDraftSave(); refreshPreview(); els.content.focus(); }

  function insertText(before, after = "", placeholder = "text") {
    const start = els.content.selectionStart, end = els.content.selectionEnd; const selected = els.content.value.slice(start, end) || placeholder;
    els.content.setRangeText(`${before}${selected}${after}`, start, end, "select"); pushHistory(true); markDirty(true); scheduleDraftSave(); refreshPreview(); els.content.focus();
  }

  function transformLines(prefix) {
    const start = els.content.selectionStart, end = els.content.selectionEnd, value = els.content.value;
    const lineStart = value.lastIndexOf("\n", start - 1) + 1; const selected = value.slice(lineStart, end);
    const lines = selected.split("\n").map(line => line.startsWith(prefix) ? line.slice(prefix.length) : prefix + line);
    els.content.setRangeText(lines.join("\n"), lineStart, end, "select"); pushHistory(true); markDirty(true); scheduleDraftSave(); refreshPreview(); els.content.focus();
  }

  const commands = {
    heading: () => transformLines("# "),
    bold: () => insertText("**", "**", "bold text"),
    italic: () => insertText("*", "*", "italic text"),
    inline: () => insertText("`", "`", "code"),
    code: () => insertText("```" + "\n", "\n```", "// " + selectedCodeLanguage + " code"),
    bullet: () => transformLines("- "),
    quote: () => transformLines("> "),
    link: () => insertText("[", "](https://example.com)", "link text"),
    hr: () => insertText("\n---\n", "", ""),
    undo: () => restoreHistory(historyIndex - 1),
    redo: () => restoreHistory(historyIndex + 1)
  };

  function setDraftStatus(state, text) { els.draftStatus.dataset.state = state; els.draftStatus.querySelector("span:last-child").textContent = text; }
  function saveDraftLocal() {
    if (!draftKey || !dirty) return;
    try { localStorage.setItem(draftKey, JSON.stringify({ title: els.title.value, content: els.content.value, category: els.category.value, tags: els.tags.value, type: els.type.value, savedAt: Date.now() })); setDraftStatus("saved", "Local draft saved"); } catch { setDraftStatus("error", "Draft unavailable"); }
  }
  function scheduleDraftSave() { clearTimeout(draftTimer); setDraftStatus("saving", "Saving local draft…"); draftTimer = setTimeout(saveDraftLocal, 700); }
  function clearDraftLocal() { if (!draftKey) return; try { localStorage.removeItem(draftKey); } catch { } setDraftStatus("", "Draft cleared"); }
  let pendingDraft = null;

  function readLocalDraft() {
    if (!draftKey || noteId) return null;
    try {
      const raw = localStorage.getItem(draftKey);
      if (!raw) return null;
      const draft = JSON.parse(raw);
      if (!draft || !draft.savedAt || Date.now() - draft.savedAt > 1000 * 60 * 60 * 24 * 7) {
        localStorage.removeItem(draftKey);
        return null;
      }
      if (!draft.content && !draft.title) return null;
      return draft;
    } catch {
      return null;
    }
  }

  function formatDraftAge(timestamp) {
    const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000));
    if (minutes < 1) return "Saved just now";
    if (minutes < 60) return `Saved ${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Saved ${hours} hr${hours === 1 ? "" : "s"} ago`;
    const days = Math.floor(hours / 24);
    return `Saved ${days} day${days === 1 ? "" : "s"} ago`;
  }

  function openDraftModal(draft) {
    pendingDraft = draft;
    els.draftMeta.textContent = formatDraftAge(draft.savedAt);
    els.draftModal.classList.add("open");
    els.restoreDraftBtn.focus();
  }

  function closeDraftModal() {
    els.draftModal.classList.remove("open");
  }

  function restorePendingDraft() {
    if (!pendingDraft) return;
    const draft = pendingDraft;
    els.title.value = draft.title || "";
    els.content.value = draft.content || "";
    els.category.value = draft.category || "Programming";
    els.tags.value = draft.tags || "";
    selectType(draft.type || "Concept");
    pendingDraft = null;
    closeDraftModal();
    markDirty(true);
    setDraftStatus("saved", "Local draft restored");
    updateTitleCount();
    refreshPreview();
    pushHistory(true);
    els.content.focus();
    toast("Draft restored");
  }

  function discardPendingDraft() {
    pendingDraft = null;
    clearDraftLocal();
    closeDraftModal();
    setDraftStatus("", "Draft discarded");
    toast("Draft discarded");
  }

  async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(text); return; }
    const helper = document.createElement("textarea"); helper.value = text; helper.style.position = "fixed"; helper.style.opacity = "0"; document.body.appendChild(helper); helper.focus(); helper.select(); const ok = document.execCommand("copy"); helper.remove(); if (!ok) throw new Error("Copy failed");
  }
  async function handlePreviewActions(event) {
    const button = event.target.closest("[data-copy-code]");
    if (!button) return;
    const wrapper = button.closest(".code-block-wrap");
    const code = wrapper?.querySelector("code")?.textContent || "";
    try {
      await copyText(code);
      button.innerHTML = '<span class="icon" data-icon="check"></span><span>Copied</span>';
      renderIcons(button);
      setTimeout(() => { if (button.isConnected) { button.innerHTML = '<span class="icon" data-icon="copy"></span><span>Copy</span>'; renderIcons(button); } }, 1500);
    } catch { toast("Copy failed", true); }
  }

  function formatVersionDate(timestamp) {
    return new Date(timestamp).toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
  }

  function versionExcerpt(content = "") {
    const clean = String(content).replace(/```[\s\S]*?```/g, "[code block]").replace(/[#>*`]/g, "").replace(/\s+/g, " ").trim();
    return clean.length > 180 ? `${clean.slice(0, 180)}…` : clean || "No content in this version.";
  }

  function renderVersionList(versions) {
    if (!versions.length) {
      els.historyList.innerHTML = '<div class="history-empty">No saved versions yet. Save this note after making an edit and its previous state will appear here.</div>';
      return;
    }
    els.historyList.innerHTML = versions.map((version, index) => {
      const label = index === 0 ? "Latest previous version" : "Previous version";
      return `<div class="history-item"><div class="history-main"><div class="history-title">${escapeHtml(version.title || "Untitled note")}</div><div class="history-meta"><span>${escapeHtml(formatVersionDate(version.createdAt))}</span><span class="history-tag">${escapeHtml(label)}</span>${version.reason === "restore" ? '<span class="history-tag">Restore point</span>' : ""}</div><div class="history-preview">${escapeHtml(versionExcerpt(version.content))}</div></div><div class="history-actions"><button class="history-btn primary" type="button" data-restore-version="${escapeHtml(version._id)}">Restore</button></div></div>`;
    }).join("");
  }

  async function openHistoryModal() {
    if (!noteId) { toast("Save the note first to create version history", true); return; }
    els.historyModal.classList.add("open");
    els.historyList.innerHTML = '<div class="history-loading">Loading history…</div>';
    try {
      const result = await api(`/notes/${encodeURIComponent(noteId)}/versions`);
      renderVersionList(result.versions || []);
      els.historyClose.focus();
    } catch (error) {
      els.historyList.innerHTML = `<div class="history-empty">${escapeHtml(error.message || "Unable to load version history")}</div>`;
    }
  }

  function closeHistoryModal() { els.historyModal.classList.remove("open"); }
  async function exportPdf() {
    if (!noteId) { toast("Save the note before exporting", true); return; }
    const button = els.exportPdfBtn;
    if (button) { button.disabled = true; button.classList.add("loading"); }
    try {
      const response = await fetch(`${API_BASE}/notes/${encodeURIComponent(noteId)}/pdf`, { credentials: "include" });
      if (!response.ok) {
        let message = "Could not export PDF";
        try { const data = await response.json(); message = data.message || message; } catch { }
        throw new Error(message);
      }
      const blob = await response.blob();
      const title = (els.title.value || "Untitled note").trim() || "Untitled note";
      const safeTitle = title.replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, " ").trim().slice(0, 90) || "devnotes-note";
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url; link.download = `${safeTitle}.pdf`;
      document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
      toast("PDF exported");
    } catch (error) { toast(error.message || "Could not export PDF", true); }
    finally { if (button) { button.disabled = false; button.classList.remove("loading"); } }
  }

  function exportMarkdown() {
    if (!noteId) { toast("Save the note before exporting", true); return; }
    const title = (els.title.value || "Untitled note").trim() || "Untitled note";
    const safeTitle = title.replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, " ").trim().slice(0, 90) || "devnotes-note";
    const tags = (els.tags.value || "").trim();
    const category = (els.category.value || "Programming").trim();
    const type = (els.type.value || "Concept").trim();
    const metadata = `---\ncategory: ${category}\ntype: ${type}${tags ? `\ntags: ${tags}` : ""}\n---\n\n`;
    const markdown = `# ${title}\n\n${metadata}${els.content.value || ""}\n`;
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = `${safeTitle}.md`;
    document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
    toast("Markdown exported");
  }


  async function restoreVersion(versionId) {
    if (!noteId || saving) return;
    const button = els.historyList.querySelector(`[data-restore-version="${CSS.escape(versionId)}"]`);
    if (button) { button.disabled = true; button.textContent = "Restoring…"; }
    try {
      const result = await api(`/notes/${encodeURIComponent(noteId)}/versions/${encodeURIComponent(versionId)}/restore`, { method: "POST" });
      currentNote = result.note;
      els.title.value = currentNote.title || "";
      els.content.value = currentNote.content || "";
      els.category.value = currentNote.category || "Programming";
      els.tags.value = (currentNote.tags || []).join(", ");
      selectType(currentNote.type || "Concept");
      markDirty(false);
      clearDraftLocal();
      updateTitleCount();
      refreshPreview();
      pushHistory(true);
      els.updatedLabel.textContent = "Restored just now";
      document.title = `${currentNote.title || "Untitled note"} — DevNotes`;
      closeHistoryModal();
      toast("Previous version restored");
    } catch (error) {
      toast(error.message || "Unable to restore version", true);
      if (button) { button.disabled = false; button.textContent = "Restore"; }
    }
  }

  function openShortcutModal() { els.shortcutModal.classList.add("open"); els.shortcutClose.focus(); }
  function closeShortcutModal() { els.shortcutModal.classList.remove("open"); }

  function setView(view) {
    const next = ["split", "write", "preview"].includes(view) ? view : "split";
    els.layout.dataset.view = next;
    $$('[data-view]').forEach(button => {
      const active = button.dataset.view === next;
      button.classList.toggle("active", active);
      button.setAttribute("aria-selected", String(active));
    });
    els.description.textContent = next === "write" ? "Focus on writing without distractions." : next === "preview" ? "Review how your Markdown note will look." : "Write and preview your note side by side.";
    refreshPreview();
  }

  function selectType(type) {
    els.type.value = type; els.selectedType.textContent = type;
    $$('[data-type]').forEach(button => button.classList.toggle("active", button.dataset.type === type));
  }

  async function loadCategories() {
    try { const result = await api("/notes/categories"); (result.categories || []).forEach(item => { const option = document.createElement("option"); option.value = item.name; els.categoryList.appendChild(option); }); } catch { }
  }

  async function requireAuth() {
    try { const result = await api("/auth/me"); return result.user; } catch (error) { if (error.status === 401) { location.href = "login.html"; return null; } throw error; }
  }
  async function loadNote() {
    if (!noteId) return;
    const result = await api(`/notes/${encodeURIComponent(noteId)}`); currentNote = result.note;
    els.title.value = currentNote.title || ""; els.content.value = currentNote.content || ""; els.category.value = currentNote.category || "Programming"; els.tags.value = (currentNote.tags || []).join(", "); selectType(currentNote.type || "Concept");
    els.modeLabel.textContent = "Edit note"; els.updatedLabel.textContent = currentNote.updatedAt ? `Updated ${new Date(currentNote.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}` : "Existing note";
  }

  function openLeaveModal() { els.leaveModal.classList.add("open"); els.stayBtn.focus(); }
  function closeLeaveModal() { els.leaveModal.classList.remove("open"); }

  async function saveNote(event) {
    event?.preventDefault(); if (saving) return;
    const title = els.title.value.trim(); const content = els.content.value.trim();
    if (!title) { toast("Give your note a title first", true); els.title.focus(); return; }
    if (!content) { toast("Add some content before saving", true); els.content.focus(); return; }
    const payload = { title, content: els.content.value, type: els.type.value, category: els.category.value.trim() || "Programming", tags: els.tags.value.split(",").map(tag => tag.trim()).filter(Boolean) };
    saving = true; els.saveBtn.disabled = true; setSaveState("saving");
    try {
      const result = noteId ? await api(`/notes/${encodeURIComponent(noteId)}`, { method: "PATCH", body: payload }) : await api("/notes", { method: "POST", body: payload });
      if (!noteId && result.note?._id) { noteId = result.note._id; history.replaceState(null, "", `note.html?id=${encodeURIComponent(noteId)}`); }
      currentNote = result.note || currentNote; dirty = false; clearDraftLocal(); setSaveState("saved"); els.updatedLabel.textContent = "Saved just now"; els.modeLabel.textContent = "Edit note"; document.title = `${title} — DevNotes`; toast("Note saved successfully");
    } catch (error) { markDirty(true); toast(error.message || "Unable to save note", true); }
    finally { saving = false; els.saveBtn.disabled = false; }
  }

  async function saveAndClose() {
    if (saving) return;
    await saveNote();
    if (!dirty) goBack();
  }

  function goBack() { if (dirty && !leaving) { openLeaveModal(); return; } leaving = true; location.href = "dashboard.html"; }

  function bindEvents() {
    els.themeToggle.addEventListener("click", () => setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark"));
    els.form.addEventListener("submit", saveNote);
    els.backBtn.addEventListener("click", goBack);
    els.stayBtn.addEventListener("click", closeLeaveModal);
    els.leaveBtn.addEventListener("click", () => { leaving = true; location.href = "dashboard.html"; });
    els.leaveModal.addEventListener("click", event => { if (event.target === els.leaveModal) closeLeaveModal(); });
    els.shortcutModal.addEventListener("click", event => { if (event.target === els.shortcutModal) closeShortcutModal(); });
    els.shortcutsBtn.addEventListener("click", openShortcutModal);
    els.shortcutClose.addEventListener("click", closeShortcutModal);
    els.historyBtn.addEventListener("click", openHistoryModal);
    els.exportMarkdownBtn.addEventListener("click", exportMarkdown);
    els.exportPdfBtn.addEventListener("click", exportPdf);
    els.historyClose.addEventListener("click", closeHistoryModal);
    els.historyModal.addEventListener("click", event => { if (event.target === els.historyModal) closeHistoryModal(); const button = event.target.closest("[data-restore-version]"); if (button) restoreVersion(button.dataset.restoreVersion); });
    els.restoreDraftBtn.addEventListener("click", restorePendingDraft);
    els.discardDraftBtn.addEventListener("click", discardPendingDraft);
    els.draftModal.addEventListener("click", event => { if (event.target === els.draftModal) discardPendingDraft(); });
    els.preview.addEventListener("click", handlePreviewActions);
    els.codeLanguage.addEventListener("change", event => { selectedCodeLanguage = event.target.value; });
    $$('[data-command]').forEach(button => button.addEventListener("click", () => commands[button.dataset.command]?.()));
    $$('[data-view]').forEach(button => button.addEventListener("click", () => setView(button.dataset.view)));
    $$('[data-type]').forEach(button => button.addEventListener("click", () => { selectType(button.dataset.type); markDirty(true); scheduleDraftSave(); }));

    els.title.addEventListener("input", () => { updateTitleCount(); markDirty(true); scheduleDraftSave(); });
    els.category.addEventListener("input", () => { markDirty(true); scheduleDraftSave(); });
    els.tags.addEventListener("input", () => { markDirty(true); scheduleDraftSave(); });
    els.content.addEventListener("input", () => { markDirty(true); clearTimeout(historyTimer); historyTimer = setTimeout(() => pushHistory(), 180); scheduleDraftSave(); refreshPreview(); });

    els.content.addEventListener("keydown", event => {
      const mod = event.ctrlKey || event.metaKey; const key = event.key.toLowerCase();
      if (mod && key === "b") { event.preventDefault(); commands.bold(); }
      else if (mod && key === "i") { event.preventDefault(); commands.italic(); }
      else if (mod && key === "z" && !event.shiftKey) { event.preventDefault(); commands.undo(); }
      else if (mod && (key === "y" || (key === "z" && event.shiftKey))) { event.preventDefault(); commands.redo(); }
      else if (mod && key === "s") { event.preventDefault(); els.form.requestSubmit(); }
      else if (mod && event.key === "Enter") { event.preventDefault(); saveAndClose(); }
      else if (event.key === "Tab") { event.preventDefault(); const start = els.content.selectionStart, end = els.content.selectionEnd; els.content.setRangeText("  ", start, end, "end"); pushHistory(true); markDirty(true); refreshPreview(); }
    });

    window.addEventListener("keydown", event => {
      const mod = event.ctrlKey || event.metaKey;
      if (mod && !event.shiftKey && !event.altKey && ["1", "2", "3"].includes(event.key)) {
        event.preventDefault();
        setView(event.key === "1" ? "split" : event.key === "2" ? "write" : "preview");
        return;
      }
      if (event.key === "?") { if (!/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || "")) { event.preventDefault(); openShortcutModal(); } return; }
      if (els.draftModal.classList.contains("open")) { if (event.key === "Escape") { discardPendingDraft(); } return; }
      if (els.shortcutModal.classList.contains("open")) { if (event.key === "Escape") { closeShortcutModal(); } return; }
      if (els.historyModal.classList.contains("open")) { if (event.key === "Escape") { closeHistoryModal(); } return; }
      if (event.key !== "Escape") return;
      if (els.leaveModal.classList.contains("open")) { closeLeaveModal(); return; }
      event.preventDefault();
      goBack();
    });
    window.addEventListener("beforeunload", event => { if (!dirty || leaving) return; event.preventDefault(); event.returnValue = ""; });
  }

  async function init() {
    renderIcons(); loadTheme(); bindEvents(); draftKey = `devnotes-draft:${noteId || "new"}`;
    try {
      const user = await requireAuth(); if (!user) return;
      await Promise.all([loadCategories(), loadNote()]);
      if (!noteId) { const draft = readLocalDraft(); if (draft) openDraftModal(draft); }
      pushHistory(true); refreshPreview(); updateTitleCount(); setSaveState(currentNote ? "saved" : "ready");
      document.title = currentNote?.title ? `${currentNote.title} — DevNotes` : "New Note — DevNotes";
    } catch (error) {
      toast(error.message || "Unable to load the note page", true);
      setTimeout(() => { location.href = "dashboard.html"; }, 1000);
    } finally { els.loading.classList.add("hidden"); setTimeout(() => els.loading.remove(), 250); }
  }

  init();
})();
