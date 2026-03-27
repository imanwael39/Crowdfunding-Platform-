import { get, patch, del } from "../js/api.js";
import { requireRole, clearSession } from "../js/auth.js";
import { formatCurrency, formatDate, showToast } from "../js/utils.js";

const admin = await requireRole("admin");
if (admin) {
  const nav = document.getElementById("admin-nav");
  const secUsers = document.getElementById("section-users");
  const secCampaigns = document.getElementById("section-campaigns");
  const secPledges = document.getElementById("section-pledges");

  function showSection(name) {
    nav.querySelectorAll("button").forEach((b) => {
      b.classList.toggle("is-active", b.dataset.section === name);
    });
    secUsers.hidden = name !== "users";
    secCampaigns.hidden = name !== "campaigns";
    secPledges.hidden = name !== "pledges";
  }

  nav.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-section]");
    if (!btn) return;
    showSection(btn.dataset.section);
  });

  function campaignStatus(c) {
    if (c.isApproved) return "Approved";
    if (c.rejected) return "Rejected";
    return "Pending";
  }

  async function loadUsers() {
    const users = await get("/users");
    secUsers.innerHTML = `
      <h1 class="admin-page-title">Users</h1>
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${users
              .map((u) => {
                const active = u.isActive;
                return `
              <tr data-user-id="${u.id}">
                <td>${u.name}</td>
                <td>${u.email}</td>
                <td>${u.role}</td>
                <td>${active ? "Active" : "Banned"}</td>
                <td>${formatDate(u.createdAt)}</td>
                <td class="actions">
                  ${
                    u.id === admin.id
                      ? "—"
                      : active
                        ? `<button type="button" class="btn btn-danger btn-sm" data-ban="${u.id}">Ban</button>`
                        : `<button type="button" class="btn btn-success btn-sm" data-unban="${u.id}">Unban</button>`
                  }
                </td>
              </tr>
            `;
              })
              .join("")}
          </tbody>
        </table>
      </div>
      <p class="text-muted mt-lg">
        <button type="button" class="btn btn-ghost btn-sm" id="admin-logout">Log out</button>
      </p>
    `;

    secUsers.querySelectorAll("[data-ban]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.ban;
        // #region agent log
        fetch('http://127.0.0.1:7864/ingest/c5a46267-78e4-4b74-9f14-adbb7bb5c334',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'426e6f'},body:JSON.stringify({sessionId:'426e6f',location:'admin.js:83',message:'ban id coercion',data:{raw:btn.dataset.ban,coerced:id,isNaN:isNaN(id)},timestamp:Date.now(),hypothesisId:'H-A'})}).catch(()=>{});
        // #endregion
        try {
          await patch(`/users/${id}`, { isActive: false });
          showToast("User banned.", "success");
          loadUsers();
        } catch {
          showToast("Could not update user.", "error");
        }
      });
    });
    secUsers.querySelectorAll("[data-unban]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.unban;
        // #region agent log
        fetch('http://127.0.0.1:7864/ingest/c5a46267-78e4-4b74-9f14-adbb7bb5c334',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'426e6f'},body:JSON.stringify({sessionId:'426e6f',location:'admin.js:95',message:'unban id coercion',data:{raw:btn.dataset.unban,coerced:id,isNaN:isNaN(id)},timestamp:Date.now(),hypothesisId:'H-A'})}).catch(()=>{});
        // #endregion
        try {
          await patch(`/users/${id}`, { isActive: true });
          showToast("User reinstated.", "success");
          loadUsers();
        } catch {
          showToast("Could not update user.", "error");
        }
      });
    });
    secUsers.querySelector("#admin-logout").addEventListener("click", () => {
      clearSession();
      location.href = "../index.html";
    });
  }

  async function loadCampaigns() {
    const [campaigns, users] = await Promise.all([get("/campaigns"), get("/users")]);
    const byUser = Object.fromEntries(users.map((u) => [u.id, u]));
    secCampaigns.innerHTML = `
      <h1 class="admin-page-title">Campaigns</h1>
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Creator</th>
              <th>Goal</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${campaigns
              .map((c) => {
                const cr = byUser[c.creatorId];
                const creatorName = cr ? cr.name : "—";
                return `
              <tr>
                <td>${c.title}</td>
                <td>${creatorName}</td>
                <td>${formatCurrency(c.goal)}</td>
                <td>${campaignStatus(c)}</td>
                <td class="actions">
                  <button type="button" class="btn btn-success btn-sm" data-approve="${c.id}">Approve</button>
                  <button type="button" class="btn btn-outline btn-sm" data-reject="${c.id}">Reject</button>
                  <button type="button" class="btn btn-danger btn-sm" data-del-c="${c.id}">Delete</button>
                </td>
              </tr>
            `;
              })
              .join("")}
          </tbody>
        </table>
      </div>
    `;

    secCampaigns.querySelectorAll("[data-approve]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.approve;
        try {
          await patch(`/campaigns/${id}`, { isApproved: true, rejected: false });
          showToast("Campaign approved.", "success");
          await loadCampaigns();
          showSection("campaigns");
        } catch {
          showToast("Update failed.", "error");
        }
      });
    });
    secCampaigns.querySelectorAll("[data-reject]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.reject;
        try {
          await patch(`/campaigns/${id}`, { isApproved: false, rejected: true });
          showToast("Campaign rejected.", "success");
          await loadCampaigns();
          showSection("campaigns");
        } catch {
          showToast("Update failed.", "error");
        }
      });
    });
    secCampaigns.querySelectorAll("[data-del-c]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.delC;
        // #region agent log
        fetch('http://127.0.0.1:7864/ingest/c5a46267-78e4-4b74-9f14-adbb7bb5c334',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'426e6f'},body:JSON.stringify({sessionId:'426e6f',location:'admin.js:178',message:'delete-campaign id coercion',data:{raw:btn.dataset.delC,coerced:id,isNaN:isNaN(id)},timestamp:Date.now(),hypothesisId:'H-A'})}).catch(()=>{});
        // #endregion
        if (!confirm("Delete this campaign?")) return;
        try {
          await del(`/campaigns/${id}`);
          const orphans = await get(`/pledges?campaignId=${id}`);
          await Promise.all(orphans.map((p) => del(`/pledges/${p.id}`)));
          showToast("Campaign deleted.", "success");
          loadCampaigns();
        } catch {
          showToast("Delete failed.", "error");
        }
      });
    });
  }

  async function loadPledges() {
    const [pledges, campaigns, users] = await Promise.all([
      get("/pledges"),
      get("/campaigns"),
      get("/users"),
    ]);
    const campById = Object.fromEntries(campaigns.map((c) => [c.id, c]));
    const userById = Object.fromEntries(users.map((u) => [u.id, u]));
    secPledges.innerHTML = `
      <h1 class="admin-page-title">Pledges</h1>
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Campaign</th>
              <th>User</th>
              <th>Amount</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            ${pledges
              .map((p) => {
                const c = campById[p.campaignId];
                const u = userById[p.userId];
                return `
              <tr>
                <td>${c ? c.title : "—"}</td>
                <td>${u ? u.name : "—"}</td>
                <td>${formatCurrency(p.amount)}</td>
                <td>${formatDate(p.createdAt)}</td>
              </tr>
            `;
              })
              .join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  loadUsers();
  loadCampaigns();
  loadPledges();
}
