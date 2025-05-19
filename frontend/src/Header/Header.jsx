import { Link } from 'react-router-dom';
import './Header.css';
import AuthButton from '../Auth/AuthButton';

function Header() {
  return (
    <header className="header">
      <div className="main-header-text">
          <Link to="/" className="main-header-text">
            AI Personas
          </Link>
      </div>
      {<nav className="nav-bar">
        <Link to="/">
          <button className="nav-button">Home</button>
        </Link>
        <AuthButton />
      </nav>}
    </header>
  );
}

export default Header;
