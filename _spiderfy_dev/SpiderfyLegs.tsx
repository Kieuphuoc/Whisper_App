import React from 'react';
import { Polyline } from 'react-native-maps';
import { SpiderfyState } from './useSpiderfy';

type Props = {
  state: NonNullable<SpiderfyState>;
};

/**
 * Renders one dashed Polyline per virtual pin, connecting the spiderfy center
 * to each spread marker.  These are drawn inside the MapView so they
 * project correctly as the user pans/zooms.
 */
export default function SpiderfyLegs({ state }: Props) {
  const { centerLat, centerLng, virtualPins } = state;
  const center = { latitude: centerLat, longitude: centerLng };

  return (
    <>
      {virtualPins.map((vp) => (
        <Polyline
          key={`leg-${vp.pin.id}`}
          coordinates={[
            center,
            { latitude: vp.displayLat, longitude: vp.displayLng },
          ]}
          strokeColor="rgba(139,92,246,0.3)"
          strokeWidth={1.5}
          zIndex={1}
          lineDashPattern={[4, 4]}
        />
      ))}
    </>
  );
}
