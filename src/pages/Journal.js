import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const prompts = [
  "What are you grateful for today? 🌸",
  "What was the highlight of your day? ✨",
  "What did you learn today? 📚",
  "What made you smile today? 😊",
  "What would you do differently? 🌿",
  "What are you looking forward to tomorrow? 🌅",
  "How did you take care of yourself today? 💆",
  "What challenged you today? 💪",
];

export default function Journal() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [entries, setEntries] = useState([]);
  const [todayEntry, setTodayEntry] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [emoji, setEmoji] = useState('📝');
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('write');
  const [prompt] = useState(prompts[Math.floor(Math.random() * prompts.length)]);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split('T')[0];
  const emojis = ['📝', '🌸', '💭', '🌿', '✨', '💪', '🎯', '🌅', '😊', '🧘'];

  useEffect(() => { fetchEntries(); }, []);

  const fetchEntries = async () => {
    const { data } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });
    setEntries(data || []);
    const todayLog = (data || []).find(e => e.date === today);
    if (todayLog) {
      setTodayEntry(todayLog);
      setTitle(todayLog.title || '');
      setContent(todayLog.content || '');
      setEmoji(todayLog.emoji || '📝');
    }
    setLoading(false);
  };

  const saveEntry = async () => {
    if (!content.trim()) return;
    if (todayEntry) {
      await supabase
        .from('journal_entries')
        .update({ title, content, emoji })
        .eq('id', todayEntry.id);
    } else {
      await supabase
        .from('journal_entries')
        .insert([{ user_id: user.id, title, content, emoji, date: today }]);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    fetchEntries();
  };

  const deleteEntry = async (id) => {
    await supabase.from('journal_entries').delete().eq('id', id);
    setEntries(entries.filter(e => e.id !== id));
  };

  const dateHeading = new Date().toLocaleDateString('en-US', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div style={{ minHeight: '100vh', background: theme.background }}>
      <Navbar />
      <div style={styles.content}>
        <h1 style={{ color: theme.text, fontSize: '2rem', fontWeight: '700', marginBottom: '4px' }}>
          📖 My Journal
        </h1>
        <p style={{ color: theme.textLight, marginBottom: '24px' }}>
          Your private space to reflect and grow 🌿
        </p>

        {/* Tabs */}
        <div style={{
          ...styles.tabRow,
          background: theme.card,
          border: `1.5px solid ${theme.border}`,
        }}>
          {[
            { key: 'write', label: "Today's Entry", emoji: '✍️' },
            { key: 'entries', label: 'Past Entries', emoji: '📚' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                ...styles.tabBtn,
                background: activeTab === tab.key ? theme.gradient : 'transparent',
                color: activeTab === tab.key ? '#fff' : theme.textLight,
                fontWeight: activeTab === tab.key ? '700' : '400',
              }}
            >
              {tab.emoji} {tab.label}
            </button>
          ))}
        </div>

        {/* Write Tab */}
        {activeTab === 'write' && (
          <div style={{
            ...styles.card,
            background: theme.card,
            border: `1.5px solid ${theme.border}`,
          }}>
            <p style={{ color: theme.textLight, fontSize: '0.85rem', marginBottom: '16px' }}>
              📅 {dateHeading}
            </p>

            {/* Prompt */}
            <div style={{
              padding: '14px 18px',
              borderRadius: '12px',
              background: theme.accent,
              border: `1px solid ${theme.border}`,
              marginBottom: '20px',
            }}>
              <p style={{ color: theme.primary, fontSize: '0.9rem', fontStyle: 'italic', fontWeight: '500' }}>
                💭 Today's prompt: {prompt}
              </p>
            </div>

            {/* Emoji Picker */}
            <p style={{ color: theme.textLight, fontSize: '0.85rem', marginBottom: '8px' }}>
              Pick an emoji for today:
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
              {emojis.map(e => (
                <span
                  key={e}
                  onClick={() => setEmoji(e)}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: emoji === e ? theme.primary : theme.accent,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '1.3rem',
                  }}
                >
                  {e}
                </span>
              ))}
            </div>

            <input
              style={{
                ...styles.input,
                background: theme.accent,
                border: `2px solid ${theme.border}`,
                color: theme.text,
                marginBottom: '12px',
              }}
              type="text"
              placeholder="Entry title (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <textarea
              style={{
                ...styles.textarea,
                background: theme.accent,
                border: `2px solid ${theme.border}`,
                color: theme.text,
              }}
              placeholder="Write about your day... 🌿"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />

            {saved && (
              <div style={{
                padding: '10px',
                borderRadius: '10px',
                background: theme.accent,
                color: theme.primary,
                textAlign: 'center',
                fontWeight: '600',
                marginTop: '12px',
              }}>
                ✅ Journal entry saved!
              </div>
            )}

            <button
              style={{
                ...styles.saveBtn,
                background: theme.gradient,
                opacity: !content.trim() ? 0.5 : 1,
                marginTop: '16px',
              }}
              onClick={saveEntry}
              disabled={!content.trim()}
            >
              💾 Save Entry
            </button>
          </div>
        )}

        {/* Past Entries Tab */}
        {activeTab === 'entries' && (
          <div>
            {loading ? (
              <p style={{ color: theme.textLight }}>Loading entries...</p>
            ) : entries.length === 0 ? (
              <div style={{
                ...styles.card,
                background: theme.card,
                border: `1.5px solid ${theme.border}`,
                textAlign: 'center',
                padding: '60px',
              }}>
                <p style={{ fontSize: '3rem' }}>📖</p>
                <p style={{ color: theme.textLight, marginTop: '12px' }}>
                  No journal entries yet! Start writing today.
                </p>
              </div>
            ) : (
              <div style={styles.entriesList}>
                {entries.map(entry => {
                  const dateObj = new Date(entry.date + 'T00:00:00');
                  const isToday = entry.date === today;
                  const dateLabel = isToday ? 'Today' :
                    dateObj.toLocaleDateString('en-US', {
                      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                    });
                  return (
                    <div key={entry.id} style={{
                      ...styles.entryCard,
                      background: theme.card,
                      border: `1.5px solid ${theme.border}`,
                      borderLeft: `4px solid ${theme.primary}`,
                    }}>
                      <div style={styles.entryHeader}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '14px',
                            background: theme.accent,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.6rem',
                          }}>
                            {entry.emoji}
                          </div>
                          <div>
                            <p style={{ color: theme.text, fontWeight: '700', fontSize: '0.95rem' }}>
                              {entry.title || dateLabel}
                            </p>
                            <p style={{ color: theme.textLight, fontSize: '0.78rem' }}>
                              📅 {dateLabel}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => deleteEntry(entry.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: theme.textLight,
                            fontSize: '1rem',
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                      <p style={{
                        color: theme.text,
                        fontSize: '0.9rem',
                        lineHeight: '1.6',
                        marginTop: '12px',
                        whiteSpace: 'pre-wrap',
                      }}>
                        {entry.content.length > 200
                          ? entry.content.substring(0, 200) + '...'
                          : entry.content}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  content: { maxWidth: '800px', margin: '0 auto', padding: '32px 16px' },
  tabRow: { display: 'flex', borderRadius: '14px', padding: '6px', gap: '4px', marginBottom: '20px' },
  tabBtn: { flex: 1, padding: '10px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '0.9rem', transition: 'all 0.2s' },
  card: { borderRadius: '18px', padding: '24px', marginBottom: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' },
  input: { width: '100%', padding: '12px 16px', borderRadius: '12px', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '16px', borderRadius: '12px', fontSize: '0.95rem', outline: 'none', minHeight: '200px', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'DM Sans, sans-serif', lineHeight: '1.6' },
  saveBtn: { width: '100%', padding: '14px', borderRadius: '12px', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '1rem' },
  entriesList: { display: 'flex', flexDirection: 'column', gap: '16px' },
  entryCard: { borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' },
  entryHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
};