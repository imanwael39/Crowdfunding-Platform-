const SESSION_KEY = "fundly_session";

function basePath() {
  return /\/admin(\/|$)/.test(location.pathname) ? "../" : "";
}

export function saveSession(user) {
  const { password: _omitted, ...safeUser } = user;
  localStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));
}

export function getSession() {
  const storedValue = localStorage.getItem(SESSION_KEY);
  if (!storedValue) return null;
  try {
    return JSON.parse(storedValue);
  } catch {
    clearSession();
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function isLoggedIn() {
  return !!getSession();
}

export async function requireAuth() {
  const user = getSession();

  if (!user) {
    window.location.href = `${basePath()}login.html`;
    return null;
  }

  try {
    const serverResponse = await fetch(`http://localhost:3000/users/${user.id}`);
    if (!serverResponse.ok) throw new Error();
    const freshUser = await serverResponse.json();

    if (!freshUser.isActive) {
      clearSession();
      window.location.href = `${basePath()}login.html`;
      return null;
    }
  } catch {
  }

  return user;
}

export async function requireRole(role) {
  const user = await requireAuth();
  if (!user) return null;

  if (user.role !== role) {
    window.location.href = `${basePath()}index.html`;
    return null;
  }

  return user;
}
