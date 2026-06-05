import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const themes = {
  sage: {
    name: 'Sage Garden',
    primary: '#5a9e5f',
    secondary: '#7cb987',
    accent: '#d4e8c2',
    background: '#f4f1eb',
    card: 'rgba(255,253,247,0.95)',
    text: '#2d5a27',
    textLight: '#7a9e74',
    border: '#d4e8c2',
    gradient: 'linear-gradient(135deg, #5a9e5f, #7cb987)',
    emoji: '🌿',
  },
  lavender: {
    name: 'Lavender Dream',
    primary: '#7c6fcd',
    secondary: '#a89ee8',
    accent: '#e8e4f8',
    background: '#f5f3ff',
    card: 'rgba(255,254,255,0.95)',
    text: '#3d2d7a',
    textLight: '#9b8ec4',
    border: '#ddd8f5',
    gradient: 'linear-gradient(135deg, #7c6fcd, #a89ee8)',
    emoji: '💜',
  },
  rose: {
    name: 'Rose Blush',
    primary: '#c97b8a',
    secondary: '#e8a0ae',
    accent: '#fce4ec',
    background: '#fdf6f7',
    card: 'rgba(255,253,253,0.95)',
    text: '#7a2d3d',
    textLight: '#c4788a',
    border: '#f5d0d8',
    gradient: 'linear-gradient(135deg, #c97b8a, #e8a0ae)',
    emoji: '🌸',
  },
  ocean: {
    name: 'Ocean Breeze',
    primary: '#4a90a4',
    secondary: '#6cb8cc',
    accent: '#d4eff5',
    background: '#f0f8fb',
    card: 'rgba(248,253,255,0.95)',
    text: '#1a4a5a',
    textLight: '#5a9aaa',
    border: '#c8e8f0',
    gradient: 'linear-gradient(135deg, #4a90a4, #6cb8cc)',
    emoji: '🌊',
  },
  sunset: {
    name: 'Warm Sunset',
    primary: '#d4845a',
    secondary: '#e8a87c',
    accent: '#fdebd0',
    background: '#fdf6f0',
    card: 'rgba(255,253,250,0.95)',
    text: '#7a3d1a',
    textLight: '#c47a5a',
    border: '#f5d8c0',
    gradient: 'linear-gradient(135deg, #d4845a, #e8a87c)',
    emoji: '🌅',
  },
};

const darkOverride = {
  background: '#1a1a2e',
  card: 'rgba(30,30,50,0.95)',
  text: '#e8e8f0',
  textLight: '#9090b0',
  border: '#3a3a5a',
};

export const ThemeProvider = ({ children }) => {
  const [themeName, setThemeName] = useState('sage');
  const [mode, setMode] = useState('light');

  useEffect(() => {
    const saved = localStorage.getItem('app-theme');
    const savedMode = localStorage.getItem('app-mode');
    if (saved) setThemeName(saved);
    if (savedMode) setMode(savedMode);
  }, []);

  const setTheme = (name) => {
    setThemeName(name);
    localStorage.setItem('app-theme', name);
  };

  const setColorMode = (m) => {
    setMode(m);
    localStorage.setItem('app-mode', m);
  };

  const baseTheme = themes[themeName];
  const isDark = mode === 'dark' ||
    (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const theme = isDark ? { ...baseTheme, ...darkOverride } : baseTheme;

  return (
    <ThemeContext.Provider value={{ theme, themeName, setTheme, mode, setColorMode, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);