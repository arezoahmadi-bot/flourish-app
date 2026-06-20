import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Navbar() {
  const { signOut } = useAuth();
  const { theme, isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const navItems = [
    { path: '/', label: 'Dashboard', emoji: '🏡' },
    { path: '/goals', label: 'Goals', emoji: '🎯' },
    { path: '/habits', label: 'Habits', emoji: '🌱' },
    { path: '/mood', label: 'Mood', emoji: '💆' },
    { path: '/timeline', label: 'Timeline', emoji: '🕐' },
    { path: '/pomodoro', label: 'Focus Timer', emoji: '⏱️' },
    { path: '/journal', label: 'Journal', emoji: '📖' },
    { path: '/friends', label: 'Friends', emoji: '👥' },
    { path: '/analytics', label: 'Analytics', emoji: '📊' },
    { path: '/weekly', label: 'Weekly Review', emoji: '📅' },
    { path: '/achievements', label: 'Achievements', emoji: '🏆' },
    { path: '/notifications', label: 'Notifications', emoji: '🔔' },
    { path: '/settings', label: 'Settings', emoji: '⚙️' },
  ];

  const currentPage = navItems.find(i => i.path === location.pathname);

  return (
    <>
      {/* Overlay */}
      {drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 200,
            backdropFilter: 'blur(4px)',
          }}
        />
      )}

      {/* Side Drawer */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: drawerOpen ? 0 : '-300px',
        width: '280px',
        height: '100vh',
        background: isDark ? '#1a1a2e' : theme.card,
        borderRight: `2px solid ${theme.border}`,
        zIndex: 300,
        transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: drawerOpen ? '4px 0 30px rgba(0,0,0,0.2)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
      }}>
        {/* Drawer Header */}
        <div style={{
          padding: '24px 20px 16px',
          borderBottom: `1.5px solid ${theme.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          background: isDark ? '#1a1a2e' : theme.card,
          zIndex: 1,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: theme.gradient,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.4rem',
            }}>
              🌿
            </div>
            <div>
              <p style={{ color: theme.text, fontWeight: '700', fontSize: '1.1rem' }}>Flourish</p>
              <p style={{ color: theme.textLight, fontSize: '0.75rem' }}>Your growth companion</p>
            </div>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            style={{
              background: theme.accent,
              border: 'none',
              borderRadius: '8px',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              fontSize: '1rem',
              color: theme.textLight,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>

        {/* Nav Items */}
        <div style={{ padding: '12px', flex: 1 }}>
          <p style={{
            color: theme.textLight,
            fontSize: '0.7rem',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginLeft: '12px',
            marginBottom: '8px',
            marginTop: '4px',
          }}>
            Navigation
          </p>
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setDrawerOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                borderRadius: '12px',
                marginBottom: '2px',
                textDecoration: 'none',
                background: location.pathname === item.path ? theme.accent : 'transparent',
                border: location.pathname === item.path
                  ? `1.5px solid ${theme.border}`
                  : '1.5px solid transparent',
                transition: 'all 0.2s',
              }}
            >
              <span style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: location.pathname === item.path ? theme.gradient : theme.accent,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem',
                flexShrink: 0,
              }}>
                {item.emoji}
              </span>
              <span style={{
                color: location.pathname === item.path ? theme.primary : theme.text,
                fontWeight: location.pathname === item.path ? '700' : '400',
                fontSize: '0.9rem',
              }}>
                {item.label}
              </span>
              {location.pathname === item.path && (
                <span style={{ marginLeft: 'auto', color: theme.primary, fontSize: '0.8rem' }}>●</span>
              )}
            </Link>
          ))}
        </div>

        {/* Drawer Footer */}
        <div style={{
          padding: '12px',
          borderTop: `1.5px solid ${theme.border}`,
          position: 'sticky',
          bottom: 0,
          background: isDark ? '#1a1a2e' : theme.card,
        }}>
          <button
            onClick={handleSignOut}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '12px',
              background: '#fff0f0',
              color: '#c62828',
              border: '1.5px solid #ffd5d5',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            🚪 Sign Out
          </button>
        </div>
      </div>

      {/* Top Navbar */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 20px',
        background: isDark ? 'rgba(26,26,46,0.98)' : theme.card,
        borderBottom: `1.5px solid ${theme.border}`,
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backdropFilter: 'blur(10px)',
        boxShadow: `0 2px 20px ${theme.primary}11`,
      }}>
        {/* Hamburger Button */}
        <button
          onClick={() => setDrawerOpen(true)}
          style={{
            background: theme.accent,
            border: `1.5px solid ${theme.border}`,
            borderRadius: '10px',
            padding: '8px 10px',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            alignItems: 'center',
          }}
        >
          <div style={{ width: '18px', height: '2px', background: theme.primary, borderRadius: '2px' }} />
          <div style={{ width: '14px', height: '2px', background: theme.primary, borderRadius: '2px' }} />
          <div style={{ width: '18px', height: '2px', background: theme.primary, borderRadius: '2px' }} />
        </button>

        {/* Logo */}
        <Link to="/" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          textDecoration: 'none',
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: theme.gradient,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.2rem',
          }}>
            🌿
          </div>
          <span style={{
            color: theme.text,
            fontWeight: '700',
            fontSize: '1.1rem',
          }}>
            Flourish
          </span>
        </Link>

        {/* Current Page Badge */}
        <div style={{
          background: theme.accent,
          border: `1.5px solid ${theme.border}`,
          borderRadius: '10px',
          padding: '7px 12px',
          color: theme.primary,
          fontSize: '0.82rem',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}>
          <span>{currentPage?.emoji || '🌿'}</span>
          <span style={{ display: window.innerWidth < 400 ? 'none' : 'inline' }}>
            {currentPage?.label || 'Flourish'}
          </span>
        </div>
      </nav>
    </>
  );
}