import React from 'react';
import AuthButton from '../AuthButton';
import './LoginModal.css';

export default function LoginModal({ isOpen, onClose }) {
  if (!isOpen) return null;
  
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3 className="modal-title">You need to log in</h3>
        
        <div>
          <AuthButton />
        </div>
        
        <div className="modal-button-container">
          <button 
            onClick={onClose}
            className="button"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}