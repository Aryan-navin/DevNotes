document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("forgotPasswordForm");
  const success = document.getElementById("forgotSuccess");
  const button = form?.querySelector("button[type='submit']");
  form?.addEventListener("submit", async (event) => {
    event.preventDefault(); event.stopPropagation();
    if (button?.disabled) return;
    const email = String(new FormData(form).get("email") || "").trim();
    if (!email) return;
    if (button) { button.disabled = true; button.dataset.originalText = button.innerHTML; button.textContent = "Sending…"; }
    try {
      await DevNotesAPI.auth.forgotPassword({ email });
      form.hidden = true;
      if (success) success.hidden = false;
    } catch (error) {
      DN.toast(error.message || "Unable to send reset link", "circle-alert");
      if (button) { button.disabled = false; button.innerHTML = button.dataset.originalText || "Send reset link →"; }
    }
  });
});
