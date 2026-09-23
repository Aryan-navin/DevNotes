document.addEventListener("DOMContentLoaded", async () => {
  const user = await Auth.require();
  if (!user) return;

  const grid = DN.qs("#noteGrid");
  const search = DN.qs("#noteSearch");
  const sort = DN.qs("#sortNotes");
  const typeFilter = DN.qs("#typeFilter");
  const categoryFilter = DN.qs("#categoryFilter");
  const clearFilters = DN.qs("#clearFilters");
  const filterStatus = DN.qs("#filterStatus");
  let tab = "all";
  let sideFilter = new URLSearchParams(location.search).get("filter") || "all";
  let notes = [];
  let categories = [];
  let tags = [];

  DN.qsa("[data-user-name]").forEach(e => e.textContent = user.name || "Developer");
  DN.qsa("[data-avatar]").forEach(e => e.textContent = DN.initials(user.name));

  const iconFor = type => ({ Snippet: "code-2", Resource: "book-open", Debugging: "bug", Idea: "lightbulb", Command: "terminal", Reference: "bookmark", Concept: "file-text" }[type] || "file-text");

  const escape = value => DN.escape(value ?? "");
  const markdownPreview = (text = "") => {
    let x = escape(text);
    x = x.replace(/```(?:\w+)?\n?([\s\S]*?)```/g, "<pre>$1</pre>")
      .replace(/^### (.*)$/gm, "<h3>$1</h3>")
      .replace(/^## (.*)$/gm, "<h2>$1</h2>")
      .replace(/^# (.*)$/gm, "<h1>$1</h1>")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/(?<!\*)\*(?!\s)(.*?)(?<!\s)\*(?!\*)/g, "<em>$1</em>")
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br>");
    return x ? `<div class="modal-note-content"><p>${x}</p></div>` : `<p class="muted">This note has no content yet.</p>`;
  };


  const renderDynamicSidebar = () => {
    const categoryBox = DN.qs("#categoryLinks");
    if (categoryBox) {
      categoryBox.innerHTML = categories.length
        ? categories.map(c => `<button class="side-link side-filter-link side-dynamic-link" type="button" data-side-filter="category:${escape(c.name)}" title="${escape(c.name)}"><i data-lucide="folder"></i><span>${escape(c.name)}</span><span class="count">${c.count}</span></button>`).join("")
        : `<div class="side-empty">No categories yet</div>`;
    }
    lucide.createIcons();
    bindSidebarLinks();
  };

  const syncCategoryFilter = () => {
    if (!categoryFilter) return;
    const current = categoryFilter.value;
    categoryFilter.innerHTML = `<option value="">All categories</option>` + categories.map(c => `<option value="${escape(c.name)}">${escape(c.name)} (${c.count})</option>`).join("");
    if (categories.some(c => c.name === current)) categoryFilter.value = current;
  };

  const loadSidebarMeta = async () => {
    try {
      const categoryResult = await DevNotesAPI.notes.categories();
      categories = categoryResult.categories || [];
      syncCategoryFilter();
      renderDynamicSidebar();
    } catch (error) {
      console.warn("Could not load sidebar metadata:", error.message);
    }
  };

  const bindCategorySubmenu = () => {
    const group = DN.qs("#categoryNavGroup");
    const toggle = DN.qs(".category-toggle");
    if (!group || !toggle || toggle.dataset.bound === "1") return;
    toggle.dataset.bound = "1";

    const setOpen = open => {
      group.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
    };

    toggle.addEventListener("click", async () => {
      const open = !group.classList.contains("is-open");
      setOpen(open);
      if (open) await showCategories();
    });

    group.addEventListener("mouseenter", () => setOpen(true));
    group.addEventListener("mouseleave", () => {
      if (toggle.getAttribute("aria-expanded") !== "true" || !group.classList.contains("category-nav-pinned")) setOpen(false);
    });

    group.addEventListener("focusin", () => setOpen(true));
    group.addEventListener("focusout", e => {
      if (!group.contains(e.relatedTarget)) setOpen(false);
    });

    document.addEventListener("keydown", e => {
      if (e.key === "Escape") setOpen(false);
    });
  };

  const bindSidebarLinks = () => {
    DN.qsa("[data-side-filter]").forEach(btn => {
      if (btn.dataset.bound === "true") return;
      btn.dataset.bound = "true";
      btn.addEventListener("click", async () => {
        sideFilter = btn.dataset.sideFilter;
        if (sideFilter === "categories") {
          if (search) search.value = "";
          DN.qsa(".tab").forEach(x => x.classList.remove("active"));
          await showCategories();
          return;
        }
        DN.qsa("[data-side-filter]").forEach(x => x.classList.toggle("active", x === btn));
        if (search) search.value = "";
        DN.qsa(".tab").forEach(x => x.classList.toggle("active", x.dataset.tab === "all"));
        tab = "all";
        if (!DN.qs("#noteGrid")) location.href = "dashboard.html";
        await loadNotes();
      });
    });
  };

  const renderCategoriesView = async () => {
    const content = DN.qs(".dashboard-content");
    if (!content) return;

    content.innerHTML = `
      <div class="categories-dashboard-view">
        <div class="categories-dashboard-head">
          <div>
            <div class="categories-kicker"><i data-lucide="folder"></i> Workspace</div>
            <h1>Categories</h1>
            <p>Browse your developer knowledge by topic and jump directly into the notes you need.</p>
          </div>
          <button class="btn btn-primary" id="categoriesNewNote" type="button"><i data-lucide="plus"></i> New Note</button>
        </div>
        <div class="categories-dashboard-toolbar">
          <div class="category-dashboard-search"><i data-lucide="search"></i><input id="dashboardCategorySearch" type="search" placeholder="Search categories..." autocomplete="off"></div>
          <div class="categories-dashboard-summary"><span><strong id="dashboardCategoryTotal">0</strong> categories</span><span><strong id="dashboardCategoryNotes">0</strong> notes</span></div>
        </div>
        <div class="dashboard-category-grid" id="dashboardCategoryGrid"></div>
      </div>`;
    lucide.createIcons();
    const categoryGrid = DN.qs("#dashboardCategoryGrid"), categorySearch = DN.qs("#dashboardCategorySearch"), categoryTotal = DN.qs("#dashboardCategoryTotal"), categoryNotes = DN.qs("#dashboardCategoryNotes");
    const draw = () => {
      const query = (categorySearch?.value || "").trim().toLowerCase();
      const filtered = categories.filter(c => c.name.toLowerCase().includes(query));
      const totalNotes = categories.reduce((sum, c) => sum + Number(c.count || 0), 0);
      if (categoryTotal) categoryTotal.textContent = categories.length;
      if (categoryNotes) categoryNotes.textContent = totalNotes;
      if (!filtered.length) {
        categoryGrid.innerHTML = `<div class="card dashboard-category-empty"><div class="empty-icon"><i data-lucide="folder-open"></i></div><h3>${categories.length ? "No matching categories" : "No categories yet"}</h3><p>${categories.length ? "Try a different search term." : "Create a note with a category and it will appear here automatically."}</p>${!categories.length ? '<button class="btn btn-primary" id="categoriesEmptyNewNote" type="button"><i data-lucide="plus"></i>Create a note</button>' : ""}</div>`;
        lucide.createIcons(); return;
      }
      categoryGrid.innerHTML = filtered.map((c, i) => `<article class="dashboard-category-card card delay-${Math.min(i, 8)}"><div class="dashboard-category-top"><div class="dashboard-category-icon"><i data-lucide="folder"></i></div><span class="dashboard-category-count">${Number(c.count || 0)} ${Number(c.count || 0) === 1 ? "note" : "notes"}</span></div><h2>${escape(c.name)}</h2><p>${Number(c.count || 0) === 1 ? "One knowledge item" : `${Number(c.count || 0)} knowledge items`} in this category.</p><a class="dashboard-category-open" href="dashboard.html?filter=category:${encodeURIComponent(c.name)}"><span>Open notes</span><i data-lucide="arrow-right"></i></a></article>`).join("");
      lucide.createIcons();
    };
    categorySearch?.addEventListener("input", draw);
    content.addEventListener("click", e => { if (e.target.closest("#categoriesNewNote") || e.target.closest("#categoriesEmptyNewNote")) location.href = "note.html"; });
    draw();
  };

  const showCategories = async () => {
    const categoryGroup = DN.qs("#categoryNavGroup");
    const categoryToggle = DN.qs(".category-toggle");
    categoryGroup?.classList.add("is-open");
    categoryToggle?.setAttribute("aria-expanded", "true");
    DN.qsa(".side-link[data-side-filter]").forEach(x => x.classList.toggle("active", x.dataset.sideFilter === "categories"));
    await loadSidebarMeta();
    await renderCategoriesView();
  };


  const updateDashboardView = () => {
    const title = DN.qs("#dashboardTitle");
    const subtitle = DN.qs("#dashboardSubtitle");
    const tabs = DN.qs("#noteTabs");
    const newBtn = DN.qs("#newNoteBtn");
    const labels = {
      all: ["Your Ideas, <span class=\"gradient\">Organized</span>", "Capture thoughts, code snippets and technical knowledge — all in one place."],
      favorites: ["Favorite <span class=\"gradient\">Notes</span>", "Keep the knowledge you want to reach quickly, all in one place."],
      archive: ["Archived <span class=\"gradient\">Notes</span>", "A quiet place for notes you want to keep without cluttering your workspace."],
      trash: ["Trash <span class=\"gradient\">Bin</span>", "Review deleted notes, restore them, or permanently remove them."],
      pinned: ["Pinned <span class=\"gradient\">Notes</span>", "Your most important developer notes, kept close at hand."]
    };
    const key = sideFilter === "favorites" || sideFilter === "archive" || sideFilter === "trash" ? sideFilter : (tab === "pinned" ? "pinned" : "all");
    const [heading, sub] = labels[key];
    if (title) title.innerHTML = heading;
    if (subtitle) subtitle.textContent = sub;
    if (tabs) tabs.style.display = ["favorites", "archive", "trash"].includes(sideFilter) ? "none" : "flex";
    if (newBtn) newBtn.style.display = sideFilter === "trash" ? "none" : "inline-flex";
  };

  const loadNotes = async () => {
    updateDashboardView();
    const params = { view: sideFilter === "favorites" ? "favorites" : sideFilter === "archive" ? "archive" : sideFilter === "trash" ? "trash" : tab === "pinned" ? "pinned" : "active", sort: sort?.value || "latest", q: (search?.value || "").trim() };
    if (typeFilter?.value) params.type = typeFilter.value;
    if (categoryFilter?.value) params.category = categoryFilter.value;
    if (sideFilter.startsWith("tag:")) params.tag = sideFilter.slice(4);
    if (sideFilter.startsWith("category:")) params.category = sideFilter.slice(9);
    try {
      const result = await DevNotesAPI.notes.list(params);
      notes = result.notes || [];
      render();
    } catch (error) {
      grid.innerHTML = `<div class="card empty-state full-grid"><div class="empty-icon"><i data-lucide="wifi-off"></i></div><h3>Couldn’t load notes</h3><p>${escape(error.message)}</p><button class="btn btn-primary" id="retryNotes">Retry</button></div>`;
      lucide.createIcons();
    }
  };

  const confirmPermanentDelete = () => new Promise(resolve => {
    const backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop confirm-backdrop";
    backdrop.innerHTML = `<section class="modal confirm-modal" role="dialog" aria-modal="true" aria-labelledby="confirmDeleteTitle" aria-describedby="confirmDeleteText">
      <div class="confirm-icon"><i data-lucide="triangle-alert"></i></div>
      <div class="confirm-content">
        <h2 id="confirmDeleteTitle">Delete note permanently?</h2>
        <p id="confirmDeleteText">This note will be permanently removed from your account. This action cannot be undone.</p>
      </div>
      <div class="confirm-actions">
        <button type="button" class="btn btn-secondary" data-confirm-cancel>Cancel <span class="confirm-key">Esc</span></button>
        <button type="button" class="btn btn-danger" data-confirm-ok><i data-lucide="trash-2"></i>Delete permanently <span class="confirm-key">Enter</span></button>
      </div>
    </section>`;
    document.body.appendChild(backdrop);
    lucide.createIcons();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const ok = () => finish(true);
    const cancel = () => finish(false);
    const onKeyDown = e => {
      if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); ok(); }
      else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); cancel(); }
    };
    const finish = value => {
      if (!document.body.contains(backdrop)) return;
      document.removeEventListener("keydown", onKeyDown, true);
      document.body.style.overflow = previousOverflow;
      backdrop.remove();
      resolve(value);
    };
    backdrop.addEventListener("click", e => {
      if (e.target === backdrop || e.target.closest("[data-confirm-cancel]")) cancel();
      else if (e.target.closest("[data-confirm-ok]")) ok();
    });
    document.addEventListener("keydown", onKeyDown, true);
    requestAnimationFrame(() => backdrop.querySelector("[data-confirm-ok]")?.focus());
  });

  const openNote = async id => {
    let n = notes.find(item => String(item._id) === String(id));
    try { if (!n) n = (await DevNotesAPI.notes.get(id)).note; } catch (error) { DN.toast(error.message, "circle-alert"); return; }
    if (!n) return;

    const backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop note-view-backdrop";
    backdrop.id = "noteViewModal";
    backdrop.innerHTML = `<article class="modal note-view-modal">
      <div class="note-view-top"><div class="note-view-type"><span class="note-type"><i data-lucide="${iconFor(n.type)}"></i></span><span class="note-type-label">${escape(n.type)}</span></div>
      <button class="icon-btn" data-close-note aria-label="Close"><i data-lucide="x"></i></button></div>
      <div class="note-view-heading"><div><div class="note-view-category"><i data-lucide="folder"></i>${escape(n.category || "Programming")}</div>
      <h2>${escape(n.title || "Untitled note")}</h2><div class="note-view-meta">${escape((n.tags || []).map(t => "#" + t).join("  ")) || "No tags"} · Updated ${DN.date(n.updatedAt)}</div></div>
      <div class="note-view-heading-actions">
      <button class="favorite-btn ${n.favorite ? "favorited" : ""}" data-modal-favorite="${escape(n._id)}" title="${n.favorite ? "Remove from favorites" : "Add to favorites"}" aria-label="${n.favorite ? "Remove from favorites" : "Add to favorites"}"><i data-lucide="star"></i></button>
      <button class="pin-btn ${n.pinned ? "pinned" : ""}" data-modal-pin="${escape(n._id)}" title="${n.pinned ? "Unpin" : "Pin"}" aria-label="${n.pinned ? "Unpin" : "Pin"}"><i data-lucide="${n.pinned ? "pin" : "pin-off"}"></i></button></div></div>
      <div class="note-view-body">${markdownPreview(n.content)}</div>
      <div class="modal-actions note-view-actions"><button class="btn btn-danger" data-modal-delete="${escape(n._id)}"><i data-lucide="${n.trashed ? "trash-2" : "trash-2"}"></i>${n.trashed ? "Delete permanently" : "Delete"}</button><span class="action-spacer"></span>
      <button class="btn btn-secondary" data-close-note>Close</button><button class="btn btn-pdf" data-modal-export-pdf="${escape(n._id)}" title="Export this note as PDF"><i data-lucide="file-text"></i>Export PDF</button><button class="btn btn-primary" data-modal-edit="${escape(n._id)}"><i data-lucide="pencil"></i>Edit note</button></div>
    </article>`;
    document.body.appendChild(backdrop); lucide.createIcons();

    const close = () => { backdrop.remove(); document.removeEventListener("keydown", esc, true); };
    const esc = e => { if (e.key === "Escape" && document.body.contains(backdrop)) { e.preventDefault(); e.stopPropagation(); close(); } };
    document.addEventListener("keydown", esc, true);
    backdrop.addEventListener("click", async e => {
      if (e.target === backdrop || e.target.closest("[data-close-note]")) return close();
      const edit = e.target.closest("[data-modal-edit]");
      if (edit) return location.href = `note.html?id=${encodeURIComponent(edit.dataset.modalEdit)}`;
      const exportPdf = e.target.closest("[data-modal-export-pdf]");
      if (exportPdf) {
        const button = exportPdf;
        button.disabled = true;
        button.classList.add("loading");
        try {
          const response = await fetch(`${window.DEVNOTES_API_BASE || "/api"}/notes/${encodeURIComponent(exportPdf.dataset.modalExportPdf)}/pdf`, { credentials: "include" });
          if (!response.ok) {
            let message = "Could not export PDF";
            try { const data = await response.json(); message = data.message || message; } catch { }
            throw new Error(message);
          }
          const blob = await response.blob();
          const safeTitle = (n.title || "Untitled note").replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, " ").trim().slice(0, 90) || "devnotes-note";
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `${safeTitle}.pdf`;
          document.body.appendChild(link);
          link.click();
          link.remove();
          URL.revokeObjectURL(url);
          DN.toast("PDF exported", "file-text");
        } catch (error) {
          DN.toast(error.message || "Could not export PDF", "circle-alert");
        } finally {
          button.disabled = false;
          button.classList.remove("loading");
        }
        return;
      }
      const favorite = e.target.closest("[data-modal-favorite]");
      if (favorite) {
        try {
          const nextFavorite = !n.favorite;
          await DevNotesAPI.notes.update(favorite.dataset.modalFavorite, { favorite: nextFavorite });
          n.favorite = nextFavorite;
          close();
          await loadNotes();
          DN.toast(nextFavorite ? "Added to favorites" : "Removed from favorites", "star");
        } catch (error) { DN.toast(error.message, "circle-alert"); }
        return;
      }
      const pin = e.target.closest("[data-modal-pin]");
      if (pin) {
        try { await DevNotesAPI.notes.update(pin.dataset.modalPin, { pinned: !n.pinned }); close(); await loadNotes(); DN.toast(n.pinned ? "Note unpinned" : "Note pinned", "pin"); }
        catch (error) { DN.toast(error.message, "circle-alert"); }
        return;
      }
      const del = e.target.closest("[data-modal-delete]");
      if (del) {
        try {
          if (n.trashed) {
            if (!(await confirmPermanentDelete())) return;
            await DevNotesAPI.notes.remove(del.dataset.modalDelete, true);
            close();
            await loadNotes();
            DN.toast("Note permanently deleted", "trash-2");
          } else {
            await DevNotesAPI.notes.remove(del.dataset.modalDelete);
            close();
            await loadNotes();
            DN.toast("Note moved to trash", "trash-2");
          }
        } catch (error) { DN.toast(error.message, "circle-alert"); }
      }
    });
  };

  const card = n => `<article class="note-card card" data-open-note="${escape(n._id)}" tabindex="0" role="button" aria-label="Open ${escape(n.title)}">
    <div class="note-card-top"><div class="note-type"><i data-lucide="${iconFor(n.type)}"></i></div>
    <div class="note-card-top-actions">
      <button class="favorite-btn ${n.favorite ? "favorited" : ""}" data-favorite="${escape(n._id)}" title="${n.favorite ? "Remove from favorites" : "Add to favorites"}" aria-label="${n.favorite ? "Remove from favorites" : "Add to favorites"}"><i data-lucide="star"></i></button>
      <button class="pin-btn ${n.pinned ? "pinned" : ""}" data-pin="${escape(n._id)}" title="${n.pinned ? "Unpin" : "Pin"}" aria-label="${n.pinned ? "Unpin" : "Pin"}"><i data-lucide="${n.pinned ? "pin" : "pin-off"}"></i></button>
    </div></div>
    <div class="note-card-body"><div class="note-card-category">${escape(n.category || "Programming")}</div><h3>${escape(n.title)}</h3>
    <p>${escape((n.content || "").replace(/[#`*_]/g, "").replace(/\n/g, " ").slice(0, 145))}</p></div>
    <div class="tags">${(n.tags || []).map(t => `<span class="tag">#${escape(t)}</span>`).join("")}</div>
    <div class="note-meta"><span>${escape(n.type)}</span><span>${DN.date(n.updatedAt)}</span></div>
    <div class="note-card-actions"><button type="button" class="icon-btn" data-edit="${escape(n._id)}" title="Edit"><i data-lucide="pencil"></i></button>
    <button type="button" class="icon-btn" data-archive="${escape(n._id)}" title="${n.archived ? "Restore" : "Archive"}"><i data-lucide="${n.archived ? "archive-restore" : "archive"}"></i></button>
    <button type="button" class="icon-btn" data-trash="${escape(n._id)}" title="${n.trashed ? "Restore" : "Move to trash"}"><i data-lucide="${n.trashed ? "rotate-ccw" : "trash-2"}"></i></button>
    ${n.trashed ? `<button type="button" class="icon-btn danger-action" data-permanent-delete="${escape(n._id)}" title="Delete permanently" aria-label="Delete permanently"><i data-lucide="trash-2"></i></button>` : ""}</div>
  </article>`;

  const render = () => {
    let visible = [...notes];
    if (tab === "recent") visible = visible.slice().sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 6);
    if (sort?.value === "oldest") visible.sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt));
    if (sort?.value === "title") visible.sort((a, b) => a.title.localeCompare(b.title));

    const emptyCopy = sideFilter === "favorites"
      ? ["No favorite notes yet", "Star a note and it will appear here for quick access."]
      : sideFilter === "archive"
        ? ["Archive is empty", "Archived notes will appear here when you move them out of your active workspace."]
        : sideFilter === "trash"
          ? ["Trash is empty", "Notes you move to trash will appear here until you restore or permanently delete them."]
          : tab === "pinned"
            ? ["No pinned notes yet", "Pin important notes to keep them easy to find."]
            : ["No notes here", "Try another filter or create a new note."];
    const hasQuery = Boolean((search?.value || "").trim() || typeFilter?.value || categoryFilter?.value);
    if (filterStatus) {
      const bits = [];
      if ((search?.value || "").trim()) bits.push(`Search: “${escape(search.value.trim())}”`);
      if (typeFilter?.value) bits.push(`Type: ${escape(typeFilter.value)}`);
      if (categoryFilter?.value) bits.push(`Category: ${escape(categoryFilter.value)}`);
      filterStatus.innerHTML = hasQuery ? `<span><strong>${visible.length}</strong> result${visible.length === 1 ? "" : "s"}</span><span class="filter-chips">${bits.map(x => `<span class="filter-chip">${x}</span>`).join("")}</span>` : "";
      if (clearFilters) clearFilters.classList.toggle("is-active", hasQuery);
      const summary = DN.qs("#toolbarSummary");
      if (summary) summary.textContent = hasQuery ? `${visible.length} matching ${visible.length === 1 ? "note" : "notes"}` : `${visible.length} ${visible.length === 1 ? "note" : "notes"} in this view`;
    }
    const emptyHeading = hasQuery ? "No matching notes" : emptyCopy[0];
    const emptyText = hasQuery ? "Try a different search term or clear one of the filters." : emptyCopy[1];
    grid.innerHTML = visible.length ? visible.map(card).join("") : `<div class="card empty-state dashboard-view-empty full-grid"><div class="empty-icon"><i data-lucide="${hasQuery ? "search-x" : sideFilter === "trash" ? "trash-2" : sideFilter === "archive" ? "archive" : sideFilter === "favorites" ? "star" : "inbox"}"></i></div><h3>${emptyHeading}</h3><p>${emptyText}</p>${!hasQuery && sideFilter !== "trash" ? '<button class="btn btn-primary" id="emptyNewNote">Create a note</button>' : hasQuery ? '<button class="btn btn-secondary" id="emptyClearFilters">Clear filters</button>' : ""}</div>`;
    const active = notes.filter(n => !n.trashed && !n.archived);
    DN.qs("#totalNotes").textContent = active.length;
    DN.qs("#snippetCount").textContent = active.filter(n => n.type === "Snippet").length;
    DN.qs("#favoriteCount").textContent = active.filter(n => n.favorite).length;
    DN.qs("#topicCount").textContent = new Set(active.map(n => n.category)).size;
    DN.qs("#sideCount").textContent = active.length;
    lucide.createIcons();
  };

  bindSidebarLinks();
  await loadSidebarMeta();

  const initialView = new URLSearchParams(location.search).get("view");
  if (initialView === "categories") await showCategories();
  else await loadNotes();

  let searchTimer;
  search?.addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(loadNotes, 220);
  });
  [sort, typeFilter, categoryFilter].forEach(control => control?.addEventListener("change", loadNotes));
  clearFilters?.addEventListener("click", async () => {
    if (search) search.value = "";
    if (typeFilter) typeFilter.value = "";
    if (categoryFilter) categoryFilter.value = "";
    if (sort) sort.value = "latest";
    DN.qsa(".tab").forEach(x => x.classList.toggle("active", x.dataset.tab === "all"));
    tab = "all";
    await loadNotes();
    DN.toast("Search and filters reset", "rotate-ccw");
  });
  DN.qsa(".tab").forEach(t => t.addEventListener("click", async () => {
    DN.qsa(".tab").forEach(x => x.classList.remove("active")); t.classList.add("active"); tab = t.dataset.tab; await loadNotes();
  }));

  grid?.addEventListener("click", async e => {
    if (e.target.closest("#retryNotes")) return loadNotes();
    if (e.target.closest("#emptyClearFilters")) { clearFilters?.click(); return; }
    const favorite = e.target.closest("[data-favorite]");
    if (favorite) {
      e.stopPropagation();
      try {
        const n = notes.find(x => String(x._id) === String(favorite.dataset.favorite));
        const nextFavorite = !n.favorite;
        await DevNotesAPI.notes.update(favorite.dataset.favorite, { favorite: nextFavorite });
        await loadNotes();
        DN.toast(nextFavorite ? "Added to favorites" : "Removed from favorites", "star");
      } catch (error) { DN.toast(error.message, "circle-alert"); }
      return;
    }
    const pin = e.target.closest("[data-pin]");
    if (pin) { e.stopPropagation(); try { const n = notes.find(x => String(x._id) === String(pin.dataset.pin)); await DevNotesAPI.notes.update(pin.dataset.pin, { pinned: !n.pinned }); await loadNotes(); DN.toast(n.pinned ? "Note unpinned" : "Note pinned", "pin"); } catch (error) { DN.toast(error.message, "circle-alert"); } return; }
    const edit = e.target.closest("[data-edit]");
    if (edit) { e.stopPropagation(); return location.href = `note.html?id=${encodeURIComponent(edit.dataset.edit)}`; }
    const archive = e.target.closest("[data-archive]");
    if (archive) { e.stopPropagation(); const n = notes.find(x => String(x._id) === String(archive.dataset.archive)); try { await DevNotesAPI.notes.update(archive.dataset.archive, { archived: !n.archived }); await loadNotes(); DN.toast(n.archived ? "Note restored" : "Note archived"); } catch (error) { DN.toast(error.message, "circle-alert"); } return; }
    const trash = e.target.closest("[data-trash]");
    if (trash) { e.stopPropagation(); const n = notes.find(x => String(x._id) === String(trash.dataset.trash)); try { await DevNotesAPI.notes.update(trash.dataset.trash, { trashed: !n.trashed }); await loadNotes(); DN.toast(n.trashed ? "Restored from trash" : "Moved to trash"); } catch (error) { DN.toast(error.message, "circle-alert"); } return; }
    const permanent = e.target.closest("[data-permanent-delete]");
    if (permanent) {
      e.stopPropagation();
      if (!(await confirmPermanentDelete())) return;
      try { await DevNotesAPI.notes.remove(permanent.dataset.permanentDelete, true); await loadNotes(); DN.toast("Note permanently deleted", "trash-2"); }
      catch (error) { DN.toast(error.message, "circle-alert"); }
      return;
    }
    const open = e.target.closest("[data-open-note]"); if (open) openNote(open.dataset.openNote);
    if (e.target.closest("#emptyNewNote")) location.href = "note.html";
  });

  grid?.addEventListener("keydown", e => { const c = e.target.closest("[data-open-note]"); if (c && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); openNote(c.dataset.openNote); } });
  DN.qs("#logoutBtn")?.addEventListener("click", () => Auth.logout());
  DN.qs("#newNoteBtn")?.addEventListener("click", () => location.href = "note.html");
  DN.qs("#commandButton")?.addEventListener("click", openPalette);
  document.addEventListener("keydown", e => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); openPalette(); } });

  function openPalette() {
    if (DN.qs("#palette")) return;
    const b = document.createElement("div"); b.className = "modal-backdrop command-backdrop"; b.id = "palette";
    b.innerHTML = `<div class="modal command-palette" role="dialog" aria-modal="true" aria-label="Command palette" aria-describedby="commandPaletteHelp"><div class="command-search"><i data-lucide="search"></i><input id="commandPaletteInput" autofocus placeholder="Search or jump to..." autocomplete="off" role="combobox" aria-expanded="true" aria-controls="commandPaletteItems" aria-autocomplete="list"><kbd>ESC</kbd></div><div class="command-items" id="commandPaletteItems" role="listbox" aria-label="Commands"><button class="command-item" type="button" data-go="new" role="option"><i data-lucide="plus"></i><span>Create new note</span></button><button class="command-item" type="button" data-go="dashboard" role="option"><i data-lucide="layout-dashboard"></i><span>Dashboard</span></button><button class="command-item" type="button" data-go="settings" role="option"><i data-lucide="settings"></i><span>Settings</span></button></div><div id="commandPaletteHelp" class="command-help"><span>↑↓ Navigate</span><span>Enter Open</span><span>Esc Close</span></div></div>`;
    document.body.appendChild(b); lucide.createIcons();
    const previousOverflow = document.body.style.overflow; document.body.style.overflow = "hidden";
    const input = b.querySelector("#commandPaletteInput");
    let items = [...b.querySelectorAll(".command-item")];
    let activeIndex = 0;
    const setActive = (index, scroll = true) => {
      items.forEach((item, i) => { const active = i === index; item.classList.toggle("is-active", active); item.setAttribute("aria-selected", String(active)); });
      activeIndex = index;
      if (scroll && items[index]) items[index].scrollIntoView({ block: "nearest" });
    };
    const refresh = () => {
      const q = input.value.trim().toLowerCase();
      items.forEach(item => { item.hidden = !item.textContent.toLowerCase().includes(q); });
      items = [...b.querySelectorAll(".command-item:not([hidden])")];
      setActive(items.length ? 0 : -1, false);
    };
    const close = () => { if (!document.body.contains(b)) return; b.remove(); document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", onKeyDown, true); };
    const activate = () => { const item = items[activeIndex]; if (item) item.click(); };
    const onKeyDown = e => { if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); close(); } };
    document.addEventListener("keydown", onKeyDown, true);
    b.addEventListener("click", e => { if (e.target === b) return close(); const item = e.target.closest("[data-go]"); if (!item) return; const d = item.dataset.go; close(); location.href = d === "new" ? "note.html" : d === "settings" ? "settings.html" : "dashboard.html"; });
    input?.addEventListener("input", refresh);
    input?.addEventListener("keydown", e => {
      if (e.key === "Escape") { e.preventDefault(); close(); return; }
      if (e.key === "ArrowDown") { e.preventDefault(); if (!items.length) return; setActive((activeIndex + 1) % items.length); return; }
      if (e.key === "ArrowUp") { e.preventDefault(); if (!items.length) return; setActive((activeIndex - 1 + items.length) % items.length); return; }
      if (e.key === "Home") { e.preventDefault(); if (items.length) setActive(0); return; }
      if (e.key === "End") { e.preventDefault(); if (items.length) setActive(items.length - 1); return; }
      if (e.key === "Enter") { e.preventDefault(); activate(); }
    });
    refresh();
    requestAnimationFrame(() => { input?.focus(); input?.select(); });
  }

  await loadSidebarMeta();
});
