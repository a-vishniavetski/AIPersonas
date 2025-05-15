import { Link } from 'react-router-dom';
import './Header.css';
import AuthButton from '../Auth/AuthButton';

function Header() {
  return (
    <header className="header">
      {<nav className="nav-bar">
        <Link to="/">
          <button className="nav-button">Home</button>
        </Link>
        <AuthButton />
      </nav>}
    <div className="main-header-text">
        AI Personas
    </div>
    </header>
  );
}

export default Header;
