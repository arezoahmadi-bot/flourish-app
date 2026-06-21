import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Friends() {
  const [friendIsPrivate, setFriendIsPrivate] = useState(false);
  const { user } = useAuth();
  const { theme } = useTheme();
  const [friends, setFriends] = useState([]);
  const [searchUsername, setSearchUsername] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searchError, setSearchError] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [friendGoals, setFriendGoals] = useState([]);
  const [friendTasks, setFriendTasks] = useState([]);
  const [friendHabits, setFriendHabits] = useState([]);
  const [activeTab, setActiveTab] = useState('friends');
  const [myGoals, setMyGoals] = useState([]);

  useEffect(() => {
    fetchFriends();
    fetchMyGoals();
  }, []);

  const fetchMyGoals = async () => {
    const { data } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id);
    setMyGoals(data || []);
  };

  const fetchFriends = async () => {
    const { data } = await supabase
      .from('friends')
      .select(`
        *,
        friend:profiles!friends_friend_id_fkey(
          id, username, full_name, streak, is_public, last_active
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'accepted');
    setFriends(data || []);
    setLoading(false);
  };

  const fetchFriendData = async (friend) => {
  // Check if friend's profile is public
  const { data: profileData } = await supabase
    .from('profiles')
    .select('is_public')
    .eq('id', friend.id)
    .single();

  if (!profileData?.is_public) {
    setFriendGoals([]);
    setFriendTasks([]);
    setFriendHabits([]);
    setFriendIsPrivate(true);
    return;
  }

  setFriendIsPrivate(false);
  const [goalsRes, tasksRes, habitsRes] = await Promise.all([
    supabase.from('goals').select('*').eq('user_id', friend.id),
    supabase.from('tasks').select('*').eq('user_id', friend.id)
      .eq('due_date', new Date().toISOString().split('T')[0]),
    supabase.from('habits').select('*').eq('user_id', friend.id),
  ]);
  setFriendGoals(goalsRes.data || []);
  setFriendTasks(tasksRes.data || []);
  setFriendHabits(habitsRes.data || []);
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
    if (error || !data) { setSearchError('User not found!'); return; }
    if (data.id === user.id) { setSearchError('You cannot add yourself!'); return; }
    setSearchResult(data);
  };

  const sendFriendRequest = async (friendId) => {
    const { error } = await supabase
      .from('friends')
      .insert([{ user_id: user.id, friend_id: friendId, status: 'accepted' }]);
    if (!error) {
      setSearchResult(null);
      setSearchUsername('');
      fetchFriends();
    }
  };

  const removeFriend = async (friendId) => {
    await supabase.from('friends').delete()
      .eq('user_id', user.id).eq('friend_id', friendId);
    setFriends(friends.filter(f => f.friend_id !== friendId));
    if (selectedFriend?.id === friendId) setSelectedFriend(null);
  };

  const openFriendProfile = async (friend) => {
  setSelectedFriend(friend);
  setActiveTab('profile');
  await fetchFriendData(friend);
};

  const getLastActiveText = (lastActive) => {
    if (!lastActive) return 'Never active';
    const days = Math.floor((new Date() - new Date(lastActive)) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Active today! 🌟';
    if (days === 1) return 'Active yesterday';
    if (days <= 3) return `Active ${days} days ago`;
    return `Inactive for ${days} days 😴`;
  };

  const getActivityColor = (lastActive) => {
    if (!lastActive) return '#ccc';
    const days = Math.floor((new Date() - new Date(lastActive)) / (1000 * 60 * 60 * 24));
    if (days === 0) return '#00c853';
    if (days <= 2) return '#ffab00';
    return '#f50057';
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div style={{ minHeight: '100vh', background: theme.background }}>
      <Navbar />
      <div style={styles.content}>
        <h1 style={{ color: theme.text, fontSize: '2rem', fontWeight: '700', marginBottom: '4px' }}>
          👥 Friends
        </h1>
        <p style={{ color: theme.textLight, marginBottom: '24px' }}>
          Grow together, celebrate each other 🌸
        </p>

        {/* Tabs */}
        <div style={{
          ...styles.tabRow,
          background: theme.card,
          border: `1.5px solid ${theme.border}`,
        }}>
          {[
            { key: 'friends', label: 'My Friends', emoji: '👥' },
            { key: 'search', label: 'Add Friend', emoji: '🔍' },
            { key: 'compare', label: 'Compare', emoji: '📊' },
            ...(selectedFriend ? [{ key: 'profile', label: selectedFriend.full_name?.split(' ')[0] || 'Friend', emoji: '🌿' }] : []),
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                ...styles.tabBtn,
                background: activeTab === tab.key ? theme.gradient : 'transparent',
                color: activeTab === tab.key ? '#fff' : theme.textLight,
                fontWeight: activeTab === tab.key ? '700' : '400',
              }}
            >
              {tab.emoji} {tab.label}
            </button>
          ))}
        </div>

        {/* Friends Tab */}
        {activeTab === 'friends' && (
          <div>
            {loading ? (
              <p style={{ color: theme.textLight }}>Loading...</p>
            ) : friends.length === 0 ? (
              <div style={{
                ...styles.card,
                background: theme.card,
                border: `1.5px solid ${theme.border}`,
                textAlign: 'center',
                padding: '60px',
              }}>
                <p style={{ fontSize: '3rem' }}>🌱</p>
                <p style={{ color: theme.textLight, marginTop: '12px' }}>
                  No friends yet! Search for friends to add them.
                </p>
              </div>
            ) : (
              <div style={styles.friendsList}>
                {friends.map(f => {
                  const activityColor = getActivityColor(f.friend?.last_active);
                  const activityText = getLastActiveText(f.friend?.last_active);
                  const isStruggling = f.friend?.last_active &&
                    Math.floor((new Date() - new Date(f.friend.last_active)) / (1000 * 60 * 60 * 24)) >= 3;

                  return (
                    <div key={f.id} style={{
                      ...styles.friendCard,
                      background: theme.card,
                      border: `1.5px solid ${theme.border}`,
                      borderLeft: `4px solid ${activityColor}`,
                    }}>
                      <div style={styles.friendTop}>
                        <div style={{ ...styles.avatar, background: theme.gradient }}>
                          {f.friend?.full_name?.[0] || '?'}
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ color: theme.text, fontWeight: '700', fontSize: '1rem' }}>
                            {f.friend?.full_name}
                          </p>
                          <p style={{ color: theme.textLight, fontSize: '0.78rem' }}>
                            @{f.friend?.username}
                          </p>
                          <p style={{ color: activityColor, fontSize: '0.78rem', fontWeight: '600', marginTop: '2px' }}>
                            {activityText}
                          </p>
                          {isStruggling && (
                            <div style={{
                              marginTop: '6px',
                              padding: '4px 10px',
                              borderRadius: '20px',
                              background: '#fff3e0',
                              color: '#e65100',
                              fontSize: '0.72rem',
                              fontWeight: '700',
                              display: 'inline-block',
                            }}>
                              ⚠️ Might need some encouragement!
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                          <div style={{
                            padding: '4px 10px',
                            borderRadius: '20px',
                            background: theme.accent,
                            color: theme.primary,
                            fontSize: '0.78rem',
                            fontWeight: '700',
                          }}>
                            🔥 {f.friend?.streak || 0} days
                          </div>
                          <button
                            onClick={() => openFriendProfile(f.friend)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '8px',
                              background: theme.gradient,
                              color: '#fff',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '0.78rem',
                              fontWeight: '600',
                            }}
                          >
                            View Profile
                          </button>
                          <button
                            onClick={() => removeFriend(f.friend_id)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '8px',
                              background: '#fff0f0',
                              color: '#c62828',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '0.78rem',
                              fontWeight: '600',
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Search Tab */}
        {activeTab === 'search' && (
          <div style={{
            ...styles.card,
            background: theme.card,
            border: `1.5px solid ${theme.border}`,
          }}>
            <h2 style={{ color: theme.text, fontSize: '1.1rem', fontWeight: '600', marginBottom: '16px' }}>
              🔍 Find a Friend
            </h2>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
              <input
                style={{
                  flex: 1, padding: '12px 16px', borderRadius: '12px',
                  fontSize: '0.95rem', outline: 'none',
                  background: theme.accent, border: `2px solid ${theme.border}`,
                  color: theme.text,
                }}
                type="text"
                placeholder="Search by username..."
                value={searchUsername}
                onChange={(e) => setSearchUsername(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchUser()}
              />
              <button
                style={{
                  padding: '12px 24px', borderRadius: '12px',
                  background: theme.gradient, color: '#fff',
                  border: 'none', cursor: 'pointer', fontWeight: '700',
                }}
                onClick={searchUser}
              >
                Search
              </button>
            </div>

            {searchError && (
              <div style={{
                padding: '10px 14px', borderRadius: '10px',
                color: '#c62828', background: '#fff0f0',
                border: '1px solid #ffd5d5', fontSize: '0.9rem',
              }}>
                😕 {searchError}
              </div>
            )}

            {searchResult && (
              <div style={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', padding: '14px',
                borderRadius: '12px', marginTop: '12px',
                background: theme.accent, border: `1px solid ${theme.border}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ ...styles.avatar, background: theme.gradient }}>
                    {searchResult.full_name?.[0] || '?'}
                  </div>
                  <div>
                    <p style={{ color: theme.text, fontWeight: '600' }}>{searchResult.full_name}</p>
                    <p style={{ color: theme.textLight, fontSize: '0.85rem' }}>@{searchResult.username}</p>
                  </div>
                </div>
                <button
                  style={{
                    padding: '8px 18px', borderRadius: '10px',
                    background: theme.gradient, color: '#fff',
                    border: 'none', cursor: 'pointer', fontWeight: '700',
                  }}
                  onClick={() => sendFriendRequest(searchResult.id)}
                >
                  + Add
                </button>
              </div>
            )}
          </div>
        )}

        {/* Compare Tab */}
        {activeTab === 'compare' && (
          <div>
            {friends.length === 0 ? (
              <div style={{
                ...styles.card,
                background: theme.card,
                border: `1.5px solid ${theme.border}`,
                textAlign: 'center', padding: '60px',
              }}>
                <p style={{ fontSize: '3rem' }}>📊</p>
                <p style={{ color: theme.textLight, marginTop: '12px' }}>
                  Add friends to compare progress!
                </p>
              </div>
            ) : (
              <div>
                <div style={{
                  ...styles.card,
                  background: theme.card,
                  border: `1.5px solid ${theme.border}`,
                }}>
                  <h2 style={{ color: theme.text, fontSize: '1.1rem', fontWeight: '600', marginBottom: '20px' }}>
                    📊 Goal Progress Comparison
                  </h2>

                  {/* My Stats */}
                  <div style={styles.compareRow}>
                    <div style={{
                      ...styles.compareCard,
                      background: theme.accent,
                      border: `1.5px solid ${theme.primary}`,
                    }}>
                      <p style={{ color: theme.primary, fontWeight: '700', marginBottom: '12px', fontSize: '0.95rem' }}>
                        🌿 You
                      </p>
                      <div style={styles.compareStat}>
                        <span style={{ color: theme.textLight, fontSize: '0.82rem' }}>Goals</span>
                        <span style={{ color: theme.primary, fontWeight: '700' }}>{myGoals.length}</span>
                      </div>
                      <div style={styles.compareStat}>
                        <span style={{ color: theme.textLight, fontSize: '0.82rem' }}>Completed</span>
                        <span style={{ color: '#00c853', fontWeight: '700' }}>
                          {myGoals.filter(g => g.completed).length}
                        </span>
                      </div>
                      <div style={styles.compareStat}>
                        <span style={{ color: theme.textLight, fontSize: '0.82rem' }}>Avg Progress</span>
                        <span style={{ color: theme.primary, fontWeight: '700' }}>
                          {myGoals.length > 0
                            ? Math.round(myGoals.reduce((s, g) => s + g.progress, 0) / myGoals.length)
                            : 0}%
                        </span>
                      </div>
                    </div>

                    {friends.slice(0, 3).map(f => (
                      <div
                        key={f.id}
                        style={{
                          ...styles.compareCard,
                          background: theme.card,
                          border: `1.5px solid ${theme.border}`,
                          cursor: 'pointer',
                        }}
                        onClick={() => openFriendProfile(f.friend)}
                      >
                        <p style={{ color: theme.text, fontWeight: '700', marginBottom: '12px', fontSize: '0.95rem' }}>
                          {f.friend?.full_name?.split(' ')[0] || 'Friend'}
                        </p>
                        <div style={styles.compareStat}>
                          <span style={{ color: theme.textLight, fontSize: '0.82rem' }}>Streak</span>
                          <span style={{ color: '#ff6d00', fontWeight: '700' }}>
                            🔥 {f.friend?.streak || 0}
                          </span>
                        </div>
                        <div style={styles.compareStat}>
                          <span style={{ color: theme.textLight, fontSize: '0.82rem' }}>Status</span>
                          <span style={{
                            color: getActivityColor(f.friend?.last_active),
                            fontWeight: '700', fontSize: '0.75rem',
                          }}>
                            {getLastActiveText(f.friend?.last_active)}
                          </span>
                        </div>
                        <p style={{ color: theme.primary, fontSize: '0.75rem', marginTop: '8px' }}>
                          Tap to see goals →
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Friend Profile Tab */}
        {activeTab === 'profile' && selectedFriend && (
          <div>
            {/* Friend Header */}
            {friendIsPrivate ? (
  <div style={{
    ...styles.card,
    background: theme.card,
    border: `1.5px solid ${theme.border}`,
    textAlign: 'center',
    padding: '40px',
  }}>
    <p style={{ fontSize: '3rem' }}>🔒</p>
    <p style={{ color: theme.text, fontWeight: '700', fontSize: '1.1rem', marginTop: '12px' }}>
      This profile is private
    </p>
    <p style={{ color: theme.textLight, fontSize: '0.9rem', marginTop: '8px' }}>
      {selectedFriend.full_name} has set their profile to private.
      Only public profiles can be viewed by friends.
    </p>
  </div>
) : (
  // Friend Goals and Habits sections go here
  <>
    {/* Friend Goals */}
    <div style={{
      ...styles.card,
      background: theme.card,
      border: `1.5px solid ${theme.border}`,
    }}>
      <h2 style={{ color: theme.text, fontSize: '1.1rem', fontWeight: '600', marginBottom: '16px' }}>
        🎯 {selectedFriend.full_name?.split(' ')[0]}'s Goals
      </h2>
      {friendGoals.length === 0 ? (
        <p style={{ color: theme.textLight, textAlign: 'center', padding: '20px' }}>
          No goals yet!
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {friendGoals.map(goal => (
            <div key={goal.id} style={{
              padding: '14px', borderRadius: '12px',
              background: theme.accent, border: `1px solid ${theme.border}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{ fontSize: '1.5rem' }}>{goal.emoji}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ color: theme.text, fontWeight: '600', fontSize: '0.9rem' }}>
                    {goal.title}
                  </p>
                  <p style={{ color: theme.textLight, fontSize: '0.75rem' }}>
                    {goal.type} · {goal.progress}% complete
                  </p>
                </div>
                {goal.completed && (
                  <span style={{ color: '#00c853', fontSize: '0.8rem', fontWeight: '700' }}>
                    🏆 Done!
                  </span>
                )}
              </div>
              <div style={{
                height: '8px', borderRadius: '4px',
                background: theme.border, overflow: 'hidden',
              }}>
                <div style={{
                  width: `${goal.progress}%`, height: '100%',
                  background: goal.completed
                    ? 'linear-gradient(135deg, #00c853, #69f0ae)'
                    : theme.gradient,
                  borderRadius: '4px',
                  transition: 'width 0.5s ease',
                }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>

    {/* Friend Habits */}
    {friendHabits.length > 0 && (
      <div style={{
        ...styles.card,
        background: theme.card,
        border: `1.5px solid ${theme.border}`,
      }}>
        <h2 style={{ color: theme.text, fontSize: '1.1rem', fontWeight: '600', marginBottom: '16px' }}>
          🌱 {selectedFriend.full_name?.split(' ')[0]}'s Habits
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {friendHabits.map(habit => {
            const doneToday = (habit.completed_dates || []).includes(todayStr);
            return (
              <div key={habit.id} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 14px', borderRadius: '12px',
                background: theme.accent, border: `1px solid ${theme.border}`,
              }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '10px',
                  background: habit.color + '22',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.2rem',
                }}>
                  {habit.emoji}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ color: theme.text, fontWeight: '600', fontSize: '0.9rem' }}>
                    {habit.title}
                  </p>
                  <p style={{ color: theme.textLight, fontSize: '0.75rem' }}>
                    🔥 {habit.streak || 0} day streak
                  </p>
                </div>
                <div style={{
                  padding: '4px 10px', borderRadius: '20px',
                  background: doneToday ? '#e8f5e9' : '#fff3e0',
                  color: doneToday ? '#2e7d32' : '#e65100',
                  fontSize: '0.72rem', fontWeight: '700',
                }}>
                  {doneToday ? '✓ Done today' : '○ Not done'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    )}
  </>
)}
            <div style={{
              ...styles.card,
              background: theme.card,
              border: `1.5px solid ${theme.border}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                <div style={{
                  width: '64px', height: '64px', borderRadius: '50%',
                  background: theme.gradient, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: '700', fontSize: '1.5rem',
                }}>
                  {selectedFriend.full_name?.[0] || '?'}
                </div>
                <div>
                  <h2 style={{ color: theme.text, fontWeight: '700', fontSize: '1.3rem' }}>
                    {selectedFriend.full_name}
                  </h2>
                  <p style={{ color: theme.textLight, fontSize: '0.85rem' }}>
                    @{selectedFriend.username}
                  </p>
                  <p style={{
                    color: getActivityColor(selectedFriend.last_active),
                    fontSize: '0.82rem', fontWeight: '600', marginTop: '2px',
                  }}>
                    {getLastActiveText(selectedFriend.last_active)}
                  </p>
                </div>
                <div style={{ marginLeft: 'auto', textAlign: 'center' }}>
                  <div style={{ color: theme.primary, fontSize: '1.8rem', fontWeight: '700' }}>
                    {selectedFriend.streak || 0}
                  </div>
                  <div style={{ color: theme.textLight, fontSize: '0.75rem' }}>day streak 🔥</div>
                </div>
              </div>

              {/* Friend Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                {[
                  { emoji: '🎯', value: friendGoals.length, label: 'Goals' },
                  { emoji: '🏆', value: friendGoals.filter(g => g.completed).length, label: 'Completed' },
                  { emoji: '✅', value: friendTasks.filter(t => t.completed).length, label: 'Tasks Today' },
                ].map((stat, i) => (
                  <div key={i} style={{
                    padding: '14px', borderRadius: '12px',
                    background: theme.accent, border: `1px solid ${theme.border}`,
                    textAlign: 'center',
                  }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{stat.emoji}</div>
                    <div style={{ color: theme.primary, fontSize: '1.3rem', fontWeight: '700' }}>{stat.value}</div>
                    <div style={{ color: theme.textLight, fontSize: '0.72rem' }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Friend Goals */}
            <div style={{
              ...styles.card,
              background: theme.card,
              border: `1.5px solid ${theme.border}`,
            }}>
              <h2 style={{ color: theme.text, fontSize: '1.1rem', fontWeight: '600', marginBottom: '16px' }}>
                🎯 {selectedFriend.full_name?.split(' ')[0]}'s Goals
              </h2>
              {friendGoals.length === 0 ? (
                <p style={{ color: theme.textLight, textAlign: 'center', padding: '20px' }}>
                  No goals yet!
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {friendGoals.map(goal => (
                    <div key={goal.id} style={{
                      padding: '14px', borderRadius: '12px',
                      background: theme.accent, border: `1px solid ${theme.border}`,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '1.5rem' }}>{goal.emoji}</span>
                        <div style={{ flex: 1 }}>
                          <p style={{ color: theme.text, fontWeight: '600', fontSize: '0.9rem' }}>
                            {goal.title}
                          </p>
                          <p style={{ color: theme.textLight, fontSize: '0.75rem' }}>
                            {goal.type} · {goal.progress}% complete
                          </p>
                        </div>
                        {goal.completed && (
                          <span style={{ color: '#00c853', fontSize: '0.8rem', fontWeight: '700' }}>
                            🏆 Done!
                          </span>
                        )}
                      </div>
                      <div style={{
                        height: '8px', borderRadius: '4px',
                        background: theme.border, overflow: 'hidden',
                      }}>
                        <div style={{
                          width: `${goal.progress}%`, height: '100%',
                          background: goal.completed
                            ? 'linear-gradient(135deg, #00c853, #69f0ae)'
                            : theme.gradient,
                          borderRadius: '4px',
                          transition: 'width 0.5s ease',
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Friend Habits */}
            {friendHabits.length > 0 && (
              <div style={{
                ...styles.card,
                background: theme.card,
                border: `1.5px solid ${theme.border}`,
              }}>
                <h2 style={{ color: theme.text, fontSize: '1.1rem', fontWeight: '600', marginBottom: '16px' }}>
                  🌱 {selectedFriend.full_name?.split(' ')[0]}'s Habits
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {friendHabits.map(habit => {
                    const doneToday = (habit.completed_dates || []).includes(todayStr);
                    return (
                      <div key={habit.id} style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '12px 14px', borderRadius: '12px',
                        background: theme.accent, border: `1px solid ${theme.border}`,
                      }}>
                        <div style={{
                          width: '40px', height: '40px', borderRadius: '10px',
                          background: habit.color + '22',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '1.2rem',
                        }}>
                          {habit.emoji}
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ color: theme.text, fontWeight: '600', fontSize: '0.9rem' }}>
                            {habit.title}
                          </p>
                          <p style={{ color: theme.textLight, fontSize: '0.75rem' }}>
                            🔥 {habit.streak || 0} day streak
                          </p>
                        </div>
                        <div style={{
                          padding: '4px 10px', borderRadius: '20px',
                          background: doneToday ? '#e8f5e9' : '#fff3e0',
                          color: doneToday ? '#2e7d32' : '#e65100',
                          fontSize: '0.72rem', fontWeight: '700',
                        }}>
                          {doneToday ? '✓ Done today' : '○ Not done'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  content: { maxWidth: '800px', margin: '0 auto', padding: '32px 16px' },
  tabRow: { display: 'flex', borderRadius: '14px', padding: '6px', gap: '4px', marginBottom: '20px', flexWrap: 'wrap' },
  tabBtn: { flex: 1, padding: '10px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '0.85rem', transition: 'all 0.2s', minWidth: '80px' },
  card: { borderRadius: '18px', padding: '24px', marginBottom: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' },
  friendsList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  friendCard: { borderRadius: '16px', padding: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' },
  friendTop: { display: 'flex', alignItems: 'flex-start', gap: '14px' },
  avatar: { width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '700', fontSize: '1.2rem', flexShrink: 0 },
  compareRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px' },
  compareCard: { borderRadius: '14px', padding: '16px' },
  compareStat: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', padding: '6px 0', borderBottom: '1px solid rgba(0,0,0,0.05)' },
};