import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  requestGoogleAuthorization,
  handleGoogleCallback,
  testAuthorization,
} from "./AuthApi.js"; // Adjust path as needed

const AuthButton = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleOAuth = async () => {
    try {
      const data = await requestGoogleAuthorization();
      window.location.href = data.authorization_url;
    } catch (err) {
      console.error("OAuth error:", err);
    }
  };

  const handleAuthTest = async () => {
    try {
      const token = localStorage.getItem("token");
      const data = await testAuthorization(token);
      alert("Authorized! Response: " + JSON.stringify(data));
    } catch (err) {
      console.error("Authorization test error:", err);
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
  }, [location]);

  return (
    <div className="flex gap-2">
      {localStorage.getItem("token") ? (
        <button onClick={handleAuthTest} className="bg-green-500 text-white px-4 py-2 rounded">
          Test Auth
        </button>
      ) : (
        <button onClick={handleOAuth} className="bg-blue-500 text-white px-4 py-2 rounded">
          Login with Google
        </button>
      )}
    </div>
  );
};

export default AuthButton;
