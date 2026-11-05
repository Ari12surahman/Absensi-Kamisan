export function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Robust coordinate parser: handles numbers, strings, and Indonesian comma decimals (e.g. "-6,917456")
 */
export function parseCoordinate(val: any): number {
  if (val === null || val === undefined || val === '') return NaN;
  if (typeof val === 'number') return isNaN(val) ? NaN : val;
  const str = String(val)
    .replace(/['"]/g, '')
    .trim()
    .replace(',', '.');
  const num = parseFloat(str);
  return isNaN(num) ? NaN : num;
}

export function getDistanceFromLatLonInM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const pLat1 = parseCoordinate(lat1);
  const pLon1 = parseCoordinate(lon1);
  const pLat2 = parseCoordinate(lat2);
  const pLon2 = parseCoordinate(lon2);

  if (isNaN(pLat1) || isNaN(pLon1) || isNaN(pLat2) || isNaN(pLon2)) {
    return 0;
  }

  const R = 6371000; // Radius bumi dalam meter
  const dLat = deg2rad(pLat2 - pLat1);
  const dLon = deg2rad(pLon2 - pLon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(pLat1)) * Math.cos(deg2rad(pLat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export function formatDistance(meters: number | null): string {
  if (meters === null || meters === undefined) return '0 meter';
  if (meters >= 1000) {
    const km = (meters / 1000).toFixed(1).replace('.0', '');
    return `${km} km`;
  }
  return `${meters} meter`;
}

export function extractCoordinates(url: string): { lat: string; lng: string } {
  if (!url) return { lat: '', lng: '' };

  const cleanUrl = url.replace(/['"]/g, '').trim();

  // Pattern 1: Desktop Maps 3d/4d (!3dLat!4dLng)
  const regex3d = /!3d(-?\d+[.,]\d+)!4d(-?\d+[.,]\d+)/;
  const match3d = cleanUrl.match(regex3d);
  if (match3d) {
    return {
      lat: match3d[1].replace(',', '.'),
      lng: match3d[2].replace(',', '.'),
    };
  }

  // Pattern 2: /@lat,lng
  const regexAt = /@(-?\d+[.,]\d+),(-?\d+[.,]\d+)/;
  const matchAt = cleanUrl.match(regexAt);
  if (matchAt) {
    return {
      lat: matchAt[1].replace(',', '.'),
      lng: matchAt[2].replace(',', '.'),
    };
  }

  // Pattern 3: q=lat,lng
  const regexQ = /[?&]q=(-?\d+[.,]\d+),(-?\d+[.,]\d+)/;
  const matchQ = cleanUrl.match(regexQ);
  if (matchQ) {
    return {
      lat: matchQ[1].replace(',', '.'),
      lng: matchQ[2].replace(',', '.'),
    };
  }

  // Pattern 4: ll=lat,lng
  const regexLL = /[?&]ll=(-?\d+[.,]\d+),(-?\d+[.,]\d+)/;
  const matchLL = cleanUrl.match(regexLL);
  if (matchLL) {
    return {
      lat: matchLL[1].replace(',', '.'),
      lng: matchLL[2].replace(',', '.'),
    };
  }

  // Pattern 5: Pasangan angka lat, lng langsung (mendukung koma maupun titik)
  const regexGeneric = /(-?\d+[.,]\d+)[,\s]+(-?\d+[.,]\d+)/;
  const matchGeneric = cleanUrl.match(regexGeneric);
  if (matchGeneric) {
    return {
      lat: matchGeneric[1].replace(',', '.'),
      lng: matchGeneric[2].replace(',', '.'),
    };
  }

  return { lat: '', lng: '' };
}
