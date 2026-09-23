document.addEventListener("DOMContentLoaded", () => {
  window.lucide?.createIcons();
  document.addEventListener("click", e => { const toggle = e.target.closest(".theme-toggle"); if (toggle) DevNotesTheme.toggle(); });
  DN.qsa("[data-year]").forEach(e => e.textContent = new Date().getFullYear());
  const mobileBtn = DN.qs("[data-mobile-menu]"), mobile = DN.qs(".mobile-menu");
  mobileBtn?.addEventListener("click", () => { mobile.classList.toggle("open"); mobileBtn.setAttribute("aria-expanded", String(mobile.classList.contains("open"))); window.lucide?.createIcons() });
  const sidebarBtn = DN.qs("[data-sidebar-toggle]"), sidebar = DN.qs(".sidebar"), backdrop = DN.qs("[data-sidebar-close]");
  const setSidebar = (open) => {
    sidebar?.classList.toggle("open", open);
    sidebarBtn?.setAttribute("aria-expanded", String(!!open));
  };
  const closeSidebar = () => setSidebar(false);
  sidebarBtn?.addEventListener("click", () => setSidebar(!sidebar?.classList.contains("open")));
  backdrop?.addEventListener("click", closeSidebar);
  sidebar?.querySelectorAll("a, button").forEach(control => control.addEventListener("click", () => { if (control !== sidebarBtn) closeSidebar(); }));
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeSidebar(); });
  const observer = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("visible"); observer.unobserve(e.target) } }), { threshold: .1 });
  DN.qsa(".reveal").forEach(e => observer.observe(e));
});
