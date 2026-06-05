import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { themes } from '../context/ThemeContext';

export default function Settings() {
  const { user } = useAuth();
  const { theme, themeName, setTheme, mode, setColorMode } = useTheme();
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    if (data) {
      setFullName(data.full_name || '');
      setUsername(data.username || '');
      setIsPublic(data.is_public || false);
    }
    setLoading(false);
  };

  const saveSettings = async () => {
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName, username, is_public: isPublic, theme: themeName })
      .eq('id', user.id);
    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const colorModes = [
    { value: 'light', emoji: '☀️', label: 'Light' },
    { value: 'dark', emoji: '🌙', label: 'Dark' },
    { value: 'system', emoji: '💻', label: 'System' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: theme.background }}>
      <Navbar />
      <div style={styles.content}>
        <h1 style={{ color: theme.text, fontSize: '2rem', fontWeight: '700', marginBottom: '4px' }}>⚙️ Settings</h1>
        <p style={{ color: theme.textLight, marginBottom: '28px' }}>Make this app truly yours 🌿</p>

        {loading ? <p style={{ color: theme.textLight }}>Loading...</p> : (
          <>
            <div style={{ ...styles.card, background: theme.card, border: `1.5px solid ${theme.border}` }}>
              <h2 style={{ color: theme.text, fontSize: '1.1rem', fontWeight: '600', marginBottom: '20px' }}>👤 Profile</h2>
              <div style={styles.avatarRow}>
                <div style={{ ...styles.avatar, background: theme.gradient }}>
                  {fullName?.[0] || '?'}
                </div>
                <div>
                  <p style={{ color: theme.text, fontWeight: '600', fontSize: '1.1rem' }}>{fullName}</p>
                  <p style={{ color: theme.textLight, fontSize: '0.9rem' }}>{user.email}</p>
                </div>
              </div>
              <div style={styles.formGroup}>
                <label style={{ color: theme.textLight, fontSize: '0.85rem', marginBottom: '6px', display: 'block' }}>Full Name</label>
                <input style={{ ...styles.input, background: theme.accent, border: `2px solid ${theme.border}`, color: theme.text }}
                  type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div style={styles.formGroup}>
                <label style={{ color: theme.textLight, fontSize: '0.85rem', marginBottom: '6px', display: 'block' }}>Username</label>
                <input style={{ ...styles.input, background: theme.accent, border: `2px solid ${theme.border}`, color: theme.text }}
                  type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
              </div>
            </div>

            <div style={{ ...styles.card, background: theme.card, border: `1.5px solid ${theme.border}` }}>
              <h2 style={{ color: theme.text, fontSize: '1.1rem', fontWeight: '600', marginBottom: '20px' }}>🎨 Theme</h2>
              <div style={styles.themesGrid}>
                {Object.entries(themes).map(([key, t]) => (
                  <div key={key} onClick={() => setTheme(key)}
                    style={{
                      ...styles.themeCard,
                      border: themeName === key ? `3px solid ${theme.primary}` : `3px solid ${theme.border}`,
                      background: theme.accent,
                    }}>
                    <div style={{ ...styles.themePreview, background: t.gradient }} />
                    <p style={{ color: theme.text, fontSize: '0.8rem', fontWeight: '600', textAlign: 'center' }}>
                      {t.emoji} {t.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ ...styles.card, background: theme.card, border: `1.5px solid ${theme.border}` }}>
              <h2 style={{ color: theme.text, fontSize: '1.1rem', fontWeight: '600', marginBottom: '20px' }}>🌙 Color Mode</h2>
              <div style={styles.modesRow}>
                {colorModes.map(m => (
                  <div key={m.value} onClick={() => setColorMode(m.value)}
                    style={{
                      ...styles.modeCard,
                      background: mode === m.value ? theme.primary + '22' : theme.accent,
                      border: `2px solid ${mode === m.value ? theme.primary : theme.border}`,
                    }}>
                    <span style={{ fontSize: '1.8rem' }}>{m.emoji}</span>
                    <p style={{ color: theme.text, fontSize: '0.85rem', fontWeight: '600' }}>{m.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ ...styles.card, background: theme.card, border: `1.5px solid ${theme.border}` }}>
              <h2 style={{ color: theme.text, fontSize: '1.1rem', fontWeight: '600', marginBottom: '16px' }}>🔒 Privacy</h2>
              <div style={styles.toggleRow}>
                <div>
                  <p style={{ color: theme.text, fontWeight: '600' }}>Public Profile</p>
                  <p style={{ color: theme.textLight, fontSize: '0.85rem' }}>Let others find and view your profile</p>
                </div>
                <div style={{ ...styles.toggle, background: isPublic ? theme.primary : theme.border }}
                  onClick={() => setIsPublic(!isPublic)}>
                  <div style={{ ...styles.knob, transform: isPublic ? 'translateX(26px)' : 'translateX(2px)' }} />
                </div>
              </div>
              <p style={{ color: theme.textLight, fontSize: '0.85rem', marginTop: '8px' }}>
                {isPublic ? '🌍 Your profile is public' : '🔒 Your profile is private'}
              </p>
            </div>

            {saved && (
              <div style={{ ...styles.savedMsg, background: theme.accent, color: theme.primary }}>
                ✅ Settings saved successfully!
              </div>
            )}

            <button style={{ ...styles.saveBtn, background: theme.gradient }} onClick={saveSettings}>
              💾 Save All Settings
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  content: { maxWidth: '700px', margin: '0 auto', padding: '32px 16px' },
  card: { borderRadius: '18px', padding: '24px', marginBottom: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' },
  avatarRow: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' },
  avatar: { width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '700', fontSize: '1.4rem' },
  formGroup: { marginBottom: '16px' },
  input: { width: '100%', padding: '12px 16px', borderRadius: '12px', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' },
  themesGrid: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' },
  themeCard: { borderRadius: '12px', padding: '10px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '8px' },
  themePreview: { height: '44px', borderRadius: '8px' },
  modesRow: { display: 'flex', gap: '12px' },
  modeCard: { flex: 1, padding: '16px', borderRadius: '14px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' },
  toggleRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  toggle: { width: '54px', height: '28px', borderRadius: '14px', cursor: 'pointer', position: 'relative', transition: 'background 0.3s' },
  knob: { position: 'absolute', top: '3px', width: '22px', height: '22px', borderRadius: '50%', background: '#fff', transition: 'transform 0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' },
  savedMsg: { padding: '12px', borderRadius: '12px', textAlign: 'center', fontWeight: '600', marginBottom: '16px' },
  saveBtn: { width: '100%', padding: '16px', borderRadius: '14px', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '1.05rem', fontWeight: '700' },
};