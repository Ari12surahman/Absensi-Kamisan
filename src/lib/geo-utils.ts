export function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

export function getDistanceFromLatLonInM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Radius bumi dalam meter
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export function formatDistance(meters: number | null): string {
  if (meters === null || meters === undefined) return '0 m';
  if (meters >= 1000) {
    const km = (meters / 1000).toFixed(1).replace('.0', '');
    return `${km} km`;
  }
  return `${meters} meter`;
}

export function extractCoordinates(url: string): { lat: string; lng: string } {
  if (!url) return { lat: '', lng: '' };

  // Format 1: Google Maps Desktop 3d/4d (!3dLat!4dLng)
  const regex3d = /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/;
  const match3d = url.match(regex3d);
  if (match3d) return { lat: match3d[1], lng: match3d[2] };

  // Format 2: /@lat,lng
  const regexAt = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
  const matchAt = url.match(regexAt);
  if (matchAt) return { lat: matchAt[1], lng: matchAt[2] };

  // Format 3: ?q=lat,lng
  const regexQ = /[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/;
  const matchQ = url.match(regexQ);
  if (matchQ) return { lat: matchQ[1], lng: matchQ[2] };

  // Format 4: ll=lat,lng
  const regexLL = /[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/;
  const matchLL = url.match(regexLL);
  if (matchLL) return { lat: matchLL[1], lng: matchLL[2] };

  // Format 5: Pasangan angka lat, lng langsung
  const regexGeneric = /(-?\d+\.\d+),\s*(-?\d+\.\d+)/;
  const matchGeneric = url.match(regexGeneric);
  if (matchGeneric) return { lat: matchGeneric[1], lng: matchGeneric[2] };

  return { lat: '', lng: '' };
}
