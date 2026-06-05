import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Friends() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [friends, setFriends] = useState([]);
  const [searchUsername, setSearchUsername] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searchError, setSearchError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchFriends(); }, []);

  const fetchFriends = async () => {
    const { data } = await supabase
      .from('friends')
      .select(`*, friend:profiles!friends_friend_id_fkey(id, username, full_name, streak, is_public)`)
      .eq('user_id', user.id)
      .eq('status', 'accepted');
    setFriends(data || []);
    setLoading(false);
  };

  const searchUser = async () => {
    setSearchError('');
    setSearchResult(null);
    if (!searchUsername.trim()) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', searchUsername.trim())
      .single();
    if (error || !data) { setSearchError('User not found! Check the username and try again.'); return; }
    if (data.id === user.id) { setSearchError('You cannot add yourself!'); return; }
    setSearchResult(data);
  };

  const sendFriendRequest = async (friendId) => {
    const { error } = await supabase
      .from('friends')
      .insert([{ user_id: user.id, friend_id: friendId, status: 'accepted' }]);
    if (!error) { setSearchResult(null); setSearchUsername(''); fetchFriends(); }
  };

  const removeFriend = async (friendId) => {
    await supabase.from('friends').delete().eq('user_id', user.id).eq('friend_id', friendId);
    setFriends(friends.filter(f => f.friend_id !== friendId));
  };

  return (
    <div style={{ minHeight: '100vh', background: theme.background }}>
      <Navbar />
      <div style={styles.content}>
        <h1 style={{ color: theme.text, fontSize: '2rem', fontWeight: '700', marginBottom: '4px' }}>👥 Friends</h1>
        <p style={{ color: theme.textLight, marginBottom: '28px' }}>Grow together, celebrate each other 🌸</p>

        <div style={{ ...styles.card, background: theme.card, border: `1.5px solid ${theme.border}` }}>
          <h2 style={{ color: theme.text, fontSize: '1.1rem', fontWeight: '600', marginBottom: '16px' }}>🔍 Find a Friend</h2>
          <div style={styles.searchRow}>
            <input
              style={{ ...styles.input, background: theme.accent, border: `2px solid ${theme.border}`, color: theme.text }}
              type="text" placeholder="Search by username..."
              value={searchUsername}
              onChange={(e) => setSearchUsername(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchUser()}
            />
            <button style={{ ...styles.searchBtn, background: theme.gradient }} onClick={searchUser}>
              Search
            </button>
          </div>

          {searchError && (
            <div style={{ ...styles.errorBox, background: '#fff0f0', border: '1px solid #ffd5d5' }}>
              😕 {searchError}
            </div>
          )}

          {searchResult && (
            <div style={{ ...styles.resultCard, background: theme.accent, border: `1px solid ${theme.border}` }}>
              <div style={styles.userRow}>
                <div style={{ ...styles.avatar, background: theme.gradient }}>
                  {searchResult.full_name?.[0] || '?'}
                </div>
                <div>
                  <p style={{ color: theme.text, fontWeight: '600' }}>{searchResult.full_name}</p>
                  <p style={{ color: theme.textLight, fontSize: '0.85rem' }}>@{searchResult.username}</p>
                </div>
              </div>
              <button style={{ ...styles.addBtn, background: theme.gradient }} onClick={() => sendFriendRequest(searchResult.id)}>
                + Add
              </button>
            </div>
          )}
        </div>

        <div style={{ ...styles.card, background: theme.card, border: `1.5px solid ${theme.border}` }}>
          <h2 style={{ color: theme.text, fontSize: '1.1rem', fontWeight: '600', marginBottom: '16px' }}>
            🌿 My Friends ({friends.length})
          </h2>
          {loading ? (
            <p style={{ color: theme.textLight }}>Loading...</p>
          ) : friends.length === 0 ? (
            <div style={styles.empty}>
              <p style={{ fontSize: '2.5rem' }}>🌱</p>
              <p style={{ color: theme.textLight, marginTop: '12px' }}>No friends yet! Search above to add friends.</p>
            </div>
          ) : (
            <div style={styles.friendsList}>
              {friends.map(f => (
                <div key={f.id} style={{ ...styles.friendCard, background: theme.accent, border: `1px solid ${theme.border}` }}>
                  <div style={{ ...styles.avatar, background: theme.gradient }}>
                    {f.friend?.full_name?.[0] || '?'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: theme.text, fontWeight: '600' }}>{f.friend?.full_name}</p>
                    <p style={{ color: theme.textLight, fontSize: '0.82rem' }}>@{f.friend?.username}</p>
                  </div>
                  <div style={{ ...styles.streakBadge, background: theme.card, color: theme.primary }}>
                    🔥 {f.friend?.streak || 0} days
                  </div>
                  <button
                    style={{ ...styles.removeBtn, background: '#fff0f0', color: '#c62828' }}
                    onClick={() => removeFriend(f.friend_id)}
                  >
                    Remove
                  </button>
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
  searchRow: { display: 'flex', gap: '12px', marginBottom: '12px' },
  input: { flex: 1, padding: '12px 16px', borderRadius: '12px', fontSize: '0.95rem', outline: 'none' },
  searchBtn: { padding: '12px 24px', borderRadius: '12px', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: '700' },
  errorBox: { padding: '10px 14px', borderRadius: '10px', color: '#c62828', fontSize: '0.9rem', marginTop: '8px' },
  resultCard: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px', borderRadius: '12px', marginTop: '12px' },
  userRow: { display: 'flex', alignItems: 'center', gap: '12px' },
  avatar: { width: '44px', height: '44px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '700', fontSize: '1.1rem' },
  addBtn: { padding: '8px 18px', borderRadius: '10px', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: '700' },
  empty: { textAlign: 'center', padding: '40px' },
  friendsList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  friendCard: { display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', borderRadius: '14px' },
  streakBadge: { padding: '6px 12px', borderRadius: '20px', fontSize: '0.82rem', fontWeight: '600' },
  removeBtn: { padding: '6px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '0.82rem' },
};