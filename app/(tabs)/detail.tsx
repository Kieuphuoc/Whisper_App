import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Heart, 
  MessageCircle, 
  Share, 
  MapPin, 
  Calendar,
  Smartphone,
  Volume2,
  ArrowLeft
} from 'lucide-react';

interface VoiceDetail {
  id: string;
  emotion: string;
  title: string;
  duration: number;
  timestamp: Date;
  location: string;
  author: {
    name: string;
    avatar: string;
  };
  device: string;
  likes: number;
  isLiked: boolean;
  replies: number;
  waveform: number[];
  imageUrl?: string;
  note?: string;
}

const mockVoiceDetail: VoiceDetail = {
  id: '1',
  emotion: '💭',
  title: 'Late night reflections',
  duration: 92,
  timestamp: new Date('2024-01-19T23:15:00'),
  location: 'Brooklyn Bridge, New York',
  author: {
    name: 'Alex Chen',
    avatar: ''
  },
  device: 'iPhone 15 Pro',
  likes: 12,
  isLiked: false,
  replies: 3,
  waveform: [0.3, 0.7, 0.4, 0.8, 0.2, 0.9, 0.6, 0.3, 0.5, 0.7, 0.8, 0.4, 0.6, 0.9, 0.2, 0.7, 0.5, 0.8, 0.3, 0.6, 0.4, 0.9, 0.7, 0.2, 0.5, 0.8, 0.6, 0.4, 0.7, 0.3],
  note: 'Standing on this bridge, watching the city lights reflect on the water. Sometimes the quiet moments teach us the most about ourselves.'
};

const styles = {
  container: {
    height: '100%',
    backgroundColor: '#f8fafc',
    overflow: 'hidden' as const,
  },
  content: {
    display: 'flex' as const,
    flexDirection: 'column' as const,
    height: '100%',
  },
  header: {
    padding: 24,
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e2e8f0',
  },
  backButton: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: 8,
    padding: '8px 12px',
    backgroundColor: '#f1f5f9',
    border: 'none' as const,
    borderRadius: 12,
    color: '#64748b',
    fontSize: 14,
    fontWeight: '500' as const,
    cursor: 'pointer' as const,
    marginBottom: 16,
    transition: 'all 0.2s ease',
  },
  headerContent: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: 16,
    marginBottom: 16,
  },
  emoji: {
    fontSize: 32,
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: '#1f2937',
    marginBottom: 4,
    lineHeight: 1.3,
  },
  author: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: 8,
    color: '#64748b',
    fontSize: 14,
  },
  avatar: {
    width: 20,
    height: 20,
    backgroundColor: '#22c55e',
    borderRadius: 10,
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600' as const,
  },
  metadata: {
    display: 'grid' as const,
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
    fontSize: 14,
    color: '#64748b',
  },
  metadataItem: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: 6,
  },
  waveformSection: {
    flex: 1,
    padding: 24,
  },
  waveformCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
    border: '1px solid #f1f5f9',
  },
  waveformContainer: {
    display: 'flex' as const,
    alignItems: 'flex-end' as const,
    justifyContent: 'center' as const,
    gap: 2,
    height: 120,
    marginBottom: 20,
  },
  waveformBar: {
    width: 3,
    borderRadius: 2,
    transition: 'all 0.1s ease',
  },
  progressTime: {
    display: 'flex' as const,
    justifyContent: 'space-between' as const,
    fontSize: 14,
    color: '#64748b',
    marginBottom: 20,
  },
  playControlContainer: {
    display: 'flex' as const,
    justifyContent: 'center' as const,
    marginBottom: 16,
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#22c55e',
    border: 'none' as const,
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    cursor: 'pointer' as const,
    color: '#ffffff',
    boxShadow: '0 8px 24px rgba(34, 197, 94, 0.3)',
    transition: 'all 0.2s ease',
  },
  noteCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
    border: '1px solid #f1f5f9',
  },
  noteText: {
    color: '#64748b',
    fontSize: 16,
    fontStyle: 'italic' as const,
    lineHeight: 1.5,
  },
  actionsContainer: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 32,
    marginBottom: 20,
  },
  actionButton: {
    display: 'flex' as const,
    flexDirection: 'column' as const,
    alignItems: 'center' as const,
    gap: 4,
    background: 'none' as const,
    border: 'none' as const,
    cursor: 'pointer' as const,
    transition: 'all 0.2s ease',
  },
  actionIcon: {
    color: '#9ca3af',
    transition: 'color 0.2s ease',
  },
  actionIconActive: {
    color: '#22c55e',
  },
  actionCount: {
    fontSize: 14,
    color: '#64748b',
  },
  replySection: {
    padding: 24,
    backgroundColor: '#ffffff',
    borderTop: '1px solid #e2e8f0',
  },
  replyButton: {
    width: '100%',
    backgroundColor: '#22c55e',
    color: '#ffffff',
    border: 'none' as const,
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    fontWeight: '500' as const,
    cursor: 'pointer' as const,
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    transition: 'all 0.2s ease',
  },
};

