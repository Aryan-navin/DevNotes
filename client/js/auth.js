const Auth = {
  user: null,
  loading: null,

  setUser(user) {
    this.user = user || null;
    return this.user;
  },

  get() {
    return this.user;
  },

  async me() {
    try {
      const result = await DevNotesAPI.auth.me();
      return this.setUser(result.user);
    } catch (error) {
      this.setUser(null);
      return null;
    }
  },

  async login(email, password) {
    const result = await DevNotesAPI.auth.login({ email, password });
    return this.setUser(result.user);
  },

  async register(name, email, password) {
    const result = await DevNotesAPI.auth.register({ name, email, password });
    return this.setUser(result.user);
  },

  async logout() {
    try { await DevNotesAPI.auth.logout(); } catch { }
    this.setUser(null);
    location.href = "index.html";
  },

  async require() {
    if (this.user) return this.user;
    if (!this.loading) this.loading = this.me();
    const user = await this.loading;
    this.loading = null;
    if (!user) {
      location.href = "login.html";
      return null;
    }
    return user;
  }
};

function bindPasswordControls() {
  document.querySelectorAll("[data-password-toggle]").forEach(btn => {
    if (btn.dataset.bound === "true") return;
    btn.dataset.bound = "true";
    btn.addEventListener("click", () => {
      const input = document.querySelector(btn.dataset.passwordToggle);
      if (!input) return;
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      btn.setAttribute("aria-label", show ? "Hide password" : "Show password");
      btn.title = show ? "Hide password" : "Show password";
      btn.innerHTML = `<i data-lucide="${show ? "eye-off" : "eye"}"></i>`;
      window.lucide?.createIcons();
    });
  });

  document.querySelectorAll("[data-show-password]").forEach(box => {
    if (box.dataset.bound === "true") return;
    box.dataset.bound = "true";
    box.addEventListener("change", () => {
      const selectors = box.dataset.confirm
        ? [box.dataset.showPassword, box.dataset.confirm]
        : [box.dataset.showPassword];
      selectors.forEach(selector => {
        const input = document.querySelector(selector);
        if (input) input.type = box.checked ? "text" : "password";
      });
      document.querySelectorAll("[data-password-toggle]").forEach(btn => {
        const input = document.querySelector(btn.dataset.passwordToggle);
        if (!input) return;
        btn.setAttribute("aria-label", box.checked ? "Hide password" : "Show password");
        btn.title = box.checked ? "Hide password" : "Show password";
        btn.innerHTML = `<i data-lucide="${box.checked ? "eye-off" : "eye"}"></i>`;
      });
      window.lucide?.createIcons();
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  bindPasswordControls();

  const loginForm = document.querySelector("#loginForm");
  loginForm?.addEventListener("submit", async event => {
    event.preventDefault();
    const button = loginForm.querySelector("button[type='submit']");
    const form = new FormData(loginForm);
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");

    if (button) { button.disabled = true; button.dataset.originalText = button.innerHTML; button.innerHTML = "Signing in…"; }
    try {
      await Auth.login(email, password);
      DN.toast("Signed in successfully");
      setTimeout(() => location.href = "dashboard.html", 450);
    } catch (error) {
      DN.toast(error.message || "Unable to sign in", "circle-alert");
      if (button) { button.disabled = false; button.innerHTML = button.dataset.originalText; window.lucide?.createIcons(); }
    }
  });

  const registerForm = document.querySelector("#registerForm");
  registerForm?.addEventListener("submit", async event => {
    event.preventDefault();
    const form = new FormData(registerForm);
    const name = String(form.get("name") || "").trim();
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");
    const confirm = String(form.get("confirmPassword") || "");
    const button = registerForm.querySelector("button[type='submit']");

    if (password !== confirm) {
      DN.toast("Passwords do not match", "circle-alert");
      return;
    }
    if (password.length < 8) {
      DN.toast("Password must be at least 8 characters", "circle-alert");
      return;
    }

    if (button) { button.disabled = true; button.dataset.originalText = button.innerHTML; button.innerHTML = "Creating workspace…"; }
    try {
      await Auth.register(name, email, password);
      DN.toast("Workspace created successfully");
      setTimeout(() => location.href = "dashboard.html", 450);
    } catch (error) {
      DN.toast(error.message || "Unable to create account", "circle-alert");
      if (button) { button.disabled = false; button.innerHTML = button.dataset.originalText; window.lucide?.createIcons(); }
    }
  });
});
