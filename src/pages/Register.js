import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async () => {
    setError('');
    setLoading(true);
    try {
      await signUp(email, password, username, fullName);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.blob1} />
      <div style={styles.blob2} />
      <div style={styles.blob3} />
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.iconCircle}>🌱</div>
          <h1 style={styles.title}>Start your journey</h1>
          <p style={styles.subtitle}>Create your account and start flourishing 🌿</p>
        </div>
        {error && <div style={styles.error}>😕 {error}</div>}
        <div style={styles.form}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Full Name 🌸</label>
            <div style={styles.inputWrapper}>
              <input style={styles.input} type="text" placeholder="Your full name"
                value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Username 🍃</label>
            <div style={styles.inputWrapper}>
              <input style={styles.input} type="text" placeholder="your_username"
                value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Email ✉️</label>
            <div style={styles.inputWrapper}>
              <input style={styles.input} type="email" placeholder="hello@example.com"
                value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Password 🔑</label>
            <div style={styles.inputWrapper}>
              <input style={styles.input}
                type={showPassword ? 'text' : 'password'}
                placeholder="at least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleRegister()}
              />
              <span style={styles.eyeBtn} onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? '🙈' : '👁️'}
              </span>
            </div>
          </div>
          <button style={{ ...styles.registerBtn, opacity: loading ? 0.7 : 1 }}
            onClick={handleRegister} disabled={loading}>
            {loading ? '✨ Creating account...' : '🌱 Create Account'}
          </button>
        </div>
        <p style={styles.loginText}>
          Already have an account?{' '}
          <Link to="/login" style={styles.loginLink}>Login here 🌿</Link>
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
    position: 'absolute', top: '-100px', left: '-100px',
    width: '400px', height: '400px', borderRadius: '50%',
    background: 'radial-gradient(circle, #b7d9b0 0%, transparent 70%)',
    opacity: 0.6,
  },
  blob2: {
    position: 'absolute', bottom: '-80px', right: '-80px',
    width: '350px', height: '350px', borderRadius: '50%',
    background: 'radial-gradient(circle, #a8c5a0 0%, transparent 70%)',
    opacity: 0.5,
  },
  blob3: {
    position: 'absolute', top: '50%', right: '10%',
    width: '200px', height: '200px', borderRadius: '50%',
    background: 'radial-gradient(circle, #d4e8c2 0%, transparent 70%)',
    opacity: 0.4,
  },
  card: {
    background: 'rgba(255, 253, 247, 0.95)',
    borderRadius: '28px',
    padding: '48px 44px',
    width: '100%',
    maxWidth: '440px',
    boxShadow: '0 8px 40px rgba(100, 140, 90, 0.15)',
    position: 'relative',
    zIndex: 1,
    border: '1.5px solid rgba(183, 217, 176, 0.4)',
  },
  header: { textAlign: 'center', marginBottom: '28px' },
  iconCircle: {
    width: '72px', height: '72px', borderRadius: '50%',
    background: 'linear-gradient(135deg, #7cb987, #a8c5a0)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '2rem', margin: '0 auto 16px',
    boxShadow: '0 4px 16px rgba(124, 185, 135, 0.35)',
  },
  title: { fontSize: '1.9rem', color: '#2d5a27', fontWeight: '700', marginBottom: '8px' },
  subtitle: { color: '#7a9e74', fontSize: '0.95rem' },
  error: {
    background: '#fff0f0', color: '#c0392b',
    padding: '12px 16px', borderRadius: '12px',
    marginBottom: '20px', fontSize: '0.9rem',
    border: '1px solid #ffd5d5',
  },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '0.9rem', fontWeight: '600', color: '#4a7a44', marginLeft: '4px' },
  inputWrapper: {
    display: 'flex', alignItems: 'center',
    background: '#f8f6f0', border: '2px solid #d4e8c2',
    borderRadius: '14px', padding: '4px 14px',
  },
  input: {
    flex: 1, padding: '11px 0', border: 'none',
    background: 'transparent', fontSize: '0.98rem',
    outline: 'none', color: '#333',
  },
  eyeBtn: { fontSize: '1.1rem', cursor: 'pointer', padding: '4px', userSelect: 'none' },
  registerBtn: {
    padding: '15px', borderRadius: '14px',
    background: 'linear-gradient(135deg, #5a9e5f, #7cb987)',
    color: '#fff', fontSize: '1.05rem', fontWeight: '700',
    border: 'none', cursor: 'pointer',
    boxShadow: '0 4px 18px rgba(90, 158, 95, 0.35)',
    marginTop: '4px',
  },
  loginText: { textAlign: 'center', marginTop: '24px', color: '#888', fontSize: '0.95rem' },
  loginLink: { color: '#5a9e5f', fontWeight: '700', textDecoration: 'none' },
  cardFooter: {
    display: 'flex', justifyContent: 'center',
    gap: '12px', marginTop: '28px',
    fontSize: '1.2rem', opacity: 0.5,
  },
};