export function VoiceDetailScreen() {
  const [voice] = useState<VoiceDetail>(mockVoiceDetail);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isLiked, setIsLiked] = useState(voice.isLiked);

  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1.1;
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [isPlaying]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* Header */}
        <div style={styles.header}>
          <button style={styles.backButton}>
            <ArrowLeft size={16} />
            Back
          </button>
          
          <div style={styles.headerContent}>
            <div style={styles.emoji}>{voice.emotion}</div>
            <div style={styles.headerInfo}>
              <h1 style={styles.title}>{voice.title}</h1>
              <div style={styles.author}>
                <div style={styles.avatar}>
                  {voice.author.name.charAt(0)}
                </div>
                <span>{voice.author.name}</span>
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div style={styles.metadata}>
            <div style={styles.metadataItem}>
              <Calendar size={16} />
              <span>{voice.timestamp.toLocaleDateString()}</span>
            </div>
            <div style={styles.metadataItem}>
              <MapPin size={16} />
              <span>{voice.location}</span>
            </div>
            <div style={styles.metadataItem}>
              <Smartphone size={16} />
              <span>{voice.device}</span>
            </div>
            <div style={styles.metadataItem}>
              <Volume2 size={16} />
              <span>{formatDuration(voice.duration)}</span>
            </div>
          </div>
        </div>

        {/* Waveform Player */}
        <div style={styles.waveformSection}>
          <div style={styles.waveformCard}>
            {/* Waveform */}
            <div style={styles.waveformContainer}>
              {voice.waveform.map((amplitude, index) => {
                const height = amplitude * 80 + 8;
                const isActive = (index / voice.waveform.length) * 100 <= progress;
                
                return (
                  <div
                    key={index}
                    style={{
                      ...styles.waveformBar,
                      height: `${height}px`,
                      backgroundColor: isActive ? '#22c55e' : '#e2e8f0',
                    }}
                  />
                );
              })}
            </div>

            {/* Progress */}
            <div style={styles.progressTime}>
              <span>{formatDuration(Math.floor((progress / 100) * voice.duration))}</span>
              <span>{formatDuration(voice.duration)}</span>
            </div>

            {/* Play Control */}
            <div style={styles.playControlContainer}>
              <button
                onClick={handlePlayPause}
                style={styles.playButton}
              >
                {isPlaying ? (
                  <Pause size={28} />
                ) : (
                  <Play size={28} style={{ marginLeft: 4 }} />
                )}
              </button>
            </div>
          </div>

          {/* Note */}
          {voice.note && (
            <div style={styles.noteCard}>
              <p style={styles.noteText}>"{voice.note}"</p>
            </div>
          )}

          {/* Actions */}
          <div style={styles.actionsContainer}>
            <button style={styles.actionButton} onClick={handleLike}>
              <div style={isLiked ? styles.actionIconActive : styles.actionIcon}>
                <Heart size={24} fill={isLiked ? 'currentColor' : 'none'} />
              </div>
              <span style={styles.actionCount}>{voice.likes + (isLiked ? 1 : 0)}</span>
            </button>

            <button style={styles.actionButton}>
              <div style={styles.actionIcon}>
                <MessageCircle size={24} />
              </div>
              <span style={styles.actionCount}>{voice.replies}</span>
            </button>

            <button style={styles.actionButton}>
              <div style={styles.actionIcon}>
                <Share size={24} />
              </div>
              <span style={styles.actionCount}>Share</span>
            </button>
          </div>
        </div>

        {/* Reply Button */}
        <div style={styles.replySection}>
          <button style={styles.replyButton}>
            <MessageCircle size={20} />
            Reply with Voice
          </button>
        </div>
      </div>
    </div>
  );
}