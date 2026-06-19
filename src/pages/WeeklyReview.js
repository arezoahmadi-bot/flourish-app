import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const weeklyMotivations = [
  "Every week is a new chance to grow! 🌱",
  "Progress over perfection, always! ✨",
  "You showed up — that's what matters! 💪",
  "Small wins lead to big victories! 🏆",
  "Keep going, you're doing amazing! 🌿",
];

export default function WeeklyReview() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [weekStats, setWeekStats] = useState({
    completedTasks: 0,
    totalTasks: 0,
    goalsProgressed: 0,
    habitsCompleted: 0,
    moodAvg: 0,
    bestDay: '',
    worstDay: '',
    productivityScore: 0,
  });
  const [dailyData, setDailyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [motivation] = useState(weeklyMotivations[Math.floor(Math.random() * weeklyMotivations.length)]);

  useEffect(() => { fetchWeekData(); }, []);

  const fetchWeekData = async () => {
    const today = new Date();
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    const startDate = weekDays[0];
    const endDate = weekDays[6];

    const [tasksRes, moodRes, habitsRes, goalsRes] = await Promise.all([
      supabase.from('tasks').select('*').eq('user_id', user.id)
        .gte('due_date', startDate).lte('due_date', endDate),
      supabase.from('mood_logs').select('*').eq('user_id', user.id)
        .gte('date', startDate).lte('date', endDate),
      supabase.from('habits').select('*').eq('user_id', user.id),
      supabase.from('goals').select('*').eq('user_id', user.id),
    ]);

    const tasks = tasksRes.data || [];
    const moodLogs = moodRes.data || [];
    const habits = habitsRes.data || [];
    const goals = goalsRes.data || [];

    const daily = weekDays.map(date => {
      const dayTasks = tasks.filter(t => t.due_date === date);
      const dayCompleted = dayTasks.filter(t => t.completed).length;
      const dayMood = moodLogs.find(m => m.date === date);
      const dayHabits = habits.filter(h =>
        (h.completed_dates || []).includes(date)
      ).length;
      const score = Math.round(
        (dayTasks.length > 0 ? (dayCompleted / dayTasks.length) * 40 : 0) +
        (dayMood ? (dayMood.mood / 5) * 30 : 0) +
        (habits.length > 0 ? (dayHabits / habits.length) * 30 : 0)
      );
      return {
        date,
        day: new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' }),
        tasks: dayCompleted,
        totalTasks: dayTasks.length,
        mood: dayMood?.mood || 0,
        habits: dayHabits,
        score,
      };
    });

    setDailyData(daily);

    const completedTasks = tasks.filter(t => t.completed).length;
    const avgMood = moodLogs.length > 0
      ? (moodLogs.reduce((s, m) => s + m.mood, 0) / moodLogs.length).toFixed(1)
      : 0;
    const bestDay = daily.reduce((best, d) => d.score > best.score ? d : best, daily[0]);
    const worstDay = daily.reduce((worst, d) => d.score < worst.score ? d : worst, daily[0]);
    const productivityScore = Math.round(daily.reduce((s, d) => s + d.score, 0) / 7);

    setWeekStats({
      completedTasks,
      totalTasks: tasks.length,
      goalsProgressed: goals.filter(g => g.progress > 0).length,
      habitsCompleted: habits.reduce((s, h) =>
        s + weekDays.filter(d => (h.completed_dates || []).includes(d)).length, 0),
      moodAvg: avgMood,
      bestDay: bestDay?.day || '–',
      worstDay: worstDay?.day || '–',
      productivityScore,
    });

    setLoading(false);
  };

  const getScoreColor = (score) => {
    if (score >= 70) return '#00c853';
    if (score >= 40) return '#ffab00';
    return '#f50057';
  };

  const getScoreLabel = (score) => {
    if (score >= 70) return 'Excellent! 🌟';
    if (score >= 40) return 'Good! 💪';
    return 'Keep going! 🌱';
  };

  return (
    <div style={{ minHeight: '100vh', background: theme.background }}>
      <Navbar />
      <div style={styles.content}>
        <h1 style={{ color: theme.text, fontSize: '2rem', fontWeight: '700', marginBottom: '4px' }}>
          📅 Weekly Review
        </h1>
        <p style={{ color: theme.textLight, marginBottom: '24px' }}>
          {motivation}
        </p>

        {loading ? (
          <p style={{ color: theme.textLight }}>Loading your week...</p>
        ) : (
          <>
            {/* Productivity Score */}
            <div style={{
              ...styles.card,
              background: theme.card,
              border: `1.5px solid ${theme.border}`,
              textAlign: 'center',
            }}>
              <h2 style={{ color: theme.text, fontSize: '1.1rem', fontWeight: '600', marginBottom: '16px' }}>
                ⚡ Weekly Productivity Score
              </h2>
              <div style={{
                width: '140px',
                height: '140px',
                borderRadius: '50%',
                background: `conic-gradient(${getScoreColor(weekStats.productivityScore)} ${weekStats.productivityScore * 3.6}deg, ${theme.accent} 0deg)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                position: 'relative',
              }}>
                <div style={{
                  width: '110px',
                  height: '110px',
                  borderRadius: '50%',
                  background: theme.card,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <span style={{
                    color: getScoreColor(weekStats.productivityScore),
                    fontSize: '2rem',
                    fontWeight: '700',
                  }}>
                    {weekStats.productivityScore}
                  </span>
                  <span style={{ color: theme.textLight, fontSize: '0.75rem' }}>out of 100</span>
                </div>
              </div>
              <p style={{
                color: getScoreColor(weekStats.productivityScore),
                fontWeight: '700',
                fontSize: '1.1rem',
              }}>
                {getScoreLabel(weekStats.productivityScore)}
              </p>
            </div>

            {/* Stats Grid */}
            <div style={styles.statsGrid}>
              {[
                { emoji: '✅', value: weekStats.completedTasks, label: 'Tasks Completed', sub: `of ${weekStats.totalTasks} total` },
                { emoji: '🎯', value: weekStats.goalsProgressed, label: 'Goals Progressed', sub: 'this week' },
                { emoji: '🌱', value: weekStats.habitsCompleted, label: 'Habit Check-ins', sub: 'this week' },
                { emoji: '😊', value: weekStats.moodAvg, label: 'Avg Mood', sub: 'out of 5' },
                { emoji: '🌟', value: weekStats.bestDay, label: 'Best Day', sub: 'highest score' },
                { emoji: '💪', value: weekStats.worstDay, label: 'Needs Work', sub: 'lowest score' },
              ].map((stat, i) => (
                <div key={i} style={{
                  ...styles.statCard,
                  background: theme.card,
                  border: `1.5px solid ${theme.border}`,
                }}>
                  <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>{stat.emoji}</div>
                  <div style={{ color: theme.primary, fontSize: '1.5rem', fontWeight: '700' }}>
                    {stat.value}
                  </div>
                  <div style={{ color: theme.text, fontSize: '0.82rem', fontWeight: '600' }}>
                    {stat.label}
                  </div>
                  <div style={{ color: theme.textLight, fontSize: '0.75rem' }}>{stat.sub}</div>
                </div>
              ))}
            </div>

            {/* Daily Breakdown Chart */}
            <div style={{
              ...styles.card,
              background: theme.card,
              border: `1.5px solid ${theme.border}`,
            }}>
              <h2 style={{ color: theme.text, fontSize: '1.1rem', fontWeight: '600', marginBottom: '20px' }}>
                📊 Daily Breakdown
              </h2>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.border} />
                  <XAxis dataKey="day" tick={{ fill: theme.textLight }} />
                  <YAxis tick={{ fill: theme.textLight }} />
                  <Tooltip
                    contentStyle={{
                      background: theme.card,
                      border: `1px solid ${theme.border}`,
                      borderRadius: '10px',
                    }}
                  />
                  <Bar dataKey="tasks" fill={theme.primary} name="Tasks Done" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="habits" fill={theme.secondary} name="Habits Done" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Daily Score Timeline */}
            <div style={{
              ...styles.card,
              background: theme.card,
              border: `1.5px solid ${theme.border}`,
            }}>
              <h2 style={{ color: theme.text, fontSize: '1.1rem', fontWeight: '600', marginBottom: '20px' }}>
                🌟 Day by Day Score
              </h2>
              <div style={styles.dayScores}>
                {dailyData.map((day, i) => (
                  <div key={i} style={styles.dayScore}>
                    <div style={{
                      width: '100%',
                      background: theme.accent,
                      borderRadius: '8px',
                      height: '80px',
                      position: 'relative',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        position: 'absolute',
                        bottom: 0,
                        width: '100%',
                        height: `${day.score}%`,
                        background: `linear-gradient(to top, ${getScoreColor(day.score)}, ${getScoreColor(day.score)}88)`,
                        borderRadius: '8px',
                        transition: 'height 0.5s ease',
                      }} />
                    </div>
                    <p style={{
                      color: theme.text,
                      fontSize: '0.78rem',
                      fontWeight: '600',
                      marginTop: '6px',
                      textAlign: 'center',
                    }}>
                      {day.day}
                    </p>
                    <p style={{
                      color: getScoreColor(day.score),
                      fontSize: '0.72rem',
                      fontWeight: '700',
                      textAlign: 'center',
                    }}>
                      {day.score}%
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  content: { maxWidth: '900px', margin: '0 auto', padding: '32px 16px' },
  card: { borderRadius: '18px', padding: '24px', marginBottom: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' },
  statCard: { borderRadius: '16px', padding: '20px', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' },
  dayScores: { display: 'flex', gap: '12px', justifyContent: 'space-between' },
  dayScore: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' },
};