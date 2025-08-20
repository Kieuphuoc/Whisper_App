import React from 'react';
import { Map, Shuffle, BookOpen, User } from 'lucide-react';

interface BottomNavigationProps {
  activeScreen: string;
  onScreenChange: (screen: string) => void;
}

const styles = {
  container: {
    position: 'fixed' as const,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(12px)',
    borderTop: '1px solid #e2e8f0',
    boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.1)',
  },
  content: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-around' as const,
    padding: '12px 16px',
    maxWidth: 448,
    margin: '0 auto',
  },
  navButton: {
    display: 'flex' as const,
    flexDirection: 'column' as const,
    alignItems: 'center' as const,
    gap: 4,
    padding: 8,
    minHeight: 56,
    minWidth: 56,
    background: 'none' as const,
    border: 'none' as const,
    cursor: 'pointer' as const,
    borderRadius: 12,
    transition: 'all 0.2s ease',
  },
  navButtonActive: {
    color: '#22c55e',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  navButtonInactive: {
    color: '#9ca3af',
  },
  navLabel: {
    fontSize: 12,
    fontWeight: '500' as const,
    lineHeight: 1,
  },
};

export function BottomNavigation({ activeScreen, onScreenChange }: BottomNavigationProps) {
  const navItems = [
    { key: 'map', icon: Map, label: 'Map' },
    { key: 'random', icon: Shuffle, label: 'Random' },
    { key: 'memory', icon: BookOpen, label: 'Memory' },
    { key: 'profile', icon: User, label: 'Profile' }
  ];

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {navItems.map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => onScreenChange(key)}
            style={{
              ...styles.navButton,
              ...(activeScreen === key ? styles.navButtonActive : styles.navButtonInactive)
            }}
          >
            <Icon size={24} strokeWidth={activeScreen === key ? 2.5 : 2} />
            <span style={styles.navLabel}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}