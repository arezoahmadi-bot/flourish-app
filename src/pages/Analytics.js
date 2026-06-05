import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function Analytics() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [goals, setGoals] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [moodLogs, setMoodLogs] = useState([]);
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const [goalsRes, tasksRes, moodRes, habitsRes] = await Promise.all([
      supabase.from('goals').select('*').eq('user_id', user.id),
      supabase.from('tasks').select('*').eq('user_id', user.id),
      supabase.from('mood_logs').select('*').eq('user_id', user.id).order('date', { ascending: true }).limit(30),
      supabase.from('habits').select('*').eq('user_id', user.id),
    ]);
    setGoals(goalsRes.data || []);
    setTasks(tasksRes.data || []);
    setMoodLogs(moodRes.data || []);
    setHabits(habitsRes.data || []);
    setLoading(false);
  };

  const goalsByType = ['daily', 'weekly', 'monthly', 'annual'].map(type => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    total: goals.filter(g => g.type === type).length,
    completed: goals.filter(g => g.type === type && g.completed).length,
  }));

  const completedTasks = tasks.filter(t => t.completed).length;
  const pendingTasks = tasks.filter(t => !t.completed).length;
  const pieData = [
    { name: 'Completed', value: completedTasks },
    { name: 'Pending', value: pendingTasks },
  ];

  const goalsProgress = goals.slice(0, 6).map(g => ({
    name: g.title.length > 15 ? g.title.substring(0, 15) + '...' : g.title,
    progress: g.progress,
  }));

  const moodChartData = moodLogs.slice(-14).map(log => ({
    date: new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    mood: log.mood,
    energy: log.energy,
  }));

  const avgMood = moodLogs.length > 0
    ? (moodLogs.reduce((s, m) => s + m.mood, 0) / moodLogs.length).toFixed(1)
    : 0;

  const totalHabitStreak = habits.reduce((s, h) => s + (h.streak || 0), 0);
  const COLORS = [theme.primary, theme.secondary, '#00c853', '#ffab00', '#00bcd4'];

  return (
    <div style={{ minHeight: '100vh', background: theme.background }}>
      <Navbar />
      <div style={styles.content}>
        <h1 style={{ color: theme.text, fontSize: '2rem', fontWeight: '700', marginBottom: '4px' }}>📊 Analytics</h1>
        <p style={{ color: theme.textLight, marginBottom: '28px' }}>Your progress at a glance 🌿</p>

        {loading ? <p style={{ color: theme.textLight }}>Loading analytics...</p> : (
          <>
            <div style={styles.statsRow}>
              {[
                { emoji: '🎯', value: goals.length, label: 'Total Goals' },
                { emoji: '🏆', value: goals.filter(g => g.completed).length, label: 'Completed Goals' },
                { emoji: '📝', value: tasks.length, label: 'Total Tasks' },
                { emoji: '😊', value: avgMood, label: 'Avg Mood' },
                { emoji: '🔥', value: totalHabitStreak, label: 'Total Habit Streaks' },
                { emoji: '⚡', value: `${goals.length > 0 ? Math.round(goals.reduce((s, g) => s + g.progress, 0) / goals.length) : 0}%`, label: 'Avg Goal Progress' },
              ].map((stat, i) => (
                <div key={i} style={{ ...styles.statCard, background: theme.card, border: `1.5px solid ${theme.border}` }}>
                  <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>{stat.emoji}</div>
                  <div style={{ color: theme.primary, fontSize: '1.6rem', fontWeight: '700' }}>{stat.value}</div>
                  <div style={{ color: theme.textLight, fontSize: '0.78rem' }}>{stat.label}</div>
                </div>
              ))}
            </div>

            <div style={{ ...styles.card, background: theme.card, border: `1.5px solid ${theme.border}` }}>
              <h2 style={{ color: theme.text, fontSize: '1.1rem', fontWeight: '600', marginBottom: '20px' }}>📊 Goals by Type</h2>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={goalsByType}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.border} />
                  <XAxis dataKey="name" tick={{ fill: theme.textLight }} />
                  <YAxis tick={{ fill: theme.textLight }} />
                  <Tooltip contentStyle={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: '10px' }} />
                  <Legend />
                  <Bar dataKey="total" fill={theme.primary} name="Total" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="completed" fill="#00c853" name="Completed" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={styles.chartsRow}>
              <div style={{ ...styles.card, background: theme.card, border: `1.5px solid ${theme.border}` }}>
                <h2 style={{ color: theme.text, fontSize: '1.1rem', fontWeight: '600', marginBottom: '20px' }}>✅ Tasks Overview</h2>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {pieData.map((entry, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div style={{ ...styles.card, background: theme.card, border: `1.5px solid ${theme.border}` }}>
                <h2 style={{ color: theme.text, fontSize: '1.1rem', fontWeight: '600', marginBottom: '20px' }}>🚀 Goals Progress</h2>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={goalsProgress} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.border} />
                    <XAxis type="number" domain={[0, 100]} tick={{ fill: theme.textLight }} />
                    <YAxis dataKey="name" type="category" width={100} tick={{ fill: theme.textLight, fontSize: 11 }} />
                    <Tooltip formatter={(value) => `${value}%`} contentStyle={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: '10px' }} />
                    <Bar dataKey="progress" radius={[0, 6, 6, 0]} name="Progress %">
                      {goalsProgress.map((entry, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {moodChartData.length > 1 && (
              <div style={{ ...styles.card, background: theme.card, border: `1.5px solid ${theme.border}` }}>
                <h2 style={{ color: theme.text, fontSize: '1.1rem', fontWeight: '600', marginBottom: '20px' }}>💆 Mood & Energy Trends</h2>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={moodChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.border} />
                    <XAxis dataKey="date" tick={{ fill: theme.textLight, fontSize: 11 }} />
                    <YAxis domain={[1, 5]} tick={{ fill: theme.textLight }} />
                    <Tooltip contentStyle={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: '10px' }} />
                    <Legend />
                    <Line type="monotone" dataKey="mood" stroke={theme.primary} strokeWidth={3} dot={{ fill: theme.primary, r: 4 }} name="Mood" />
                    <Line type="monotone" dataKey="energy" stroke={theme.secondary} strokeWidth={3} strokeDasharray="5 5" dot={{ fill: theme.secondary, r: 4 }} name="Energy" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  content: { maxWidth: '1000px', margin: '0 auto', padding: '32px 16px' },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' },
  statCard: { borderRadius: '16px', padding: '20px', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' },
  card: { borderRadius: '18px', padding: '24px', marginBottom: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' },
  chartsRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
};