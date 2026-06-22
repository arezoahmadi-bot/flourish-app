import { useEffect } from 'react';
import Notifications from './pages/Notifications';
import OfflineBanner from './components/OfflineBanner';
import FriendFeed from './pages/FriendFeed';
import ProductivityScore from './pages/ProductivityScore';
import WeeklyReview from './pages/WeeklyReview';
import Journal from './pages/Journal';
import Achievements from './pages/Achievements';
import Timeline from './pages/Timeline';
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Goals from './pages/Goals';
import Friends from './pages/Friends';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import Pomodoro from './pages/Pomodoro';
import Habits from './pages/Habits';
import Mood from './pages/Mood';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import './index.css';

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (user) {
      const visited = JSON.parse(localStorage.getItem('flourish_visited_pages') || '[]');
      if (!visited.includes(location.pathname)) {
        visited.push(location.pathname);
        localStorage.setItem('flourish_visited_pages', JSON.stringify(visited));
      }
    }
  }, [location.pathname, user]);

  return user ? children : <Navigate to="/login" />;
};
function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <OfflineBanner />
        <Router>
          <Routes>
            <Route path="/feed" element={<PrivateRoute><FriendFeed /></PrivateRoute>} />
            <Route path="/productivity" element={<PrivateRoute><ProductivityScore /></PrivateRoute>} />
            <Route path="/weekly" element={<PrivateRoute><WeeklyReview /></PrivateRoute>} />
            <Route path="/notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />
            <Route path="/journal" element={<PrivateRoute><Journal /></PrivateRoute>} />
            <Route path="/achievements" element={<PrivateRoute><Achievements /></PrivateRoute>} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/goals" element={<PrivateRoute><Goals /></PrivateRoute>} />
            <Route path="/friends" element={<PrivateRoute><Friends /></PrivateRoute>} />
            <Route path="/analytics" element={<PrivateRoute><Analytics /></PrivateRoute>} />
            <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
            <Route path="/pomodoro" element={<PrivateRoute><Pomodoro /></PrivateRoute>} />
            <Route path="/habits" element={<PrivateRoute><Habits /></PrivateRoute>} />
            <Route path="/mood" element={<PrivateRoute><Mood /></PrivateRoute>} />
            <Route path="/timeline" element={<PrivateRoute><Timeline /></PrivateRoute>} />
          </Routes>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;