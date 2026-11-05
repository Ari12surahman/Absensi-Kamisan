export function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Robust coordinate parser: handles numbers, strings, Indonesian comma decimals (e.g. "-6,917456"),
 * and repairs multiple dots / thousand separators added by Indonesian Google Sheets (e.g. "-67.771.517" or "1.084.148.205")
 */
export function parseCoordinate(val: any, type?: 'lat' | 'lng'): number {
  if (val === null || val === undefined || val === '') return NaN;
  if (typeof val === 'number') {
    if (isNaN(val)) return NaN;
    if (type === 'lat' && (val < -15 || val > 10)) {
      val = String(val);
    } else if (type === 'lng' && (val < 90 || val > 150)) {
      val = String(val);
    } else {
      return val;
    }
  }

  const str = String(val)
    .replace(/['"]/g, '')
    .trim();

  // If already standard float: e.g. "-6.7771517" or "-6,7771517"
  const commaOrDotCount = (str.match(/[.,]/g) || []).length;
  if (commaOrDotCount === 1) {
    const num = parseFloat(str.replace(',', '.'));
    if (!isNaN(num)) {
      if (type === 'lat' && num >= -15 && num <= 10) return num;
      if (type === 'lng' && num >= 90 && num <= 150) return num;
      if (!type) return num;
    }
  }

  // Handle multiple dots / thousand separators formatted by Indonesian Google Sheets
  // e.g. "-67.771.517" -> -6.7771517, "1.084.148.205" -> 108.4148205
  const digits = str.replace(/[^\d-]/g, '');
  if (digits) {
    if (type === 'lat' || (!type && digits.startsWith('-'))) {
      // In Indonesia, Latitude is -0.x to -11.x (commonly -6.x, -7.x, -8.x)
      const match = digits.match(/^(-[1-9])(\d+)$/);
      if (match) {
        const repaired = parseFloat(`${match[1]}.${match[2]}`);
        if (!isNaN(repaired) && repaired >= -15 && repaired <= 10) {
          return repaired;
        }
      }
      const match2 = digits.match(/^(-1[0-2])(\d+)$/);
      if (match2) {
        const repaired = parseFloat(`${match2[1]}.${match2[2]}`);
        if (!isNaN(repaired) && repaired >= -15 && repaired <= 10) {
          return repaired;
        }
      }
    }

    if (type === 'lng' || (!type && !digits.startsWith('-'))) {
      // In Indonesia, Longitude is 95.x to 141.x (e.g. 106.x, 107.x, 108.x)
      if (digits.startsWith('1')) {
        const match = digits.match(/^([1][0-4]\d)(\d+)$/);
        if (match) {
          const repaired = parseFloat(`${match[1]}.${match[2]}`);
          if (!isNaN(repaired) && repaired >= 90 && repaired <= 150) {
            return repaired;
          }
        }
      } else if (digits.startsWith('9')) {
        const match = digits.match(/^(9\d)(\d+)$/);
        if (match) {
          const repaired = parseFloat(`${match[1]}.${match[2]}`);
          if (!isNaN(repaired) && repaired >= 90 && repaired <= 150) {
            return repaired;
          }
        }
      }
    }
  }

  const standardNum = parseFloat(str.replace(',', '.'));
  return isNaN(standardNum) ? NaN : standardNum;
}

export function getDistanceFromLatLonInM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const pLat1 = parseCoordinate(lat1, 'lat');
  const pLon1 = parseCoordinate(lon1, 'lng');
  const pLat2 = parseCoordinate(lat2, 'lat');
  const pLon2 = parseCoordinate(lon2, 'lng');

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
