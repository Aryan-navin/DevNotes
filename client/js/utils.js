window.DN = {
  qs: (s, p = document) => p.querySelector(s),
  qsa: (s, p = document) => [...p.querySelectorAll(s)],
  escape: (s = "") => String(s).replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m])),
  toast: (message, icon = "check-circle-2") => {
    let wrap = document.querySelector(".toast-wrap");
    if (!wrap) { wrap = document.createElement("div"); wrap.className = "toast-wrap"; document.body.appendChild(wrap) }
    const el = document.createElement("div"); el.className = "toast"; el.innerHTML = `<i data-lucide="${icon}"></i><span>${DN.escape(message)}</span>`;
    wrap.appendChild(el); window.lucide?.createIcons(); setTimeout(() => el.remove(), 2600);
  },
  initials: (name = "Developer") => name.trim().split(/\s+/).slice(0, 2).map(x => x[0]).join("").toUpperCase(),
  uid: () => crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  date: (v) => new Date(v).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
};
