import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  requestGoogleAuthorization,
  handleGoogleCallback,
  testAuthorization,
} from "./AuthApi.js"; // Adjust path as needed
import { useAuthenticatedFetch } from "../Chat/ChatWindowsApi.js";

const AuthButton = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const authFetch = useAuthenticatedFetch();

  const handleOAuth = async () => {
    try {
      const data = await requestGoogleAuthorization();
      window.location.href = data.authorization_url;
    } catch (err) {
      console.error("OAuth error:", err);
    }
  };

    const handleTestAuth = async () => {
    try {
      const result = await testAuthorization(authFetch);
      if (result) {
        console.log('Authorization successful:', result);
      }
      // If result is null, user was redirected due to 401
    } catch (error) {
      console.error('Authorization test failed:', error);
    }
  };

  useEffect(() => {
    if (location.pathname === "/oauth/callback") {
      const query = window.location.search;

      handleGoogleCallback(query)
        .then((data) => {
          if (data.access_token) {
            localStorage.setItem("token", data.access_token);
            alert("Login successful");
            navigate("/");
          } else {
            alert("Login failed");
          }
        })
        .catch(console.error);
    }
  }, [location, navigate]);

  return (
    <div className="flex gap-2">
      {localStorage.getItem("token") ? (
        <button onClick={handleTestAuth}>
          Auth
        </button>
      ) : (
        <button onClick={handleOAuth}>
          Login (Google)
        </button>
      )}
    </div>
  );
};

export default AuthButton;
