const BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!BASE_URL) {
  throw new Error("VITE_API_BASE_URL is not defined");
}

export async function registerUser(username, password) {
  return fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });
}

export async function getCurrentUser() {
  return fetch(`${BASE_URL}/auth/me`, {
    method: "GET",
    credentials: "include",
  });
}

export async function loginUser(username, password) {
  return fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });
}

export async function logoutUser() {
  return fetch(`${BASE_URL}/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
}
