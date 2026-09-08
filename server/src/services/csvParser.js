/**
 * CSV Climate Parser & Validator Module
 */

function parseClimateCSV(csvText) {
  if (!csvText || typeof csvText !== 'string') {
    throw new Error('CSV file content is empty or invalid.');
  }

  const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) {
    throw new Error('CSV must contain a header row and at least one data row.');
  }

  // Parse header
  const header = lines[0].toLowerCase().split(',').map(s => s.trim());
  const tsIdx = header.findIndex(h => h.includes('time') || h.includes('date'));
  const tempIdx = header.findIndex(h => h.includes('temp'));
  const solarIdx = header.findIndex(h => h.includes('solar') || h.includes('rad'));
  const windIdx = header.findIndex(h => h.includes('wind') || h.includes('speed'));
  const humIdx = header.findIndex(h => h.includes('hum') || h.includes('rh'));

  if (tsIdx === -1 || tempIdx === -1) {
    throw new Error('CSV header missing required columns: timestamp and temperature.');
  }

  const dataPoints = [];
  const errors = [];

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(',').map(s => s.trim());
    if (row.length < header.length) continue;

    const timestamp = row[tsIdx];
    const temp = parseFloat(row[tempIdx]);
    const solar = solarIdx !== -1 ? parseFloat(row[solarIdx]) : 0;
    const wind = windIdx !== -1 ? parseFloat(row[windIdx]) : 2.0;
    const hum = humIdx !== -1 ? parseFloat(row[humIdx]) : 50.0;

    if (!timestamp) {
      errors.push(`Row ${i + 1}: Missing timestamp.`);
      continue;
    }
    if (isNaN(temp) || temp < -90 || temp > 60) {
      errors.push(`Row ${i + 1}: Invalid ambient temperature '${row[tempIdx]}'.`);
      continue;
    }
    if (isNaN(solar) || solar < 0 || solar > 2000) {
      errors.push(`Row ${i + 1}: Invalid solar radiation '${row[solarIdx]}'.`);
      continue;
    }
    if (isNaN(wind) || wind < 0 || wind > 100) {
      errors.push(`Row ${i + 1}: Invalid wind speed '${row[windIdx]}'.`);
      continue;
    }

    dataPoints.push({
      timestamp,
      ambientTemperature: temp,
      solarRadiation: Math.max(0, solar),
      windSpeed: Math.max(0, wind),
      humidity: Math.min(100, Math.max(0, isNaN(hum) ? 50 : hum))
    });
  }

  if (dataPoints.length === 0) {
    throw new Error(`Failed to parse valid climate records. Errors: ${errors.slice(0, 3).join(' ')}`);
  }

  return {
    dataPoints,
    warnings: errors
  };
}

module.exports = {
  parseClimateCSV
};
