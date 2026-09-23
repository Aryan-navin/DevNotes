document.addEventListener("DOMContentLoaded", () => {
  const input = DN.qs("#noteSearch");
  const q = new URLSearchParams(location.search).get("q"); if (input && q) input.value = q;
});
