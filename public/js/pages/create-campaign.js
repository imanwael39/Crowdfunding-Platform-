import { post } from "../api.js";
import { requireAuth } from "../auth.js";
import { fileToBase64, showToast } from "../utils.js";

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
  const form = document.getElementById("campaign-form");
  const fileInput = document.getElementById("image");
  const preview = document.getElementById("img-preview");

  document.getElementById("deadline").min = todayStr();

  fileInput.addEventListener("change", async () => {
    const file = fileInput.files[0];
    if (!file) {
      preview.hidden = true;
      preview.innerHTML = "";
      return;
    }
    const data = await fileToBase64(file);
    preview.hidden = false;
    preview.innerHTML = `<img src="${data}" alt="" />`;
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!isFutureDate(form.deadline.value)) {
      showToast("Deadline must be at least 1 day in the future.", "error");
      return;
    }
    let image = "placeholder";
    const file = fileInput.files[0];
    if (file) {
      try {
        image = await fileToBase64(file);
      } catch {
        showToast("Could not read image.", "error");
        return;
      }
    }
    const body = {
      title: form.title.value.trim(),
      description: form.description.value.trim(),
      category: form.category.value,
      goal: Number(form.goal.value),
      deadline: form.deadline.value,
      isApproved: false,
      image,
      creatorId: user.id,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    try {
      await post("/campaigns", body);
      showToast("Campaign submitted.", "success");
      location.href = "dashboard.html";
    } catch {
      showToast("Could not create campaign.", "error");
    }
  });
}
