import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function FriendFeed() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [friends, setFriends] = useState([]);
  const [feedItems, setFeedItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchFeed(); }, []);

  const fetchFeed = async () => {
    const { data: friendsData } = await supabase
      .from('friends')
      .select('*, friend:profiles!friends_friend_id_fkey(id, username, full_name, streak)')
      .eq('user_id', user.id)
      .eq('status', 'accepted');

    setFriends(friendsData || []);

    const friendIds = (friendsData || []).map(f => f.friend_id);
    if (friendIds.length === 0) {
      setLoading(false);
      return;
    }

    const [tasksRes, goalsRes, habitsRes, moodRes] = await Promise.all([
      supabase.from('tasks').select('*, profile:profiles!tasks_user_id_fkey(full_name, username)')
        .in('user_id', friendIds).eq('completed', true)
        .order('created_at', { ascending: false }).limit(20),
      supabase.from('goals').select('*, profile:profiles!goals_user_id_fkey(full_name, username)')
        .in('user_id', friendIds).eq('completed', true)
        .order('created_at', { ascending: false }).limit(10),
      supabase.from('habits').select('*, profile:profiles!habits_user_id_fkey(full_name, username)')
        .in('user_id', friendIds)
        .order('created_at', { ascending: false }).limit(10),
      supabase.from('mood_logs').select('*, profile:profiles!mood_logs_user_id_fkey(full_name, username)')
        .in('user_id', friendIds)
        .order('created_at', { ascending: false }).limit(10),
    ]);

    const feed = [];

    (tasksRes.data || []).forEach(task => {
      feed.push({
        id: `task_${task.id}`,
        type: 'task',
        emoji: '✅',
        color: '#00c853',
        name: task.profile?.full_name || 'Friend',
        username: task.profile?.username,
        message: `completed a task: "${task.title}"`,
        time: task.created_at,
      });
    });

    (goalsRes.data || []).forEach(goal => {
      feed.push({
        id: `goal_${goal.id}`,
        type: 'goal',
        emoji: '🏆',
        color: '#ffab00',
        name: goal.profile?.full_name || 'Friend',
        username: goal.profile?.username,
        message: `achieved their goal: "${goal.title}" 🎉`,
        time: goal.created_at,
      });
    });

    (habitsRes.data || []).forEach(habit => {
      feed.push({
        id: `habit_${habit.id}`,
        type: 'habit',
        emoji: '🌱',
        color: '#5a9e5f',
        name: habit.profile?.full_name || 'Friend',
        username: habit.profile?.username,
        message: `is building a habit: "${habit.title}" (${habit.streak || 0} day streak!)`,
        time: habit.created_at,
      });
    });

    (moodRes.data || []).forEach(log => {
      const moodEmojis = { 5: '🤩', 4: '😊', 3: '😐', 2: '😔', 1: '😞' };
      const moodLabels = { 5: 'amazing', 4: 'good', 3: 'okay', 2: 'low', 1: 'rough' };
      feed.push({
        id: `mood_${log.id}`,
        type: 'mood',
        emoji: moodEmojis[log.mood] || '😊',
        color: '#7c6fcd',
        name: log.profile?.full_name || 'Friend',
        username: log.profile?.username,
        message: `is feeling ${moodLabels[log.mood] || 'okay'} today`,
        time: log.created_at,
      });
    });

    feed.sort((a, b) => new Date(b.time) - new Date(a.time));
    setFeedItems(feed.slice(0, 30));
    setLoading(false);
  };

  const formatTime = (time) => {
    const date = new Date(time);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000 / 60);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
  };

  return (
    <div style={{ minHeight: '100vh', background: theme.background }}>
      <Navbar />
      <div style={styles.content}>
        <h1 style={{ color: theme.text, fontSize: '2rem', fontWeight: '700', marginBottom: '4px' }}>
          👥 Friend Activity
        </h1>
        <p style={{ color: theme.textLight, marginBottom: '24px' }}>
          See what your friends are up to 🌿
        </p>

        {/* Friends Overview */}
        {friends.length > 0 && (
          <div style={{
            ...styles.card,
            background: theme.card,
            border: `1.5px solid ${theme.border}`,
          }}>
            <h2 style={{ color: theme.text, fontSize: '1.1rem', fontWeight: '600', marginBottom: '16px' }}>
              🌟 Friends Streaks
            </h2>
            <div style={styles.friendsRow}>
              {friends.map(f => (
                <div key={f.id} style={{
                  ...styles.friendBubble,
                  background: theme.accent,
                  border: `1.5px solid ${theme.border}`,
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: theme.gradient,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: '700',
                    fontSize: '1.2rem',
                    margin: '0 auto 8px',
                  }}>
                    {f.friend?.full_name?.[0] || '?'}
                  </div>
                  <p style={{ color: theme.text, fontWeight: '600', fontSize: '0.82rem', textAlign: 'center' }}>
                    {f.friend?.full_name?.split(' ')[0]}
                  </p>
                  <p style={{ color: '#ff6d00', fontSize: '0.78rem', textAlign: 'center', fontWeight: '700' }}>
                    🔥 {f.friend?.streak || 0}d
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Activity Feed */}
        <div style={{
          ...styles.card,
          background: theme.card,
          border: `1.5px solid ${theme.border}`,
        }}>
          <h2 style={{ color: theme.text, fontSize: '1.1rem', fontWeight: '600', marginBottom: '16px' }}>
            📰 Activity Feed
          </h2>

          {loading ? (
            <p style={{ color: theme.textLight }}>Loading feed...</p>
          ) : friends.length === 0 ? (
            <div style={styles.empty}>
              <p style={{ fontSize: '3rem' }}>👥</p>
              <p style={{ color: theme.textLight, marginTop: '12px' }}>
                Add friends to see their activity here!
              </p>
            </div>
          ) : feedItems.length === 0 ? (
            <div style={styles.empty}>
              <p style={{ fontSize: '3rem' }}>🌱</p>
              <p style={{ color: theme.textLight, marginTop: '12px' }}>
                No activity yet! Your friends haven't done anything yet.
              </p>
            </div>
          ) : (
            <div style={styles.feedList}>
              {feedItems.map(item => (
                <div key={item.id} style={{
                  ...styles.feedItem,
                  background: theme.accent,
                  border: `1px solid ${theme.border}`,
                  borderLeft: `4px solid ${item.color}`,
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: item.color + '22',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.3rem',
                    flexShrink: 0,
                  }}>
                    {item.emoji}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: theme.text, fontSize: '0.88rem', lineHeight: '1.5' }}>
                      <span style={{ fontWeight: '700' }}>{item.name}</span>
                      {' '}{item.message}
                    </p>
                    <p style={{ color: theme.textLight, fontSize: '0.75rem', marginTop: '2px' }}>
                      @{item.username} · {formatTime(item.time)}
                    </p>
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
  content: { maxWidth: '800px', margin: '0 auto', padding: '32px 16px' },
  card: { borderRadius: '18px', padding: '24px', marginBottom: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' },
  friendsRow: { display: 'flex', gap: '12px', flexWrap: 'wrap' },
  friendBubble: { padding: '14px', borderRadius: '14px', minWidth: '80px' },
  empty: { textAlign: 'center', padding: '40px' },
  feedList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  feedItem: { display: 'flex', gap: '12px', padding: '14px', borderRadius: '12px', alignItems: 'flex-start' },
};