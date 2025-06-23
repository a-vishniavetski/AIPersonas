import React, { useState } from 'react';
import { usePollinationsImage } from '@pollinations/react';
import "./GenerateImageModal.css";

function GenerateImageModal({ onClose, persona_name }) {
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // Use Pollinations hook for image generation
  const imageUrl = usePollinationsImage(
    description && isGenerating ? description : null, 
    { 
      width: 512, 
      height: 512, 
      seed: Math.floor(Math.random() * 1000000) // Random seed for variety
    }
  );

  // Update generated image URL when imageUrl changes
  React.useEffect(() => {
    if (imageUrl && isGenerating) {
      setGeneratedImageUrl(imageUrl);
      setIsGenerating(false);
    }
  }, [imageUrl, isGenerating]);

  const handleGenerate = async () => {
    if (!description.trim()) {
      alert('Please enter a description for the image');
      return;
    }
    
    setSaveSuccess(false);
    setSaveError(null);
    setGeneratedImageUrl(null);
    setIsGenerating(true);
  };

  const handleSaveImage = async () => {
    if (!generatedImageUrl) {
      setSaveError('No image to save');
      return;
    }
  
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
  
    try {
      // Create a proxy URL to bypass CORS (using a public CORS proxy)
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(generatedImageUrl)}`;
      
      // Fetch the image through the proxy
      const response = await fetch(proxyUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch generated image');
      }
      
      const blob = await response.blob();
      
      // Create a File object from the blob
      const file = new File([blob], `${persona_name?.toLowerCase() || 'persona'}.png`, {
        type: 'image/png'
      });
  
      // Create FormData for upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('persona_name', persona_name?.toLowerCase() || 'default');
  
      // Get token for authentication
      const token = localStorage.getItem('token');
  
      // Upload using your existing API endpoint
      const uploadResponse = await fetch('https://localhost:8000/api/upload_persona_image/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
  
      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.detail || 'Upload failed');
      }
  
      const result = await uploadResponse.json();
      console.log('Upload successful:', result);
      
      setSaveSuccess(true);
      setSaveError(null);
      
      // Close modal after successful save
      setTimeout(() => {
        onClose();
        // Refresh the page to show new image
        window.location.reload();
      }, 1500);
  
    } catch (error) {
      console.error('Save error:', error);
      setSaveError(error.message || 'Failed to save image');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Generate AI Image</h2>
        <div className="form-container">
          <div className="form-group">
            <label htmlFor="image-description">Image Description</label>
            <textarea
              id="image-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              placeholder="Describe the image you want to generate (e.g., 'A friendly robot with blue eyes wearing a casual outfit')"
              rows="4"
            />
          </div>

          {/* Generated Image Preview */}
          {generatedImageUrl && (
            <div className="generated-image-preview">
              <h3>Generated Image:</h3>
              <img 
                src={generatedImageUrl} 
                alt="Generated AI Image" 
                style={{ 
                  maxWidth: '100%', 
                  height: 'auto', 
                  border: '2px solid #ccc', 
                  borderRadius: '8px',
                  marginBottom: '10px'
                }} 
              />
            </div>
          )}

          {/* Status Messages */}
          {saveSuccess && (
            <div className="upload-message success">
              ✅ Image saved successfully! Closing modal...
            </div>
          )}
          
          {saveError && (
            <div className="upload-message error">
              ❌ {saveError}
            </div>
          )}

          <div className="form-actions">
            {!generatedImageUrl ? (
              <button 
                type="button" 
                onClick={handleGenerate}
                disabled={isGenerating || !description.trim()}
              >
                {isGenerating ? '🎨 Generating...' : '🎨 Generate Image'}
              </button>
            ) : (
              <>
                <button 
                  type="button" 
                  onClick={handleSaveImage}
                  disabled={isSaving}
                  className="save-button"
                >
                  {isSaving ? '💾 Saving...' : '💾 Save Image'}
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setGeneratedImageUrl(null);
                    setIsGenerating(false);
                    setSaveSuccess(false);
                    setSaveError(null);
                  }}
                  className="regenerate-button"
                >
                  🔄 Generate New
                </button>
              </>
            )}
            <button type="button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GenerateImageModal;