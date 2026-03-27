const BASE = "http://localhost:3000";


async function request(method, path, body) {
  const options = { method, headers: {} };


  if (body !== undefined) {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE}${path}`, options);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || response.statusText);
  }

  if (response.status === 204) return null;

  return response.json();
}

export function get(path) {
  return request("GET", path);
}

export function post(path, body) {
  return request("POST", path, body);
}

export function patch(path, body) {
  return request("PATCH", path, body);
}

export function del(path) {
  return request("DELETE", path);
}
