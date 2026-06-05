import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const moods = [
  { value: 5, emoji: '🤩', label: 'Amazing' },
  { value: 4, emoji: '😊', label: 'Good' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 2, emoji: '😔', label: 'Low' },
  { value: 1, emoji: '😞', label: 'Rough' },
];

const energyLevels = [
  { value: 3, emoji: '⚡', label: 'High' },
  { value: 2, emoji: '🔋', label: 'Medium' },
  { value: 1, emoji: '😴', label: 'Low' },
];

export default function Mood() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [moodLogs, setMoodLogs] = useState([]);
  const [selectedMood, setSelectedMood] = useState(null);
  const [selectedEnergy, setSelectedEnergy] = useState(null);
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [todayLog, setTodayLog] = useState(null);

  useEffect(() => {
    fetchMoodLogs();
  }, []);

  const fetchMoodLogs = async () => {
    const { data } = await supabase
      .from('mood_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(30);

    setMoodLogs(data || []);

    const today = new Date().toISOString().split('T')[0];
    const todayEntry = (data || []).find(m => m.date === today);
    if (todayEntry) {
      setTodayLog(todayEntry);
      setSelectedMood(todayEntry.mood);
      setSelectedEnergy(todayEntry.energy);
      setNote(todayEntry.note || '');
    }
    setLoading(false);
  };

  const saveMood = async () => {
    if (!selectedMood || !selectedEnergy) return;
    const today = new Date().toISOString().split('T')[0];

    if (todayLog) {
      await supabase
        .from('mood_logs')
        .update({ mood: selectedMood, energy: selectedEnergy, note })
        .eq('id', todayLog.id);
    } else {
      await supabase
        .from('mood_logs')
        .insert([{
          user_id: user.id,
          mood: selectedMood,
          energy: selectedEnergy,
          note,
          date: today,
        }]);
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    fetchMoodLogs();
  };

  const chartData = [...moodLogs]
    .reverse()
    .slice(-14)
    .map(log => ({
      date: new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      mood: log.mood,
      energy: log.energy,
    }));

  const avgMood = moodLogs.length > 0
    ? (moodLogs.reduce((s, m) => s + m.mood, 0) / moodLogs.length).toFixed(1)
    : 0;

  const bestDay = moodLogs.length > 0
    ? moodLogs.reduce((best, m) => m.mood > best.mood ? m : best, moodLogs[0])
    : null;

  return (
    <div style={{ minHeight: '100vh', background: theme.background }}>
      <Navbar />
      <div style={styles.content}>
        <h1 style={{ color: theme.text, fontSize: '2rem', fontWeight: '700', marginBottom: '4px' }}>
          💆 Mood Tracker
        </h1>
        <p style={{ color: theme.textLight, marginBottom: '28px' }}>
          How are you feeling today? Tracking your mood helps you understand yourself better 🌸
        </p>

        {/* Today's Check-in */}
        <div style={{
          ...styles.card,
          background: theme.card,
          border: `1.5px solid ${theme.border}`,
        }}>
          <h2 style={{ color: theme.text, fontSize: '1.1rem', fontWeight: '600', marginBottom: '20px' }}>
            Today's Check-in 🌅
          </h2>

          <p style={{ color: theme.textLight, marginBottom: '12px', fontSize: '0.9rem' }}>
            How's your mood?
          </p>
          <div style={styles.moodRow}>
            {moods.map(m => (
              <div
                key={m.value}
                onClick={() => setSelectedMood(m.value)}
                style={{
                  ...styles.moodBtn,
                  background: selectedMood === m.value ? theme.primary + '22' : theme.accent,
                  border: `2px solid ${selectedMood === m.value ? theme.primary : theme.border}`,
                  transform: selectedMood === m.value ? 'scale(1.1)' : 'scale(1)',
                }}
              >
                <span style={{ fontSize: '1.8rem' }}>{m.emoji}</span>
                <span style={{ fontSize: '0.75rem', color: theme.textLight }}>{m.label}</span>
              </div>
            ))}
          </div>

          <p style={{ color: theme.textLight, marginBottom: '12px', marginTop: '20px', fontSize: '0.9rem' }}>
            Energy level?
          </p>
          <div style={styles.energyRow}>
            {energyLevels.map(e => (
              <div
                key={e.value}
                onClick={() => setSelectedEnergy(e.value)}
                style={{
                  ...styles.energyBtn,
                  background: selectedEnergy === e.value ? theme.primary + '22' : theme.accent,
                  border: `2px solid ${selectedEnergy === e.value ? theme.primary : theme.border}`,
                }}
              >
                <span style={{ fontSize: '1.5rem' }}>{e.emoji}</span>
                <span style={{ fontSize: '0.85rem', color: theme.textLight }}>{e.label}</span>
              </div>
            ))}
          </div>

          <textarea
            style={{
              ...styles.noteInput,
              background: theme.accent,
              border: `2px solid ${theme.border}`,
              color: theme.text,
              marginTop: '16px',
            }}
            placeholder="Any notes about today? (optional) 🌿"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          {saved && (
            <div style={{
              ...styles.savedMsg,
              background: theme.accent,
              color: theme.primary,
            }}>
              ✅ Mood logged successfully!
            </div>
          )}

          <button
            style={{
              ...styles.saveBtn,
              background: theme.gradient,
              opacity: (!selectedMood || !selectedEnergy) ? 0.5 : 1,
            }}
            onClick={saveMood}
            disabled={!selectedMood || !selectedEnergy}
          >
            💾 Save Today's Mood
          </button>
        </div>

        {/* Stats */}
        {moodLogs.length > 0 && (
          <div style={styles.statsRow}>
            <div style={{
              ...styles.statCard,
              background: theme.card,
              border: `1.5px solid ${theme.border}`,
            }}>
              <div style={{ fontSize: '2rem' }}>📊</div>
              <div style={{ color: theme.primary, fontSize: '1.8rem', fontWeight: '700' }}>
                {avgMood}
              </div>
              <div style={{ color: theme.textLight, fontSize: '0.82rem' }}>Avg Mood (30d)</div>
            </div>
            <div style={{
              ...styles.statCard,
              background: theme.card,
              border: `1.5px solid ${theme.border}`,
            }}>
              <div style={{ fontSize: '2rem' }}>📝</div>
              <div style={{ color: theme.primary, fontSize: '1.8rem', fontWeight: '700' }}>
                {moodLogs.length}
              </div>
              <div style={{ color: theme.textLight, fontSize: '0.82rem' }}>Days Tracked</div>
            </div>
            <div style={{
              ...styles.statCard,
              background: theme.card,
              border: `1.5px solid ${theme.border}`,
            }}>
              <div style={{ fontSize: '2rem' }}>🌟</div>
              <div style={{ color: theme.primary, fontSize: '1.8rem', fontWeight: '700' }}>
                {bestDay ? moods.find(m => m.value === bestDay.mood)?.emoji : '–'}
              </div>
              <div style={{ color: theme.textLight, fontSize: '0.82rem' }}>Best Mood</div>
            </div>
          </div>
        )}

        {/* Chart */}
        {chartData.length > 1 && (
          <div style={{
            ...styles.card,
            background: theme.card,
            border: `1.5px solid ${theme.border}`,
          }}>
            <h2 style={{ color: theme.text, fontSize: '1.1rem', fontWeight: '600', marginBottom: '20px' }}>
              📈 Mood & Energy (Last 14 days)
            </h2>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.border} />
                <XAxis dataKey="date" tick={{ fill: theme.textLight, fontSize: 12 }} />
                <YAxis domain={[1, 5]} tick={{ fill: theme.textLight, fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    background: theme.card,
                    border: `1px solid ${theme.border}`,
                    borderRadius: '10px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="mood"
                  stroke={theme.primary}
                  strokeWidth={3}
                  dot={{ fill: theme.primary, r: 5 }}
                  name="Mood"
                />
                <Line
                  type="monotone"
                  dataKey="energy"
                  stroke={theme.secondary}
                  strokeWidth={3}
                  dot={{ fill: theme.secondary, r: 5 }}
                  strokeDasharray="5 5"
                  name="Energy"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Recent Logs */}
        {moodLogs.length > 0 && (
          <div style={{
            ...styles.card,
            background: theme.card,
            border: `1.5px solid ${theme.border}`,
          }}>
            <h2 style={{ color: theme.text, fontSize: '1.1rem', fontWeight: '600', marginBottom: '16px' }}>
              📅 Recent Check-ins
            </h2>
            <div style={styles.logsList}>
              {moodLogs.slice(0, 7).map(log => {
                const moodObj = moods.find(m => m.value === log.mood);
                const energyObj = energyLevels.find(e => e.value === log.energy);
                return (
                  <div key={log.id} style={{
                    ...styles.logItem,
                    background: theme.accent,
                    border: `1px solid ${theme.border}`,
                  }}>
                    <span style={{ fontSize: '1.5rem' }}>{moodObj?.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ color: theme.text, fontWeight: '600', fontSize: '0.9rem' }}>
                        {moodObj?.label} · {energyObj?.emoji} {energyObj?.label} energy
                      </p>
                      {log.note && (
                        <p style={{ color: theme.textLight, fontSize: '0.82rem' }}>{log.note}</p>
                      )}
                    </div>
                    <span style={{ color: theme.textLight, fontSize: '0.8rem' }}>
                      {new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  content: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '32px 16px',
  },
  card: {
    borderRadius: '18px',
    padding: '24px',
    marginBottom: '20px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
  },
  moodRow: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  moodBtn: {
    flex: 1,
    minWidth: '70px',
    padding: '12px 8px',
    borderRadius: '14px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    transition: 'all 0.2s',
  },
  energyRow: {
    display: 'flex',
    gap: '12px',
  },
  energyBtn: {
    flex: 1,
    padding: '12px',
    borderRadius: '14px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.2s',
  },
  noteInput: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '12px',
    fontSize: '0.95rem',
    outline: 'none',
    minHeight: '80px',
    resize: 'vertical',
    boxSizing: 'border-box',
    fontFamily: 'DM Sans, sans-serif',
  },
  savedMsg: {
    padding: '10px',
    borderRadius: '10px',
    textAlign: 'center',
    fontWeight: '600',
    marginTop: '12px',
    fontSize: '0.9rem',
  },
  saveBtn: {
    width: '100%',
    padding: '14px',
    borderRadius: '12px',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '700',
    fontSize: '1rem',
    marginTop: '16px',
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px',
    marginBottom: '20px',
  },
  statCard: {
    borderRadius: '16px',
    padding: '20px',
    textAlign: 'center',
    boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
  },
  logsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  logItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    borderRadius: '12px',
  },
};