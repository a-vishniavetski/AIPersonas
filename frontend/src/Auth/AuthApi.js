// src/Auth/AuthApi.js
import { useAuthenticatedFetch } from "../Chat/ChatWindowsApi";

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

export const testAuthorization = async (authFetch) => {
  try {
    const response = await authFetch(`${API_BASE}/authenticated-route`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      // credentials: "include" is already handled by authFetch
    });

    // If response is null, it means 401 was handled (user redirected)
    if (!response) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Authorization failed: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    // If it's our 401 redirect error, don't re-throw
    if (error.message.includes('Unauthorized - redirected')) {
      return null;
    }
    // Re-throw other errors
    throw error;
  }
};
