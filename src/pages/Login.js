import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
  };

  return (
    <div style={styles.container}>
      <div style={styles.blob1} />
      <div style={styles.blob2} />
      <div style={styles.blob3} />
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.iconCircle}>🌿</div>
          <h1 style={styles.title}>Welcome back!</h1>
          <p style={styles.subtitle}>Your goals missed you 🌸 Let's pick up where you left off.</p>
        </div>
        {error && <div style={styles.error}>😕 {error}</div>}
        <div style={styles.form}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Your email ✉️</label>
            <div style={styles.inputWrapper}>
              <input
                style={styles.input}
                type="email"
                placeholder="hello@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Password 🔑</label>
            <div style={styles.inputWrapper}>
              <input
                style={styles.input}
                type={showPassword ? 'text' : 'password'}
                placeholder="your secret password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              />
              <span style={styles.eyeBtn} onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? '🙈' : '👁️'}
              </span>
            </div>
          </div>
          <button
            style={{ ...styles.loginBtn, opacity: loading ? 0.7 : 1 }}
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? '✨ Logging in...' : '🚀 Let\'s Go!'}
          </button>
          <div style={styles.divider}>
            <div style={styles.dividerLine} />
            <span style={styles.dividerText}>or continue with</span>
            <div style={styles.dividerLine} />
          </div>
          <button style={styles.googleBtn} onClick={handleGoogleLogin}>
            <img src="https://www.google.com/favicon.ico" alt="Google" style={{ width: '18px', height: '18px' }} />
            Sign in with Google
          </button>
        </div>
        <p style={styles.registerText}>
          New here?{' '}
          <Link to="/register" style={styles.registerLink}>Create your account 🌱</Link>
        </p>
        <div style={styles.cardFooter}>
          <span>🎯</span><span>💪</span><span>🌟</span><span>✨</span><span>🌿</span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f4f1eb',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: "'Segoe UI', sans-serif",
  },
  blob1: {
    position: 'absolute',
    top: '-100px',
    left: '-100px',
    width: '400px',
    height: '400px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, #b7d9b0 0%, transparent 70%)',
    opacity: 0.6,
  },
  blob2: {
    position: 'absolute',
    bottom: '-80px',
    right: '-80px',
    width: '350px',
    height: '350px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, #a8c5a0 0%, transparent 70%)',
    opacity: 0.5,
  },
  blob3: {
    position: 'absolute',
    top: '50%',
    right: '10%',
    width: '200px',
    height: '200px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, #d4e8c2 0%, transparent 70%)',
    opacity: 0.4,
  },
  card: {
    background: 'rgba(255, 253, 247, 0.95)',
    borderRadius: '28px',
    padding: '48px 44px',
    width: '100%',
    maxWidth: '440px',
    boxShadow: '0 8px 40px rgba(100, 140, 90, 0.15), 0 2px 8px rgba(0,0,0,0.06)',
    position: 'relative',
    zIndex: 1,
    border: '1.5px solid rgba(183, 217, 176, 0.4)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  iconCircle: {
    width: '72px',
    height: '72px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #7cb987, #a8c5a0)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '2rem',
    margin: '0 auto 16px',
    boxShadow: '0 4px 16px rgba(124, 185, 135, 0.35)',
  },
  title: {
    fontSize: '1.9rem',
    color: '#2d5a27',
    fontWeight: '700',
    marginBottom: '8px',
    letterSpacing: '-0.5px',
  },
  subtitle: {
    color: '#7a9e74',
    fontSize: '0.95rem',
    lineHeight: '1.5',
  },
  error: {
    background: '#fff0f0',
    color: '#c0392b',
    padding: '12px 16px',
    borderRadius: '12px',
    marginBottom: '20px',
    fontSize: '0.9rem',
    border: '1px solid #ffd5d5',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#4a7a44',
    marginLeft: '4px',
  },
  inputWrapper: {
    display: 'flex',
    alignItems: 'center',
    background: '#f8f6f0',
    border: '2px solid #d4e8c2',
    borderRadius: '14px',
    padding: '4px 14px',
  },
  input: {
    flex: 1,
    padding: '11px 0',
    border: 'none',
    background: 'transparent',
    fontSize: '0.98rem',
    outline: 'none',
    color: '#333',
  },
  eyeBtn: {
    fontSize: '1.1rem',
    cursor: 'pointer',
    padding: '4px',
    userSelect: 'none',
  },
  loginBtn: {
    padding: '15px',
    borderRadius: '14px',
    background: 'linear-gradient(135deg, #5a9e5f, #7cb987)',
    color: '#fff',
    fontSize: '1.05rem',
    fontWeight: '700',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 4px 18px rgba(90, 158, 95, 0.35)',
    letterSpacing: '0.3px',
    marginTop: '4px',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    background: '#e0ddd5',
  },
  dividerText: {
    color: '#aaa',
    fontSize: '0.82rem',
    whiteSpace: 'nowrap',
  },
  googleBtn: {
    padding: '13px',
    borderRadius: '14px',
    background: '#fff',
    color: '#444',
    fontSize: '0.98rem',
    fontWeight: '600',
    border: '2px solid #e8e5dd',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  registerText: {
    textAlign: 'center',
    marginTop: '24px',
    color: '#888',
    fontSize: '0.95rem',
  },
  registerLink: {
    color: '#5a9e5f',
    fontWeight: '700',
    textDecoration: 'none',
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'center',
    gap: '12px',
    marginTop: '28px',
    fontSize: '1.2rem',
    opacity: 0.5,
  },
};