import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useToast } from '../ToastContext';

export default function TopBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    addToast('Signed out successfully.');
    navigate('/login');
    setMobileMenuOpen(false);
  };

  return (
    <div className="topbar-wrapper">
      <div className="topbar">
        <div className="topbar-left">
          <Link to={user ? '/dashboard' : '/login'} onClick={() => setMobileMenuOpen(false)}>
            <div className="brand">Split<span className="brand-mark">Smart</span></div>
          </Link>
          
          {user && (
            <div className="desktop-nav">
              <Link 
                to="/dashboard" 
                className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
              >
                Dashboard
              </Link>
            </div>
          )}
        </div>

        {user ? (
          <>
            <div className="topbar-right desktop-only">
              <div className="topbar-user">
                <div className="avatar">{user.name.charAt(0).toUpperCase()}</div>
                <span>{user.name}</span>
              </div>
              <button className="btn btn-outline" onClick={handleLogout}>Sign out</button>
            </div>
            
            <button 
              className="mobile-menu-btn" 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {mobileMenuOpen ? (
                  <><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></>
                ) : (
                  <><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></>
                )}
              </svg>
            </button>
          </>
        ) : (
          <div className="topbar-right">
            <Link to="/login" className="btn btn-outline">Sign in</Link>
          </div>
        )}
      </div>

      {user && mobileMenuOpen && (
        <div className="mobile-nav">
          <Link 
            to="/dashboard" 
            className={`mobile-nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Dashboard
          </Link>
          <div className="mobile-nav-user">
            <div className="avatar">{user.name.charAt(0).toUpperCase()}</div>
            <span>{user.name}</span>
          </div>
          <button className="btn btn-outline mobile-logout" onClick={handleLogout}>Sign out</button>
        </div>
      )}
    </div>
  );
}
