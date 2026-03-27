import { get, post } from "../api.js";
import { getSession, clearSession } from "../auth.js";
import {
  formatCurrency,
  formatDate,
  daysLeft,
  fundedPercent,
  totalRaised,
  categoryColor,
  showToast,
} from "../utils.js";

const params = new URLSearchParams(location.search);
const id = params.get("id");
// #region agent log
fetch('http://127.0.0.1:7864/ingest/c5a46267-78e4-4b74-9f14-adbb7bb5c334',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'426e6f'},body:JSON.stringify({sessionId:'426e6f',location:'campaign.js:14',message:'campaign id post-fix',data:{raw:params.get('id'),id,isString:typeof id === 'string'},timestamp:Date.now(),hypothesisId:'H-B'})}).catch(()=>{});
// #endregion

let activeCampaign = null;
let refreshFn = null;
let pendingAmount = 0;

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
      location.reload();
    });
  } else {
    el.innerHTML = `
      <a href="index.html">Discover</a>
      <a href="login.html">Log in</a>
      <a href="register.html" class="btn btn-primary btn-sm">Sign up</a>
    `;
  }
}

function backersCount(pledges) {
  return new Set(pledges.map((p) => p.userId)).size;
}

function openPaymentModal(amount) {
  pendingAmount = amount;
  const overlay = document.getElementById("payment-overlay");
  document.getElementById("pay-campaign").textContent = activeCampaign.title;
  document.getElementById("pay-amount").textContent = formatCurrency(amount);
  document.getElementById("pay-actions").hidden = false;
  document.getElementById("pay-processing").hidden = true;
  overlay.classList.add("is-open");
  overlay.setAttribute("aria-hidden", "false");
}

function closePaymentModal() {
  const overlay = document.getElementById("payment-overlay");
  overlay.classList.remove("is-open");
  overlay.setAttribute("aria-hidden", "true");
}

async function confirmPayment() {
  const user = getSession();
  if (!user || !activeCampaign) return;
  document.getElementById("pay-actions").hidden = true;
  document.getElementById("pay-processing").hidden = false;
  await new Promise((r) => setTimeout(r, 1500));
  try {
    await post("/pledges", {
      campaignId: activeCampaign.id,
      userId: user.id,
      amount: pendingAmount,
      createdAt: new Date().toISOString().slice(0, 10),
    });
    showToast("Thanks for backing this campaign!", "success");
    closePaymentModal();
    await refreshFn();
  } catch {
    showToast("Payment failed to record. Try again.", "error");
    document.getElementById("pay-actions").hidden = false;
    document.getElementById("pay-processing").hidden = true;
  }
}

function wirePaymentModal() {
  document.getElementById("pay-confirm").addEventListener("click", confirmPayment);
  document.getElementById("pay-cancel").addEventListener("click", closePaymentModal);
  document.getElementById("payment-overlay").addEventListener("click", (e) => {
    if (e.target.id === "payment-overlay") closePaymentModal();
  });
}

