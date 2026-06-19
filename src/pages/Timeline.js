import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const HOURS = Array.from({ length: 24 }, (_, i) => i);

const taskColors = [
  { label: 'Study 📚', color: '#7c6fcd' },
  { label: 'Exercise 🏃', color: '#5a9e5f' },
  { label: 'Rest 😴', color: '#4a90a4' },
  { label: 'Food 🍽️', color: '#d4845a' },
  { label: 'Social 👥', color: '#c97b8a' },
  { label: 'Work 💼', color: '#7cb987' },
  { label: 'Personal 🌿', color: '#a89ee8' },
  { label: 'Other ⭐', color: '#e8a87c' },
];

const formatHour = (hour) => {
  if (hour === 0) return '12:00 AM';
  if (hour < 12) return `${hour}:00 AM`;
  if (hour === 12) return '12:00 PM';
  return `${hour - 12}:00 PM`;
};

export default function Timeline() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [timelineTasks, setTimelineTasks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedHour, setSelectedHour] = useState(null);
  const [newTask, setNewTask] = useState({
    title: '',
    hour: 8,
    duration: 1,
    color: '#7c6fcd',
    emoji: '📝',
    category: 'Study 📚',
  });
  const [editingTask, setEditingTask] = useState(null);
  const [currentHour, setCurrentHour] = useState(new Date().getHours());
  const [currentMinute, setCurrentMinute] = useState(new Date().getMinutes());
  const currentTimeRef = useRef(null);

  const today = new Date().toISOString().split('T')[0];
  const dateHeading = new Date().toLocaleDateString('en-US', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  useEffect(() => {
    fetchTimelineTasks();
    const interval = setInterval(() => {
      setCurrentHour(new Date().getHours());
      setCurrentMinute(new Date().getMinutes());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (currentTimeRef.current) {
      currentTimeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [timelineTasks]);

  const fetchTimelineTasks = async () => {
    const { data } = await supabase
      .from('timeline_tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .order('hour', { ascending: true });
    setTimelineTasks(data || []);
  };

  const addTimelineTask = async () => {
    if (!newTask.title.trim()) return;
    const { data, error } = await supabase
      .from('timeline_tasks')
      .insert([{
        user_id: user.id,
        title: newTask.title,
        hour: newTask.hour,
        duration: newTask.duration,
        color: newTask.color,
        emoji: newTask.emoji,
        category: newTask.category,
        date: today,
        completed: false,
      }])
      .select();
    if (error) {
      alert('Please create the timeline_tasks table first!');
      return;
    }
    setTimelineTasks([...timelineTasks, ...data].sort((a, b) => a.hour - b.hour));
    setShowForm(false);
    setNewTask({ title: '', hour: 8, duration: 1, color: '#7c6fcd', emoji: '📝', category: 'Study 📚' });
  };

  const toggleTimelineTask = async (task) => {
    const { data } = await supabase
      .from('timeline_tasks')
      .update({ completed: !task.completed })
      .eq('id', task.id)
      .select();
    setTimelineTasks(timelineTasks.map(t => t.id === task.id ? data[0] : t));
  };

  const deleteTimelineTask = async (id) => {
    await supabase.from('timeline_tasks').delete().eq('id', id);
    setTimelineTasks(timelineTasks.filter(t => t.id !== id));
  };

  const getTasksForHour = (hour) => {
    return timelineTasks.filter(t => t.hour === hour);
  };

  const emojis = ['📝', '📚', '🏃', '☕', '🍽️', '💼', '🎯', '🧘', '🌿', '💪', '🎨', '🎵', '💤', '🚿', '🏠'];

  return (
    <div style={{ minHeight: '100vh', background: theme.background }}>
      <Navbar />
      <div style={styles.content}>
        <div style={styles.header}>
          <div>
            <h1 style={{ color: theme.text, fontSize: '2rem', fontWeight: '700', marginBottom: '4px' }}>
              🕐 Daily Timeline
            </h1>
            <p style={{ color: theme.textLight }}>📅 {dateHeading}</p>
          </div>
          <button
            style={{ ...styles.addBtn, background: theme.gradient }}
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? '✕ Cancel' : '+ Add Task'}
          </button>
        </div>

        {/* Add Task Form */}
        {showForm && (
          <div style={{
            ...styles.card,
            background: theme.card,
            border: `1.5px solid ${theme.border}`,
          }}>
            <h2 style={{ color: theme.text, fontSize: '1.1rem', fontWeight: '600', marginBottom: '16px' }}>
              ➕ Add to Timeline
            </h2>

            <div style={styles.formGrid}>
              <div style={styles.formField}>
                <label style={{ color: theme.textLight, fontSize: '0.85rem', marginBottom: '6px', display: 'block' }}>
                  Task Title
                </label>
                <input
                  style={{
                    ...styles.input,
                    background: theme.accent,
                    border: `2px solid ${theme.border}`,
                    color: theme.text,
                  }}
                  type="text"
                  placeholder="What are you doing?"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                />
              </div>

              <div style={styles.formField}>
                <label style={{ color: theme.textLight, fontSize: '0.85rem', marginBottom: '6px', display: 'block' }}>
                  Start Time
                </label>
                <select
                  style={{
                    ...styles.input,
                    background: theme.accent,
                    border: `2px solid ${theme.border}`,
                    color: theme.text,
                  }}
                  value={newTask.hour}
                  onChange={(e) => setNewTask({ ...newTask, hour: parseInt(e.target.value) })}
                >
                  {HOURS.map(h => (
                    <option key={h} value={h}>{formatHour(h)}</option>
                  ))}
                </select>
              </div>

              <div style={styles.formField}>
                <label style={{ color: theme.textLight, fontSize: '0.85rem', marginBottom: '6px', display: 'block' }}>
                  Duration (hours)
                </label>
                <select
                  style={{
                    ...styles.input,
                    background: theme.accent,
                    border: `2px solid ${theme.border}`,
                    color: theme.text,
                  }}
                  value={newTask.duration}
                  onChange={(e) => setNewTask({ ...newTask, duration: parseFloat(e.target.value) })}
                >
                  <option value={0.25}>15 minutes</option>
                  <option value={0.5}>30 minutes</option>
                  <option value={0.75}>45 minutes</option>
                  <option value={1}>1 hour</option>
                  <option value={1.5}>1.5 hours</option>
                  <option value={2}>2 hours</option>
                  <option value={3}>3 hours</option>
                  <option value={4}>4 hours</option>
                </select>
              </div>

              <div style={styles.formField}>
                <label style={{ color: theme.textLight, fontSize: '0.85rem', marginBottom: '6px', display: 'block' }}>
                  Category
                </label>
                <select
                  style={{
                    ...styles.input,
                    background: theme.accent,
                    border: `2px solid ${theme.border}`,
                    color: theme.text,
                  }}
                  value={newTask.category}
                  onChange={(e) => {
                    const cat = taskColors.find(c => c.label === e.target.value);
                    setNewTask({ ...newTask, category: e.target.value, color: cat?.color || '#7c6fcd' });
                  }}
                >
                  {taskColors.map(c => (
                    <option key={c.label} value={c.label}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginTop: '12px' }}>
              <label style={{ color: theme.textLight, fontSize: '0.85rem', marginBottom: '8px', display: 'block' }}>
                Pick an emoji
              </label>
              <div style={styles.emojiRow}>
                {emojis.map(e => (
                  <span
                    key={e}
                    onClick={() => setNewTask({ ...newTask, emoji: e })}
                    style={{
                      ...styles.emojiBtn,
                      background: newTask.emoji === e ? theme.primary : theme.accent,
                      fontSize: '1.3rem',
                    }}
                  >
                    {e}
                  </span>
                ))}
              </div>
            </div>

            <button
              style={{ ...styles.submitBtn, background: theme.gradient, marginTop: '16px' }}
              onClick={addTimelineTask}
            >
              Add to Timeline 🕐
            </button>
          </div>
        )}

        {/* Timeline */}
        <div style={{
          ...styles.card,
          background: theme.card,
          border: `1.5px solid ${theme.border}`,
          padding: '0',
          overflow: 'hidden',
        }}>
          {HOURS.map(hour => {
            const tasks = getTasksForHour(hour);
            const isCurrentHour = hour === currentHour;
            const isPast = hour < currentHour;

            return (
              <div
                key={hour}
                ref={isCurrentHour ? currentTimeRef : null}
                style={{
                  display: 'flex',
                  borderBottom: `1px solid ${theme.border}`,
                  minHeight: '64px',
                  background: isCurrentHour ? theme.accent + '88' : 'transparent',
                  opacity: isPast && tasks.length === 0 ? 0.4 : 1,
                  transition: 'all 0.2s',
                }}
              >
                {/* Hour Label */}
                <div style={{
                  width: '90px',
                  flexShrink: 0,
                  padding: '12px 16px',
                  borderRight: `1.5px solid ${theme.border}`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  justifyContent: 'flex-start',
                  gap: '2px',
                }}>
                  <span style={{
                    color: isCurrentHour ? theme.primary : theme.textLight,
                    fontSize: '0.78rem',
                    fontWeight: isCurrentHour ? '700' : '400',
                  }}>
                    {formatHour(hour)}
                  </span>
                  {isCurrentHour && (
                    <span style={{
                      fontSize: '0.7rem',
                      color: theme.primary,
                      fontWeight: '700',
                    }}>
                      NOW
                    </span>
                  )}
                </div>

                {/* Tasks Area */}
                <div style={{
                  flex: 1,
                  padding: '8px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}>
                  {/* Current time indicator */}
                  {isCurrentHour && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '4px',
                    }}>
                      <div style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: theme.primary,
                        flexShrink: 0,
                        boxShadow: `0 0 8px ${theme.primary}`,
                      }} />
                      <div style={{
                        flex: 1,
                        height: '2px',
                        background: theme.primary,
                        opacity: 0.5,
                      }} />
                      <span style={{ color: theme.primary, fontSize: '0.75rem', fontWeight: '700' }}>
                        {String(currentHour).padStart(2, '0')}:{String(currentMinute).padStart(2, '0')}
                      </span>
                    </div>
                  )}

                  {tasks.map(task => (
                    <div
                      key={task.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        background: task.color + '22',
                        border: `1.5px solid ${task.color}44`,
                        opacity: task.completed ? 0.6 : 1,
                      }}
                    >
                      <div
                        style={{
                          width: '4px',
                          height: '100%',
                          minHeight: '20px',
                          borderRadius: '2px',
                          background: task.color,
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ fontSize: '1.1rem' }}>{task.emoji}</span>
                      <div style={{ flex: 1 }}>
                        <p style={{
                          color: theme.text,
                          fontWeight: '600',
                          fontSize: '0.9rem',
                          textDecoration: task.completed ? 'line-through' : 'none',
                        }}>
                          {task.title}
                        </p>
                        <p style={{ color: theme.textLight, fontSize: '0.75rem' }}>
                          {formatHour(task.hour)} · {task.duration < 1
                            ? `${task.duration * 60} min`
                            : `${task.duration} hr${task.duration > 1 ? 's' : ''}`
                          } · {task.category}
                        </p>
                      </div>
                      <div style={styles.taskActions}>
                        <div
                          onClick={() => toggleTimelineTask(task)}
                          style={{
                            width: '22px',
                            height: '22px',
                            borderRadius: '6px',
                            border: `2px solid ${task.completed ? task.color : theme.border}`,
                            background: task.completed ? task.color : 'transparent',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {task.completed && <span style={{ color: '#fff', fontSize: '0.7rem' }}>✓</span>}
                        </div>
                        <button
                          onClick={() => deleteTimelineTask(task.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: theme.textLight,
                            fontSize: '0.9rem',
                            padding: '2px',
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Add task button on hover */}
                  {tasks.length === 0 && (
                    <button
                      onClick={() => {
                        setNewTask({ ...newTask, hour });
                        setShowForm(true);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      style={{
                        background: 'transparent',
                        border: `1.5px dashed ${theme.border}`,
                        borderRadius: '8px',
                        padding: '6px 12px',
                        cursor: 'pointer',
                        color: theme.textLight,
                        fontSize: '0.78rem',
                        textAlign: 'left',
                        display: 'none',
                      }}
                      className="add-hour-btn"
                    >
                      + Add task
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const styles = {
  content: { maxWidth: '860px', margin: '0 auto', padding: '32px 16px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  addBtn: { padding: '12px 24px', borderRadius: '12px', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '0.95rem' },
  card: { borderRadius: '18px', padding: '24px', marginBottom: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  formField: { display: 'flex', flexDirection: 'column' },
  input: { padding: '12px 16px', borderRadius: '12px', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', width: '100%' },
  emojiRow: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  emojiBtn: { width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  submitBtn: { width: '100%', padding: '14px', borderRadius: '12px', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '1rem' },
  taskActions: { display: 'flex', alignItems: 'center', gap: '6px' },
};