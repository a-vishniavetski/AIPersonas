import "./App.css";
import ChatWindow from "./Chat/ChatWindow.jsx";
import Menu from "./Menu/Menu.jsx";
import Auth from "./Auth/Auth.jsx";
import MainLayout from "./layouts/MainLayout.jsx"

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

function App() {
  return (
    <Router>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Menu />} />
          <Route path="/ChatWindow/:persona_name" element={<ChatWindow />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/oauth/callback/*" element={<Auth />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
