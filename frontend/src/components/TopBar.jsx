import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function TopBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="topbar">
      <Link to={user ? '/dashboard' : '/login'} style={{ textDecoration: 'none' }}>
        <div className="brand">Split<span className="brand-mark">Smart</span></div>
      </Link>
      {user && (
        <div className="topbar-right">
          <span>{user.name}</span>
          <button className="btn btn-outline" onClick={handleLogout}>Sign out</button>
        </div>
      )}
    </div>
  );
}
