import { get, post } from "../api.js";
import { saveSession } from "../auth.js";
import { showToast } from "../utils.js";

const colors = [
  "#534ab7",
  "#0f6e56",
  "#c45c26",
  "#185fa5",
  "#993c1d",
  "#e94560",
  "#993556",
];

function initials(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function randomColor() {
  return colors[Math.floor(Math.random() * colors.length)];
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = loginForm.email.value.trim().toLowerCase();
    const password = loginForm.password.value;
    try {
      const users = await get(`/users?email=${encodeURIComponent(email)}`);
      const user = users.find((u) => u.password === password);
      if (!user) {
        showToast("Invalid email or password.", "error");
        return;
      }
      if (!user.isActive) {
        showToast("This account is disabled.", "error");
        return;
      }
      saveSession(user);
      location.href = "index.html";
    } catch {
      showToast("Something went wrong. Try again.", "error");
    }
  });
}

if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = registerForm.name.value.trim();
    const email = registerForm.email.value.trim().toLowerCase();
    const password = registerForm.password.value;
    try {
      const exists = await get(`/users?email=${encodeURIComponent(email)}`);
      if (exists.length) {
        showToast("Email already registered. Please log in.", "error");
        return;
      }
      const body = {
        name,
        email,
        password,
        role: "user",
        isActive: true,
        avatar: initials(name),
        avatarColor: randomColor(),
        createdAt: todayIso(),
      };
      const user = await post("/users", body);
      saveSession(user);
      location.href = "index.html";
    } catch {
      showToast("Could not register. Email may already be in use.", "error");
    }
  });
}
