// layouts/MainLayout.jsx
import { Outlet } from "react-router-dom";
import "./layout.css"

const MainLayout = () => {
    return (
        <div className="main-layout">
            <header className="main-header">
                AI Terminal
            </header>

            <main className="main-content">
                <Outlet /> {/* Page-specific content goes here */}
            </main>

            <footer className="main-footer">
                Student AI Persona Project – 2025
            </footer>
        </div>
    );
}

export default MainLayout;