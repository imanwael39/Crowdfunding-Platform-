import { get } from "../api.js";
import { getSession, clearSession } from "../auth.js";
import {
  formatCurrency,
  daysLeft,
  fundedPercent,
  totalRaised,
  categoryColor,
  truncate,
} from "../utils.js";

const categories = [
  { slug: "", label: "All" },
  { slug: "technology", label: "Technology" },
  { slug: "environment", label: "Environment" },
  { slug: "music", label: "Music" },
  { slug: "education", label: "Education" },
  { slug: "animals", label: "Animals" },
  { slug: "health", label: "Health" },
];

function campaignImageUrl(c) {
  if (c.image && c.image !== "placeholder" && c.image.startsWith("data:")) {
    return c.image;
  }
  return null;
}

function renderNav() {
  const el = document.getElementById("nav-actions");
  const user = getSession();
  if (user) {
    el.innerHTML = `
      <a href="index.html">Discover</a>
      <a href="dashboard.html">Dashboard</a>
      <a href="create-campaign.html" class="btn btn-primary btn-sm">New campaign</a>
      <div class="site-nav__user">
        <span class="avatar" style="background:${user.avatarColor}">${user.avatar}</span>
        <button type="button" class="btn btn-ghost btn-sm" id="logout-btn">Log out</button>
      </div>
    `;
    el.querySelector("#logout-btn").addEventListener("click", () => {
      clearSession();
      location.href = "index.html";
    });
  } else {
    el.innerHTML = `
      <a href="index.html">Discover</a>
      <a href="login.html">Log in</a>
      <a href="register.html" class="btn btn-primary btn-sm">Sign up</a>
    `;
  }
}

function readFilters() {
  const params = new URLSearchParams(location.search);
  return {
    q: (params.get("q") || "").trim().toLowerCase(),
    category: params.get("category") || "",
  };
}

function writeUrl(q, category) {
  const p = new URLSearchParams();
  if (q) p.set("q", q);
  if (category) p.set("category", category);
  const s = p.toString();
  const page = location.pathname.split("/").pop() || "index.html";
  history.replaceState(null, "", s ? `${page}?${s}` : page);
}

function renderCategoryBar(activeCat) {
  const bar = document.getElementById("category-bar");
  bar.innerHTML = categories
    .map(
      (c) => `
    <a href="#" class="category-pill ${c.slug === activeCat ? "is-active" : ""}" data-cat="${c.slug}">${c.label}</a>
  `
    )
    .join("");
  bar.querySelectorAll("[data-cat]").forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const cat = a.dataset.cat;
      const q = document.getElementById("search-q").value.trim();
      writeUrl(q, cat);
      load();
    });
  });
}

function renderCard(c, userMap, pledgeMap) {
  const pledges = pledgeMap[c.id] || [];
  const raised = totalRaised(pledges);
  const pct = fundedPercent(raised, c.goal);
  const left = daysLeft(c.deadline);
  const creator = userMap[c.creatorId] || { name: "Creator", avatar: "?", avatarColor: "#5c5c6f" };
  const img = campaignImageUrl(c);
  const catColor = categoryColor(c.category);
  const fundedClass = pct >= 100 ? "progress-bar--funded" : "";

  return `
    <a href="campaign.html?id=${c.id}" class="card campaign-card">
      <div class="campaign-card__media ${img ? "" : "campaign-card__media--placeholder"}">
        ${img ? `<img src="${img}" alt="" />` : ""}
      </div>
      <div class="campaign-card__body">
        <span class="badge" style="background:${catColor}">${c.category}</span>
        <h2 class="campaign-card__title">${c.title}</h2>
        <p class="text-muted campaign-card__desc">${truncate(c.description, 100)}</p>
        <div class="progress-bar ${fundedClass}"><span class="progress-bar__fill" style="width:${pct}%"></span></div>
        <div class="campaign-card__stats">
          <span><strong>${formatCurrency(raised)}</strong> raised</span>
          <span>of ${formatCurrency(c.goal)}</span>
        </div>
        <div class="campaign-card__meta">
          <span class="campaign-card__creator">
            <span class="avatar" style="background:${creator.avatarColor}">${creator.avatar}</span>
            ${creator.name}
          </span>
          <span>${left < 0 ? "Ended" : `${left} days left`}</span>
        </div>
      </div>
    </a>
  `;
}

async function load() {
  const { q, category } = readFilters();
  document.getElementById("search-q").value = q;

  // json-server v1 removed the ?q= full-text param; category exact-match still works server-side
  let qs = "isApproved=true&_sort=deadline";
  if (category) qs += `&category=${encodeURIComponent(category)}`;

  const grid = document.getElementById("campaign-grid");
  try {
    let campaigns = await get(`/campaigns?${qs}`);
    if (q) {
      campaigns = campaigns.filter((c) => (c.title || "").toLowerCase().includes(q));
    }
    const users = await get("/users");
    const pledges = await get("/pledges");
    const userMap = Object.fromEntries(users.map((u) => [u.id, u]));
    const pledgeMap = {};
    pledges.forEach((p) => {
      if (!pledgeMap[p.campaignId]) pledgeMap[p.campaignId] = [];
      pledgeMap[p.campaignId].push(p);
    });

    renderCategoryBar(category);

    if (!campaigns.length) {
      grid.innerHTML = `<div class="empty-state card">No campaigns match your filters.</div>`;
      return;
    }
    grid.innerHTML = campaigns.map((c) => renderCard(c, userMap, pledgeMap)).join("");
  } catch {
    grid.innerHTML = `<div class="empty-state card">Could not load campaigns. Is JSON Server running on port 3000?</div>`;
  }
}

function triggerSearch() {
  const q = document.getElementById("search-q").value.trim().toLowerCase();
  const { category } = readFilters();
  writeUrl(q, category);
  load();
}

let searchTimer;
const searchInput = document.getElementById("search-q");
searchInput.addEventListener("input", () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(triggerSearch, 280);
});
searchInput.addEventListener("change", () => {
  clearTimeout(searchTimer);
  triggerSearch();
});

renderNav();
load();
