import React, { useState } from 'react';
import { Play, MapPin, Clock, SortAsc, Search } from 'lucide-react';

interface Memory {
  id: string;
  emotion: string;
  title: string;
  duration: number;
  timestamp: Date;
  location: string;
  imageUrl?: string;
  playCount: number;
  note?: string;
}

const mockMemories: Memory[] = [
  {
    id: '1',
    emotion: '😊',
    title: 'Morning coffee thoughts',
    duration: 45,
    timestamp: new Date('2024-01-20T08:30:00'),
    location: 'Central Park, NYC',
    playCount: 3,
    note: 'Perfect autumn morning with golden leaves'
  },
  {
    id: '2',
    emotion: '💭',
    title: 'Late night reflections',
    duration: 92,
    timestamp: new Date('2024-01-19T23:15:00'),
    location: 'Brooklyn Bridge',
    playCount: 1,
    note: 'City lights and quiet thoughts'
  },
  {
    id: '3',
    emotion: '🎉',
    title: 'Got the job!',
    duration: 38,
    timestamp: new Date('2024-01-18T14:20:00'),
    location: 'Times Square',
    playCount: 7,
    note: 'Dreams do come true!'
  },
  {
    id: '4',
    emotion: '😢',
    title: 'Missing home',
    duration: 67,
    timestamp: new Date('2024-01-17T19:45:00'),
    location: 'Washington Square Park',
    playCount: 2,
    note: 'Sometimes distance makes the heart grow fonder'
  },
  {
    id: '5',
    emotion: '❤️',
    title: 'First date butterflies',
    duration: 54,
    timestamp: new Date('2024-01-16T20:30:00'),
    location: 'High Line Park',
    playCount: 5,
    note: 'New beginnings feel magical'
  }
];

const styles = {
  container: {
    height: '100%',
    backgroundColor: '#f8fafc',
  },
  header: {
    position: 'sticky' as const,
    top: 0,
    zIndex: 10,
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e2e8f0',
  },
  headerContent: {
    padding: 20,
  },
  headerTop: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '600' as const,
    color: '#1f2937',
    letterSpacing: '-0.02em',
  },
  badge: {
    backgroundColor: '#22c55e',
    color: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 14,
    fontWeight: '500' as const,
  },
  searchContainer: {
    position: 'relative' as const,
    marginBottom: 16,
  },
  searchIcon: {
    position: 'absolute' as const,
    left: 16,
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#64748b',
  },
  searchInput: {
    width: '100%',
    backgroundColor: '#f1f5f9',
    border: '1px solid #e2e8f0',
    borderRadius: 16,
    paddingLeft: 44,
    paddingRight: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
    outline: 'none' as const,
  },
  sortContainer: {
    display: 'flex' as const,
    gap: 8,
    overflowX: 'auto' as const,
  },
  sortButton: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: 4,
    padding: '8px 16px',
    borderRadius: 12,
    fontSize: 14,
    fontWeight: '500' as const,
    border: 'none' as const,
    cursor: 'pointer' as const,
    flexShrink: 0,
    transition: 'all 0.2s ease',
  },
  sortButtonActive: {
    backgroundColor: '#22c55e',
    color: '#ffffff',
  },
  sortButtonInactive: {
    backgroundColor: '#ffffff',
    color: '#64748b',
    border: '1px solid #e2e8f0',
  },
  scrollArea: {
    flex: 1,
    overflowY: 'auto' as const,
  },
  memoryList: {
    padding: 16,
    display: 'flex' as const,
    flexDirection: 'column' as const,
    gap: 16,
  },
  memoryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
    border: '1px solid #f1f5f9',
    transition: 'all 0.2s ease',
  },
  memoryContent: {
    display: 'flex' as const,
    alignItems: 'flex-start' as const,
    gap: 16,
  },
  mapSnapshot: {
    width: 64,
    height: 64,
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    flexShrink: 0,
    position: 'relative' as const,
    overflow: 'hidden' as const,
    border: '1px solid #e2e8f0',
  },
  mapGradient: {
    position: 'absolute' as const,
    inset: 0,
    background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, #f1f5f9 100%)',
  },
  mapIcon: {
    position: 'relative' as const,
    zIndex: 1,
    color: '#22c55e',
  },
  memoryInfo: {
    flex: 1,
    minWidth: 0,
  },
  memoryTop: {
    display: 'flex' as const,
    alignItems: 'flex-start' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 8,
  },
  memoryLeft: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  memoryEmotion: {
    fontSize: 20,
    flexShrink: 0,
  },
  memoryDetails: {
    minWidth: 0,
  },
  memoryTitle: {
    color: '#1f2937',
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 4,
    overflow: 'hidden' as const,
    textOverflow: 'ellipsis' as const,
    whiteSpace: 'nowrap' as const,
  },
  memoryMeta: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: 12,
    fontSize: 14,
    color: '#64748b',
  },
  playButton: {
    width: 40,
    height: 40,
    backgroundColor: '#22c55e',
    borderRadius: 12,
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    border: 'none' as const,
    cursor: 'pointer' as const,
    color: '#ffffff',
    flexShrink: 0,
    transition: 'all 0.2s ease',
  },
  memoryNote: {
    color: '#64748b',
    fontSize: 14,
    fontStyle: 'italic' as const,
    marginTop: 8,
    lineHeight: 1.4,
  },
  memoryBottom: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginTop: 8,
  },
  memoryLocation: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: 4,
    fontSize: 12,
    color: '#9ca3af',
    overflow: 'hidden' as const,
    textOverflow: 'ellipsis' as const,
    whiteSpace: 'nowrap' as const,
    flex: 1,
  },
  memoryPlays: {
    fontSize: 12,
    color: '#22c55e',
    fontWeight: '500' as const,
  },
};

