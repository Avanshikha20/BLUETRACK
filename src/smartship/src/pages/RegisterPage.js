import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGoogleLogin } from '@react-oauth/google';
import './LoginPage.css';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, googleLogin } = useAuth();
  const [form, setForm] = useState({ email: '', password: '', role: 'Customer' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form.email, form.password, form.role);
      navigate('/login');
    } catch {
      setError('Registration failed. Check password policy (min 8 chars, uppercase, digit, symbol).');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setError('');
      setLoading(true);
      try {
        const { role } = await googleLogin(tokenResponse.access_token);
        navigate(role === 'Admin' ? '/admin' : '/dashboard');
      } catch (err) {
        const msg = err?.response?.data?.error || 'Google sign-up failed. Please try again.';
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    onError: () => setError('Google sign-up was cancelled or failed.'),
  });

  return (
    <div className="auth-shell">
      <form className="card lp-auth-card" onSubmit={onSubmit}>
        <div className="lp-auth-logo">
          <svg width="36" height="36" viewBox="0 0 30 30" fill="none">
            <rect width="30" height="30" rx="9" fill="#0d9488"/>
            <path d="M8 15l7-7 7 7" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8 20l7-7 7 7" stroke="rgba(255,255,255,0.45)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h1 className="lp-auth-title">Create account</h1>
        <p className="hint" style={{ textAlign: 'center', marginTop: '-0.3rem' }}>
          Join SmartShip today
        </p>

        <div className="lp-field">
          <label className="lp-label">Email address</label>
          <input
            className="input"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            autoFocus
          />
        </div>

        <div className="lp-field">
          <label className="lp-label">Password</label>
          <input
            className="input"
            type="password"
            placeholder="Min 8 chars, uppercase, digit & symbol"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
        </div>

        <div className="lp-field">
          <label className="lp-label">Account Type</label>
          <select
            className="input"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            <option value="Customer">Customer</option>
            <option value="Admin">Admin</option>
          </select>
        </div>

        {error && <p className="error">{error}</p>}

        <button className="button" type="submit" disabled={loading} style={{ marginTop: '0.25rem' }}>
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
              <span className="lp-spinner" /> Creating account…
            </span>
          ) : 'Create Account →'}
        </button>

        <div className="lp-divider">
          <span>or</span>
        </div>

        <button
          type="button"
          className="lp-google-btn"
          onClick={() => handleGoogleSignUp()}
          disabled={loading}
        >
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#4285F4" d="M47.5 24.5c0-1.6-.1-3.2-.4-4.7H24v9h13.1c-.6 3-2.3 5.5-4.9 7.2v6h7.9c4.6-4.3 7.4-10.6 7.4-17.5z"/>
            <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.9-6c-2.2 1.5-5 2.3-8 2.3-6.1 0-11.3-4.1-13.2-9.7H2.7v6.2C6.7 43.1 14.8 48 24 48z"/>
            <path fill="#FBBC05" d="M10.8 28.8A14.7 14.7 0 0 1 10 24c0-1.7.3-3.3.8-4.8v-6.2H2.7A23.9 23.9 0 0 0 0 24c0 3.9.9 7.6 2.7 10.8l8.1-6z"/>
            <path fill="#EA4335" d="M24 9.5c3.4 0 6.5 1.2 8.9 3.5l6.6-6.6C35.9 2.5 30.4 0 24 0 14.8 0 6.7 4.9 2.7 13.2l8.1 6.2C12.7 13.6 17.9 9.5 24 9.5z"/>
          </svg>
          Continue with Google
        </button>

        <p className="hint" style={{ textAlign: 'center' }}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </div>
  );
};

export default RegisterPage;
