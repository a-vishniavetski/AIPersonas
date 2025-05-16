// layouts/MainLayout.jsx
import { Outlet } from "react-router-dom";
import Header from "../Header/Header.jsx";
import "./layout.css"
import { motion } from 'framer-motion';

const MainLayout = () => {
    return (
        <motion.div
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         exit={{ opacity: 0 }}
         transition={{ duration: 1 }}
         className="main-layout">
            {/* <header className="main-header">
                AI Terminal
            </header> */}
            <Header />
            <main className="main-content">
                <Outlet /> {/* Page-specific content goes here */}
            </main>

            <footer className="main-footer">
                2025 © Twórcy Czatbotów
            </footer>
        </motion.div>
    );
}

export default MainLayout;