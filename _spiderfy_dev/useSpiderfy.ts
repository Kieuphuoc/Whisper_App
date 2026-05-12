import { useCallback, useState } from 'react';
import { VoicePin } from '@/types';

export type VirtualPin = {
  pin: VoicePin;
  displayLat: number;
  displayLng: number;
};

export type SpiderfyState = {
  centerLat: number;
  centerLng: number;
  virtualPins: VirtualPin[];
} | null;

/**
 * Separation in degrees between spiral arms.
 * 0.00055° ≈ ~60 m — large enough that spread pins stay beyond the
 * react-native-map-clustering radius (30 px at street-level zoom) so they
 * don't re-cluster with each other or with the original pile.
 */
const SPIRAL_SEPARATION = 0.00055;

/**
 * Arrange N pins in an Archimedean spiral around a center coordinate.
 * All produced coordinates are ephemeral — never written to the DB.
 */
function computeSpiralPositions(
  centerLat: number,
  centerLng: number,
  pins: VoicePin[],
  separation: number = SPIRAL_SEPARATION,
): VirtualPin[] {
  return pins.map((pin, i) => {
    // angle grows by 0.5 rad per step; +1 ensures i=0 has non-zero radius
    const angle = i * 0.5;
    const radius = separation * Math.sqrt(angle + 1);
    return {
      pin,
      displayLat: centerLat + radius * Math.cos(angle),
      displayLng: centerLng + radius * Math.sin(angle),
    };
  });
}

type UseSpiderfyReturn = {
  /** Active spiderfy state, or null when collapsed. */
  spiderfyState: SpiderfyState;
  /** Whether an exit animation is in progress (markers should animate out). */
  isSpiderfyExiting: boolean;
  /** Expand the spiral for a group of co-located pins. */
  activateSpiderfy: (lat: number, lng: number, pins: VoicePin[]) => void;
  /** Begin the exit animation sequence. */
  collapseSpiderfy: () => void;
  /** Called by the last SpiderfyMarker once its exit animation finishes. */
  cleanupSpiderfy: () => void;
};

export function useSpiderfy(): UseSpiderfyReturn {
  const [spiderfyState, setSpiderfyState] = useState<SpiderfyState>(null);
  const [isSpiderfyExiting, setIsSpiderfyExiting] = useState(false);

  const activateSpiderfy = useCallback(
    (lat: number, lng: number, pins: VoicePin[]) => {
      // If a different spiderfy is already open, replace it immediately
      setIsSpiderfyExiting(false);
      setSpiderfyState({
        centerLat: lat,
        centerLng: lng,
        virtualPins: computeSpiralPositions(lat, lng, pins),
      });
    },
    [],
  );

  const collapseSpiderfy = useCallback(() => {
    if (!spiderfyState) return;
    setIsSpiderfyExiting(true);
    // cleanupSpiderfy is called by the last marker after its exit animation
  }, [spiderfyState]);

  const cleanupSpiderfy = useCallback(() => {
    setIsSpiderfyExiting(false);
    setSpiderfyState(null);
  }, []);

  return {
    spiderfyState,
    isSpiderfyExiting,
    activateSpiderfy,
    collapseSpiderfy,
    cleanupSpiderfy,
  };
}
