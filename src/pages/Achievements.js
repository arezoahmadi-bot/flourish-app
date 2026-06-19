import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const allBadges = [
  { id: 'first_task', emoji: '🌱', title: 'First Step', desc: 'Complete your first task', category: 'Tasks' },
  { id: 'ten_tasks', emoji: '📝', title: 'Task Master', desc: 'Complete 10 tasks', category: 'Tasks' },
  { id: 'fifty_tasks', emoji: '⚡', title: 'Productivity Pro', desc: 'Complete 50 tasks', category: 'Tasks' },
  { id: 'first_goal', emoji: '🎯', title: 'Goal Setter', desc: 'Create your first goal', category: 'Goals' },
  { id: 'first_goal_done', emoji: '🏆', title: 'Goal Crusher', desc: 'Complete your first goal', category: 'Goals' },
  { id: 'three_goals', emoji: '🌟', title: 'Dreamer', desc: 'Complete 3 goals', category: 'Goals' },
  { id: 'streak_3', emoji: '🔥', title: 'On Fire', desc: 'Achieve a 3 day streak', category: 'Streaks' },
  { id: 'streak_7', emoji: '💪', title: 'Week Warrior', desc: 'Achieve a 7 day streak', category: 'Streaks' },
  { id: 'streak_30', emoji: '👑', title: 'Monthly Master', desc: 'Achieve a 30 day streak', category: 'Streaks' },
  { id: 'first_habit', emoji: '🌿', title: 'Habit Former', desc: 'Create your first habit', category: 'Habits' },
  { id: 'habit_week', emoji: '🦋', title: 'Consistent', desc: 'Complete a habit 7 days in a row', category: 'Habits' },
  { id: 'first_mood', emoji: '💆', title: 'Self Aware', desc: 'Log your mood for the first time', category: 'Mood' },
  { id: 'mood_week', emoji: '🌸', title: 'Mindful', desc: 'Log mood 7 days in a row', category: 'Mood' },
  { id: 'first_focus', emoji: '⏱️', title: 'Focus Starter', desc: 'Complete your first pomodoro', category: 'Focus' },
  { id: 'five_focus', emoji: '🧘', title: 'Deep Worker', desc: 'Complete 5 pomodoro sessions', category: 'Focus' },
  { id: 'first_friend', emoji: '👥', title: 'Social Butterfly', desc: 'Add your first friend', category: 'Social' },
  { id: 'early_bird', emoji: '🌅', title: 'Early Bird', desc: 'Add a task before 7 AM', category: 'Special' },
  { id: 'night_owl', emoji: '🦉', title: 'Night Owl', desc: 'Add a task after 10 PM', category: 'Special' },
  { id: 'perfectionist', emoji: '✨', title: 'Perfectionist', desc: 'Complete all tasks in a day', category: 'Special' },
  { id: 'explorer', emoji: '🗺️', title: 'Explorer', desc: 'Visit all pages of the app', category: 'Special' },
];

