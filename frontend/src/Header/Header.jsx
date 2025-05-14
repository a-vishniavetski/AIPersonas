import { Link } from 'react-router-dom';
import './Header.css';

function Header() {
  return (
    <header className="header">
      {<nav className="nav-bar">
        <Link to="/">
          <button className="nav-button">Home</button>
        </Link>
        <Link to="/auth">
          <button className="nav-button">Auth</button>
        </Link>
      </nav>}

    <div className="main-header-text">
        AI Personas
    </div>
    </header>
  );
}

export default Header;
