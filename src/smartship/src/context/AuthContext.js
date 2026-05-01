import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

const parseJwt = (token) => {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('smartship_token'));
  const [user, setUser]   = useState(() => {
    const existing = localStorage.getItem('smartship_token');
    if (!existing) return null;
    const parsed = parseJwt(existing);
    if (!parsed)   return null;
    return {
      email: parsed.email || parsed['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'],
      role:  parsed['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'],
    };
  });

  // ── Step 1: validate credentials — returns { requiresOtp: true, email }
  // The caller should save the email and show the OTP input.
  const initiateLogin = useCallback(async (email, password) => {
    const response = await api.post('/gateway/auth/login', { email, password });
    // Backend now returns { requiresOtp: true, email } instead of a token
    return response.data; // { requiresOtp: true, email }
  }, []);

  // ── Step 2: submit OTP — receives JWT and completes login
  const verifyOtp = useCallback(async (email, otp) => {
    const response = await api.post('/gateway/auth/verify-otp', { email, otp });
    const { token: nextToken, role } = response.data;
    localStorage.setItem('smartship_token', nextToken);
    setToken(nextToken);
    setUser({ email, role });
    return { role };
  }, []);

  const register = useCallback(async (email, password, role) => {
    await api.post('/gateway/auth/register', { email, password, role });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('smartship_token');
    setToken(null);
    setUser(null);
  }, []);

  const googleLogin = useCallback(async (idToken) => {
    const response = await api.post('/gateway/auth/google-login', { idToken });
    const { token: nextToken, email, role } = response.data;
    localStorage.setItem('smartship_token', nextToken);
    setToken(nextToken);
    setUser({ email, role });
    return { role };
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token),
      initiateLogin,
      verifyOtp,
      register,
      googleLogin,
      logout,
    }),
    [token, user, initiateLogin, verifyOtp, register, googleLogin, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
};
