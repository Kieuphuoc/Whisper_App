// // components/MarkerLoader.tsx
// import { Marker, Popup, useMapEvents } from 'react-leaflet';
// import { useState, useEffect } from 'react';

// interface MarkerData {
//   id: number;
//   lat: number;
//   lng: number;
//   title: string;
// }

// async function fetchMarkers(bounds: any): Promise<MarkerData[]> {
//   const sw = bounds.getSouthWest();
//   const ne = bounds.getNorthEast();

//   const url = `https://your-backend.com/api/markers?swLat=${sw.lat}&swLng=${sw.lng}&neLat=${ne.lat}&neLng=${ne.lng}`;
//   const res = await fetch(url);
//   return res.json();
// }

// export default function MarkerLoader() {
//   const [markers, setMarkers] = useState<MarkerData[]>([]);

//   const map = useMapEvents({
//     moveend: () => {
//       const bounds = map.getBounds();
//       fetchMarkers(bounds).then(setMarkers);
//     },
//   });

//   // Load lần đầu
//   useEffect(() => {
//     fetchMarkers(map.getBounds()).then(setMarkers);
//   }, [map]);

//   return (
//     <>
//       {markers.map((marker) => (
//         <Marker key={marker.id} position={[marker.lat, marker.lng]}>
//           <Popup>{marker.title}</Popup>
//         </Marker>
//       ))}
//     </>
//   );
// }
