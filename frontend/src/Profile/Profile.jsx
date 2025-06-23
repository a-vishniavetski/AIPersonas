import React, { useEffect, useState } from 'react';
import { Link, useParams } from "react-router-dom";
import { Button } from '@headlessui/react';
import { motion } from 'framer-motion';
import './Profile.css';
import { useAuthenticatedFetch } from '../Chat/ChatWindowsApi';

const Profile = () => {
  const { persona_name } = useParams();
  const authFetch = useAuthenticatedFetch();
  
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  
  const token = localStorage.getItem("token");

  // Load profile data from API
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!persona_name) {
        // setError("No persona selected");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Fetch profile image from FastAPI endpoint
        const imageResponse = await authFetch(`https://localhost:8000/api/persona_image/${persona_name}`, {
          method: "GET",
        });
        
        if (imageResponse) {
          const imageBlob = await imageResponse.blob();
          const imageUrl = URL.createObjectURL(imageBlob);
          setProfileImage(imageUrl);
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Profile loading failed:", err);
        // setError("Failed to load profile");
        setLoading(false);
      }
    };

    fetchProfileData();
    
    // Cleanup image URL on unmount
    return () => {
      if (profileImage) {
        URL.revokeObjectURL(profileImage);
      }
    };
  }, [persona_name, authFetch]);

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1 }}
        className="profile-container"
      >
        <div className="profile-content glass-panel glassmorphism-black">
          <div className="profile-loading">
            <div className="spinner"></div>
          </div>
        </div>
      </motion.div>
    );
  }

//   if (error) {
//     return (
//       <motion.div
//         initial={{ opacity: 0 }}
//         animate={{ opacity: 1 }}
//         exit={{ opacity: 0 }}
//         transition={{ duration: 1 }}
//         className="profile-container"
//       >
//         <div className="profile-content glass-panel glassmorphism-black">
//           <div className="profile-error">{error}</div>
//           <Link to="/" className="profile-button">
//             Back to Home
//           </Link>
//         </div>
//       </motion.div>
//     );
//   }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
      className="profile-container"
    >
      <div className="profile-content glass-panel glassmorphism-black">
        <h1 className="profile-title">{persona_name}</h1>
        
        <div className="profile-image">
          <img 
            src={profileImage || `/personas/${persona_name.toLowerCase()}.png`} 
            alt={persona_name}
            onError={(e) => {
              // Fallback to local image if API image fails
              e.target.src = `/personas/${persona_name.toLowerCase()}.png`;
            }}
          />
        </div>

        <div className="profile-actions">
          <Link 
            to={`/ChatWindow/${persona_name}`} 
            className="profile-button primary"
          >
            💬 Start Chat
          </Link>
          <Button 
            className="profile-button"
            onClick={() => window.history.back()}
          >
            Generate Image with AI
          </Button>
          <Button 
            className="profile-button"
            onClick={() => window.history.back()}
          >
            Set Image from Local
          </Button>
          <Button 
            className="profile-button"
            onClick={() => window.history.back()}
          >
            ← Back
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default Profile;