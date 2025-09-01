type VoicePin = {
  id: string;
  latitude: number;
  longitude: number;
  emotion: string;
  description: string;
  duration: number;
  visibility: 'PUBLIC' | 'PRIVATE' | 'FRIENDS';
  audioUrl: string;
  imageUrl?: string;
  address?: string;
  createdAt: string;
  user?: {
    name: string;
    avatar?: string;
  };
  likes?: number;
  replies?: number;
};

type Cluster = {
  latitude: number;
  longitude: number;
  voicePins: VoicePin[];
};

// Tính khoảng cách giữa hai điểm theo công thức Haversine
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Bán kính Trái Đất (km)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Khoảng cách tính bằng km
  return distance * 1000; // Chuyển về mét
}

// Nhóm các voice pin theo vị trí
export function clusterVoicePins(voicePins: VoicePin[], maxDistance: number = 50): Cluster[] {
  if (voicePins.length === 0) return [];

  const clusters: Cluster[] = [];
  const processed = new Set<string>();

  for (const voicePin of voicePins) {
    if (processed.has(voicePin.id)) continue;

    const cluster: Cluster = {
      latitude: voicePin.latitude,
      longitude: voicePin.longitude,
      voicePins: [voicePin]
    };

    processed.add(voicePin.id);

    // Tìm các voice pin khác trong phạm vi
    for (const otherVoicePin of voicePins) {
      if (processed.has(otherVoicePin.id)) continue;

      const distance = calculateDistance(
        voicePin.latitude, 
        voicePin.longitude, 
        otherVoicePin.latitude, 
        otherVoicePin.longitude
      );

      if (distance <= maxDistance) {
        cluster.voicePins.push(otherVoicePin);
        processed.add(otherVoicePin.id);
      }
    }

    // Tính trung bình vị trí của cluster
    if (cluster.voicePins.length > 1) {
      const avgLat = cluster.voicePins.reduce((sum, vp) => sum + vp.latitude, 0) / cluster.voicePins.length;
      const avgLon = cluster.voicePins.reduce((sum, vp) => sum + vp.longitude, 0) / cluster.voicePins.length;
      cluster.latitude = avgLat;
      cluster.longitude = avgLon;
    }

    clusters.push(cluster);
  }

  return clusters;
}

// Lấy voice pin gần nhất trong một cluster
export function getNearestVoicePin(cluster: Cluster, targetLat: number, targetLon: number): VoicePin {
  let nearest = cluster.voicePins[0];
  let minDistance = calculateDistance(targetLat, targetLon, nearest.latitude, nearest.longitude);

  for (const voicePin of cluster.voicePins) {
    const distance = calculateDistance(targetLat, targetLon, voicePin.latitude, voicePin.longitude);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = voicePin;
    }
  }

  return nearest;
}

