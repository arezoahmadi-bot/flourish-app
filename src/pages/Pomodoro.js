import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import { useTheme } from '../context/ThemeContext';

const MODES = {
  pomodoro: { label: 'Focus', duration: 25 * 60, emoji: '🎯' },
  short: { label: 'Short Break', duration: 5 * 60, emoji: '☕' },
  long: { label: 'Long Break', duration: 15 * 60, emoji: '🌿' },
};

export default function Pomodoro() {
  const { theme } = useTheme();
  const [mode, setMode] = useState('pomodoro');
  const [timeLeft, setTimeLeft] = useState(MODES.pomodoro.duration);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [clockStyle, setClockStyle] = useState('digital');
  const intervalRef = useRef(null);

  useEffect(() => {
    setTimeLeft(MODES[mode].duration);
    setRunning(false);
    clearInterval(intervalRef.current);
  }, [mode]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            if (mode === 'pomodoro') setSessions(s => s + 1);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, mode]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const pad = (n) => String(n).padStart(2, '0');
  const total = MODES[mode].duration;
  const progress = ((total - timeLeft) / total) * 100;
  const circumference = 2 * Math.PI * 120;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const reset = () => {
    setTimeLeft(MODES[mode].duration);
    setRunning(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: theme.background }}>
      <Navbar />
      <div style={styles.content}>
        <h1 style={{ color: theme.text, fontSize: '2rem', fontWeight: '700', marginBottom: '8px' }}>
          ⏱️ Focus Timer
        </h1>
        <p style={{ color: theme.textLight, marginBottom: '28px' }}>
          Stay focused, take breaks, grow every day 🌱
        </p>

        {/* Mode Selector */}
        <div style={{
          ...styles.modeRow,
          background: theme.card,
          border: `1.5px solid ${theme.border}`,
        }}>
          {Object.entries(MODES).map(([key, val]) => (
            <button
              key={key}
              onClick={() => setMode(key)}
              style={{
                ...styles.modeBtn,
                background: mode === key ? theme.gradient : 'transparent',
                color: mode === key ? '#fff' : theme.textLight,
                fontWeight: mode === key ? '700' : '400',
              }}
            >
              {val.emoji} {val.label}
            </button>
          ))}
        </div>

        {/* Clock Style Selector */}
        <div style={styles.styleRow}>
          {['digital', 'round', 'minimal'].map(s => (
            <button
              key={s}
              onClick={() => setClockStyle(s)}
              style={{
                ...styles.styleBtn,
                background: clockStyle === s ? theme.accent : 'transparent',
                color: clockStyle === s ? theme.primary : theme.textLight,
                border: `1.5px solid ${clockStyle === s ? theme.primary : theme.border}`,
              }}
            >
              {s === 'digital' ? '🔢' : s === 'round' ? '🕐' : '✨'} {s}
            </button>
          ))}
        </div>

        {/* Timer Display */}
        <div style={{
          ...styles.timerCard,
          background: theme.card,
          border: `1.5px solid ${theme.border}`,
        }}>

          {/* Digital Style */}
          {clockStyle === 'digital' && (
            <div style={styles.digitalDisplay}>
              <div style={{
                ...styles.digitalTime,
                color: theme.primary,
                textShadow: `0 0 30px ${theme.primary}44`,
              }}>
                {pad(minutes)}:{pad(seconds)}
              </div>
              <p style={{ color: theme.textLight, fontSize: '1rem' }}>
                {MODES[mode].emoji} {MODES[mode].label}
              </p>
            </div>
          )}

          {/* Round Style */}
          {clockStyle === 'round' && (
            <div style={styles.roundDisplay}>
              <svg width="280" height="280" viewBox="0 0 280 280">
                <circle
                  cx="140" cy="140" r="120"
                  fill="none"
                  stroke={theme.accent}
                  strokeWidth="12"
                />
                <circle
                  cx="140" cy="140" r="120"
                  fill="none"
                  stroke={theme.primary}
                  strokeWidth="12"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  transform="rotate(-90 140 140)"
                  style={{ transition: 'stroke-dashoffset 1s linear' }}
                />
                <text
                  x="140" y="130"
                  textAnchor="middle"
                  fill={theme.primary}
                  fontSize="42"
                  fontWeight="700"
                  fontFamily="DM Sans, sans-serif"
                >
                  {pad(minutes)}:{pad(seconds)}
                </text>
                <text
                  x="140" y="165"
                  textAnchor="middle"
                  fill={theme.textLight}
                  fontSize="16"
                  fontFamily="DM Sans, sans-serif"
                >
                  {MODES[mode].label}
                </text>
              </svg>
            </div>
          )}

          {/* Minimal Style */}
          {clockStyle === 'minimal' && (
            <div style={styles.minimalDisplay}>
              <div style={{ fontSize: '1rem', color: theme.textLight, marginBottom: '8px' }}>
                {MODES[mode].emoji} {MODES[mode].label}
              </div>
              <div style={{
                fontSize: '5rem',
                fontWeight: '300',
                color: theme.text,
                letterSpacing: '8px',
              }}>
                {pad(minutes)}:{pad(seconds)}
              </div>
              <div style={{
                width: '100%',
                height: '4px',
                background: theme.accent,
                borderRadius: '2px',
                marginTop: '20px',
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${progress}%`,
                  height: '100%',
                  background: theme.gradient,
                  borderRadius: '2px',
                  transition: 'width 1s linear',
                }} />
              </div>
            </div>
          )}

          {/* Controls */}
          <div style={styles.controls}>
            <button
              onClick={reset}
              style={{
                ...styles.controlBtn,
                background: theme.accent,
                color: theme.primary,
              }}
            >
              🔄 Reset
            </button>
            <button
              onClick={() => setRunning(!running)}
              style={{
                ...styles.playBtn,
                background: theme.gradient,
              }}
            >
              {running ? '⏸ Pause' : '▶ Start'}
            </button>
          </div>

          {/* Sessions */}
          <div style={styles.sessionsRow}>
            <p style={{ color: theme.textLight, fontSize: '0.9rem' }}>
              🍅 Sessions completed today:
            </p>
            <div style={styles.sessionDots}>
              {Array.from({ length: Math.max(4, sessions) }).map((_, i) => (
                <div key={i} style={{
                  ...styles.dot,
                  background: i < sessions ? theme.primary : theme.accent,
                }} />
              ))}
            </div>
          </div>
        </div>

        {/* Tips */}
        <div style={{
          ...styles.tipsCard,
          background: theme.card,
          border: `1.5px solid ${theme.border}`,
        }}>
          <h3 style={{ color: theme.text, marginBottom: '12px' }}>💡 Focus Tips</h3>
          <div style={styles.tipsList}>
            {[
              '🌿 Put your phone face down during focus sessions',
              '💧 Keep a glass of water nearby',
              '🎵 Try lo-fi music or nature sounds',
              '📵 Close unnecessary browser tabs',
              '🧘 Take deep breaths during breaks',
            ].map((tip, i) => (
              <p key={i} style={{ color: theme.textLight, fontSize: '0.9rem', padding: '6px 0' }}>
                {tip}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  content: {
    maxWidth: '700px',
    margin: '0 auto',
    padding: '32px 16px',
  },
  modeRow: {
    display: 'flex',
    borderRadius: '14px',
    padding: '6px',
    gap: '4px',
    marginBottom: '16px',
  },
  modeBtn: {
    flex: 1,
    padding: '10px',
    borderRadius: '10px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.9rem',
    transition: 'all 0.2s',
  },
  styleRow: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
    justifyContent: 'center',
  },
  styleBtn: {
    padding: '8px 18px',
    borderRadius: '20px',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: '600',
    transition: 'all 0.2s',
  },
  timerCard: {
    borderRadius: '20px',
    padding: '36px',
    textAlign: 'center',
    marginBottom: '20px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
  },
  digitalDisplay: {
    marginBottom: '28px',
  },
  digitalTime: {
    fontSize: '6rem',
    fontWeight: '700',
    fontFamily: 'monospace',
    letterSpacing: '4px',
    marginBottom: '8px',
  },
  roundDisplay: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '28px',
  },
  minimalDisplay: {
    marginBottom: '28px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  controls: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
    marginBottom: '24px',
  },
  controlBtn: {
    padding: '12px 24px',
    borderRadius: '12px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '600',
  },
  playBtn: {
    padding: '12px 36px',
    borderRadius: '12px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '700',
    color: '#fff',
    boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
  },
  sessionsRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  sessionDots: {
    display: 'flex',
    gap: '6px',
  },
  dot: {
    width: '14px',
    height: '14px',
    borderRadius: '50%',
    transition: 'background 0.3s',
  },
  tipsCard: {
    borderRadius: '18px',
    padding: '24px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
  },
  tipsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
};