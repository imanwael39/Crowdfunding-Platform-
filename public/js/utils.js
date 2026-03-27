const toastRootId = "toast-root";

function ensureToastRoot() {
  let el = document.getElementById(toastRootId);
  if (!el) {
    el = document.createElement("div");
    el.id = toastRootId;
    el.className = "toast-root";
    document.body.appendChild(el);
  }
  return el;
}

export function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function daysLeft(deadline) {
  const end = new Date(deadline);
  const now = new Date();
  const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  return diff;
}

export function fundedPercent(raised, goal) {
  if (!goal) return 0;
  return Math.min(100, Math.round((raised / goal) * 100));
}

export function totalRaised(pledges) {
  return pledges.reduce((sum, p) => sum + (p.amount || 0), 0);
}

export function formatCurrency(n) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function showToast(message, type = "info") {
  const root = ensureToastRoot();
  const t = document.createElement("div");
  t.className = `toast toast--${type}`;
  t.textContent = message;
  root.appendChild(t);
  requestAnimationFrame(() => t.classList.add("toast--show"));
  setTimeout(() => {
    t.classList.remove("toast--show");
    setTimeout(() => t.remove(), 300);
  }, 3200);
}

const categoryPalette = {
  technology: "#534ab7",
  environment: "#0f6e56",
  music: "#c45c26",
  education: "#185fa5",
  animals: "#993c1d",
  health: "#e94560",
};

export function categoryColor(cat) {
  return categoryPalette[cat] || "#5c5c6f";
}

export function truncate(str, max = 120) {
  if (!str || str.length <= max) return str || "";
  return str.slice(0, max).trimEnd() + "…";
}
