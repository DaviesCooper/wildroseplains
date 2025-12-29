import { Link, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import './App.css';
import { HomePage } from './pages/HomePage';
import { GalleryPage } from './pages/GalleryPage';
import { DeckBoxesPage } from './pages/DeckBoxesPage';
import { ContactPage } from './pages/ContactPage';

function App() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const isContact = location.pathname === '/contact';

  return (
    <div className="shell">
      {!isHome && (
        <header className="site-header">
          <Link to="/" className="site-logo">
            <img src="/logo.svg" alt="Wildrose Plains crest" />
          </Link>
        </header>
      )}

      <main className="shell__main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/deck_boxes" element={<DeckBoxesPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </main>

      <footer className="site-footer">
        <span>© {new Date().getFullYear()} Wildrose Plains</span>
        {!isContact && (
          <NavLink to="/contact" className="nav-link">
            Contact
          </NavLink>
        )}
      </footer>
    </div>
  );
}

export default App;
