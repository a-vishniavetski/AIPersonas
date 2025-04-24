import React, { useEffect } from "react";
import {Link, useNavigate} from "react-router-dom"; // Add this import

const Auth = () => {
  const navigate = useNavigate(); // Add this line
  const handleOAuth = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(
        "http://localhost:8000/auth/google/authorize",
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          credentials: "include", // Add this
        },
      );

      if (response.status !== 200) {
        throw new Error(
          "Error while fetching google authorization request: ${response.status}",
        );
      }

      const data = await response.json();
      window.location.href = data.authorization_url;
    } catch (err) {
      console.error("Błąd: ", err);
    }
  };

  const handleAuthTest = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(
        "http://localhost:8000/authenticated-route",
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: "Bearer " + localStorage.getItem("token"),
          },
          credentials: "include", // Add this
        },
      );

      if (response.status !== 200) {
        alert("shit happens");
        throw new Error(
          `Error while fetching google authorization request: ${response.status}`,
        );
      }

      const data = await response.json();
      alert("Authenticated route response: " + JSON.stringify(data));
    } catch (err) {
      console.error("Błąd: ", err);
    }
  };

  useEffect(() => {
    if (window.location.pathname === "/oauth/callback") {
      const query = window.location.search;
      // alert("Received callback with query: " + query);

      fetch("http://localhost:8000/auth/google/callback" + query, {
        method: "GET",
        credentials: "include",
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Network response was not ok");
          }
          return response.json();
        })
        .then((data) => {
          if (data.access_token) {
            localStorage.setItem("token", data.access_token);
            console.log("Token saved to local storage");
            alert("Login successful" + data.access_token);

            navigate("/");
          } else {
            console.log("Token not found in response");
            alert("Login failed");
          }
        })
        .catch(console.error);
    }
  });

  return (
    <div className="loginContainer">
      <div className="loginWindow">
        <div className="loginHeader">Login</div>
        <div className="authorizationSelection">
          <form className="oauthAuthorization" onSubmit={handleOAuth}>
            <button type="submit">Google</button>
          </form>
        </div>
      </div>

      <div className="authTestWindow">
        {localStorage.getItem("token") && (
          <div>
            <div className="authTestHeader">Test</div>
            <form className="authTestForm" onSubmit={handleAuthTest}>
              <button type="submit">Test authorization</button>
            </form>
            <Link to="/">
              <button className="bg-blue-500 text-white p-2 rounded mt-2 mr-2">
                Go to Main Page
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Auth;
