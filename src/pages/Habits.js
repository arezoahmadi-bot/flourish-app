import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const habitEmojis = ['🌱', '💪', '📚', '🏃', '💧', '🧘', '🎨', '🌿', '⭐', '🎯'];
const habitColors = ['#7cb987', '#7c6fcd', '#c97b8a', '#4a90a4', '#d4845a'];

export default function Habits() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [habits, setHabits] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newHabit, setNewHabit] = useState({
    title: '',
    emoji: '🌱',
    color: '#7cb987',
    frequency: 'daily',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHabits();
  }, []);

  const fetchHabits = async () => {
    const { data } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setHabits(data || []);
    setLoading(false);
  };

  const addHabit = async () => {
    if (!newHabit.title.trim()) return;
    const { data, error } = await supabase
      .from('habits')
      .insert([{ ...newHabit, user_id: user.id }])
      .select();
    if (error) {
      alert('Please create the habits table first! Check instructions.');
      return;
    }
    setHabits([...data, ...habits]);
    setNewHabit({ title: '', emoji: '🌱', color: '#7cb987', frequency: 'daily' });
    setShowForm(false);
  };

  const toggleHabitToday = async (habit) => {
    const today = new Date().toISOString().split('T')[0];
    const completedDates = habit.completed_dates || [];
    const isCompleted = completedDates.includes(today);
    const updatedDates = isCompleted
      ? completedDates.filter(d => d !== today)
      : [...completedDates, today];

    const { data } = await supabase
      .from('habits')
      .update({
        completed_dates: updatedDates,
        streak: updatedDates.length,
      })
      .eq('id', habit.id)
      .select();
    setHabits(habits.map(h => h.id === habit.id ? data[0] : h));
  };

  const deleteHabit = async (id) => {
    await supabase.from('habits').delete().eq('id', id);
    setHabits(habits.filter(h => h.id !== id));
  };

  const isCompletedToday = (habit) => {
    const today = new Date().toISOString().split('T')[0];
    return (habit.completed_dates || []).includes(today);
  };

  const getLast7Days = () => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });
  };

  const last7Days = getLast7Days();

  return (
    <div style={{ minHeight: '100vh', background: theme.background }}>
      <Navbar />
      <div style={styles.content}>
        <div style={styles.header}>
          <div>
            <h1 style={{ color: theme.text, fontSize: '2rem', fontWeight: '700' }}>
              🌱 My Habits
            </h1>
            <p style={{ color: theme.textLight, marginTop: '4px' }}>
              Small daily actions create big life changes
            </p>
          </div>
          <button
            style={{
              ...styles.addBtn,
              background: theme.gradient,
            }}
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? '✕ Cancel' : '+ New Habit'}
          </button>
        </div>

        {/* Add Habit Form */}
        {showForm && (
          <div style={{
            ...styles.card,
            background: theme.card,
            border: `1.5px solid ${theme.border}`,
          }}>
            <h2 style={{ color: theme.text, marginBottom: '16px', fontSize: '1.1rem' }}>
              Create New Habit
            </h2>

            <input
              style={{
                ...styles.input,
                background: theme.accent,
                border: `2px solid ${theme.border}`,
                color: theme.text,
                marginBottom: '16px',
              }}
              type="text"
              placeholder="Habit name (e.g. Drink 8 glasses of water)"
              value={newHabit.title}
              onChange={(e) => setNewHabit({ ...newHabit, title: e.target.value })}
            />

            <p style={{ color: theme.textLight, fontSize: '0.85rem', marginBottom: '8px' }}>
              Pick an emoji:
            </p>
            <div style={styles.emojiRow}>
              {habitEmojis.map(e => (
                <span
                  key={e}
                  onClick={() => setNewHabit({ ...newHabit, emoji: e })}
                  style={{
                    ...styles.emojiBtn,
                    background: newHabit.emoji === e ? theme.primary : theme.accent,
                    fontSize: '1.4rem',
                  }}
                >
                  {e}
                </span>
              ))}
            </div>

            <p style={{ color: theme.textLight, fontSize: '0.85rem', marginBottom: '8px', marginTop: '16px' }}>
              Pick a color:
            </p>
            <div style={styles.colorRow}>
              {habitColors.map(c => (
                <div
                  key={c}
                  onClick={() => setNewHabit({ ...newHabit, color: c })}
                  style={{
                    ...styles.colorBtn,
                    background: c,
                    border: newHabit.color === c ? `3px solid ${theme.text}` : '3px solid transparent',
                  }}
                />
              ))}
            </div>

            <select
              style={{
                ...styles.input,
                background: theme.accent,
                border: `2px solid ${theme.border}`,
                color: theme.text,
                marginTop: '16px',
              }}
              value={newHabit.frequency}
              onChange={(e) => setNewHabit({ ...newHabit, frequency: e.target.value })}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>

            <button
              style={{
                ...styles.submitBtn,
                background: theme.gradient,
                marginTop: '16px',
              }}
              onClick={addHabit}
            >
              Create Habit 🌱
            </button>
          </div>
        )}

        {/* Habits List */}
        {loading ? (
          <p style={{ color: theme.textLight }}>Loading habits...</p>
        ) : habits.length === 0 ? (
          <div style={{
            ...styles.card,
            background: theme.card,
            border: `1.5px solid ${theme.border}`,
            textAlign: 'center',
            padding: '60px',
          }}>
            <p style={{ fontSize: '3rem' }}>🌱</p>
            <p style={{ color: theme.textLight, marginTop: '12px' }}>
              No habits yet! Create your first habit above.
            </p>
          </div>
        ) : (
          <div style={styles.habitsList}>
            {habits.map(habit => (
              <div key={habit.id} style={{
                ...styles.habitCard,
                background: theme.card,
                border: `1.5px solid ${theme.border}`,
              }}>
                <div style={styles.habitTop}>
                  <div style={styles.habitLeft}>
                    <div style={{
                      ...styles.habitIcon,
                      background: habit.color + '22',
                    }}>
                      <span style={{ fontSize: '1.5rem' }}>{habit.emoji}</span>
                    </div>
                    <div>
                      <p style={{
                        color: theme.text,
                        fontWeight: '600',
                        fontSize: '1rem',
                      }}>
                        {habit.title}
                      </p>
                      <p style={{ color: theme.textLight, fontSize: '0.82rem' }}>
                        🔥 {habit.streak || 0} day streak · {habit.frequency}
                      </p>
                    </div>
                  </div>
                  <div style={styles.habitActions}>
                    <button
                      onClick={() => toggleHabitToday(habit)}
                      style={{
                        ...styles.checkBtn,
                        background: isCompletedToday(habit) ? habit.color : theme.accent,
                        color: isCompletedToday(habit) ? '#fff' : theme.textLight,
                      }}
                    >
                      {isCompletedToday(habit) ? '✓ Done' : 'Mark Done'}
                    </button>
                    <button
                      onClick={() => deleteHabit(habit.id)}
                      style={styles.deleteBtn}
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* 7 Day Tracker */}
                <div style={styles.weekTracker}>
                  {last7Days.map((date, i) => {
                    const completed = (habit.completed_dates || []).includes(date);
                    const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
                    return (
                      <div key={i} style={styles.dayColumn}>
                        <div style={{
                          ...styles.dayDot,
                          background: completed ? habit.color : theme.accent,
                          border: `2px solid ${completed ? habit.color : theme.border}`,
                        }}>
                          {completed && <span style={{ color: '#fff', fontSize: '0.6rem' }}>✓</span>}
                        </div>
                        <p style={{
                          fontSize: '0.7rem',
                          color: theme.textLight,
                          marginTop: '4px',
                        }}>
                          {dayName}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
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
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  addBtn: {
    padding: '12px 24px',
    borderRadius: '12px',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '700',
    fontSize: '0.95rem',
  },
  card: {
    borderRadius: '18px',
    padding: '24px',
    marginBottom: '20px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '12px',
    fontSize: '0.95rem',
    outline: 'none',
    boxSizing: 'border-box',
  },
  emojiRow: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  emojiBtn: {
    width: '44px',
    height: '44px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  colorRow: {
    display: 'flex',
    gap: '10px',
  },
  colorBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    cursor: 'pointer',
  },
  submitBtn: {
    width: '100%',
    padding: '14px',
    borderRadius: '12px',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '700',
    fontSize: '1rem',
  },
  habitsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  habitCard: {
    borderRadius: '18px',
    padding: '20px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
  },
  habitTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  habitLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  habitIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitActions: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  checkBtn: {
    padding: '8px 16px',
    borderRadius: '10px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '0.85rem',
    transition: 'all 0.2s',
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1.1rem',
    padding: '4px',
  },
  weekTracker: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'space-between',
  },
  dayColumn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    flex: 1,
  },
  dayDot: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  },
};