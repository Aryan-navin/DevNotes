document.addEventListener("DOMContentLoaded", async () => {
  const user = await Auth.require();
  if (!user) return;

  const grid = DN.qs("#categoriesGrid");
  const empty = DN.qs("#categoriesEmpty");
  const search = DN.qs("#categorySearch");
  const totalEl = DN.qs("#categoryTotal");
  const notesEl = DN.qs("#categoryNotesTotal");
  const categoryLinks = DN.qs("#categoryLinks");
  const tagLinks = DN.qs("#tagLinks");
  let categories = [];

  DN.qsa("[data-user-name]").forEach(e => e.textContent = user.name || "Developer");
  DN.qsa("[data-avatar]").forEach(e => e.textContent = DN.initials(user.name));

  const esc = value => DN.escape(value ?? "");


  DN.qs("#logoutBtn")?.addEventListener("click", () => Auth.logout());

  const loadSidebar = async () => {
    try {
      const [c, t] = await Promise.all([DevNotesAPI.notes.categories(), DevNotesAPI.notes.tags()]);
      const cats = c.categories || [];
      const tags = t.tags || [];
      if (categoryLinks) {
        categoryLinks.innerHTML = cats.length
          ? cats.map(x => `<a class="side-link side-dynamic-link active" href="dashboard.html?filter=category:${encodeURIComponent(x.name)}" title="${esc(x.name)}"><i data-lucide="folder"></i><span>${esc(x.name)}</span><span class="count">${x.count}</span></a>`).join("")
          : `<div class="side-empty">No categories yet</div>`;
      }
      if (tagLinks) {
        tagLinks.innerHTML = tags.length
          ? tags.slice(0, 8).map(x => `<a class="side-link side-dynamic-link" href="dashboard.html?filter=tag:${encodeURIComponent(x.name)}" title="${esc(x.name)}"><i data-lucide="hash"></i><span>${esc(x.name)}</span><span class="count">${x.count}</span></a>`).join("")
          : `<div class="side-empty">No tags yet</div>`;
      }
      lucide.createIcons();
    } catch (e) {
      console.warn("Could not load sidebar metadata:", e.message);
    }
  };

  const loadCategories = async () => {
    grid.innerHTML = `<div class="category-loading card"><i data-lucide="loader-circle"></i><span>Loading categories…</span></div>`;
    lucide.createIcons();
    try {
      const result = await DevNotesAPI.notes.categories();
      categories = result.categories || [];
      render();
    } catch (error) {
      grid.innerHTML = `<div class="card category-error"><div class="category-error-icon"><i data-lucide="wifi-off"></i></div><h3>Couldn’t load categories</h3><p>${esc(error.message)}</p><button class="btn btn-primary" id="retryCategories"><i data-lucide="refresh-cw"></i>Retry</button></div>`;
      lucide.createIcons();
      DN.qs("#retryCategories")?.addEventListener("click", loadCategories);
    }
  };

  const render = () => {
    const query = (search?.value || "").trim().toLowerCase();
    const filtered = categories.filter(c => c.name.toLowerCase().includes(query));
    const totalNotes = categories.reduce((sum, c) => sum + Number(c.count || 0), 0);
    if (totalEl) totalEl.textContent = categories.length;
    if (notesEl) notesEl.textContent = totalNotes;
    if (!filtered.length) {
      grid.innerHTML = "";
      empty?.classList.remove("hidden");
      if (empty) empty.querySelector("h3").textContent = categories.length ? "No matching categories" : "No categories yet";
      if (empty) empty.querySelector("p").textContent = categories.length ? "Try another category name." : "Create a note with a category and it will appear here automatically.";
      return;
    }
    empty?.classList.add("hidden");
    grid.innerHTML = filtered.map((c, i) => `
      <article class="category-card card reveal visible">
        <div class="category-card-top">
          <div class="category-icon"><i data-lucide="folder"></i></div>
          <span class="category-count">${c.count} ${Number(c.count) === 1 ? "note" : "notes"}</span>
        </div>
        <h2>${esc(c.name)}</h2>
        <p>${Number(c.count) === 1 ? "One knowledge item" : `${c.count} knowledge items`} in this category.</p>
        <a class="category-open" href="dashboard.html?filter=category:${encodeURIComponent(c.name)}">
          <span>Open notes</span><i data-lucide="arrow-up-right"></i>
        </a>
      </article>
    `).join("");
    lucide.createIcons();
  };

  search?.addEventListener("input", render);
  await Promise.all([loadSidebar(), loadCategories()]);
});
