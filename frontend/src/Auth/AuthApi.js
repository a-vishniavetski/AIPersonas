// src/Auth/AuthApi.js

const API_BASE = "https://localhost:8000";

export const requestGoogleAuthorization = async () => {
  const response = await fetch(`${API_BASE}/auth/google/authorize`, {
    method: "GET",
    headers: { Accept: "application/json" },
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Failed to get authorization URL: ${response.status}`);
  }

  return response.json();
};

export const handleGoogleCallback = async (queryString) => {
  const response = await fetch(`${API_BASE}/auth/google/callback${queryString}`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Callback failed");
  }

  return response.json();
};

export const testAuthorization = async (token) => {
  const response = await fetch(`${API_BASE}/authenticated-route`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Authorization failed: ${response.status}`);
  }

  return response.json();
};
