import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  { label: 'Sleep 🌙', color: '#3d2d7a' },
  { label: 'Other ⭐', color: '#e8a87c' },
];

const formatHour = (hour) => {
  if (hour === 0) return '12:00 AM';
  if (hour < 12) return `${hour}:00 AM`;
  if (hour === 12) return '12:00 PM';
  return `${hour - 12}:00 PM`;
};

const HOUR_HEIGHT = 80;
const EMOJIS = ['📝', '📚', '🏃', '☕', '🍽️', '💼', '🎯', '🧘', '🌿', '💪', '🎨', '🎵', '💤', '🚿', '🏠', '🌙'];
const MINUTES = [0, 15, 30, 45];

// TaskForm is outside main component to prevent re-renders
const TaskForm = React.memo(({ data, setData, onSave, onCancel, theme }) => (
  <div style={{
    borderRadius: '14px',
    padding: '16px',
    background: theme.accent,
    border: `1.5px solid ${theme.border}`,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  }}>
    <input
      autoFocus
      style={{
        width: '100%',
        padding: '10px 14px',
        borderRadius: '10px',
        fontSize: '0.92rem',
        outline: 'none',
        boxSizing: 'border-box',
        background: theme.card,
        border: `2px solid ${theme.border}`,
        color: theme.text,
      }}
      type="text"
      placeholder="Task title"
      value={data.title}
      onChange={(e) => setData(prev => ({ ...prev, title: e.target.value }))}
    />

    <div style={{ display: 'flex', gap: '12px' }}>
      <div style={{ flex: 1 }}>
        <label style={{ color: theme.textLight, fontSize: '0.78rem', marginBottom: '4px', display: 'block' }}>
          Start Time
        </label>
        <div style={{ display: 'flex', gap: '6px' }}>
          <select
            style={{
              flex: 1, padding: '8px 10px', borderRadius: '10px',
              fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box',
              background: theme.card, border: `2px solid ${theme.border}`, color: theme.text,
            }}
            value={data.start_hour}
            onChange={(e) => setData(prev => ({ ...prev, start_hour: parseInt(e.target.value) }))}
          >
            {HOURS.map(h => <option key={h} value={h}>{formatHour(h)}</option>)}
          </select>
          <select
            style={{
              width: '70px', padding: '8px 6px', borderRadius: '10px',
              fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box',
              background: theme.card, border: `2px solid ${theme.border}`, color: theme.text,
            }}
            value={data.start_minute}
            onChange={(e) => setData(prev => ({ ...prev, start_minute: parseInt(e.target.value) }))}
          >
            {MINUTES.map(m => <option key={m} value={m}>:{String(m).padStart(2, '0')}</option>)}
          </select>
        </div>
      </div>

      <div style={{ flex: 1 }}>
        <label style={{ color: theme.textLight, fontSize: '0.78rem', marginBottom: '4px', display: 'block' }}>
          End Time
        </label>
        <div style={{ display: 'flex', gap: '6px' }}>
          <select
            style={{
              flex: 1, padding: '8px 10px', borderRadius: '10px',
              fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box',
              background: theme.card, border: `2px solid ${theme.border}`, color: theme.text,
            }}
            value={data.end_hour}
            onChange={(e) => setData(prev => ({ ...prev, end_hour: parseInt(e.target.value) }))}
          >
            {HOURS.map(h => <option key={h} value={h}>{formatHour(h)}</option>)}
          </select>
          <select
            style={{
              width: '70px', padding: '8px 6px', borderRadius: '10px',
              fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box',
              background: theme.card, border: `2px solid ${theme.border}`, color: theme.text,
            }}
            value={data.end_minute}
            onChange={(e) => setData(prev => ({ ...prev, end_minute: parseInt(e.target.value) }))}
          >
            {MINUTES.map(m => <option key={m} value={m}>:{String(m).padStart(2, '0')}</option>)}
          </select>
        </div>
      </div>
    </div>

    <div>
      <label style={{ color: theme.textLight, fontSize: '0.78rem', marginBottom: '6px', display: 'block' }}>
        Category
      </label>
      <select
        style={{
          width: '100%', padding: '10px 14px', borderRadius: '10px',
          fontSize: '0.92rem', outline: 'none', boxSizing: 'border-box',
          background: theme.card, border: `2px solid ${theme.border}`, color: theme.text,
        }}
        value={data.category}
        onChange={(e) => {
          const cat = taskColors.find(c => c.label === e.target.value);
          setData(prev => ({ ...prev, category: e.target.value, color: cat?.color || prev.color }));
        }}
      >
        {taskColors.map(c => <option key={c.label} value={c.label}>{c.label}</option>)}
      </select>
    </div>

    <div>
      <label style={{ color: theme.textLight, fontSize: '0.78rem', marginBottom: '6px', display: 'block' }}>
        Emoji
      </label>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {EMOJIS.map(e => (
          <span
            key={e}
            onClick={() => setData(prev => ({ ...prev, emoji: e }))}
            style={{
              width: '36px', height: '36px', borderRadius: '8px',
              background: data.emoji === e ? theme.primary : theme.card,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', fontSize: '1.1rem',
            }}
          >
            {e}
          </span>
        ))}
      </div>
    </div>

    <div style={{ display: 'flex', gap: '8px' }}>
      <button
        onClick={onCancel}
        style={{
          flex: 1, padding: '10px', borderRadius: '10px',
          background: theme.card, border: `1px solid ${theme.border}`,
          color: theme.textLight, cursor: 'pointer', fontWeight: '600',
        }}
      >
        Cancel
      </button>
      <button
        onClick={onSave}
        style={{
          flex: 1, padding: '10px', borderRadius: '10px',
          background: theme.gradient, border: 'none',
          color: '#fff', cursor: 'pointer', fontWeight: '700',
        }}
      >
        💾 Save
      </button>
    </div>
  </div>
));