export function MyMemoryScreen() {
  const [memories] = useState<Memory[]>(mockMemories);
  const [sortBy, setSortBy] = useState<'time' | 'emotion' | 'location' | 'plays'>('time');
  const [searchQuery, setSearchQuery] = useState('');

  const sortedMemories = [...memories]
    .filter(memory => 
      memory.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      memory.location.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'time':
          return b.timestamp.getTime() - a.timestamp.getTime();
        case 'plays':
          return b.playCount - a.playCount;
        case 'location':
          return a.location.localeCompare(b.location);
        case 'emotion':
          return a.emotion.localeCompare(b.emotion);
        default:
          return 0;
      }
    });

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.headerTop}>
            <h1 style={styles.title}>My Memories</h1>
            <div style={styles.badge}>
              {memories.length} voices
            </div>
          </div>
          
          {/* Search */}
          <div style={styles.searchContainer}>
            <Search size={20} style={styles.searchIcon} />
            <input
              style={styles.searchInput}
              placeholder="Search memories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Sort Controls */}
          <div style={styles.sortContainer}>
            {[
              { key: 'time', label: 'Recent' },
              { key: 'plays', label: 'Popular' },
              { key: 'emotion', label: 'Emotion' },
              { key: 'location', label: 'Location' }
            ].map(({ key, label }) => (
              <button
                key={key}
                style={{
                  ...styles.sortButton,
                  ...(sortBy === key ? styles.sortButtonActive : styles.sortButtonInactive)
                }}
                onClick={() => setSortBy(key as any)}
              >
                <SortAsc size={16} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Memory List */}
      <div style={styles.scrollArea}>
        <div style={styles.memoryList}>
          {sortedMemories.map((memory) => (
            <div key={memory.id} style={styles.memoryCard}>
              <div style={styles.memoryContent}>
                {/* Mini Map Snapshot */}
                <div style={styles.mapSnapshot}>
                  <div style={styles.mapGradient}></div>
                  <MapPin size={24} style={styles.mapIcon} />
                </div>

                {/* Memory Info */}
                <div style={styles.memoryInfo}>
                  <div style={styles.memoryTop}>
                    <div style={styles.memoryLeft}>
                      <span style={styles.memoryEmotion}>{memory.emotion}</span>
                      <div style={styles.memoryDetails}>
                        <h3 style={styles.memoryTitle}>{memory.title}</h3>
                        <div style={styles.memoryMeta}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Clock size={12} />
                            {memory.duration}s
                          </span>
                          <span>{formatDate(memory.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <button style={styles.playButton}>
                      <Play size={16} style={{ marginLeft: 2 }} />
                    </button>
                  </div>

                  {memory.note && (
                    <div style={styles.memoryNote}>
                      "{memory.note}"
                    </div>
                  )}

                  <div style={styles.memoryBottom}>
                    <div style={styles.memoryLocation}>
                      <MapPin size={12} />
                      <span>{memory.location}</span>
                    </div>
                    
                    <div style={styles.memoryPlays}>
                      {memory.playCount} plays
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}