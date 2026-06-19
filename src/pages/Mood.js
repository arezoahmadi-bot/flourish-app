import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const moods = [
  { value: 5, emoji: '🤩', label: 'Amazing', color: '#00c853' },
  { value: 4, emoji: '😊', label: 'Good', color: '#7cb987' },
  { value: 3, emoji: '😐', label: 'Okay', color: '#ffab00' },
  { value: 2, emoji: '😔', label: 'Low', color: '#d4845a' },
  { value: 1, emoji: '😞', label: 'Rough', color: '#f50057' },
];

const energyLevels = [
  { value: 3, emoji: '⚡', label: 'High Energy', color: '#00c853' },
  { value: 2, emoji: '🔋', label: 'Medium Energy', color: '#ffab00' },
  { value: 1, emoji: '😴', label: 'Low Energy', color: '#f50057' },
];

const getMoodInsight = (mood, energy, tasksCompleted) => {
  if (mood >= 4 && energy >= 3) return "You were thriving today! Keep this energy going! 🌟";
  if (mood >= 4 && energy <= 1) return "Great mood despite low energy — you're resilient! 💪";
  if (mood <= 2 && energy <= 1) return "Tough day, but you showed up. That counts! 🌿";
  if (mood <= 2 && energy >= 3) return "High energy but low mood — maybe take a break? 🧘";
  return "A balanced day — steady progress wins the race! 🌱";
};