export default function Timeline() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [timelineTasks, setTimelineTasks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [currentHour, setCurrentHour] = useState(new Date().getHours());
  const [currentMinute, setCurrentMinute] = useState(new Date().getMinutes());
  const currentTimeRef = useRef(null);

  const [newTask, setNewTask] = useState({
    title: '',
    start_hour: 8,
    start_minute: 0,
    end_hour: 9,
    end_minute: 0,
    color: '#7c6fcd',
    emoji: '📝',
    category: 'Study 📚',
  });

  const [editTask, setEditTask] = useState(null);

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
      .order('start_hour', { ascending: true });
    setTimelineTasks(data || []);
  };

  const getDuration = (task) => {
    const startMins = (task.start_hour ?? task.hour ?? 0) * 60 + (task.start_minute ?? 0);
    const endMins = (task.end_hour ?? ((task.hour ?? 0) + (task.duration ?? 1))) * 60 + (task.end_minute ?? 0);
    return Math.max(0.25, (endMins - startMins) / 60);
  };

  const addTimelineTask = useCallback(async () => {
    if (!newTask.title.trim()) return;
    const duration = getDuration(newTask);
    const { data, error } = await supabase
      .from('timeline_tasks')
      .insert([{
        user_id: user.id,
        title: newTask.title,
        hour: newTask.start_hour,
        start_hour: newTask.start_hour,
        start_minute: newTask.start_minute,
        end_hour: newTask.end_hour,
        end_minute: newTask.end_minute,
        duration,
        color: newTask.color,
        emoji: newTask.emoji,
        category: newTask.category,
        date: today,
        completed: false,
      }])
      .select();
    if (error) { alert('Error: ' + error.message); return; }
    setTimelineTasks(prev => [...prev, ...data].sort((a, b) =>
      (a.start_hour ?? a.hour ?? 0) - (b.start_hour ?? b.hour ?? 0)));
    setShowForm(false);
    setNewTask({
      title: '', start_hour: 8, start_minute: 0,
      end_hour: 9, end_minute: 0,
      color: '#7c6fcd', emoji: '📝', category: 'Study 📚',
    });
  }, [newTask, user.id, today]);

  const startEdit = useCallback((task) => {
    setEditingTask(task.id);
    setEditTask({
      title: task.title,
      start_hour: task.start_hour ?? task.hour ?? 0,
      start_minute: task.start_minute ?? 0,
      end_hour: task.end_hour ?? Math.min(23, (task.hour ?? 0) + Math.floor(task.duration ?? 1)),
      end_minute: task.end_minute ?? 0,
      color: task.color,
      emoji: task.emoji,
      category: task.category,
    });
  }, []);

  const saveEdit = useCallback(async (id) => {
    if (!editTask?.title.trim()) return;
    const duration = getDuration(editTask);
    const { data } = await supabase
      .from('timeline_tasks')
      .update({
        title: editTask.title,
        hour: editTask.start_hour,
        start_hour: editTask.start_hour,
        start_minute: editTask.start_minute,
        end_hour: editTask.end_hour,
        end_minute: editTask.end_minute,
        duration,
        color: editTask.color,
        emoji: editTask.emoji,
        category: editTask.category,
      })
      .eq('id', id)
      .select();
    setTimelineTasks(prev => prev.map(t => t.id === id ? data[0] : t)
      .sort((a, b) => (a.start_hour ?? a.hour ?? 0) - (b.start_hour ?? b.hour ?? 0)));
    setEditingTask(null);
    setEditTask(null);
  }, [editTask]);

  const toggleTimelineTask = useCallback(async (task) => {
    const { data } = await supabase
      .from('timeline_tasks')
      .update({ completed: !task.completed })
      .eq('id', task.id)
      .select();
    setTimelineTasks(prev => prev.map(t => t.id === task.id ? data[0] : t));
  }, []);

  const deleteTimelineTask = useCallback(async (id) => {
    await supabase.from('timeline_tasks').delete().eq('id', id);
    setTimelineTasks(prev => prev.filter(t => t.id !== id));
  }, []);

  const addSleepCycle = () => {
    setNewTask({
      title: 'Sleep 💤',
      start_hour: 23,
      start_minute: 0,
      end_hour: 7,
      end_minute: 0,
      color: '#3d2d7a',
      emoji: '🌙',
      category: 'Sleep 🌙',
    });
    setShowForm(true);
  };

  const getTaskStyle = (task) => {
    const startHour = task.start_hour ?? task.hour ?? 0;
    const startMinute = task.start_minute ?? 0;
    const endHour = task.end_hour ?? Math.min(23, startHour + Math.floor(task.duration ?? 1));
    const endMinute = task.end_minute ?? 0;
    const topOffset = (startMinute / 60) * HOUR_HEIGHT;
    const durationMins = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
    const height = Math.max(40, (durationMins / 60) * HOUR_HEIGHT);
    return { topOffset, height };
  };

  return (
    <div style={{ minHeight: '100vh', background: theme.background }}>
      <Navbar />
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '32px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ color: theme.text, fontSize: '2rem', fontWeight: '700', marginBottom: '4px' }}>
              🕐 Daily Timeline
            </h1>
            <p style={{ color: theme.textLight }}>📅 {dateHeading}</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              style={{
                padding: '10px 16px', borderRadius: '12px',
                background: '#3d2d7a22', color: '#3d2d7a',
                border: '1.5px solid #3d2d7a44', cursor: 'pointer',
                fontWeight: '700', fontSize: '0.88rem',
              }}
              onClick={addSleepCycle}
            >
              🌙 Add Sleep
            </button>
            <button
              style={{
                padding: '10px 20px', borderRadius: '12px',
                background: theme.gradient, color: '#fff',
                border: 'none', cursor: 'pointer',
                fontWeight: '700', fontSize: '0.95rem',
              }}
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? '✕ Cancel' : '+ Add Task'}
            </button>
          </div>
        </div>

        {showForm && (
          <div style={{
            borderRadius: '18px', padding: '24px', marginBottom: '20px',
            background: theme.card, border: `1.5px solid ${theme.border}`,
            boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
          }}>
            <h2 style={{ color: theme.text, fontSize: '1.1rem', fontWeight: '600', marginBottom: '16px' }}>
              ➕ Add to Timeline
            </h2>
            <TaskForm
              data={newTask}
              setData={setNewTask}
              onSave={addTimelineTask}
              onCancel={() => setShowForm(false)}
              theme={theme}
            />
          </div>
        )}

        <div style={{
          borderRadius: '18px', marginBottom: '20px',
          background: theme.card, border: `1.5px solid ${theme.border}`,
          boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
          overflow: 'hidden',
        }}>
          <div style={{ position: 'relative' }}>
            {HOURS.map(hour => {
              const isCurrentHour = hour === currentHour;
              const tasksInHour = timelineTasks.filter(t =>
                (t.start_hour ?? t.hour ?? 0) === hour
              );

              return (
                <div
                  key={hour}
                  ref={isCurrentHour ? currentTimeRef : null}
                  style={{
                    display: 'flex',
                    borderBottom: `1px solid ${theme.border}`,
                    minHeight: `${HOUR_HEIGHT}px`,
                    position: 'relative',
                    background: isCurrentHour ? theme.accent + '44' : 'transparent',
                  }}
                >
                  <div style={{
                    width: '80px', flexShrink: 0,
                    padding: '8px 12px',
                    borderRight: `1.5px solid ${theme.border}`,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'flex-end', justifyContent: 'flex-start',
                    gap: '2px',
                  }}>
                    <span style={{
                      color: isCurrentHour ? theme.primary : theme.textLight,
                      fontSize: '0.72rem',
                      fontWeight: isCurrentHour ? '700' : '400',
                    }}>
                      {formatHour(hour)}
                    </span>
                    {isCurrentHour && (
                      <span style={{ fontSize: '0.65rem', color: theme.primary, fontWeight: '700' }}>
                        NOW
                      </span>
                    )}
                  </div>

                  <div style={{ flex: 1, padding: '4px 8px', position: 'relative', minHeight: `${HOUR_HEIGHT}px` }}>
                    {isCurrentHour && (
                      <div style={{
                        position: 'absolute',
                        top: `${(currentMinute / 60) * HOUR_HEIGHT}px`,
                        left: 0, right: 0,
                        display: 'flex', alignItems: 'center',
                        zIndex: 10, pointerEvents: 'none',
                      }}>
                        <div style={{
                          width: '10px', height: '10px', borderRadius: '50%',
                          background: theme.primary, flexShrink: 0,
                          boxShadow: `0 0 8px ${theme.primary}`,
                        }} />
                        <div style={{ flex: 1, height: '2px', background: theme.primary, opacity: 0.6 }} />
                      </div>
                    )}

                    {tasksInHour.map(task => {
                      const { topOffset, height } = getTaskStyle(task);
                      const isSleep = task.category === 'Sleep 🌙';

                      return (
                        <div key={task.id} style={{ position: 'relative', marginBottom: '4px' }}>
                          {editingTask === task.id && editTask ? (
                            <div style={{ marginTop: `${topOffset}px` }}>
                              <TaskForm
                                data={editTask}
                                setData={setEditTask}
                                onSave={() => saveEdit(task.id)}
                                onCancel={() => setEditingTask(null)}
                                theme={theme}
                              />
                            </div>
                          ) : (
                            <div style={{
                              marginTop: `${topOffset}px`,
                              height: `${height}px`,
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '8px',
                              padding: '8px 12px',
                              borderRadius: '10px',
                              background: isSleep
                                ? 'linear-gradient(135deg, #1a1a3e, #3d2d7a)'
                                : task.color + '22',
                              border: `1.5px solid ${task.color}44`,
                              opacity: task.completed ? 0.6 : 1,
                              overflow: 'hidden',
                            }}>
                              <div style={{
                                width: '4px', alignSelf: 'stretch',
                                borderRadius: '2px', background: task.color, flexShrink: 0,
                              }} />
                              <span style={{ fontSize: '1rem', flexShrink: 0 }}>{task.emoji}</span>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{
                                  color: isSleep ? '#fff' : theme.text,
                                  fontWeight: '600', fontSize: '0.85rem',
                                  textDecoration: task.completed ? 'line-through' : 'none',
                                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                }}>
                                  {task.title}
                                </p>
                                <p style={{ color: isSleep ? 'rgba(255,255,255,0.7)' : theme.textLight, fontSize: '0.72rem' }}>
                                  {formatHour(task.start_hour ?? task.hour ?? 0)}
                                  {task.start_minute ? `:${String(task.start_minute).padStart(2, '0')}` : ''}
                                  {' → '}
                                  {formatHour(task.end_hour ?? Math.min(23, (task.hour ?? 0) + Math.floor(task.duration ?? 1)))}
                                  {task.end_minute ? `:${String(task.end_minute).padStart(2, '0')}` : ''}
                                  {' · '}
                                  {getDuration(task) < 1
                                    ? `${Math.round(getDuration(task) * 60)} min`
                                    : `${getDuration(task).toFixed(1)} hrs`}
                                </p>
                              </div>
                              <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                                <div
                                  onClick={() => toggleTimelineTask(task)}
                                  style={{
                                    width: '20px', height: '20px', borderRadius: '6px',
                                    border: `2px solid ${task.completed ? task.color : theme.border}`,
                                    background: task.completed ? task.color : 'transparent',
                                    cursor: 'pointer', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center',
                                  }}
                                >
                                  {task.completed && <span style={{ color: '#fff', fontSize: '0.6rem' }}>✓</span>}
                                </div>
                                <button
                                  onClick={() => startEdit(task)}
                                  style={{
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    fontSize: '0.85rem', padding: '2px',
                                    color: isSleep ? '#fff' : theme.textLight,
                                  }}
                                >✏️</button>
                                <button
                                  onClick={() => deleteTimelineTask(task.id)}
                                  style={{
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    fontSize: '0.85rem', padding: '2px',
                                    color: isSleep ? '#fff' : theme.textLight,
                                  }}
                                >🗑️</button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}