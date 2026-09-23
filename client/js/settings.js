document.addEventListener("DOMContentLoaded", async () => {
  const user = await Auth.require();
  if (!user) return;
  const name = document.querySelector("#settingName");
  const email = document.querySelector("#settingEmail");
  const save = document.querySelector("#saveSettings");
  const reset = document.querySelector("#resetProfile");
  const feedback = document.querySelector("#settingsFeedback");
  const avatar = document.querySelector("#profileAvatar");
  const namePreview = document.querySelector("#profileNamePreview");
  const emailPreview = document.querySelector("#profileEmailPreview");
  const createdPreview = document.querySelector("#profileCreatedPreview");
  const themeLabel = document.querySelector("#themeLabel");
  let originalName = user.name || "";

  const formatDate = value => {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat(undefined, { month: "short", year: "numeric" }).format(date);
  };
  const updatePreview = () => {
    const value = (name?.value || "").trim() || "Your name";
    if (namePreview) namePreview.textContent = value;
    if (avatar) avatar.textContent = DN.initials(value);
    if (emailPreview) emailPreview.textContent = email?.value || "Your account email";
    if (createdPreview) createdPreview.textContent = formatDate(user.createdAt);
    if (reset) reset.disabled = value === originalName;
  };
  const updateThemeLabel = () => { if (themeLabel) themeLabel.textContent = DevNotesTheme.get() === "dark" ? "Dark mode" : "Light mode"; };

  if (name) name.value = originalName;
  if (email) email.value = user.email || "";
  updatePreview();
  if (user.preferences?.theme && user.preferences.theme !== DevNotesTheme.get()) DevNotesTheme.set(user.preferences.theme);
  updateThemeLabel();
  name?.addEventListener("input", updatePreview);
  reset?.addEventListener("click", () => { if (name) name.value = originalName; if (feedback) feedback.textContent = "Changes discarded"; updatePreview(); });

  document.addEventListener("devnotes:theme", async event => {
    updateThemeLabel();
    try { const result = await DevNotesAPI.users.preferences({ theme: event.detail }); Auth.setUser(result.user); }
    catch { DN.toast("Theme saved on this device; account sync failed", "circle-alert"); }
  });

  save?.addEventListener("click", async () => {
    const nextName = (name?.value || "").trim();
    if (nextName.length < 2 || nextName.length > 80) { DN.toast("Name must contain 2–80 characters", "circle-alert"); name?.focus(); return; }
    if (nextName === originalName) { if (feedback) feedback.textContent = "No changes to save"; return; }
    save.disabled = true; if (reset) reset.disabled = true; if (feedback) feedback.textContent = "Saving…";
    try {
      const result = await DevNotesAPI.users.preferences({ name: nextName });
      Auth.setUser(result.user); originalName = result.user.name || nextName; if (name) name.value = originalName;
      if (feedback) feedback.textContent = "Saved just now"; updatePreview(); DN.toast("Profile updated successfully", "check");
    } catch (error) { if (feedback) feedback.textContent = "Could not save"; DN.toast(error.message || "Unable to save profile", "circle-alert"); }
    finally { save.disabled = false; updatePreview(); }
  });

  const sidebar = document.querySelector(".sidebar");
  const sidebarToggle = document.querySelector("[data-sidebar-toggle]");
  const setSidebar = (open) => {
    sidebar?.classList.toggle("open", open);
    sidebarToggle?.setAttribute("aria-expanded", String(!!open));
  };
  sidebarToggle?.addEventListener("click", () => setSidebar(!sidebar?.classList.contains("open")));
  document.querySelector("[data-sidebar-close]")?.addEventListener("click", () => setSidebar(false));
  document.querySelector("#logoutBtn")?.addEventListener("click", () => Auth.logout());
  document.addEventListener("keydown", event => {
    if (event.key !== "Escape") return;
    const sidebar = document.querySelector(".sidebar");
    if (sidebar?.classList.contains("open")) { setSidebar(false); return; }
    if (event.target && ["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName)) return;
    location.href = "dashboard.html";
  });
});

(() => {
  const form = document.querySelector("#changePasswordForm");
  if (!form) return;

  const current = document.querySelector("#currentPassword");
  const next = document.querySelector("#newPassword");
  const confirm = document.querySelector("#confirmNewPassword");
  const button = document.querySelector("#changePasswordBtn");
  const feedback = document.querySelector("#passwordFeedback");
  const showAll = document.querySelector("#showAllPasswords");

  const setVisible = (visible) => {
    [current, next, confirm].forEach(input => {
      if (input) input.type = visible ? "text" : "password";
    });
    document.querySelectorAll("[data-password-toggle]").forEach(toggle => {
      const icon = toggle.querySelector("[data-icon]");
      if (icon) icon.dataset.icon = visible ? "eye-off" : "eye";
      toggle.setAttribute("aria-label", visible ? "Hide password" : "Show password");
      toggle.title = visible ? "Hide password" : "Show password";
    });
    window.DevNotesSettingsIcons?.render();
  };

  document.querySelectorAll("[data-password-toggle]").forEach(toggle => {
    toggle.addEventListener("click", () => {
      const input = document.querySelector(toggle.dataset.passwordToggle);
      if (!input) return;
      input.type = input.type === "password" ? "text" : "password";
      const visible = input.type === "text";
      const icon = toggle.querySelector("[data-icon]");
      if (icon) icon.dataset.icon = visible ? "eye-off" : "eye";
      toggle.setAttribute("aria-label", visible ? "Hide password" : "Show password");
      toggle.title = visible ? "Hide password" : "Show password";
      window.DevNotesSettingsIcons?.render();
      if (showAll) showAll.checked = [current, next, confirm].every(el => el?.type === "text");
    });
  });

  showAll?.addEventListener("change", () => setVisible(showAll.checked));

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const currentPassword = String(current?.value || "");
    const newPassword = String(next?.value || "");
    const confirmPassword = String(confirm?.value || "");

    if (!currentPassword || !newPassword || !confirmPassword) {
      DN.toast("Please fill in all password fields", "circle-alert");
      return;
    }
    if (newPassword.length < 8) {
      DN.toast("New password must be at least 8 characters", "circle-alert");
      next?.focus();
      return;
    }
    if (newPassword !== confirmPassword) {
      DN.toast("New passwords do not match", "circle-alert");
      confirm?.focus();
      return;
    }

    button.disabled = true;
    if (feedback) feedback.textContent = "Changing…";

    try {
      await DevNotesAPI.auth.changePassword({ currentPassword, newPassword, confirmPassword });
      form.reset();
      setVisible(false);
      if (feedback) feedback.textContent = "Changed just now";
      DN.toast("Password changed successfully", "check");
    } catch (error) {
      if (feedback) feedback.textContent = "Could not change";
      DN.toast(error.message || "Unable to change password", "circle-alert");
    } finally {
      button.disabled = false;
    }
  });
})();

