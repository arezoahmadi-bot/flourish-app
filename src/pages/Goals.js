import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const goalEmojis = ['🎯', '💪', '📚', '🏃', '🎨', '💡', '🌟', '❤️', '🏆', '🚀', '🌱', '✨', '🦋', '🎵', '🧘'];

export default function Goals() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [goals, setGoals] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    type: 'daily',
    emoji: '🎯',
    target_date: '',
    start_date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => { fetchGoals(); }, []);

  const fetchGoals = async () => {
    const { data } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setGoals(data || []);
  };

  const addGoal = async () => {
  if (!newGoal.title.trim()) {
    alert('Please enter a goal title! 🌱');
    return;
  }
  if (!newGoal.target_date) {
    alert('Please enter a deadline date! 📅');
    return;
  }
  const { data, error } = await supabase
    .from('goals')
    .insert([{ ...newGoal, user_id: user.id }])
    .select();
  if (error) {
    alert('Error creating goal: ' + error.message);
    return;
  }
  if (data && data.length > 0) setGoals([...data, ...goals]);
  setNewGoal({ title: '', description: '', type: 'daily', emoji: '🎯', target_date: '', start_date: new Date().toISOString().split('T')[0] });
  setShowForm(false);
};
  const deleteGoal = async (id) => {
    await supabase.from('goals').delete().eq('id', id);
    setGoals(goals.filter(g => g.id !== id));
  };

  const updateProgress = async (goal, amount) => {
    const newProgress = Math.min(100, Math.max(0, goal.progress + amount));
    const { data } = await supabase
      .from('goals')
      .update({ progress: newProgress, completed: newProgress === 100 })
      .eq('id', goal.id)
      .select();
    setGoals(goals.map(g => g.id === goal.id ? data[0] : g));
  };

  const typeColors = {
    daily: { bg: '#e8f5e9', text: '#2e7d32' },
    weekly: { bg: '#e3f2fd', text: '#1565c0' },
    monthly: { bg: '#fce4ec', text: '#c62828' },
    annual: { bg: '#f3e5f5', text: '#6a1b9a' },
  };

  return (
    <div style={{ minHeight: '100vh', background: theme.background }}>
      <Navbar />
      <div style={styles.content}>
        <div style={styles.header}>
          <div>
            <h1 style={{ color: theme.text, fontSize: '2rem', fontWeight: '700' }}>🎯 My Goals</h1>
            <p style={{ color: theme.textLight, marginTop: '4px' }}>Break big dreams into daily actions</p>
          </div>
          <button style={{ ...styles.addBtn, background: theme.gradient }} onClick={() => setShowForm(!showForm)}>
            {showForm ? '✕ Cancel' : '+ New Goal'}
          </button>
        </div>

        {showForm && (
          <div style={{ ...styles.card, background: theme.card, border: `1.5px solid ${theme.border}` }}>
            <h2 style={{ color: theme.text, marginBottom: '16px' }}>Create New Goal</h2>
            <div style={styles.emojiRow}>
              {goalEmojis.map(e => (
                <span key={e} onClick={() => setNewGoal({ ...newGoal, emoji: e })}
                  style={{ ...styles.emojiBtn, background: newGoal.emoji === e ? theme.primary : theme.accent }}>
                  {e}
                </span>
              ))}
            </div>
            <input style={{ ...styles.input, background: theme.accent, border: `2px solid ${theme.border}`, color: theme.text, marginTop: '16px' }}
              type="text" placeholder="Goal title" value={newGoal.title}
              onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })} />
            <textarea style={{ ...styles.textarea, background: theme.accent, border: `2px solid ${theme.border}`, color: theme.text }}
              placeholder="Description (optional)" value={newGoal.description}
              onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })} />
            <select style={{ ...styles.input, background: theme.accent, border: `2px solid ${theme.border}`, color: theme.text }}
              value={newGoal.type} onChange={(e) => setNewGoal({ ...newGoal, type: e.target.value })}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="annual">Annual</option>
            </select>
            <div style={styles.dateRow}>
              <div style={styles.dateField}>
                <label style={{ color: theme.textLight, fontSize: '0.85rem' }}>Start Date</label>
                <input style={{ ...styles.input, background: theme.accent, border: `2px solid ${theme.border}`, color: theme.text }}
                  type="date" value={newGoal.start_date}
                  onChange={(e) => setNewGoal({ ...newGoal, start_date: e.target.value })} />
              </div>
              <div style={styles.dateField}>
                <label style={{ color: theme.textLight, fontSize: '0.85rem' }}>Target/Deadline Date</label>
                <input style={{ ...styles.input, background: theme.accent, border: `2px solid ${theme.border}`, color: theme.text }}
                  type="date" value={newGoal.target_date}
                  onChange={(e) => setNewGoal({ ...newGoal, target_date: e.target.value })} />
              </div>
            </div>
            <button style={{ ...styles.submitBtn, background: theme.gradient }} onClick={addGoal}>
              Create Goal 🚀
            </button>
          </div>
        )}

        {goals.length === 0 ? (
          <div style={{ ...styles.card, background: theme.card, border: `1.5px solid ${theme.border}`, textAlign: 'center', padding: '60px' }}>
            <p style={{ fontSize: '3rem' }}>🎯</p>
            <p style={{ color: theme.textLight, marginTop: '12px' }}>No goals yet! Create your first goal above.</p>
          </div>
        ) : (
          <div style={styles.grid}>
            {goals.map(goal => (
              <div key={goal.id} style={{ ...styles.goalCard, background: theme.card, border: `1.5px solid ${theme.border}` }}>
                <div style={styles.goalHeader}>
                  <span style={{ fontSize: '2rem' }}>{goal.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ color: theme.text, fontSize: '1rem', fontWeight: '600' }}>{goal.title}</h3>
                    <span style={{ ...styles.typeBadge, background: typeColors[goal.type]?.bg, color: typeColors[goal.type]?.text }}>
                      {goal.type}
                    </span>
                  </div>
                  <button onClick={() => deleteGoal(goal.id)} style={styles.deleteBtn}>🗑️</button>
                </div>

                {goal.description && <p style={{ color: theme.textLight, fontSize: '0.88rem', marginBottom: '12px' }}>{goal.description}</p>}

                <div style={{ ...styles.progressBar, background: theme.accent }}>
                  <div style={{
                    ...styles.progressFill, width: `${goal.progress}%`,
                    background: goal.completed ? 'linear-gradient(135deg, #00c853, #69f0ae)' : theme.gradient,
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ color: theme.textLight, fontSize: '0.82rem' }}>{goal.progress}% complete</span>
                  {goal.completed && <span style={{ color: '#00c853', fontWeight: '700', fontSize: '0.85rem' }}>🏆 Done!</span>}
                </div>

                {goal.target_date && (
                  <p style={{ color: theme.textLight, fontSize: '0.82rem', marginBottom: '12px' }}>
                    📅 Deadline: {new Date(goal.target_date).toLocaleDateString()}
                  </p>
                )}

                {!goal.completed && (
                  <div style={styles.controls}>
                    <button style={{ ...styles.ctrlBtn, background: theme.accent, color: theme.textLight }} onClick={() => updateProgress(goal, -10)}>-10%</button>
                    <button style={{ ...styles.ctrlBtn, background: theme.accent, color: theme.textLight }} onClick={() => updateProgress(goal, 10)}>+10%</button>
                    <button style={{ ...styles.ctrlBtn, background: theme.accent, color: theme.textLight }} onClick={() => updateProgress(goal, 25)}>+25%</button>
                    <button style={{ ...styles.ctrlBtn, background: '#00c853', color: '#fff' }} onClick={() => updateProgress(goal, 100)}>✓ Done</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  content: { maxWidth: '1000px', margin: '0 auto', padding: '32px 16px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  addBtn: { padding: '12px 24px', borderRadius: '12px', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '0.95rem' },
  card: { borderRadius: '18px', padding: '24px', marginBottom: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '12px' },
  emojiRow: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  emojiBtn: { width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '1.3rem' },
  input: { width: '100%', padding: '12px 16px', borderRadius: '12px', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '12px 16px', borderRadius: '12px', fontSize: '0.95rem', outline: 'none', minHeight: '80px', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'DM Sans, sans-serif' },
  dateRow: { display: 'flex', gap: '12px' },
  dateField: { flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' },
  submitBtn: { padding: '14px', borderRadius: '12px', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '1rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' },
  goalCard: { borderRadius: '18px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' },
  goalHeader: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' },
  typeBadge: { fontSize: '0.72rem', padding: '2px 8px', borderRadius: '20px', fontWeight: '700', textTransform: 'uppercase' },
  deleteBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem' },
  progressBar: { borderRadius: '10px', height: '10px', overflow: 'hidden', marginBottom: '6px' },
  progressFill: { height: '100%', borderRadius: '10px', transition: 'width 0.5s ease' },
  controls: { display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' },
  ctrlBtn: { padding: '6px 10px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.82rem', fontWeight: '600' },
};