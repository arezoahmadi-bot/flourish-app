import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ProductivityScore() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [todayScore, setTodayScore] = useState(0);
  const [weekScores, setWeekScores] = useState([]);
  const [breakdown, setBreakdown] = useState({
    tasks: 0, goals: 0, habits: 0, mood: 0, streak: 0,
  });
  const [loading, setLoading] = useState(true);
  const [level, setLevel] = useState('');

  useEffect(() => { calculateScore(); }, []);

  const getLevel = (score) => {
    if (score >= 90) return { label: 'Legendary 👑', color: '#ffab00' };
    if (score >= 75) return { label: 'Champion 🏆', color: '#00c853' };
    if (score >= 60) return { label: 'Achiever 🌟', color: '#7cb987' };
    if (score >= 40) return { label: 'Explorer 🌱', color: '#4a90a4' };
    if (score >= 20) return { label: 'Beginner 🌿', color: '#7c6fcd' };
    return { label: 'Just Starting 🌸', color: '#c97b8a' };
  };

  const calculateScore = async () => {
    const today = new Date().toISOString().split('T')[0];
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    const [tasksRes, goalsRes, habitsRes, moodRes, profileRes] = await Promise.all([
      supabase.from('tasks').select('*').eq('user_id', user.id).eq('due_date', today),
      supabase.from('goals').select('*').eq('user_id', user.id),
      supabase.from('habits').select('*').eq('user_id', user.id),
      supabase.from('mood_logs').select('*').eq('user_id', user.id).eq('date', today),
      supabase.from('profiles').select('*').eq('id', user.id).single(),
    ]);

    const tasks = tasksRes.data || [];
    const goals = goalsRes.data || [];
    const habits = habitsRes.data || [];
    const mood = moodRes.data?.[0];
    const profile = profileRes.data;

    const taskScore = tasks.length > 0
      ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 30)
      : 0;
    const goalScore = goals.length > 0
      ? Math.round((goals.reduce((s, g) => s + g.progress, 0) / (goals.length * 100)) * 25)
      : 0;
    const habitScore = habits.length > 0
      ? Math.round((habits.filter(h =>
          (h.completed_dates || []).includes(today)
        ).length / habits.length) * 25)
      : 0;
    const moodScore = mood ? Math.round((mood.mood / 5) * 10) : 0;
    const streakScore = Math.min(10, Math.round((profile?.streak || 0) / 3));

    const total = taskScore + goalScore + habitScore + moodScore + streakScore;

    setBreakdown({
      tasks: taskScore,
      goals: goalScore,
      habits: habitScore,
      mood: moodScore,
      streak: streakScore,
    });
    setTodayScore(total);
    setLevel(getLevel(total));

    // Week scores
    const weekData = await Promise.all(weekDays.map(async (date) => {
      const [t, m, h] = await Promise.all([
        supabase.from('tasks').select('*').eq('user_id', user.id).eq('due_date', date),
        supabase.from('mood_logs').select('*').eq('user_id', user.id).eq('date', date),
        supabase.from('habits').select('*').eq('user_id', user.id),
      ]);
      const dayTasks = t.data || [];
      const dayMood = m.data?.[0];
      const dayHabits = h.data || [];
      const s1 = dayTasks.length > 0 ? Math.round((dayTasks.filter(t => t.completed).length / dayTasks.length) * 30) : 0;
      const s2 = dayMood ? Math.round((dayMood.mood / 5) * 10) : 0;
      const s3 = dayHabits.length > 0 ? Math.round((dayHabits.filter(h => (h.completed_dates || []).includes(date)).length / dayHabits.length) * 25) : 0;
      return {
        day: new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' }),
        score: s1 + s2 + s3,
      };
    }));

    setWeekScores(weekData);
    setLoading(false);
  };

  const getScoreColor = (score) => {
    if (score >= 70) return '#00c853';
    if (score >= 40) return '#ffab00';
    return '#f50057';
  };

  const breakdownItems = [
    { label: 'Tasks Completed', score: breakdown.tasks, max: 30, emoji: '✅' },
    { label: 'Goals Progress', score: breakdown.goals, max: 25, emoji: '🎯' },
    { label: 'Habits Done', score: breakdown.habits, max: 25, emoji: '🌱' },
    { label: 'Mood Logged', score: breakdown.mood, max: 10, emoji: '💆' },
    { label: 'Streak Bonus', score: breakdown.streak, max: 10, emoji: '🔥' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: theme.background }}>
      <Navbar />
      <div style={styles.content}>
        <h1 style={{ color: theme.text, fontSize: '2rem', fontWeight: '700', marginBottom: '4px' }}>
          ⚡ Productivity Score
        </h1>
        <p style={{ color: theme.textLight, marginBottom: '24px' }}>
          Your daily performance at a glance 🌿
        </p>

        {loading ? (
          <p style={{ color: theme.textLight }}>Calculating your score...</p>
        ) : (
          <>
            {/* Today's Score */}
            <div style={{
              ...styles.card,
              background: theme.card,
              border: `1.5px solid ${theme.border}`,
              textAlign: 'center',
            }}>
              <h2 style={{ color: theme.text, fontSize: '1.1rem', fontWeight: '600', marginBottom: '24px' }}>
                Today's Score
              </h2>
              <div style={{
                width: '160px',
                height: '160px',
                borderRadius: '50%',
                background: `conic-gradient(${getScoreColor(todayScore)} ${todayScore * 3.6}deg, ${theme.accent} 0deg)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}>
                <div style={{
                  width: '130px',
                  height: '130px',
                  borderRadius: '50%',
                  background: theme.card,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <span style={{
                    color: getScoreColor(todayScore),
                    fontSize: '2.5rem',
                    fontWeight: '800',
                  }}>
                    {todayScore}
                  </span>
                  <span style={{ color: theme.textLight, fontSize: '0.75rem' }}>out of 100</span>
                </div>
              </div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 20px',
                borderRadius: '20px',
                background: level.color + '22',
                border: `1.5px solid ${level.color}44`,
              }}>
                <span style={{ color: level.color, fontWeight: '700', fontSize: '1rem' }}>
                  {level.label}
                </span>
              </div>
            </div>

            {/* Score Breakdown */}
            <div style={{
              ...styles.card,
              background: theme.card,
              border: `1.5px solid ${theme.border}`,
            }}>
              <h2 style={{ color: theme.text, fontSize: '1.1rem', fontWeight: '600', marginBottom: '20px' }}>
                📊 Score Breakdown
              </h2>
              <div style={styles.breakdownList}>
                {breakdownItems.map((item, i) => (
                  <div key={i} style={styles.breakdownItem}>
                    <div style={styles.breakdownLeft}>
                      <span style={{ fontSize: '1.3rem' }}>{item.emoji}</span>
                      <span style={{ color: theme.text, fontSize: '0.9rem', fontWeight: '500' }}>
                        {item.label}
                      </span>
                    </div>
                    <div style={styles.breakdownRight}>
                      <div style={{
                        flex: 1,
                        background: theme.accent,
                        borderRadius: '10px',
                        height: '8px',
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          width: `${(item.score / item.max) * 100}%`,
                          height: '100%',
                          background: theme.gradient,
                          borderRadius: '10px',
                          transition: 'width 0.5s ease',
                        }} />
                      </div>
                      <span style={{
                        color: theme.primary,
                        fontWeight: '700',
                        fontSize: '0.85rem',
                        minWidth: '50px',
                        textAlign: 'right',
                      }}>
                        {item.score}/{item.max}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Week Chart */}
            <div style={{
              ...styles.card,
              background: theme.card,
              border: `1.5px solid ${theme.border}`,
            }}>
              <h2 style={{ color: theme.text, fontSize: '1.1rem', fontWeight: '600', marginBottom: '20px' }}>
                📈 This Week's Scores
              </h2>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={weekScores}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.border} />
                  <XAxis dataKey="day" tick={{ fill: theme.textLight }} />
                  <YAxis domain={[0, 100]} tick={{ fill: theme.textLight }} />
                  <Tooltip
                    contentStyle={{
                      background: theme.card,
                      border: `1px solid ${theme.border}`,
                      borderRadius: '10px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke={theme.primary}
                    strokeWidth={3}
                    dot={{ fill: theme.primary, r: 5 }}
                    name="Score"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Tips to improve */}
            <div style={{
              ...styles.card,
              background: theme.card,
              border: `1.5px solid ${theme.border}`,
            }}>
              <h2 style={{ color: theme.text, fontSize: '1.1rem', fontWeight: '600', marginBottom: '16px' }}>
                💡 How to Improve Your Score
              </h2>
              <div style={styles.tipsList}>
                {breakdown.tasks < 20 && (
                  <div style={{ ...styles.tip, background: theme.accent }}>
                    <span>✅</span>
                    <p style={{ color: theme.text, fontSize: '0.88rem' }}>
                      Complete more tasks today to boost your score by up to 30 points!
                    </p>
                  </div>
                )}
                {breakdown.habits < 15 && (
                  <div style={{ ...styles.tip, background: theme.accent }}>
                    <span>🌱</span>
                    <p style={{ color: theme.text, fontSize: '0.88rem' }}>
                      Check in your habits to earn up to 25 more points!
                    </p>
                  </div>
                )}
                {breakdown.mood === 0 && (
                  <div style={{ ...styles.tip, background: theme.accent }}>
                    <span>💆</span>
                    <p style={{ color: theme.text, fontSize: '0.88rem' }}>
                      Log your mood to earn 10 bonus points!
                    </p>
                  </div>
                )}
                {breakdown.streak < 5 && (
                  <div style={{ ...styles.tip, background: theme.accent }}>
                    <span>🔥</span>
                    <p style={{ color: theme.text, fontSize: '0.88rem' }}>
                      Build your daily streak to earn bonus points!
                    </p>
                  </div>
                )}
                {todayScore >= 80 && (
                  <div style={{ ...styles.tip, background: theme.accent }}>
                    <span>🌟</span>
                    <p style={{ color: theme.text, fontSize: '0.88rem' }}>
                      Amazing score! You're crushing it today! Keep it up!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  content: { maxWidth: '800px', margin: '0 auto', padding: '32px 16px' },
  card: { borderRadius: '18px', padding: '24px', marginBottom: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' },
  breakdownList: { display: 'flex', flexDirection: 'column', gap: '14px' },
  breakdownItem: { display: 'flex', alignItems: 'center', gap: '12px' },
  breakdownLeft: { display: 'flex', alignItems: 'center', gap: '10px', width: '180px', flexShrink: 0 },
  breakdownRight: { display: 'flex', alignItems: 'center', gap: '12px', flex: 1 },
  tipsList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  tip: { display: 'flex', gap: '10px', padding: '12px 14px', borderRadius: '12px', alignItems: 'flex-start', fontSize: '1.2rem' },
};