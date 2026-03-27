import { get, patch, del } from "../api.js";
import { requireAuth, clearSession } from "../auth.js";
import { formatCurrency, formatDate, totalRaised, showToast } from "../utils.js";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function isFutureDate(val) {
  const d = new Date(val);
  if (isNaN(d.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d > today;
}

const user = await requireAuth();
if (user) {
  const nav = document.getElementById("nav-actions");
  const adminLink =
    user.role === "admin" ? `<a href="admin/index.html">Admin</a>` : "";
  nav.innerHTML = `
    <a href="index.html">Discover</a>
    <a href="create-campaign.html" class="btn btn-primary btn-sm">New campaign</a>
    ${adminLink}
    <div class="site-nav__user">
      <span class="avatar" style="background:${user.avatarColor}">${user.avatar}</span>
      <button type="button" class="btn btn-ghost btn-sm" id="logout-btn">Log out</button>
    </div>
  `;
  nav.querySelector("#logout-btn").addEventListener("click", () => {
    clearSession();
    location.href = "index.html";
  });

  const panelCampaigns = document.getElementById("panel-campaigns");
  const panelPledges = document.getElementById("panel-pledges");
  const editOverlay = document.getElementById("edit-overlay");
  const editForm = document.getElementById("edit-form");
  const editCampaignId = document.getElementById("edit-campaign-id");

  function campaignStatus(c) {
    if (c.isApproved) return { label: "Approved", cls: "status-badge--approved" };
    if (c.rejected) return { label: "Rejected", cls: "status-badge--rejected" };
    return { label: "Pending", cls: "status-badge--pending" };
  }

  async function loadCampaigns() {
    const [campaigns, pledges] = await Promise.all([
      get(`/campaigns?creatorId=${user.id}`),
      get("/pledges"),
    ]);
    const byCampaign = {};
    pledges.forEach((p) => {
      if (!byCampaign[p.campaignId]) byCampaign[p.campaignId] = [];
      byCampaign[p.campaignId].push(p);
    });
    if (!campaigns.length) {
      panelCampaigns.innerHTML = `<div class="empty-state card">You have not created any campaigns yet.</div>`;
      return;
    }
    panelCampaigns.innerHTML = campaigns
      .map((c) => {
        const raised = totalRaised(byCampaign[c.id] || []);
        const st = campaignStatus(c);
        return `
      <div class="card dashboard-campaign" data-id="${c.id}">
        <div>
          <h2 class="dashboard-campaign__title">
            <a href="campaign.html?id=${c.id}">${c.title}</a>
          </h2>
          <span class="status-badge ${st.cls}">${st.label}</span>
          <p class="text-muted dashboard-campaign__raised">
            ${formatCurrency(raised)} of ${formatCurrency(c.goal)} raised
          </p>
        </div>
        <div class="dashboard-campaign__actions">
          <button type="button" class="btn btn-outline btn-sm" data-edit="${c.id}">Edit</button>
          <button type="button" class="btn btn-danger btn-sm" data-del="${c.id}">Delete</button>
        </div>
      </div>
    `;
      })
      .join("");

    panelCampaigns.querySelectorAll("[data-edit]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const cid = btn.dataset.edit;
        const c = campaigns.find((x) => x.id === cid);
        // #region agent log
        fetch('http://127.0.0.1:7864/ingest/c5a46267-78e4-4b74-9f14-adbb7bb5c334',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'426e6f'},body:JSON.stringify({sessionId:'426e6f',location:'dashboard.js:77',message:'edit cid post-fix',data:{raw:btn.dataset.edit,cid,found:!!c,storedIdType:campaigns.length?typeof campaigns[0].id:'N/A'},timestamp:Date.now(),hypothesisId:'H-C'})}).catch(()=>{});
        // #endregion
        if (!c) return;
        editCampaignId.value = c.id;
        editForm.deadline.value = c.deadline;
        editForm.deadline.min = todayStr();
        editForm.description.value = c.description;
        editOverlay.classList.add("is-open");
        editOverlay.setAttribute("aria-hidden", "false");
      });
    });

    panelCampaigns.querySelectorAll("[data-del]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const cid = btn.dataset.del;
        // #region agent log
        fetch('http://127.0.0.1:7864/ingest/c5a46267-78e4-4b74-9f14-adbb7bb5c334',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'426e6f'},body:JSON.stringify({sessionId:'426e6f',location:'dashboard.js:89',message:'delete cid post-fix',data:{raw:btn.dataset.del,cid,isString:typeof cid==='string'},timestamp:Date.now(),hypothesisId:'H-D'})}).catch(()=>{});
        // #endregion
        if (!confirm("Delete this campaign? This cannot be undone.")) return;
        try {
          await del(`/campaigns/${cid}`);
          const orphans = await get(`/pledges?campaignId=${cid}`);
          await Promise.all(orphans.map((p) => del(`/pledges/${p.id}`)));
          showToast("Campaign deleted.", "success");
          loadCampaigns();
        } catch {
          showToast("Could not delete.", "error");
        }
      });
    });
  }

  async function loadPledges() {
    const pledges = await get(`/pledges?userId=${user.id}`);
    if (!pledges.length) {
      panelPledges.innerHTML = `<div class="empty-state card">You have not pledged to any campaigns yet.</div>`;
      return;
    }
    const campaigns = await get("/campaigns");
    const byId = Object.fromEntries(campaigns.map((c) => [c.id, c]));
    panelPledges.innerHTML = `
      <ul class="pledge-list card pledge-list--dashboard">
        ${pledges
          .map((p) => {
            const c = byId[p.campaignId];
            const title = c ? c.title : "Campaign";
            return `
          <li class="pledge-row">
            <span><a href="campaign.html?id=${p.campaignId}">${title}</a></span>
            <span><strong>${formatCurrency(p.amount)}</strong> · ${formatDate(p.createdAt)}</span>
          </li>
        `;
          })
          .join("")}
      </ul>
    `;
  }

  document.getElementById("dash-tabs").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-tab]");
    if (!btn) return;
    document.querySelectorAll("#dash-tabs button").forEach((b) => b.classList.remove("is-active"));
    btn.classList.add("is-active");
    const tab = btn.dataset.tab;
    panelCampaigns.hidden = tab !== "campaigns";
    panelPledges.hidden = tab !== "pledges";
  });

  document.getElementById("edit-cancel").addEventListener("click", () => {
    editOverlay.classList.remove("is-open");
    editOverlay.setAttribute("aria-hidden", "true");
  });
  editOverlay.addEventListener("click", (e) => {
    if (e.target === editOverlay) {
      editOverlay.classList.remove("is-open");
      editOverlay.setAttribute("aria-hidden", "true");
    }
  });

  editForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!isFutureDate(editForm.deadline.value)) {
      showToast("Deadline must be at least 1 day in the future.", "error");
      return;
    }
    const idVal = editCampaignId.value;
    try {
      await patch(`/campaigns/${idVal}`, {
        deadline: editForm.deadline.value,
        description: editForm.description.value.trim(),
      });
      showToast("Campaign updated.", "success");
      editOverlay.classList.remove("is-open");
      editOverlay.setAttribute("aria-hidden", "true");
      loadCampaigns();
    } catch {
      showToast("Update failed.", "error");
    }
  });

  loadCampaigns();
  loadPledges();
}
