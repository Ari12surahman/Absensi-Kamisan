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

export function extractCoordinates(url: string): { lat: string; lng: string } {
  if (!url) return { lat: '', lng: '' };

  const regexAt = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
  const matchAt = url.match(regexAt);
  if (matchAt) return { lat: matchAt[1], lng: matchAt[2] };

  const regexQ = /[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/;
  const matchQ = url.match(regexQ);
  if (matchQ) return { lat: matchQ[1], lng: matchQ[2] };

  const regexGeneric = /(-?\d+\.\d+),\s*(-?\d+\.\d+)/;
  const matchGeneric = url.match(regexGeneric);
  if (matchGeneric) return { lat: matchGeneric[1], lng: matchGeneric[2] };

  return { lat: '', lng: '' };
}

