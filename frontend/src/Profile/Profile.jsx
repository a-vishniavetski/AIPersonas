import React, { useEffect, useState } from 'react';
import { useRef } from 'react';
import {Link, useParams} from "react-router-dom";
import { Input, Button } from '@headlessui/react'
import { motion } from 'framer-motion';
import '../Chat/ChatWindow.css';


const Profile = () => {
    var {persona_name} = useParams();


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
            <p>Welcome to your profile page!</p>
            <Link to={`/ChatWindow/${persona_name}`} className="profile-link">Go to Chat</Link>
        </div>
    </motion.div>
  );
};

export default Profile;
