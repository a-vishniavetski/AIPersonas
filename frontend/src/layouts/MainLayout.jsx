// layouts/MainLayout.jsx
import { Outlet } from "react-router-dom";
import Header from "../Header/Header.jsx";
import "./layout.css"

const MainLayout = () => {
    return (
        <div className="main-layout">
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
        </div>
    );
}

export default MainLayout;