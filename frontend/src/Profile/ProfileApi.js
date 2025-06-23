import { useAuthenticatedFetch } from '../Chat/ChatWindowsApi';

// Get persona profile data
export const getPersonaProfile = async (personaName, token) => {
  try {
    const response = await fetch(`https://localhost:8000/api/persona_profile/${personaName}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching persona profile:", error);
    throw error;
  }
};

// Get persona image from FastAPI endpoint
export const getPersonaImage = async (personaName, token) => {
  try {
    const response = await fetch(`https://localhost:8000/api/persona_image/${personaName}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.blob();
  } catch (error) {
    console.error("Error fetching persona image:", error);
    throw error;
  }
};

// Update persona rating
export const updatePersonaRating = async (personaName, rating, token) => {
  try {
    const response = await fetch(`https://localhost:8000/api/persona_rating`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        persona_name: personaName,
        rating: rating
      }),
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating persona rating:", error);
    throw error;
  }
};

// Get persona conversation statistics
export const getPersonaStats = async (personaName, token) => {
  try {
    const response = await fetch(`https://localhost:8000/api/persona_stats/${personaName}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching persona stats:", error);
    throw error;
  }
};

// Custom hook for profile operations
export const useProfileApi = () => {
  const authFetch = useAuthenticatedFetch();
  const token = localStorage.getItem("token");

  const fetchProfile = async (personaName) => {
    const response = await authFetch(`https://localhost:8000/api/persona_profile/${personaName}`, {
      method: "GET",
    });
    return response ? await response.json() : null;
  };

  const fetchImage = async (personaName) => {
    const response = await authFetch(`https://localhost:8000/api/persona_image/${personaName}`, {
      method: "GET",
    });
    return response ? await response.blob() : null;
  };

  const updateRating = async (personaName, rating) => {
    const response = await authFetch(`https://localhost:8000/api/persona_rating`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        persona_name: personaName,
        rating: rating
      }),
    });
    return response ? await response.json() : null;
  };

  const fetchStats = async (personaName) => {
    const response = await authFetch(`https://localhost:8000/api/persona_stats/${personaName}`, {
      method: "GET",
    });
    return response ? await response.json() : null;
  };

  return {
    fetchProfile,
    fetchImage,
    updateRating,
    fetchStats
  };
};