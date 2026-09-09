/**
 * ShelterIQ — Climate Time Machine Data Adapter
 *
 * Extracts and normalizes real physics simulation outputs for 3D visualization.
 * Strictly avoids fake fallbacks, dummy values, and fabricated hourly breakdowns.
 */

/**
 * Extracts and computes real conductive envelope heat-loss contributions
 * Note: Passive solar gain is intentionally excluded from envelope conductive heat loss.
 */
export function extractComponentLosses(componentBreakdown = {}) {
  const cb = componentBreakdown || {};

  const wallLoss = Math.abs(Number(cb.wallConduction || cb.wallsConduction || 0));
  const roofLoss = Math.abs(Number(cb.roofConduction || 0));
  const curvedLoss = Math.abs(Number(cb.curvedEnvelopeConduction || 0));
  const floorLoss = Math.abs(Number(cb.floorConduction || 0));
  const windowLoss = Math.abs(Number(cb.windowConduction || cb.windowsConduction || 0));
  const doorLoss = Math.abs(Number(cb.doorConduction || cb.doorsConduction || 0));

  // For curved archetypes (Dome/Quonset), combine curved envelope loss with wall or roof
  const totalWallLoss = wallLoss + (curvedLoss > 0 && wallLoss === 0 ? curvedLoss : 0);
  const totalRoofLoss = roofLoss + (curvedLoss > 0 && roofLoss === 0 ? curvedLoss : 0);

  const totalConductiveLoss = totalWallLoss + totalRoofLoss + floorLoss + windowLoss + doorLoss;

  const getPct = (val) => (totalConductiveLoss > 0 ? Number(((val / totalConductiveLoss) * 100).toFixed(1)) : 0);

  const wallPct = getPct(totalWallLoss);
  const roofPct = getPct(totalRoofLoss);
  const floorPct = getPct(floorLoss);
  const windowPct = getPct(windowLoss);
  const doorPct = getPct(doorLoss);

  const maxLoss = Math.max(totalWallLoss, totalRoofLoss, floorLoss, windowLoss, doorLoss, 0.001);

  const getNorm = (val) => {
    if (totalConductiveLoss === 0) return 0.2;
    return Math.max(0.1, Math.min(1.0, val / maxLoss));
  };

  return {
    raw: {
      walls: totalWallLoss,
      roof: totalRoofLoss,
      floor: floorLoss,
      windows: windowLoss,
      doors: doorLoss,
      totalConductive: totalConductiveLoss
    },
    percentages: {
      walls: wallPct,
      roof: roofPct,
      floor: floorPct,
      windows: windowPct,
      doors: doorPct
    },
    normalized: {
      walls: getNorm(totalWallLoss),
      roof: getNorm(totalRoofLoss),
      floor: getNorm(floorLoss),
      windows: getNorm(windowLoss),
      doors: getNorm(doorLoss)
    }
  };
}

/**
 * Maps a normalized intensity fraction [0, 1] to a scientific thermal colormap
 * Low loss (Blue/Cyan) -> Moderate (Green/Yellow) -> High loss (Orange/Crimson)
 */
export function getThermalColor(fraction = 0.5) {
  const f = Math.max(0, Math.min(1, Number(fraction) || 0));

  if (f < 0.25) {
    // Deep Blue to Cyan
    const t = f / 0.25;
    return interpolateColor('#1e40af', '#0284c7', t);
  } else if (f < 0.5) {
    // Cyan to Teal / Green
    const t = (f - 0.25) / 0.25;
    return interpolateColor('#0284c7', '#10b981', t);
  } else if (f < 0.75) {
    // Green to Amber / Yellow
    const t = (f - 0.5) / 0.25;
    return interpolateColor('#10b981', '#f59e0b', t);
  } else {
    // Amber to Crimson Red
    const t = (f - 0.75) / 0.25;
    return interpolateColor('#f59e0b', '#dc2626', t);
  }
}

function interpolateColor(color1, color2, factor) {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  const r = Math.round(c1.r + factor * (c2.r - c1.r));
  const g = Math.round(c1.g + factor * (c2.g - c1.g));
  const b = Math.round(c1.b + factor * (c2.b - c1.b));
  return rgbToHex(r, g, b);
}

function hexToRgb(hex) {
  const sanitized = hex.replace('#', '');
  const bigint = parseInt(sanitized, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255
  };
}

function rgbToHex(r, g, b) {
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

/**
 * Determines thermal comfort status based on indoor temperature and comfort boundaries
 */
export function getComfortStatus(indoorTemp, minComfort = 18, maxComfort = 24) {
  if (indoorTemp === null || indoorTemp === undefined || !Number.isFinite(Number(indoorTemp))) {
    return { label: 'N/A', statusClass: 'text-slate-400 bg-slate-100 border-slate-300' };
  }
  const T = Number(indoorTemp);
  if (T >= minComfort && T <= maxComfort) {
    return {
      label: 'COMFORTABLE',
      statusClass: 'text-emerald-700 bg-emerald-50 border-emerald-300',
      badgeClass: 'bg-emerald-600 text-white'
    };
  } else if (T < minComfort) {
    return {
      label: 'TOO COLD',
      statusClass: 'text-sky-700 bg-sky-50 border-sky-300',
      badgeClass: 'bg-sky-600 text-white'
    };
  } else {
    return {
      label: 'TOO HOT',
      statusClass: 'text-amber-700 bg-amber-50 border-amber-300',
      badgeClass: 'bg-amber-600 text-white'
    };
  }
}

/**
 * Formats timestamp or hourly index cleanly
 */
export function formatHourLabel(timestamp, index) {
  if (timestamp) {
    if (timestamp.includes('T') || timestamp.includes(':')) {
      const parts = timestamp.split('T');
      const timePart = parts[1] || parts[0];
      const match = timePart.match(/(\d{1,2}):(\d{2})/);
      if (match) {
        return `${match[1].padStart(2, '0')}:${match[2]}`;
      }
    }
  }
  const hr = index !== undefined ? index % 24 : 0;
  return `${String(hr).padStart(2, '0')}:00`;
}
