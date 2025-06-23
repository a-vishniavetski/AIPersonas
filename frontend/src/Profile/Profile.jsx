import React, { useEffect, useState, useRef } from 'react';
import { Link, useParams } from "react-router-dom";
import { Button } from '@headlessui/react';
import { motion } from 'framer-motion';
import './Profile.css';
import { useAuthenticatedFetch } from '../Chat/ChatWindowsApi';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const { persona_name } = useParams();
  const authFetch = useAuthenticatedFetch();
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  
  const token = localStorage.getItem("token");

  // Load profile data from API
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!persona_name) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setLoading(false);
      } catch (err) {
        console.error("Profile loading failed:", err);
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

  // Handle file selection
  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  // Handle file upload
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Reset previous states
    setUploadError(null);
    setUploadSuccess(false);

    // Validate file type on frontend
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file');
      return;
    }

    if (file.type !== 'image/png') {
      setUploadError('Only PNG images are allowed');
      return;
    }

    // Validate file size (8MB limit)
    if (file.size > 8 * 1024 * 1024) {
      setUploadError('File size too large (max 8MB)');
      return;
    }

    try {
      setUploading(true);
      
      // Create FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('persona_name', persona_name.toLowerCase());

      // Make the upload request
      // const response = await fetch(`https://localhost:8000/api/upload_persona_image/${persona_name.toLowerCase()}`, {
        const response = await fetch(`https://localhost:8000/api/upload_persona_image/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type header - let browser set it with boundary for FormData
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.log('Full error response:', errorData);
        throw new Error(errorData.detail || 'Upload failed');
      }

      const result = await response.json();
      console.log('Upload successful:', result);
      
      setUploadSuccess(true);
      setUploadError(null);
      
      // Optional: Refresh the profile image by adding a timestamp to bypass cache
      const imageElement = document.querySelector('.profile-image img');
      if (imageElement) {
        const originalSrc = imageElement.src.split('?')[0]; // Remove existing query params
        imageElement.src = `${originalSrc}?t=${Date.now()}`;
      }
      
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Refresh the page, because of weird cache problems
      window.location.reload();
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

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
            src={`https://localhost:8000/static/personas/${persona_name.toLowerCase()}.png`}
            alt={persona_name}
            onError={(e) => {
              // Fallback to test_image if API image fails
              e.target.src = "https://localhost:8000/static/personas/test_image.png";
            }}
          />
        </div>

        {/* Upload Status Messages */}
        {uploadSuccess && (
          <div className="upload-message success">
            ✅ Image uploaded successfully!
          </div>
        )}
        
        {uploadError && (
          <div className="upload-message error">
            ❌ {uploadError}
          </div>
        )}

        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept="image/png"
          style={{ display: 'none' }}
        />

        <div className="profile-actions">
          <Link
            to={`/ChatWindow/${persona_name}`}
            className="profile-button primary"
          >
            💬 Start Chat
          </Link>
          
          <Button
            className="profile-button"
            onClick={() => navigate(`/ChatWindow/${persona_name}`)}
          >
            Generate Image with AI
          </Button>
          
          <Button
            className="profile-button"
            onClick={handleFileSelect}
            disabled={uploading}
          >
            {uploading ? '⏳ Uploading...' : '📁 Set Image from Local'}
          </Button>
          
        </div>
      </div>
    </motion.div>
  );
};

export default Profile;