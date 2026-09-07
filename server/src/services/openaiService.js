/**
 * AI Service - OpenAI Explanation Engine & Physical Synthesis Fallback
 */

const axios = require('axios');

async function generateAIExplanation({ shelterName, climateLocation, metrics, componentBreakdown }) {
  const apiKey = process.env.OPENAI_API_KEY;

  const promptText = `
You are an expert DRDO Passive Solar Thermal Architecture Specialist.
Explain the following thermal simulation results for the passive shelter "${shelterName}" located at "${climateLocation}".

Physics Simulation Results (Numerical Truth):
- Average Indoor Temperature: ${metrics.avgIndoorTemp}°C
- Min / Max Indoor Temp: ${metrics.minIndoorTemp}°C / ${metrics.maxIndoorTemp}°C
- Thermal Comfort Index (18-24°C): ${metrics.comfortPercentage}% of hours
- Total Solar Gain Captured: ${metrics.totalSolarGain} kWh
- Total Heat Loss: ${metrics.totalHeatLoss} kWh
- Peak Heat Loss: ${metrics.peakHeatLoss} W
- Major Conduction Loss Components:
  * Wall Conduction: ${componentBreakdown.wallConduction} W avg
  * Roof Conduction: ${componentBreakdown.roofConduction} W avg
  * Floor Conduction: ${componentBreakdown.floorConduction} W avg
  * Window Conduction: ${componentBreakdown.windowConduction} W avg
  * Door Conduction: ${componentBreakdown.doorConduction} W avg

Provide:
1. Executive Physical Performance Analysis
2. Primary Sources of Heat Loss & Thermal Bridges
3. Solar Energy Capture & Orientation Effectiveness
4. Specific Passive Architecture Recommendations (Insulation, Trombe Wall, Thermal Mass)
`;

  if (apiKey && apiKey.trim() !== '') {
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'You are a thermal engineering AI assistant. Analyze physical simulation outputs. Do not alter or fabricate numerical values.' },
            { role: 'user', content: promptText }
          ],
          temperature: 0.3,
          max_tokens: 600
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      return {
        explanation: response.data.choices[0].message.content,
        source: 'OpenAI GPT-3.5 API'
      };
    } catch (err) {
      console.warn('[OpenAI Warning] API request failed:', err.message);
    }
  }

  // Structured Rule-Based Engineering Physical Explanation Fallback (No fake data!)
  const wallPct = Math.round((componentBreakdown.wallConduction / (metrics.peakHeatLoss || 1)) * 100);
  const roofPct = Math.round((componentBreakdown.roofConduction / (metrics.peakHeatLoss || 1)) * 100);
  const windowPct = Math.round((componentBreakdown.windowConduction / (metrics.peakHeatLoss || 1)) * 100);

  const fallbackText = `
### Executive Thermal Analysis
The passive shelter design at **${climateLocation}** maintains an average indoor temperature of **${metrics.avgIndoorTemp}°C** (ranging from **${metrics.minIndoorTemp}°C** to **${metrics.maxIndoorTemp}°C**), achieving a thermal comfort factor of **${metrics.comfortPercentage}%**.

### Primary Thermal Dynamics & Loss Channels
1. **Envelope Conduction Breakdown**: Wall thermal transfer accounts for approximately **${componentBreakdown.wallConduction} W** average loss. Roof envelope transfer averages **${componentBreakdown.roofConduction} W**.
2. **Glazing & Openings**: Windows account for **${componentBreakdown.windowConduction} W** average conduction loss, balanced against a direct solar radiation gain of **${metrics.totalSolarGain} kWh**.

### Engineering Recommendations
- **Envelope Optimization**: Increase insulation thickness (e.g. PUF / EPS paneling) on roof surfaces to reduce peak conductive loss of **${metrics.peakHeatLoss} W**.
- **Solar Gain Maximization**: Orient glazing facades at 180° South with double/triple Low-E glazing to optimize solar gain in high-altitude sub-zero climates.
  `;

  return {
    explanation: fallbackText.trim(),
    source: 'Automated Thermal Synthesis Engine'
  };
}

module.exports = {
  generateAIExplanation
};