function renderDetail(campaign, creator, pledges, usersById) {
  const raised = totalRaised(pledges);
  const pct = fundedPercent(raised, campaign.goal);
  const left = daysLeft(campaign.deadline);
  const img = campaignImageUrl(campaign);
  const cat = categoryColor(campaign.category);
  const fundedClass = pct >= 100 ? "progress-bar--funded" : "";
  const user = getSession();
  const sorted = [...pledges].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
  const pledgeRows = sorted
    .slice(0, 12)
    .map((p) => {
      const u = usersById[p.userId] || { name: "Backer", avatar: "?", avatarColor: "#5c5c6f" };
      return `
      <li class="pledge-row">
        <span class="pledge-row__user">
          <span class="avatar" style="background:${u.avatarColor}">${u.avatar}</span>
          ${u.name}
        </span>
        <span><strong>${formatCurrency(p.amount)}</strong> · ${formatDate(p.createdAt)}</span>
      </li>
    `;
    })
    .join("");

  const pledgeForm =
    user && campaign.isApproved
      ? `
    <div class="card pledge-box campaign-detail__sidebar">
      <h2 class="sidebar-form-title">Back this project</h2>
      <form id="pledge-form">
        <div class="field">
          <label for="pledge-amount">Pledge amount (USD)</label>
          <input id="pledge-amount" name="amount" type="number" min="1" step="1" required />
        </div>
        <button type="submit" class="btn btn-primary btn-block">Back this campaign</button>
      </form>
    </div>
  `
      : user && !campaign.isApproved
        ? `<div class="card pledge-box campaign-detail__sidebar"><p class="text-muted mb-0">This campaign is not accepting pledges yet.</p></div>`
        : `<div class="card pledge-box campaign-detail__sidebar"><p class="text-muted mb-0"><a href="login.html">Log in</a> to back this campaign.</p></div>`;

  return `
    <div class="page-header campaign-detail__title-block">
      <a href="index.html" class="text-muted">← All campaigns</a>
      <h1>${campaign.title}</h1>
      <span class="badge" style="background:${cat}">${campaign.category}</span>
    </div>
    <div class="campaign-detail__hero ${img ? "" : "campaign-detail__hero--placeholder"}">
      ${img ? `<img src="${img}" alt="" />` : ""}
    </div>
    <div class="campaign-detail__layout">
      <div>
        <div class="card campaign-detail__body">
          <div class="campaign-detail__creator-row">
            <span class="avatar" style="background:${creator.avatarColor}">${creator.avatar}</span>
            <div>
              <div class="text-muted campaign-detail__creator-label">Creator</div>
              <strong>${creator.name}</strong>
            </div>
          </div>
          <p class="campaign-detail__description">${campaign.description}</p>
        </div>
        <h2 class="campaign-detail__section-title">Recent pledges</h2>
        <ul class="pledge-list card">
          ${
            pledgeRows ||
            `<li class="text-muted pledge-list__empty">No pledges yet. Be the first.</li>`
          }
        </ul>
      </div>
      <div>
        <div class="card pledge-box">
          <div class="progress-bar ${fundedClass}"><span class="progress-bar__fill" style="width:${pct}%"></span></div>
          <div class="pledge-stats-row">
            <span>${formatCurrency(raised)}</span>
            <span class="text-muted">of ${formatCurrency(campaign.goal)}</span>
          </div>
          <p class="pledge-pct">${pct}% funded</p>
          <p class="text-muted mb-0">${backersCount(pledges)} backers · ${left < 0 ? "Campaign ended" : `${left} days to go`}</p>
        </div>
        ${pledgeForm}
      </div>
    </div>
  `;
}

async function load() {
  const loading = document.getElementById("loading");
  const content = document.getElementById("content");
  if (!id) {
    loading.textContent = "Missing campaign.";
    return;
  }
  try {
    const campaign = await get(`/campaigns/${id}`);
    activeCampaign = campaign;
    const [creator, pledges, users] = await Promise.all([
      get(`/users/${campaign.creatorId}`),
      get(`/pledges?campaignId=${id}`),
      get("/users"),
    ]);
    const usersById = Object.fromEntries(users.map((u) => [u.id, u]));

    refreshFn = async () => {
      const nextPledges = await get(`/pledges?campaignId=${id}`);
      content.innerHTML = renderDetail(campaign, creator, nextPledges, usersById);
    };

    loading.hidden = true;
    content.hidden = false;
    content.innerHTML = renderDetail(campaign, creator, pledges, usersById);
  } catch {
    loading.textContent = "Campaign not found.";
  }
}

document.getElementById("main").addEventListener("submit", (e) => {
  if (e.target.id !== "pledge-form") return;
  e.preventDefault();
  if (!activeCampaign) return;
  const amount = Number(e.target.amount.value);
  if (!amount || amount < 1) return;
  openPaymentModal(amount);
  e.target.reset();
});

renderNav();
wirePaymentModal();
load();
