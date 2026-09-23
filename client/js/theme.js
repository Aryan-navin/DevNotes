(() => {
  const key = "devnotes-theme";
  const root = document.documentElement;
  root.style.colorScheme = "light";

  const saved = localStorage.getItem(key);
  const initial = saved || (
    window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
  );

  const syncControls = () => {
    const dark = root.dataset.theme === "dark";
    document.querySelectorAll(".theme-toggle").forEach((button) => {
      button.setAttribute("aria-pressed", String(dark));
      button.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
      button.title = dark ? "Switch to light mode" : "Switch to dark mode";
    });
  };

  const apply = (theme, persist = true) => {
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    if (persist) localStorage.setItem(key, theme);
    syncControls();
    document.dispatchEvent(new CustomEvent("devnotes:theme", { detail: theme }));
  };

  // Apply before the page paints, preventing a light/dark flash.
  root.dataset.theme = initial;

  window.DevNotesTheme = {
    get: () => root.dataset.theme,
    set: (theme) => apply(theme, true),
    toggle: () => apply(root.dataset.theme === "dark" ? "light" : "dark", true)
  };

  document.addEventListener("DOMContentLoaded", syncControls);
})();
