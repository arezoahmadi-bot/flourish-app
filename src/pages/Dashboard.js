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
  const { theme } = useTheme();
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('');
  const [quote] = useState(quotes[Math.floor(Math.random() * quotes.length)]);
  const [rolledOver, setRolledOver] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [viewMode, setViewMode] = useState('today');

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const dateHeading = today.toLocaleDateString('en-US', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  useEffect(() => {
  const hour = new Date().getHours();
  if (hour < 12) setGreeting('Good morning');
  else if (hour < 17) setGreeting('Good afternoon');
  else setGreeting('Good evening');
  fetchProfile();

  // Sync when coming back online
  window.addEventListener('online', syncLocalTasks);
  return () => window.removeEventListener('online', syncLocalTasks);
}, []);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');
    fetchProfile();
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [viewMode]);

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
        .insert([{ id: user.id, full_name: user.email, username: user.email.split('@')[0], streak: 0, last_active: todayStr }])
        .select().single();
      setProfile(newProfile);
    } else {
      await updateStreak(data);
      await rolloverTasks(data);
      setProfile(data);
    }
    setLoading(false);
  };

  const updateStreak = async (profileData) => {
    const lastActive = profileData.last_active;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    let newStreak = profileData.streak || 0;
    if (lastActive === todayStr) return;
    else if (lastActive === yesterdayStr) newStreak = newStreak + 1;
    else newStreak = 1;
    await supabase.from('profiles').update({ streak: newStreak, last_active: todayStr }).eq('id', user.id);
    setProfile(prev => prev ? { ...prev, streak: newStreak } : null);
  };

  const rolloverTasks = async (profileData) => {
    const lastActive = profileData.last_active;
    if (!lastActive || lastActive === todayStr) return;
    const { data: unfinishedTasks } = await supabase
      .from('tasks').select('*').eq('user_id', user.id)
      .eq('completed', false).lt('due_date', todayStr);
    if (unfinishedTasks && unfinishedTasks.length > 0) {
      await supabase.from('tasks').update({ due_date: todayStr })
        .eq('user_id', user.id).eq('completed', false).lt('due_date', todayStr);
      setRolledOver(true);
      setTimeout(() => setRolledOver(false), 5000);
    }
  };

 const fetchTasks = async () => {
  try {
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('due_date', todayStr)
      .order('created_at', { ascending: true });
    const tasks = data || [];
    setTasks(tasks);
    // Save to local storage for offline use
    localStorage.setItem('flourish_tasks_' + todayStr, JSON.stringify(tasks));
  } catch (err) {
    // If offline, load from local storage
    const cached = localStorage.getItem('flourish_tasks_' + todayStr);
    if (cached) setTasks(JSON.parse(cached));
  }
};  

  const addTask = async () => {
  if (!newTask.trim()) return;
  const task = {
    id: 'local_' + Date.now(),
    user_id: user.id,
    title: newTask,
    due_date: todayStr,
    completed: false,
    created_at: new Date().toISOString(),
  };

  // Add to UI immediately
  const updatedTasks = [...tasks, task];
  setTasks(updatedTasks);
  localStorage.setItem('flourish_tasks_' + todayStr, JSON.stringify(updatedTasks));
  setNewTask('');

  // Try to save to Supabase if online
  try {
    const { data, error } = await supabase
      .from('tasks')
      .insert([{
        user_id: user.id,
        title: task.title,
        due_date: todayStr,
      }])
      .select();
    if (!error && data) {
      // Replace local task with real one from server
      const synced = updatedTasks.map(t =>
        t.id === task.id ? data[0] : t
      );
      setTasks(synced);
      localStorage.setItem('flourish_tasks_' + todayStr, JSON.stringify(synced));
    }
  } catch (err) {
    // Stay offline, task is saved locally
    console.log('Offline - task saved locally');
  }
};

  const toggleTask = async (task) => {
    const { data } = await supabase
      .from('tasks').update({ completed: !task.completed }).eq('id', task.id).select();
    setTasks(tasks.map(t => t.id === task.id ? data[0] : t));
  };

  const deleteTask = async (id) => {
  const updatedTasks = tasks.filter(t => t.id !== id);
  setTasks(updatedTasks);
  localStorage.setItem('flourish_tasks_' + todayStr, JSON.stringify(updatedTasks));

  try {
    if (!id.toString().startsWith('local_')) {
      await supabase.from('tasks').delete().eq('id', id);
    }
  } catch (err) {
    console.log('Offline - delete saved locally');
  }
};
const syncLocalTasks = async () => {
  const cached = localStorage.getItem('flourish_tasks_' + todayStr);
  if (!cached) return;
  const localTasks = JSON.parse(cached);
  const unsyncedTasks = localTasks.filter(t =>
    t.id.toString().startsWith('local_')
  );
  for (const task of unsyncedTasks) {
    try {
      const { data } = await supabase
        .from('tasks')
        .insert([{
          user_id: user.id,
          title: task.title,
          due_date: task.due_date,
          completed: task.completed,
        }])
        .select();
      if (data) {
        const updated = localTasks.map(t =>
          t.id === task.id ? data[0] : t
        );
        localStorage.setItem('flourish_tasks_' + todayStr, JSON.stringify(updated));
        setTasks(updated);
      }
    } catch (err) {
      console.log('Still offline');
    }
  }
};

  const startEdit = (task) => {
    setEditingTask(task.id);
    setEditTitle(task.title);
  };

  const saveEdit = async (id) => {
    if (!editTitle.trim()) return;
    const { data } = await supabase
      .from('tasks').update({ title: editTitle }).eq('id', id).select();
    setTasks(tasks.map(t => t.id === id ? data[0] : t));
    setEditingTask(null);
    setEditTitle('');
  };

  // Group tasks by date
  const groupedTasks = tasks.reduce((groups, task) => {
    const date = task.due_date;
    if (!groups[date]) groups[date] = [];
    groups[date].push(task);
    return groups;
  }, {});

  const sortedDates = Object.keys(groupedTasks).sort((a, b) => b.localeCompare(a));

  const completedCount = tasks.filter(t => t.completed && t.due_date === todayStr).length;
  const totalCount = tasks.filter(t => t.due_date === todayStr).length;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const formatDateHeading = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00');
    const isToday = dateStr === todayStr;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = dateStr === yesterday.toISOString().split('T')[0];
    if (isToday) return '📅 Today';
    if (isYesterday) return '📆 Yesterday';
    return date.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  return (
    <div style={{ minHeight: '100vh', background: theme.background }}>
      <Navbar />
      <div style={styles.content}>

        {rolledOver && (
          <div style={{ ...styles.rolloverNote, background: theme.accent, border: `1.5px solid ${theme.border}`, color: theme.primary }}>
            🔄 Unfinished tasks from yesterday moved to today!
          </div>
        )}

        <div style={styles.greetingSection}>
          <p style={{ color: theme.textLight, fontSize: '0.95rem', marginBottom: '6px' }}>📅 {dateHeading}</p>
          <h1 style={{ color: theme.text, fontSize: '2rem', fontWeight: '700', marginBottom: '12px' }}>
            {greeting}, {profile?.full_name?.split(' ')[0] || 'Friend'} {theme.emoji}
          </h1>
          <div style={{ ...styles.quoteCard, background: theme.card, border: `1.5px solid ${theme.border}` }}>
            <span style={{ fontSize: '1.5rem' }}>{quote.emoji}</span>
            <p style={{ color: theme.textLight, fontStyle: 'italic', fontSize: '0.95rem' }}>"{quote.text}"</p>
          </div>
        </div>

        <div style={styles.statsRow}>
          {[
            { emoji: '✅', value: completedCount, label: 'Done Today' },
            { emoji: '📝', value: totalCount, label: "Today's Tasks" },
            { emoji: '🔥', value: profile?.streak || 0, label: 'Day Streak' },
            { emoji: '⚡', value: `${percentage}%`, label: 'Progress' },
          ].map((stat, i) => (
            <div key={i} style={{ ...styles.statCard, background: theme.card, border: `1.5px solid ${theme.border}` }}>
              <div style={styles.statEmoji}>{stat.emoji}</div>
              <div style={{ color: theme.primary, fontSize: '1.8rem', fontWeight: '700' }}>{stat.value}</div>
              <div style={{ color: theme.textLight, fontSize: '0.82rem' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        <div style={{ ...styles.card, background: theme.card, border: `1.5px solid ${theme.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h2 style={{ color: theme.text, fontSize: '1.1rem', fontWeight: '600' }}>Today's Progress</h2>
            <span style={{ color: theme.primary, fontWeight: '700' }}>{percentage}%</span>
          </div>
          <div style={{ ...styles.progressBar, background: theme.accent }}>
            <div style={{ ...styles.progressFill, width: `${percentage}%`, background: theme.gradient }} />
          </div>
          <p style={{ color: theme.textLight, fontSize: '0.85rem', marginTop: '8px' }}>
            {completedCount} of {totalCount} tasks completed today
          </p>
        </div>

        <div style={{ ...styles.card, background: theme.card, border: `1.5px solid ${theme.border}` }}>
          <div style={styles.taskHeader}>
            <h2 style={{ color: theme.text, fontSize: '1.1rem', fontWeight: '600' }}>📝 Tasks</h2>
            <div style={styles.viewToggle}>
              <button
                onClick={() => setViewMode('today')}
                style={{
                  ...styles.toggleBtn,
                  background: viewMode === 'today' ? theme.gradient : theme.accent,
                  color: viewMode === 'today' ? '#fff' : theme.textLight,
                }}
              >
                Today
              </button>
              <button
                onClick={() => setViewMode('all')}
                style={{
                  ...styles.toggleBtn,
                  background: viewMode === 'all' ? theme.gradient : theme.accent,
                  color: viewMode === 'all' ? '#fff' : theme.textLight,
                }}
              >
                All Tasks
              </button>
            </div>
          </div>

          <div style={styles.addRow}>
            <input
              style={{ ...styles.input, background: theme.accent, border: `2px solid ${theme.border}`, color: theme.text }}
              type="text"
              placeholder="Add a new task... 🌱"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTask()}
            />
            <button style={{ ...styles.addBtn, background: theme.gradient }} onClick={addTask}>+ Add</button>
          </div>

          {loading ? (
            <p style={{ color: theme.textLight }}>Loading tasks...</p>
          ) : tasks.length === 0 ? (
            <div style={styles.empty}>
              <p style={{ fontSize: '2rem' }}>🌸</p>
              <p style={{ color: theme.textLight, marginTop: '8px' }}>No tasks yet! Add your first task above.</p>
            </div>
          ) : (
            <div style={styles.groupedList}>
              {sortedDates.map(date => (
                <div key={date} style={styles.dateGroup}>
                  <div style={{ ...styles.dateLabel, color: theme.primary, borderBottom: `2px solid ${theme.border}` }}>
                    {formatDateHeading(date)}
                  </div>
                  <div style={styles.taskTable}>
                    {groupedTasks[date].map(task => (
                      <div key={task.id} style={{
                        ...styles.taskRow,
                        background: task.completed ? theme.accent : 'transparent',
                        border: `1.5px solid ${theme.border}`,
                        opacity: task.completed ? 0.75 : 1,
                      }}>
                        <div
                          style={{
                            ...styles.checkbox,
                            background: task.completed ? theme.primary : 'transparent',
                            border: `2px solid ${task.completed ? theme.primary : theme.border}`,
                          }}
                          onClick={() => toggleTask(task)}
                        >
                          {task.completed && <span style={{ color: '#fff', fontSize: '0.75rem' }}>✓</span>}
                        </div>

                        {editingTask === task.id ? (
                          <input
                            style={{
                              ...styles.editInput,
                              background: theme.accent,
                              border: `2px solid ${theme.primary}`,
                              color: theme.text,
                            }}
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && saveEdit(task.id)}
                            autoFocus
                          />
                        ) : (
                          <span style={{
                            flex: 1,
                            color: theme.text,
                            textDecoration: task.completed ? 'line-through' : 'none',
                            fontSize: '0.95rem',
                          }}>
                            {task.title}
                          </span>
                        )}

                        {editingTask === task.id ? (
                          <button onClick={() => saveEdit(task.id)} style={{ ...styles.iconBtn, color: theme.primary }}>💾</button>
                        ) : (
                          <button onClick={() => startEdit(task)} style={{ ...styles.iconBtn, color: theme.textLight }}>✏️</button>
                        )}
                        <button onClick={() => deleteTask(task.id)} style={{ ...styles.iconBtn, color: theme.textLight }}>🗑️</button>
                      </div>
                    ))}
                  </div>
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
  content: { maxWidth: '860px', margin: '0 auto', padding: '32px 16px' },
  rolloverNote: { padding: '12px 20px', borderRadius: '12px', marginBottom: '20px', fontWeight: '600', fontSize: '0.9rem' },
  greetingSection: { marginBottom: '28px' },
  quoteCard: { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 20px', borderRadius: '14px' },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' },
  statCard: { borderRadius: '16px', padding: '20px', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' },
  statEmoji: { fontSize: '1.8rem', marginBottom: '8px' },
  card: { borderRadius: '18px', padding: '24px', marginBottom: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' },
  progressBar: { borderRadius: '10px', height: '12px', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: '10px', transition: 'width 0.5s ease' },
  taskHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  viewToggle: { display: 'flex', gap: '8px' },
  toggleBtn: { padding: '6px 16px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' },
  addRow: { display: 'flex', gap: '12px', marginBottom: '16px' },
  input: { flex: 1, padding: '12px 16px', borderRadius: '12px', fontSize: '0.95rem', outline: 'none' },
  addBtn: { padding: '12px 22px', borderRadius: '12px', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '0.95rem' },
  groupedList: { display: 'flex', flexDirection: 'column', gap: '20px' },
  dateGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  dateLabel: { fontSize: '0.9rem', fontWeight: '700', paddingBottom: '8px', marginBottom: '4px' },
  taskTable: { display: 'flex', flexDirection: 'column', gap: '8px' },
  taskRow: { display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', borderRadius: '10px', transition: 'all 0.2s' },
  checkbox: { width: '22px', height: '22px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' },
  editInput: { flex: 1, padding: '6px 10px', borderRadius: '8px', fontSize: '0.95rem', outline: 'none' },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', padding: '4px' },
  empty: { textAlign: 'center', padding: '40px' },
};