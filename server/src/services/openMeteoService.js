/**
 * Climate Service - Open-Meteo API Integration
 */

const axios = require('axios');

/**
 * Fetch climate data from Open-Meteo API for given lat/lng
 */
async function fetchOpenMeteoClimate(latitude, longitude, days = 7, cityName = null) {
  try {
    const lat = Number(latitude);
    const lng = Number(longitude);

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      throw new Error('Invalid latitude or longitude coordinates provided.');
    }

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,direct_normal_irradiance,diffuse_radiation&forecast_days=${days}`;
    
    const response = await axios.get(url, { timeout: 8000 });
    const hourly = response.data.hourly;

    if (!hourly || !hourly.time || hourly.time.length === 0) {
      throw new Error('Open-Meteo API returned empty hourly weather payload.');
    }

    const dataPoints = hourly.time.map((timeStr, idx) => {
      const temp = hourly.temperature_2m[idx] ?? 0;
      const directSolar = hourly.direct_normal_irradiance[idx] ?? 0;
      const diffuseSolar = hourly.diffuse_radiation[idx] ?? 0;
      const totalSolar = Math.max(0, directSolar + diffuseSolar);
      const wind = Math.max(0, hourly.wind_speed_10m[idx] ?? 2.0);
      const humidity = Math.min(100, Math.max(0, hourly.relative_humidity_2m[idx] ?? 50));

      return {
        timestamp: timeStr,
        ambientTemperature: temp,
        solarRadiation: totalSolar,
        windSpeed: wind,
        humidity
      };
    });

    const displayName = cityName || `Open-Meteo (${lat.toFixed(2)}°, ${lng.toFixed(2)}°)`;
    
    return {
      name: displayName,
      location: displayName,
      latitude: lat,
      longitude: lng,
      elevation: response.data.elevation || 3500,
      sourceType: 'Open-Meteo API',
      timePeriod: `${dataPoints.length} Hours`,
      dataPoints
    };
  } catch (error) {
    console.error('[Open-Meteo Error]:', error.message);
    throw new Error(`Failed to retrieve live Open-Meteo climate data: ${error.message}`);
  }
}

module.exports = {
  fetchOpenMeteoClimate
};
