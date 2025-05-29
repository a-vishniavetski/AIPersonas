export function downloadPDFConversation(conversationId, token) {
    return fetch("https://localhost:8000/api/pdf_conversation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        conversation_id: conversationId
      }),
      credentials: "include",
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.blob();
    })
    .then(blob => {
      // Create a blob URL for the PDF
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary anchor element to trigger the download
      const a = document.createElement('a');
      a.href = url;
      a.download = `conversation.pdf`; // The actual filename will come from the server
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    });
  }

// Utility to handle logout and redirect
export const handleUnauthorized = (navigate) => {
  // Remove token from localStorage
  localStorage.removeItem('token');
  // You might also want to clear other auth-related data
  localStorage.removeItem('userId');
  localStorage.removeItem('personaId');
  // Add any other cleanup you need
  
  // Redirect to homepage/login
  navigate('/'); // or navigate('/login') depending on your routing
};

// Enhanced fetch wrapper that automatically handles 401s
export const authenticatedFetch = async (url, options = {}, navigate) => {
  const token = localStorage.getItem('token');
  
  // Add auth header if token exists
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });
  
  // Handle 401 Unauthorized
  if (response.status === 401) {
    handleUnauthorized(navigate);
    throw new Error('Unauthorized - redirected to login');
  }
  
  return response;
};

// Alternative: Custom hook for authenticated requests
import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';

export const useAuthenticatedFetch = () => {
  const navigate = useNavigate();
  
  const authFetch = useCallback(async (url, options = {}) => {
    try {
      return await authenticatedFetch(url, options, navigate);
    } catch (error) {
      if (error.message.includes('Unauthorized')) {
        // Error already handled by authenticatedFetch
        return null;
      }
      throw error;
    }
  }, [navigate]);
  
  return authFetch;
};