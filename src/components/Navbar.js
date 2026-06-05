import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Navbar() {
  const { signOut } = useAuth();
  const { theme, isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const navItems = [
    { path: '/', label: 'Dashboard', emoji: '🏡' },
    { path: '/goals', label: 'Goals', emoji: '🎯' },
    { path: '/habits', label: 'Habits', emoji: '🌱' },
    { path: '/mood', label: 'Mood', emoji: '💆' },
    { path: '/pomodoro', label: 'Focus', emoji: '⏱️' },
    { path: '/friends', label: 'Friends', emoji: '👥' },
    { path: '/analytics', label: 'Analytics', emoji: '📊' },
    { path: '/settings', label: 'Settings', emoji: '⚙️' },
  ];

  return (
    <nav style={{
      ...styles.nav,
      background: isDark ? 'rgba(26,26,46,0.98)' : theme.card,
      borderBottom: `2px solid ${theme.border}`,
      boxShadow: `0 2px 20px ${theme.primary}22`,
    }}>
      <Link to="/" style={styles.logo}>
        <div style={{
          ...styles.logoIcon,
          background: theme.gradient,
        }}>
          🌿
        </div>
        <span style={{ color: theme.text, fontWeight: '700', fontSize: '1.1rem' }}>
          Flourish
        </span>
      </Link>

      <div style={styles.links}>
        {navItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            style={{
              ...styles.link,
              color: location.pathname === item.path ? theme.primary : theme.textLight,
              background: location.pathname === item.path ? theme.accent : 'transparent',
              fontWeight: location.pathname === item.path ? '600' : '400',
            }}
          >
            <span>{item.emoji}</span>
            <span>{item.label}</span>
          </Link>
        ))}
        <button
          onClick={handleSignOut}
          style={{
            ...styles.logoutBtn,
            background: theme.accent,
            color: theme.primary,
          }}
        >
          🚪 Logout
        </button>
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 32px',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    backdropFilter: 'blur(10px)',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    textDecoration: 'none',
  },
  logoIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.2rem',
  },
  links: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    flexWrap: 'wrap',
  },
  link: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    padding: '7px 12px',
    borderRadius: '10px',
    fontSize: '0.85rem',
    textDecoration: 'none',
    transition: 'all 0.2s',
  },
  logoutBtn: {
    padding: '7px 14px',
    borderRadius: '10px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: '600',
    marginLeft: '8px',
  },
};