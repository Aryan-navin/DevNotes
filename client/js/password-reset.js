document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token") || "";
  // Keep the one-time token out of browser history immediately after reading it.
  if (token) window.history.replaceState({}, document.title, window.location.pathname);
  const form = document.getElementById("resetPasswordForm");
  const success = document.getElementById("resetSuccess");
  const password = document.getElementById("newPassword");
  const confirm = document.getElementById("confirmPassword");
  const showBoth = document.getElementById("showBoth");
  const submit = form?.querySelector("button[type='submit']");

  const setVisibility = (visible) => {
    [password, confirm].forEach((input) => { if (input) input.type = visible ? "text" : "password"; });
    document.querySelectorAll("[data-password-toggle]").forEach((button) => {
      const input = document.querySelector(button.dataset.passwordToggle);
      if (!input) return;
      button.setAttribute("aria-label", visible ? "Hide password" : "Show password");
      button.title = visible ? "Hide password" : "Show password";
      button.querySelector(".eye-icon")?.replaceChildren(document.createTextNode(visible ? "◉" : "◉"));
    });
  };

  showBoth?.addEventListener("change", () => setVisibility(showBoth.checked));
  document.querySelectorAll("[data-password-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const input = document.querySelector(button.dataset.passwordToggle);
      if (!input) return;
      const nextVisible = input.type === "password";
      input.type = nextVisible ? "text" : "password";
      button.setAttribute("aria-label", nextVisible ? "Hide password" : "Show password");
      button.title = nextVisible ? "Hide password" : "Show password";
      if (showBoth) {
        showBoth.checked = password?.type === "text" && confirm?.type === "text";
      }
    });
  });

  if (!token) {
    if (form) form.hidden = true;
    DN.toast("This password reset link is missing or invalid", "circle-alert");
    return;
  }

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (submit?.disabled) return;

    const nextPassword = String(password?.value || "");
    const confirmPassword = String(confirm?.value || "");
    if (nextPassword.length < 8) { DN.toast("Password must be at least 8 characters", "circle-alert"); password?.focus(); return; }
    if (nextPassword !== confirmPassword) { DN.toast("Passwords do not match", "circle-alert"); confirm?.focus(); return; }

    if (submit) { submit.disabled = true; submit.textContent = "Updating…"; }
    try {
      await DevNotesAPI.auth.resetPassword({ token, password: nextPassword });
      if (form) form.hidden = true;
      if (success) success.hidden = false;
      // Remove the sensitive token from browser history before redirecting.
      window.history.replaceState({}, document.title, window.location.pathname);
      const loginOrigin = String(window.DEVNOTES_LOGIN_ORIGIN || window.DEVNOTES_CLIENT_ORIGIN || window.location.origin).replace(/\/$/, "");
      setTimeout(() => { window.location.replace(`${loginOrigin}/login.html?reset=success`); }, 1200);
    } catch (error) {
      DN.toast(error.message || "Unable to reset password", "circle-alert");
      if (submit) { submit.disabled = false; submit.textContent = "Reset password →"; }
    }
  });
});
