import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGoogleLogin } from '@react-oauth/google';
import './LoginPage.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const { initiateLogin, verifyOtp, googleLogin, user } = useAuth();

  // step: 'credentials' | 'otp'
  const [step, setStep]         = useState('credentials');
  const [form, setForm]         = useState({ email: '', password: '' });
  const [otp, setOtp]           = useState(['', '', '', '', '', '']);
  const [pendingEmail, setPendingEmail] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent]     = useState(false);

  const otpRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

  // ── Step 1 — submit credentials ───────────────────────────────────────────
  const handleCredentials = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await initiateLogin(form.email, form.password);
      setPendingEmail(form.email);
      setStep('otp');
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data;
      setError(typeof msg === 'string' ? msg : 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  // ── Google OAuth ──────────────────────────────────────────────────────────
  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setError('');
      setLoading(true);
      try {
        // Exchange the access token for the id_token via Google's userinfo
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const profile = await res.json();
        // Send the access token as idToken — backend validates via Google
        const { role } = await googleLogin(tokenResponse.access_token);
        navigate(role === 'Admin' ? '/admin' : '/dashboard');
      } catch (err) {
        const msg = err?.response?.data?.error || 'Google sign-in failed. Please try again.';
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    onError: () => setError('Google sign-in was cancelled or failed.'),
  });

  // ── Step 2 — submit OTP ──────────────────────────────────────────────────
  const handleOtp = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) { setError('Please enter all 6 digits.'); return; }
    setError('');
    setLoading(true);
    try {
      const { role } = await verifyOtp(pendingEmail, code);
      navigate(role === 'Admin' ? '/admin' : '/dashboard');
    } catch (err) {
      const msg = err?.response?.data?.error || 'Incorrect code. Please try again.';
      setError(msg);
      setOtp(['', '', '', '', '', '']);
      otpRefs[0].current?.focus();
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResend = async () => {
    setResending(true);
    setError('');
    try {
      await initiateLogin(form.email, form.password);
      setResent(true);
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => setResent(false), 4000);
    } catch {
      setError('Could not resend code. Please go back and try again.');
    } finally {
      setResending(false);
    }
  };

  // OTP digit input handling
  const handleOtpDigit = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < 5) otpRefs[index + 1].current?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0)
      otpRefs[index - 1].current?.focus();
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length > 0) {
      const next = pasted.split('').concat(Array(6).fill('')).slice(0, 6);
      setOtp(next);
      otpRefs[Math.min(pasted.length, 5)].current?.focus();
      e.preventDefault();
    }
  };

  // ── RENDER: credentials step ─────────────────────────────────────────────
  if (step === 'credentials') {
    return (
      <div className="auth-shell">
        <form className="card lp-auth-card" onSubmit={handleCredentials}>
          <div className="lp-auth-logo">
            <svg width="36" height="36" viewBox="0 0 30 30" fill="none">
              <rect width="30" height="30" rx="9" fill="#0d9488"/>
              <path d="M8 15l7-7 7 7" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 20l7-7 7 7" stroke="rgba(255,255,255,0.45)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="lp-auth-title">Welcome back</h1>
          <p className="hint" style={{ textAlign: 'center', marginTop: '-0.3rem' }}>
            Sign in to your SmartShip account
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
              placeholder="Your password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          {error && <p className="error">{error}</p>}

          <button className="button" type="submit" disabled={loading} style={{ marginTop: '0.25rem' }}>
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                <span className="lp-spinner" /> Sending code…
              </span>
            ) : 'Continue →'}
          </button>

          <div className="lp-auth-info">
            🔒 A 6-digit verification code will be sent to your email after this step.
          </div>

          <div className="lp-divider">
            <span>or</span>
          </div>

          <button
            type="button"
            className="lp-google-btn"
            onClick={() => handleGoogleLogin()}
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
            No account? <Link to="/register">Create one</Link>
          </p>
        </form>
      </div>
    );
  }

  // ── RENDER: OTP step ─────────────────────────────────────────────────────
  return (
    <div className="auth-shell">
      <div className="card lp-auth-card">
        <div className="lp-auth-logo">
          <span style={{ fontSize: '2rem' }}>✉️</span>
        </div>
        <h1 className="lp-auth-title">Check your email</h1>
        <p className="hint" style={{ textAlign: 'center', marginTop: '-0.3rem' }}>
          We sent a 6-digit code to <strong>{pendingEmail}</strong>
        </p>

        <form onSubmit={handleOtp}>
          {/* OTP digit boxes */}
          <div className="lp-otp-row" onPaste={handleOtpPaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={otpRefs[i]}
                className="lp-otp-box"
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpDigit(i, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                autoFocus={i === 0}
              />
            ))}
          </div>

          {error && <p className="error" style={{ textAlign: 'center' }}>{error}</p>}
          {resent && <p style={{ color: '#0d9488', textAlign: 'center', fontSize: '0.88rem' }}>✅ New code sent!</p>}

          <button
            className="button"
            type="submit"
            disabled={loading || otp.join('').length < 6}
            style={{ width: '100%', marginTop: '1rem' }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                <span className="lp-spinner" /> Verifying…
              </span>
            ) : '✅ Verify & Sign In'}
          </button>
        </form>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <button
            onClick={() => { setStep('credentials'); setError(''); setOtp(['','','','','','']); }}
            style={{ background: 'none', border: 'none', color: '#0f766e', cursor: 'pointer', fontSize: '0.88rem', padding: 0 }}
          >
            ← Change email
          </button>
          <button
            onClick={handleResend}
            disabled={resending}
            style={{ background: 'none', border: 'none', color: '#0f766e', cursor: 'pointer', fontSize: '0.88rem', padding: 0 }}
          >
            {resending ? 'Resending…' : 'Resend code'}
          </button>
        </div>

        <p className="hint" style={{ textAlign: 'center', fontSize: '0.78rem' }}>
          Code expires in 10 minutes · Check spam if not received
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