export default function Mood() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [moodLogs, setMoodLogs] = useState([]);
  const [selectedMood, setSelectedMood] = useState(null);
  const [selectedEnergy, setSelectedEnergy] = useState(null);
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);
  const [todayLog, setTodayLog] = useState(null);
  const [activeTab, setActiveTab] = useState('checkin');

  useEffect(() => { fetchMoodLogs(); }, []);

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
  };

  const saveMood = async () => {
    if (!selectedMood || !selectedEnergy) return;
    const today = new Date().toISOString().split('T')[0];
    if (todayLog) {
      await supabase.from('mood_logs')
        .update({ mood: selectedMood, energy: selectedEnergy, note })
        .eq('id', todayLog.id);
    } else {
      await supabase.from('mood_logs')
        .insert([{ user_id: user.id, mood: selectedMood, energy: selectedEnergy, note, date: today }]);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    fetchMoodLogs();
  };

  const chartData = [...moodLogs].reverse().slice(-14).map(log => ({
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
        <p style={{ color: theme.textLight, marginBottom: '24px' }}>
          Understanding yourself is the first step to growth 🌸
        </p>

        {/* Tabs */}
        <div style={{
          ...styles.tabRow,
          background: theme.card,
          border: `1.5px solid ${theme.border}`,
        }}>
          {[
            { key: 'checkin', label: 'Check-in', emoji: '🌅' },
            { key: 'diary', label: 'Mood Diary', emoji: '📖' },
            { key: 'charts', label: 'Charts', emoji: '📈' },
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

        {/* Check-in Tab */}
        {activeTab === 'checkin' && (
          <div style={{
            ...styles.card,
            background: theme.card,
            border: `1.5px solid ${theme.border}`,
          }}>
            <h2 style={{ color: theme.text, fontSize: '1.1rem', fontWeight: '600', marginBottom: '20px' }}>
              🌅 Today's Check-in
            </h2>

            <p style={{ color: theme.textLight, marginBottom: '12px', fontSize: '0.9rem' }}>
              How's your mood today?
            </p>
            <div style={styles.moodRow}>
              {moods.map(m => (
                <div
                  key={m.value}
                  onClick={() => setSelectedMood(m.value)}
                  style={{
                    ...styles.moodBtn,
                    background: selectedMood === m.value ? m.color + '22' : theme.accent,
                    border: `2px solid ${selectedMood === m.value ? m.color : theme.border}`,
                    transform: selectedMood === m.value ? 'scale(1.08)' : 'scale(1)',
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
                    background: selectedEnergy === e.value ? e.color + '22' : theme.accent,
                    border: `2px solid ${selectedEnergy === e.value ? e.color : theme.border}`,
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
              placeholder="How was your day? Any thoughts? 🌿"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />

            {saved && (
              <div style={{ ...styles.savedMsg, background: theme.accent, color: theme.primary }}>
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
        )}

        {/* Mood Diary Tab */}
        {activeTab === 'diary' && (
          <div>
            {moodLogs.length === 0 ? (
              <div style={{
                ...styles.card,
                background: theme.card,
                border: `1.5px solid ${theme.border}`,
                textAlign: 'center',
                padding: '60px',
              }}>
                <p style={{ fontSize: '3rem' }}>📖</p>
                <p style={{ color: theme.textLight, marginTop: '12px' }}>
                  No mood logs yet! Start checking in daily.
                </p>
              </div>
            ) : (
              <div style={styles.diaryList}>
                {moodLogs.map(log => {
                  const moodObj = moods.find(m => m.value === log.mood);
                  const energyObj = energyLevels.find(e => e.value === log.energy);
                  const dateObj = new Date(log.date + 'T00:00:00');
                  const isToday = log.date === new Date().toISOString().split('T')[0];
                  const isYesterday = log.date === new Date(Date.now() - 86400000).toISOString().split('T')[0];

                  const dateLabel = isToday ? 'Today' :
                    isYesterday ? 'Yesterday' :
                    dateObj.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });

                  return (
                    <div key={log.id} style={{
                      ...styles.diaryCard,
                      background: theme.card,
                      border: `1.5px solid ${theme.border}`,
                      borderLeft: `4px solid ${moodObj?.color || theme.primary}`,
                    }}>
                      {/* Date Header */}
                      <div style={styles.diaryHeader}>
                        <div>
                          <p style={{ color: theme.text, fontWeight: '700', fontSize: '1rem' }}>
                            📅 {dateLabel}
                          </p>
                          <p style={{ color: theme.textLight, fontSize: '0.78rem' }}>
                            {dateObj.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                          </p>
                        </div>
                        <div style={{
                          ...styles.moodBadge,
                          background: moodObj?.color + '22',
                          border: `1.5px solid ${moodObj?.color}44`,
                        }}>
                          <span style={{ fontSize: '1.5rem' }}>{moodObj?.emoji}</span>
                          <span style={{ color: moodObj?.color, fontWeight: '700', fontSize: '0.85rem' }}>
                            {moodObj?.label}
                          </span>
                        </div>
                      </div>

                      {/* Stats Row */}
                      <div style={styles.diaryStats}>
                        <div style={{
                          ...styles.diaryStat,
                          background: theme.accent,
                          border: `1px solid ${theme.border}`,
                        }}>
                          <span>{energyObj?.emoji}</span>
                          <span style={{ color: theme.text, fontSize: '0.82rem', fontWeight: '600' }}>
                            {energyObj?.label}
                          </span>
                        </div>
                        <div style={{
                          ...styles.diaryStat,
                          background: theme.accent,
                          border: `1px solid ${theme.border}`,
                        }}>
                          <span>⭐</span>
                          <span style={{ color: theme.text, fontSize: '0.82rem', fontWeight: '600' }}>
                            Mood Score: {log.mood}/5
                          </span>
                        </div>
                      </div>

                      {/* Note */}
                      {log.note && (
                        <div style={{
                          ...styles.diaryNote,
                          background: theme.accent,
                          border: `1px solid ${theme.border}`,
                        }}>
                          <p style={{ color: theme.textLight, fontSize: '0.85rem', fontStyle: 'italic' }}>
                            💭 "{log.note}"
                          </p>
                        </div>
                      )}

                      {/* Insight */}
                      <p style={{
                        color: theme.primary,
                        fontSize: '0.82rem',
                        marginTop: '10px',
                        fontWeight: '500',
                      }}>
                        ✨ {getMoodInsight(log.mood, log.energy)}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Charts Tab */}
        {activeTab === 'charts' && (
          <div>
            {/* Stats */}
            <div style={styles.statsRow}>
              {[
                { emoji: '📊', value: avgMood, label: 'Avg Mood (30d)' },
                { emoji: '📝', value: moodLogs.length, label: 'Days Tracked' },
                { emoji: '🌟', value: bestDay ? moods.find(m => m.value === bestDay.mood)?.emoji : '–', label: 'Best Mood' },
              ].map((stat, i) => (
                <div key={i} style={{
                  ...styles.statCard,
                  background: theme.card,
                  border: `1.5px solid ${theme.border}`,
                }}>
                  <div style={{ fontSize: '2rem', marginBottom: '8px' }}>{stat.emoji}</div>
                  <div style={{ color: theme.primary, fontSize: '1.6rem', fontWeight: '700' }}>{stat.value}</div>
                  <div style={{ color: theme.textLight, fontSize: '0.78rem' }}>{stat.label}</div>
                </div>
              ))}
            </div>

            {chartData.length > 1 ? (
              <div style={{
                ...styles.card,
                background: theme.card,
                border: `1.5px solid ${theme.border}`,
              }}>
                <h2 style={{ color: theme.text, fontSize: '1.1rem', fontWeight: '600', marginBottom: '20px' }}>
                  📈 Mood & Energy Trends
                </h2>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.border} />
                    <XAxis dataKey="date" tick={{ fill: theme.textLight, fontSize: 11 }} />
                    <YAxis domain={[1, 5]} tick={{ fill: theme.textLight }} />
                    <Tooltip contentStyle={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: '10px' }} />
                    <Line type="monotone" dataKey="mood" stroke={theme.primary} strokeWidth={3} dot={{ fill: theme.primary, r: 5 }} name="Mood" />
                    <Line type="monotone" dataKey="energy" stroke={theme.secondary} strokeWidth={3} strokeDasharray="5 5" dot={{ fill: theme.secondary, r: 5 }} name="Energy" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={{
                ...styles.card,
                background: theme.card,
                border: `1.5px solid ${theme.border}`,
                textAlign: 'center',
                padding: '40px',
              }}>
                <p style={{ fontSize: '2rem' }}>📈</p>
                <p style={{ color: theme.textLight, marginTop: '12px' }}>
                  Log at least 2 days to see your mood chart!
                </p>
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
  moodRow: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
  moodBtn: { flex: 1, minWidth: '70px', padding: '12px 8px', borderRadius: '14px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', transition: 'all 0.2s' },
  energyRow: { display: 'flex', gap: '12px' },
  energyBtn: { flex: 1, padding: '12px', borderRadius: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s' },
  noteInput: { width: '100%', padding: '12px 16px', borderRadius: '12px', fontSize: '0.95rem', outline: 'none', minHeight: '80px', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'DM Sans, sans-serif' },
  savedMsg: { padding: '10px', borderRadius: '10px', textAlign: 'center', fontWeight: '600', marginTop: '12px', fontSize: '0.9rem' },
  saveBtn: { width: '100%', padding: '14px', borderRadius: '12px', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '1rem', marginTop: '16px' },
  diaryList: { display: 'flex', flexDirection: 'column', gap: '16px' },
  diaryCard: { borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' },
  diaryHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' },
  moodBadge: { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', borderRadius: '20px' },
  diaryStats: { display: 'flex', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' },
  diaryStat: { display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '20px', fontSize: '0.82rem' },
  diaryNote: { padding: '12px 16px', borderRadius: '12px', marginBottom: '8px' },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' },
  statCard: { borderRadius: '16px', padding: '20px', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' },
};