(() => {
  document.addEventListener("DOMContentLoaded", () => {
    const exportBtn = document.querySelector("#exportNotesBtn");
    const importBtn = document.querySelector("#importNotesBtn");
    const exportPdfBtn = document.querySelector("#exportPdfBtn");
    const fileInput = document.querySelector("#importNotesFile");
    const feedback = document.querySelector("#dataFeedback");
    const countBadge = document.querySelector("#backupCount");

    const setFeedback = (message, type = "") => {
      if (!feedback) return;
      feedback.textContent = message;
      feedback.className = `data-feedback ${type}`.trim();
    };

    exportBtn?.addEventListener("click", async () => {
      exportBtn.disabled = true;
      setFeedback("Preparing your backup…");
      try {
        const result = await DevNotesAPI.notes.exportAll();
        const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const date = new Date().toISOString().slice(0, 10);
        link.href = url;
        link.download = `devnotes-backup-${date}.json`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
        if (countBadge) countBadge.textContent = `${result.noteCount || 0} notes`;
        setFeedback(`Backup exported successfully • ${result.noteCount || 0} notes`, "success");
        DN.toast("DevNotes backup exported", "check");
      } catch (error) {
        setFeedback(error.message || "Could not export backup", "error");
        DN.toast(error.message || "Could not export backup", "circle-alert");
      } finally { exportBtn.disabled = false; }
    });

    exportPdfBtn?.addEventListener("click", async () => {
      exportPdfBtn.disabled = true;
      setFeedback("Preparing your PDF…");
      try {
        const response = await fetch(`${window.DEVNOTES_API_BASE || "/api"}/notes/export.pdf`, { credentials: "include" });
        if (!response.ok) {
          let message = "Could not export PDF";
          try { const data = await response.json(); message = data.message || message; } catch { }
          throw new Error(message);
        }
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `devnotes-backup-${new Date().toISOString().slice(0, 10)}.pdf`;
        document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
        setFeedback("PDF exported successfully", "success");
        DN.toast("DevNotes PDF exported", "check");
      } catch (error) {
        setFeedback(error.message || "Could not export PDF", "error");
        DN.toast(error.message || "Could not export PDF", "circle-alert");
      } finally { exportPdfBtn.disabled = false; }
    });

    importBtn?.addEventListener("click", () => fileInput?.click());
    fileInput?.addEventListener("change", async () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      importBtn.disabled = true;
      setFeedback("Reading backup…");
      try {
        const text = await file.text();
        const isMarkdown = file.name.toLowerCase().endsWith(".md") || file.type === "text/markdown";
        let result;
        if (isMarkdown) {
          const frontmatter = text.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
          const metadata = {};
          if (frontmatter) frontmatter[1].split("\n").forEach(line => { const match = line.match(/^([\w-]+):\s*(.*)$/); if (match) metadata[match[1]] = match[2].trim(); });
          const body = text.replace(/^---\s*\n[\s\S]*?\n---\s*\n?/, "");
          const heading = body.match(/^#\s+(.+)\s*\n?/);
          const title = heading ? heading[1].trim() : file.name.replace(/\.md$/i, "");
          const content = heading ? body.replace(/^#\s+.+\s*\n?/, "").trimStart() : body;
          const created = await DevNotesAPI.notes.create({ title: title.slice(0, 180) || "Imported note", content, type: metadata.type || "Concept", category: metadata.category || "Programming", tags: metadata.tags || "" });
          result = { imported: created.note ? 1 : 0, skipped: 0, failed: 0, errors: [] };
        } else {
          let backup;
          try { backup = JSON.parse(text); } catch { throw new Error("That file is not valid JSON."); }
          if (!Array.isArray(backup?.notes)) throw new Error("This is not a valid DevNotes backup.");
          if (!backup.notes.length) throw new Error("The backup contains no notes.");
          result = await DevNotesAPI.notes.importAll({ notes: backup.notes });
        }
        const parts = [`${result.imported || 0} imported`, `${result.skipped || 0} skipped`];
        if (result.failed) parts.push(`${result.failed} failed`);
        setFeedback(`Import complete • ${parts.join(" • ")}`, result.failed ? "error" : "success");
        DN.toast(`Import complete: ${result.imported || 0} notes added`, result.failed ? "circle-alert" : "check");
        if (result.errors?.length) console.warn("DevNotes import issues:", result.errors);
      } catch (error) {
        setFeedback(error.message || "Could not import backup", "error");
        DN.toast(error.message || "Could not import backup", "circle-alert");
      } finally {
        importBtn.disabled = false;
        fileInput.value = "";
      }
    });
  });
})();
