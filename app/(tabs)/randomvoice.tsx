import React, { useState, useEffect } from 'react';
import { Play, Pause, SkipForward, MapPin } from 'lucide-react';

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    overflow: 'hidden' as const,
  },
  blurredBackground: {
    position: 'absolute' as const,
    inset: 0,
    background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 50%, #f8fafc 100%)',
  },
  blurredPattern: {
    position: 'absolute' as const,
    inset: 0,
    opacity: 0.1,
    filter: 'blur(2px)',
  },
  content: {
    position: 'relative' as const,
    zIndex: 10,
    display: 'flex' as const,
    flexDirection: 'column' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    height: '100%',
    padding: 24,
  },
  title: {
    textAlign: 'center' as const,
    marginBottom: 32,
  },
  titleText: {
    fontSize: 28,
    fontWeight: '600' as const,
    color: '#1f2937',
    marginBottom: 8,
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
  },
  centralPlayArea: {
    position: 'relative' as const,
    marginBottom: 32,
  },
  glowContainer: {
    position: 'relative' as const,
  },
  glowEffect1: {
    position: 'absolute' as const,
    inset: 0,
    backgroundColor: '#22c55e',
    borderRadius: '50%',
    filter: 'blur(40px)',
    opacity: 0.2,
    transform: 'scale(1.3)',
  },
  glowEffect2: {
    position: 'absolute' as const,
    inset: 0,
    backgroundColor: '#22c55e',
    borderRadius: '50%',
    filter: 'blur(20px)',
    opacity: 0.3,
    transform: 'scale(1.1)',
  },
  mainPlayButton: {
    position: 'relative' as const,
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#22c55e',
    border: '4px solid #ffffff',
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    cursor: 'pointer' as const,
    color: '#ffffff',
    boxShadow: '0 12px 32px rgba(34, 197, 94, 0.4)',
    transition: 'all 0.3s ease',
  },
  dynamicEmotion: {
    position: 'absolute' as const,
    top: -48,
    left: '50%',
    transform: 'translateX(-50%)',
    fontSize: 32,
    animation: 'bounce 1s ease-in-out',
    filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))',
  },
  voiceInfo: {
    textAlign: 'center' as const,
    marginBottom: 24,
    maxWidth: 280,
  },
  voiceEmotion: {
    fontSize: 32,
    marginBottom: 12,
  },
  voiceTitle: {
    color: '#1f2937',
    fontSize: 18,
    fontWeight: '600' as const,
    marginBottom: 8,
    lineHeight: 1.4,
  },
  voiceLocation: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 6,
    color: '#64748b',
    fontSize: 14,
  },
  progressContainer: {
    width: '100%',
    maxWidth: 240,
    marginBottom: 24,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    overflow: 'hidden' as const,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#22c55e',
    transition: 'width 0.1s ease',
  },
  progressTime: {
    display: 'flex' as const,
    justifyContent: 'space-between' as const,
    fontSize: 12,
    color: '#64748b',
    marginTop: 8,
  },
  controls: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: 16,
  },
  skipButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    border: '2px solid #e2e8f0',
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    cursor: 'pointer' as const,
    color: '#64748b',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  },
  discoverText: {
    position: 'absolute' as const,
    bottom: 32,
    left: 24,
    right: 24,
    textAlign: 'center' as const,
    color: '#9ca3af',
    fontSize: 14,
  },
};

export function RandomVoiceScreen() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [currentVoice, setCurrentVoice] = useState({
    emotion: '💭',
    title: 'Deep thoughts from a stranger',
    distance: '0.3 km away',
    duration: 67
  });

  const emotions = ['😊', '😢', '🎉', '💭', '❤️', '😌'];

  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1.5;
        });
        
        // Change emotion randomly during playback
        if (Math.random() > 0.7) {
          setCurrentEmotion(emotions[Math.floor(Math.random() * emotions.length)]);
        }
      }, 100);

      return () => clearInterval(interval);
    }
  }, [isPlaying]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      setCurrentEmotion(currentVoice.emotion);
    }
  };

  const handleNext = () => {
    setIsPlaying(false);
    setProgress(0);
    setCurrentEmotion('');
    
    const newEmotions = ['😊', '😢', '🎉', '💭', '❤️', '😌', '🤔', '✨'];
    const titles = [
      'A quiet moment of reflection',
      'Laughter from yesterday',
      'Thoughts by the river',
      'Missing someone special',
      'Dancing in the rain',
      'Sunrise meditations'
    ];
    
    setCurrentVoice({
      emotion: newEmotions[Math.floor(Math.random() * newEmotions.length)],
      title: titles[Math.floor(Math.random() * titles.length)],
      distance: `${(Math.random() * 0.8 + 0.1).toFixed(1)} km away`,
      duration: Math.floor(Math.random() * 60 + 30)
    });
  };

  return (
    <div style={styles.container}>
      {/* Blurred Background */}
      <div style={styles.blurredBackground}>
        <div style={styles.blurredPattern}>
          <svg width="100%" height="100%" style={{ color: '#cbd5e1' }}>
            <defs>
              <pattern id="random-grid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="1"/>
                <circle cx="30" cy="30" r="2" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#random-grid)" />
          </svg>
        </div>
      </div>

      {/* Content */}
      <div style={styles.content}>
        {/* Title */}
        <div style={styles.title}>
          <h1 style={styles.titleText}>Random Voice</h1>
          <p style={styles.subtitle}>Discover voices within 1km</p>
        </div>

        {/* Central Play Button */}
        <div style={styles.centralPlayArea}>
          <div style={styles.glowContainer}>
            <div style={styles.glowEffect1}></div>
            <div style={styles.glowEffect2}></div>
            
            <button
              onClick={handlePlayPause}
              style={styles.mainPlayButton}
            >
              {isPlaying ? (
                <Pause size={40} />
              ) : (
                <Play size={40} style={{ marginLeft: 4 }} />
              )}
            </button>

            {/* Dynamic Emotion Display */}
            {currentEmotion && (
              <div style={styles.dynamicEmotion}>
                {currentEmotion}
              </div>
            )}
          </div>
        </div>

        {/* Voice Info */}
        <div style={styles.voiceInfo}>
          <div style={styles.voiceEmotion}>{currentVoice.emotion}</div>
          <h2 style={styles.voiceTitle}>{currentVoice.title}</h2>
          <div style={styles.voiceLocation}>
            <MapPin size={16} />
            <span>{currentVoice.distance}</span>
          </div>
        </div>

        {/* Progress Bar */}
        {isPlaying && (
          <div style={styles.progressContainer}>
            <div style={styles.progressBar}>
              <div 
                style={{
                  ...styles.progressFill,
                  width: `${progress}%`
                }}
              ></div>
            </div>
            <div style={styles.progressTime}>
              <span>{Math.floor((progress / 100) * currentVoice.duration)}s</span>
              <span>{currentVoice.duration}s</span>
            </div>
          </div>
        )}

        {/* Controls */}
        <div style={styles.controls}>
          <button
            onClick={handleNext}
            style={styles.skipButton}
          >
            <SkipForward size={20} />
          </button>
        </div>

        {/* Discover More */}
        <div style={styles.discoverText}>
          Tap to discover more voices nearby
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% {
            transform: translateX(-50%) translateY(0);
          }
          40% {
            transform: translateX(-50%) translateY(-10px);
          }
          60% {
            transform: translateX(-50%) translateY(-5px);
          }
        }
      `}</style>
    </div>
  );
}