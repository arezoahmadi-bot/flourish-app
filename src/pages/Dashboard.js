import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const quotes = [
  { text: "Small steps every day lead to big changes.", emoji: "🌱" },
  { text: "You don't have to be perfect, just consistent.", emoji: "✨" },
  { text: "Every morning is a fresh start.", emoji: "🌅" },
  { text: "Progress, not perfection.", emoji: "💪" },
  { text: "Your future self is watching. Make them proud.", emoji: "🌟" },
  { text: "One task at a time. You've got this.", emoji: "🎯" },
  { text: "Rest if you must, but don't quit.", emoji: "🍃" },
  { text: "Believe in your journey, even the slow parts.", emoji: "🌿" },
  { text: "Today's efforts are tomorrow's results.", emoji: "🏆" },
  { text: "Be gentle with yourself. Growth takes time.", emoji: "🌸" },
];

export default function Dashboard() {
  const { user } = useAuth();
  const { theme, isDark } = useTheme();
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('');
  const [quote] = useState(quotes[Math.floor(Math.random() * quotes.length)]);
  const [rolledOver, setRolledOver] = useState(false);

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const dateHeading = today.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error) return;

    if (!data) {
      const { data: newProfile } = await supabase
        .from('profiles')
        .insert([{
          id: user.id,
          full_name: user.email,
          username: user.email.split('@')[0],
          streak: 0,
          last_active: todayStr,
        }])
        .select()
        .single();
      setProfile(newProfile);
      await fetchTasks();
    } else {
      await updateStreak(data);
      await rolloverTasks(data);
      setProfile(data);
      await fetchTasks();
    }
    setLoading(false);
  };

  const updateStreak = async (profileData) => {
    const lastActive = profileData.last_active;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let newStreak = profileData.streak || 0;

    if (lastActive === todayStr) {
      return;
    } else if (lastActive === yesterdayStr) {
      newStreak = newStreak + 1;
    } else if (lastActive && lastActive < yesterdayStr) {
      newStreak = 1;
    } else {
      newStreak = 1;
    }

    await supabase
      .from('profiles')
      .update({ streak: newStreak, last_active: todayStr })
      .eq('id', user.id);

    setProfile(prev => prev ? { ...prev, streak: newStreak, last_active: todayStr } : null);
  };

  const rolloverTasks = async (profileData) => {
    const lastActive = profileData.last_active;
    if (!lastActive || lastActive === todayStr) return;

    const { data: unfinishedTasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('completed', false)
      .lt('due_date', todayStr);

    if (unfinishedTasks && unfinishedTasks.length > 0) {
      await supabase
        .from('tasks')
        .update({ due_date: todayStr })
        .eq('user_id', user.id)
        .eq('completed', false)
        .lt('due_date', todayStr);

      setRolledOver(true);
      setTimeout(() => setRolledOver(false), 5000);
    }
  };

  const fetchTasks = async () => {
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('due_date', todayStr)
      .order('created_at', { ascending: true });
    setTasks(data || []);
  };

  const addTask = async () => {
    if (!newTask.trim()) return;
    const { data, error } = await supabase
      .from('tasks')
      .insert([{
        user_id: user.id,
        title: newTask,
        due_date: todayStr,
      }])
      .select();
    if (error) return;
    if (data && data.length > 0) setTasks([...tasks, ...data]);
    setNewTask('');
  };

  const toggleTask = async (task) => {
    const { data } = await supabase
      .from('tasks')
      .update({ completed: !task.completed })
      .eq('id', task.id)
      .select();
    setTasks(tasks.map(t => t.id === task.id ? data[0] : t));
  };

  const deleteTask = async (id) => {
    await supabase.from('tasks').delete().eq('id', id);
    setTasks(tasks.filter(t => t.id !== id));
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div style={{ minHeight: '100vh', background: theme.background }}>
      <Navbar />
      <div style={styles.content}>

        {/* Rollover notification */}
        {rolledOver && (
          <div style={{
            ...styles.rolloverNote,
            background: theme.accent,
            border: `1.5px solid ${theme.border}`,
            color: theme.primary,
          }}>
            🔄 Some unfinished tasks from yesterday have been moved to today!
          </div>
        )}

        {/* Greeting */}
        <div style={styles.greetingSection}>
          <p style={{ color: theme.textLight, fontSize: '0.95rem', marginBottom: '6px' }}>
            📅 {dateHeading}
          </p>
          <h1 style={{ color: theme.text, fontSize: '2rem', fontWeight: '700', marginBottom: '12px' }}>
            {greeting}, {profile?.full_name?.split(' ')[0] || 'Friend'} {theme.emoji}
          </h1>
          <div style={{
            ...styles.quoteCard,
            background: theme.card,
            border: `1.5px solid ${theme.border}`,
          }}>
            <span style={{ fontSize: '1.5rem' }}>{quote.emoji}</span>
            <p style={{ color: theme.textLight, fontStyle: 'italic', fontSize: '0.95rem' }}>
              "{quote.text}"
            </p>
          </div>
        </div>

        {/* Stats */}
        <div style={styles.statsRow}>
          {[
            { emoji: '✅', value: completedCount, label: 'Done Today' },
            { emoji: '📝', value: totalCount, label: 'Total Tasks' },
            { emoji: '🔥', value: profile?.streak || 0, label: 'Day Streak' },
            { emoji: '⚡', value: `${percentage}%`, label: 'Progress' },
          ].map((stat, i) => (
            <div key={i} style={{
              ...styles.statCard,
              background: theme.card,
              border: `1.5px solid ${theme.border}`,
            }}>
              <div style={styles.statEmoji}>{stat.emoji}</div>
              <div style={{ color: theme.primary, fontSize: '1.8rem', fontWeight: '700' }}>
                {stat.value}
              </div>
              <div style={{ color: theme.textLight, fontSize: '0.82rem' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Progress Bar */}
        <div style={{
          ...styles.card,
          background: theme.card,
          border: `1.5px solid ${theme.border}`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h2 style={{ color: theme.text, fontSize: '1.1rem', fontWeight: '600' }}>
              Today's Progress
            </h2>
            <span style={{ color: theme.primary, fontWeight: '700' }}>{percentage}%</span>
          </div>
          <div style={{ ...styles.progressBar, background: theme.accent }}>
            <div style={{
              ...styles.progressFill,
              width: `${percentage}%`,
              background: theme.gradient,
            }} />
          </div>
          <p style={{ color: theme.textLight, fontSize: '0.85rem', marginTop: '8px' }}>
            {completedCount} of {totalCount} tasks completed
          </p>
        </div>

        {/* Tasks */}
        <div style={{
          ...styles.card,
          background: theme.card,
          border: `1.5px solid ${theme.border}`,
        }}>
          {/* Day heading */}
          <div style={styles.dayHeading}>
            <div style={{
              ...styles.dayBadge,
              background: theme.gradient,
            }}>
              <span style={{ color: '#fff', fontWeight: '700', fontSize: '0.9rem' }}>
                {today.toLocaleDateString('en-US', { weekday: 'long' })}
              </span>
              <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.8rem' }}>
                {today.toLocaleDateString('en-US', { day: 'numeric', month: 'long' })}
              </span>
            </div>
            <h2 style={{ color: theme.text, fontSize: '1.1rem', fontWeight: '600' }}>
              📝 Today's Tasks
            </h2>
          </div>

          <div style={styles.addRow}>
            <input
              style={{
                ...styles.input,
                background: theme.accent,
                border: `2px solid ${theme.border}`,
                color: theme.text,
              }}
              type="text"
              placeholder="Add a new task... 🌱"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTask()}
            />
            <button style={{
              ...styles.addBtn,
              background: theme.gradient,
            }} onClick={addTask}>
              + Add
            </button>
          </div>

          {loading ? (
            <p style={{ color: theme.textLight }}>Loading tasks...</p>
          ) : tasks.length === 0 ? (
            <div style={styles.empty}>
              <p style={{ fontSize: '2rem' }}>🌸</p>
              <p style={{ color: theme.textLight, marginTop: '8px' }}>
                No tasks yet! Add your first task above.
              </p>
            </div>
          ) : (
            <div style={styles.taskList}>
              {tasks.map(task => (
                <div key={task.id} style={{
                  ...styles.taskItem,
                  background: task.completed ? theme.accent : 'transparent',
                  border: `1.5px solid ${theme.border}`,
                  opacity: task.completed ? 0.7 : 1,
                }}>
                  <div
                    style={{
                      ...styles.checkbox,
                      background: task.completed ? theme.primary : 'transparent',
                      border: `2px solid ${task.completed ? theme.primary : theme.border}`,
                    }}
                    onClick={() => toggleTask(task)}
                  >
                    {task.completed && (
                      <span style={{ color: '#fff', fontSize: '0.75rem' }}>✓</span>
                    )}
                  </div>
                  <span style={{
                    flex: 1,
                    color: theme.text,
                    textDecoration: task.completed ? 'line-through' : 'none',
                    fontSize: '0.95rem',
                  }}>
                    {task.title}
                  </span>
                  <span style={{
                    fontSize: '0.75rem',
                    color: theme.textLight,
                    marginRight: '8px',
                  }}>
                    {new Date(task.due_date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  <button
                    onClick={() => deleteTask(task.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: theme.textLight,
                      fontSize: '1rem',
                      padding: '4px',
                    }}
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  content: {
    maxWidth: '860px',
    margin: '0 auto',
    padding: '32px 16px',
  },
  rolloverNote: {
    padding: '12px 20px',
    borderRadius: '12px',
    marginBottom: '20px',
    fontWeight: '600',
    fontSize: '0.9rem',
  },
  greetingSection: {
    marginBottom: '28px',
  },
  quoteCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 20px',
    borderRadius: '14px',
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    marginBottom: '20px',
  },
  statCard: {
    borderRadius: '16px',
    padding: '20px',
    textAlign: 'center',
    boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
  },
  statEmoji: {
    fontSize: '1.8rem',
    marginBottom: '8px',
  },
  card: {
    borderRadius: '18px',
    padding: '24px',
    marginBottom: '20px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
  },
  progressBar: {
    borderRadius: '10px',
    height: '12px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: '10px',
    transition: 'width 0.5s ease',
  },
  dayHeading: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '20px',
  },
  dayBadge: {
    padding: '8px 16px',
    borderRadius: '12px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  addRow: {
    display: 'flex',
    gap: '12px',
    marginBottom: '16px',
  },
  input: {
    flex: 1,
    padding: '12px 16px',
    borderRadius: '12px',
    fontSize: '0.95rem',
    outline: 'none',
  },
  addBtn: {
    padding: '12px 22px',
    borderRadius: '12px',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '700',
    fontSize: '0.95rem',
  },
  taskList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  taskItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    borderRadius: '12px',
    transition: 'all 0.2s',
  },
  checkbox: {
    width: '22px',
    height: '22px',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'all 0.2s',
  },
  empty: {
    textAlign: 'center',
    padding: '40px',
  },
};