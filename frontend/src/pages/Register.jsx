import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', { name, email, password });
      setSuccess(true);
      // Small success transition before redirect
      setTimeout(() => {
        login(data.token, data.user);
        navigate('/dashboard');
      }, 800);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-header">
          <div className="brand brand-centered">Split<span className="brand-mark">Smart</span></div>
          <h1 className="auth-title">Create an account</h1>
          <p className="auth-sub" style={{ marginBottom: '1.5rem' }}>
            Join today to track shared expenses and settle up effortlessly.
          </p>
        </div>

        {error && <div className="error-banner" role="alert">{error}</div>}
        {success && <div className="success-banner" role="alert">Account created! Redirecting...</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="name">Full name</label>
            <input 
              id="name" 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required 
              disabled={loading || success}
              placeholder="e.g. Ananya Sharma" 
              autoComplete="name"
            />
          </div>
          <div className="field">
            <label htmlFor="email">Email address</label>
            <input 
              id="email" 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              disabled={loading || success}
              placeholder="you@example.com" 
              autoComplete="email"
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input 
              id="password" 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              disabled={loading || success}
              placeholder="At least 6 characters" 
              autoComplete="new-password"
            />
            {password && password.length < 6 && (
              <p style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: '0.25rem' }}>Password is too short.</p>
            )}
          </div>
          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '0.5rem' }} 
            disabled={loading || success || !name || !email || password.length < 6}
          >
            {loading || success ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <div className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