export default function Achievements() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [unlockedBadges, setUnlockedBadges] = useState([]);
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    totalGoals: 0,
    completedGoals: 0,
    streak: 0,
    totalHabits: 0,
    totalMoodLogs: 0,
    totalFriends: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = ['All', 'Tasks', 'Goals', 'Streaks', 'Habits', 'Mood', 'Focus', 'Social', 'Special'];

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    const [tasksRes, goalsRes, profileRes, habitsRes, moodRes, friendsRes] = await Promise.all([
      supabase.from('tasks').select('*').eq('user_id', user.id),
      supabase.from('goals').select('*').eq('user_id', user.id),
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('habits').select('*').eq('user_id', user.id),
      supabase.from('mood_logs').select('*').eq('user_id', user.id),
      supabase.from('friends').select('*').eq('user_id', user.id),
    ]);

    const tasks = tasksRes.data || [];
    const goals = goalsRes.data || [];
    const profile = profileRes.data;
    const habits = habitsRes.data || [];
    const moodLogs = moodRes.data || [];
    const friends = friendsRes.data || [];

    const newStats = {
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.completed).length,
      totalGoals: goals.length,
      completedGoals: goals.filter(g => g.completed).length,
      streak: profile?.streak || 0,
      totalHabits: habits.length,
      totalMoodLogs: moodLogs.length,
      totalFriends: friends.length,
    };

    setStats(newStats);
    calculateBadges(newStats);
    setLoading(false);
  };

  const calculateBadges = (s) => {
    const unlocked = [];
    if (s.completedTasks >= 1) unlocked.push('first_task');
    if (s.completedTasks >= 10) unlocked.push('ten_tasks');
    if (s.completedTasks >= 50) unlocked.push('fifty_tasks');
    if (s.totalGoals >= 1) unlocked.push('first_goal');
    if (s.completedGoals >= 1) unlocked.push('first_goal_done');
    if (s.completedGoals >= 3) unlocked.push('three_goals');
    if (s.streak >= 3) unlocked.push('streak_3');
    if (s.streak >= 7) unlocked.push('streak_7');
    if (s.streak >= 30) unlocked.push('streak_30');
    if (s.totalHabits >= 1) unlocked.push('first_habit');
    if (s.totalMoodLogs >= 1) unlocked.push('first_mood');
    if (s.totalMoodLogs >= 7) unlocked.push('mood_week');
    if (s.totalFriends >= 1) unlocked.push('first_friend');
    setUnlockedBadges(unlocked);
  };

  const isUnlocked = (id) => unlockedBadges.includes(id);

  const filteredBadges = activeCategory === 'All'
    ? allBadges
    : allBadges.filter(b => b.category === activeCategory);

  const unlockedCount = allBadges.filter(b => isUnlocked(b.id)).length;
  const percentage = Math.round((unlockedCount / allBadges.length) * 100);

  return (
    <div style={{ minHeight: '100vh', background: theme.background }}>
      <Navbar />
      <div style={styles.content}>
        <h1 style={{ color: theme.text, fontSize: '2rem', fontWeight: '700', marginBottom: '4px' }}>
          🏆 Achievements
        </h1>
        <p style={{ color: theme.textLight, marginBottom: '24px' }}>
          Every badge tells your story 🌟
        </p>

        {/* Progress Overview */}
        <div style={{
          ...styles.card,
          background: theme.card,
          border: `1.5px solid ${theme.border}`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h2 style={{ color: theme.text, fontSize: '1.1rem', fontWeight: '600' }}>
              Your Progress
            </h2>
            <span style={{ color: theme.primary, fontWeight: '700', fontSize: '1.1rem' }}>
              {unlockedCount}/{allBadges.length} badges
            </span>
          </div>
          <div style={{ background: theme.accent, borderRadius: '10px', height: '12px', overflow: 'hidden', marginBottom: '8px' }}>
            <div style={{
              width: `${percentage}%`,
              height: '100%',
              background: theme.gradient,
              borderRadius: '10px',
              transition: 'width 0.5s ease',
            }} />
          </div>
          <p style={{ color: theme.textLight, fontSize: '0.85rem' }}>
            {percentage}% of all achievements unlocked 🌿
          </p>
        </div>

        {/* Stats Row */}
        <div style={styles.statsRow}>
          {[
            { emoji: '✅', value: stats.completedTasks, label: 'Tasks Done' },
            { emoji: '🏆', value: stats.completedGoals, label: 'Goals Done' },
            { emoji: '🔥', value: stats.streak, label: 'Day Streak' },
            { emoji: '🌱', value: stats.totalHabits, label: 'Habits' },
          ].map((stat, i) => (
            <div key={i} style={{
              ...styles.statCard,
              background: theme.card,
              border: `1.5px solid ${theme.border}`,
            }}>
              <div style={{ fontSize: '1.8rem', marginBottom: '6px' }}>{stat.emoji}</div>
              <div style={{ color: theme.primary, fontSize: '1.5rem', fontWeight: '700' }}>{stat.value}</div>
              <div style={{ color: theme.textLight, fontSize: '0.78rem' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Category Filter */}
        <div style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
          marginBottom: '20px',
        }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: `1.5px solid ${activeCategory === cat ? theme.primary : theme.border}`,
                background: activeCategory === cat ? theme.primary : theme.card,
                color: activeCategory === cat ? '#fff' : theme.textLight,
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.82rem',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Badges Grid */}
        {loading ? (
          <p style={{ color: theme.textLight }}>Loading achievements...</p>
        ) : (
          <div style={styles.badgesGrid}>
            {filteredBadges.map(badge => {
              const unlocked = isUnlocked(badge.id);
              return (
                <div
                  key={badge.id}
                  style={{
                    ...styles.badgeCard,
                    background: unlocked ? theme.card : theme.accent,
                    border: `1.5px solid ${unlocked ? theme.primary : theme.border}`,
                    opacity: unlocked ? 1 : 0.6,
                  }}
                >
                  <div style={{
                    ...styles.badgeEmoji,
                    background: unlocked ? theme.gradient : theme.border,
                    filter: unlocked ? 'none' : 'grayscale(100%)',
                  }}>
                    <span style={{ fontSize: '1.8rem' }}>{badge.emoji}</span>
                  </div>
                  <h3 style={{
                    color: unlocked ? theme.text : theme.textLight,
                    fontSize: '0.9rem',
                    fontWeight: '700',
                    marginBottom: '4px',
                    textAlign: 'center',
                  }}>
                    {badge.title}
                  </h3>
                  <p style={{
                    color: theme.textLight,
                    fontSize: '0.75rem',
                    textAlign: 'center',
                    lineHeight: '1.4',
                  }}>
                    {badge.desc}
                  </p>
                  {unlocked && (
                    <div style={{
                      marginTop: '8px',
                      padding: '4px 10px',
                      borderRadius: '20px',
                      background: theme.accent,
                      color: theme.primary,
                      fontSize: '0.72rem',
                      fontWeight: '700',
                    }}>
                      ✓ Unlocked!
                    </div>
                  )}
                  {!unlocked && (
                    <div style={{
                      marginTop: '8px',
                      padding: '4px 10px',
                      borderRadius: '20px',
                      background: theme.accent,
                      color: theme.textLight,
                      fontSize: '0.72rem',
                    }}>
                      🔒 Locked
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  content: { maxWidth: '1000px', margin: '0 auto', padding: '32px 16px' },
  card: { borderRadius: '18px', padding: '24px', marginBottom: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' },
  statCard: { borderRadius: '16px', padding: '16px', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' },
  badgesGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px' },
  badgeCard: { borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', transition: 'all 0.2s' },
  badgeEmoji: { width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
};