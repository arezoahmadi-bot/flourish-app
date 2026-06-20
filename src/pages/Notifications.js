import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Notifications() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { generateNotifications(); }, []);

  const generateNotifications = async () => {
    const today = new Date().toISOString().split('T')[0];
    const [tasksRes, goalsRes, habitsRes, moodRes, profileRes, friendsRes] = await Promise.all([
      supabase.from('tasks').select('*').eq('user_id', user.id).eq('due_date', today),
      supabase.from('goals').select('*').eq('user_id', user.id).eq('completed', false),
      supabase.from('habits').select('*').eq('user_id', user.id),
      supabase.from('mood_logs').select('*').eq('user_id', user.id).eq('date', today),
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('friends').select('*, friend:profiles!friends_friend_id_fkey(username, full_name, streak)').eq('user_id', user.id).eq('status', 'accepted'),
    ]);

    const tasks = tasksRes.data || [];
    const goals = goalsRes.data || [];
    const habits = habitsRes.data || [];
    const moodLogged = (moodRes.data || []).length > 0;
    const profile = profileRes.data;
    const friends = friendsRes.data || [];

    const newNotifications = [];

    // Task notifications
    const pendingTasks = tasks.filter(t => !t.completed);
    if (pendingTasks.length > 0) {
      newNotifications.push({
        id: 'pending_tasks',
        emoji: '📝',
        title: `${pendingTasks.length} task${pendingTasks.length > 1 ? 's' : ''} pending today`,
        message: 'Keep going! Complete your tasks to maintain your streak.',
        type: 'warning',
        time: 'Today',
        color: '#ffab00',
      });
    }

    if (tasks.length > 0 && tasks.every(t => t.completed)) {
      newNotifications.push({
        id: 'all_tasks_done',
        emoji: '🎉',
        title: 'All tasks completed!',
        message: 'Amazing work! You completed all your tasks today!',
        type: 'success',
        time: 'Today',
        color: '#00c853',
      });
    }

    // Mood notification
    if (!moodLogged) {
      newNotifications.push({
        id: 'mood_reminder',
        emoji: '💆',
        title: "Don't forget to log your mood!",
        message: 'Take a moment to check in with yourself today.',
        type: 'info',
        time: 'Today',
        color: '#7c6fcd',
      });
    }

    // Streak notification
    if (profile?.streak > 0) {
      newNotifications.push({
        id: 'streak',
        emoji: '🔥',
        title: `${profile.streak} day streak! Keep it up!`,
        message: profile.streak >= 7
          ? 'Incredible dedication! You\'re on fire! 🌟'
          : 'You\'re building a great habit. Don\'t break the chain!',
        type: 'success',
        time: 'Today',
        color: '#ff6d00',
      });
    }

    // Goals notifications
    const nearDeadlineGoals = goals.filter(g => {
      if (!g.target_date) return false;
      const deadline = new Date(g.target_date);
      const daysLeft = Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24));
      return daysLeft <= 7 && daysLeft > 0;
    });

    nearDeadlineGoals.forEach(goal => {
      const daysLeft = Math.ceil((new Date(goal.target_date) - new Date()) / (1000 * 60 * 60 * 24));
      newNotifications.push({
        id: `goal_deadline_${goal.id}`,
        emoji: '⏰',
        title: `"${goal.title}" deadline in ${daysLeft} day${daysLeft > 1 ? 's' : ''}!`,
        message: `Current progress: ${goal.progress}%. Push harder! 💪`,
        type: 'warning',
        time: 'Goal reminder',
        color: '#f50057',
      });
    });

    // Habits notifications
    const todayHabits = habits.filter(h => !(h.completed_dates || []).includes(today));
    if (todayHabits.length > 0) {
      newNotifications.push({
        id: 'habits_reminder',
        emoji: '🌱',
        title: `${todayHabits.length} habit${todayHabits.length > 1 ? 's' : ''} not done yet today`,
        message: todayHabits.map(h => `${h.emoji} ${h.title}`).join(', '),
        type: 'info',
        time: 'Today',
        color: '#5a9e5f',
      });
    }

    // Friends notifications
    friends.forEach(f => {
      if (f.friend?.streak >= 7) {
        newNotifications.push({
          id: `friend_streak_${f.friend_id}`,
          emoji: '👥',
          title: `${f.friend?.full_name} is on a ${f.friend?.streak} day streak!`,
          message: 'Cheer them on and keep up with their progress! 🎉',
          type: 'social',
          time: 'Friend update',
          color: '#c97b8a',
        });
      }
    });

    // Morning briefing
    const hour = new Date().getHours();
    if (hour < 12) {
      newNotifications.unshift({
        id: 'morning_briefing',
        emoji: '🌅',
        title: 'Good morning! Here\'s your daily briefing',
        message: `You have ${tasks.length} tasks today, ${goals.length} active goals, and ${habits.length} habits to track.`,
        type: 'info',
        time: 'Morning briefing',
        color: '#4a90a4',
      });
    } else if (hour >= 20) {
      newNotifications.unshift({
        id: 'evening_checkin',
        emoji: '🌙',
        title: 'Evening check-in time!',
        message: 'How was your day? Log your mood and review your progress.',
        type: 'info',
        time: 'Evening reminder',
        color: '#7c6fcd',
      });
    }

    setNotifications(newNotifications);
    setLoading(false);
  };

  const typeStyles = {
    success: { bg: '#e8f5e9', border: '#a5d6a7' },
    warning: { bg: '#fff8e1', border: '#ffe082' },
    info: { bg: '#e3f2fd', border: '#90caf9' },
    social: { bg: '#fce4ec', border: '#f48fb1' },
  };

  return (
    <div style={{ minHeight: '100vh', background: theme.background }}>
      <Navbar />
      <div style={styles.content}>
        <h1 style={{ color: theme.text, fontSize: '2rem', fontWeight: '700', marginBottom: '4px' }}>
          🔔 Notifications
        </h1>
        <p style={{ color: theme.textLight, marginBottom: '24px' }}>
          Stay on top of your goals and habits 🌿
        </p>

        {loading ? (
          <p style={{ color: theme.textLight }}>Loading notifications...</p>
        ) : notifications.length === 0 ? (
          <div style={{
            ...styles.card,
            background: theme.card,
            border: `1.5px solid ${theme.border}`,
            textAlign: 'center',
            padding: '60px',
          }}>
            <p style={{ fontSize: '3rem' }}>🎉</p>
            <p style={{ color: theme.textLight, marginTop: '12px' }}>
              All caught up! No notifications right now.
            </p>
          </div>
        ) : (
          <div style={styles.notifList}>
            {notifications.map(notif => (
              <div key={notif.id} style={{
                ...styles.notifCard,
                background: theme.card,
                border: `1.5px solid ${theme.border}`,
                borderLeft: `4px solid ${notif.color}`,
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '14px',
                  background: notif.color + '22',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.6rem',
                  flexShrink: 0,
                }}>
                  {notif.emoji}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                    <p style={{ color: theme.text, fontWeight: '700', fontSize: '0.95rem' }}>
                      {notif.title}
                    </p>
                    <span style={{
                      color: theme.textLight,
                      fontSize: '0.72rem',
                      background: theme.accent,
                      padding: '2px 8px',
                      borderRadius: '20px',
                      flexShrink: 0,
                      marginLeft: '8px',
                    }}>
                      {notif.time}
                    </span>
                  </div>
                  <p style={{ color: theme.textLight, fontSize: '0.85rem', lineHeight: '1.5' }}>
                    {notif.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Refresh Button */}
        <button
          onClick={generateNotifications}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: '12px',
            background: theme.gradient,
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            fontWeight: '700',
            fontSize: '1rem',
            marginTop: '8px',
          }}
        >
          🔄 Refresh Notifications
        </button>
      </div>
    </div>
  );
}

const styles = {
  content: { maxWidth: '800px', margin: '0 auto', padding: '32px 16px' },
  card: { borderRadius: '18px', padding: '24px', marginBottom: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' },
  notifList: { display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' },
  notifCard: { borderRadius: '16px', padding: '18px', display: 'flex', gap: '16px', alignItems: 'flex-start', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' },
};