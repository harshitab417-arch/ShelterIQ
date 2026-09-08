/**
 * Report Service - PDFKit Engineering Report Generator
 * Perfectly formatted 2-page engineering report with left-aligned headings and structured tables
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

function safeNum(val, fallback = 0) {
  const n = Number(val);
  return isNaN(n) || !isFinite(n) ? fallback : n;
}

function generateSimulationPDF(simulation, outputPath) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);

      // Header Banner
      doc.rect(40, 40, 515, 55).fill('#0284c7');
      doc.fillColor('#ffffff')
         .fontSize(16)
         .font('Helvetica-Bold')
         .text('DRDO PASSIVE SHELTER THERMAL DESIGN REPORT', 55, 50);
      
      doc.fontSize(9)
         .font('Helvetica')
         .text(`Generated: ${new Date().toLocaleDateString()} | Project Ref: ${simulation._id || 'SIM-2026'}`, 55, 74);

      doc.fillColor('#1e293b');

      const m = simulation.results?.metrics || {};
      const shelter = simulation.shelter || {};
      const climate = simulation.climateDataset || {};
      const timeSeries = Array.isArray(simulation.results?.timeSeries) ? simulation.results.timeSeries : [];
      const breakdown = simulation.results?.componentBreakdown || {};

      // Compute location ambient temperature bounds safely
      let locationMinTemp = 'N/A';
      let locationMaxTemp = 'N/A';
      if (climate?.dataPoints && Array.isArray(climate.dataPoints) && climate.dataPoints.length > 0) {
        const temps = climate.dataPoints.map(p => safeNum(p.ambientTemperature)).filter(t => !isNaN(t));
        if (temps.length > 0) {
          locationMinTemp = Math.min(...temps).toFixed(1);
          locationMaxTemp = Math.max(...temps).toFixed(1);
        }
      }

      const shelterShape = shelter.design?.shape || 'Rectangular';

      // ================= PAGE 1 =================

      // ================= SECTION 1: EXECUTIVE SUMMARY & PROJECT DETAILS =================
      let curY = 110;
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#0369a1').text('1. Executive Summary & Location Climate', 40, curY);
      curY += 16;
      doc.rect(40, curY, 515, 1).fill('#e2e8f0');
      curY += 8;

      doc.fontSize(9).font('Helvetica').fillColor('#334155');
      doc.text(`Shelter Name: ${shelter.name || simulation.name || 'Passive Shelter Design'}`, 40, curY); curY += 13;
      doc.text(`Location / Climate Zone: ${climate.location || climate.name || 'High Altitude Region (Ladakh)'}`, 40, curY); curY += 13;
      doc.text(`Location Ambient Bounds: ${locationMinTemp}°C (Min) to ${locationMaxTemp}°C (Max)`, 40, curY); curY += 13;
      doc.text(`Predicted Optimal Shelter Shape: ${shelterShape}`, 40, curY); curY += 18;

      // ================= SECTION 2: SHELTER MODEL OVERVIEW & ENVELOPE MATERIALS =================
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#0369a1').text('2. Shelter Model Overview & Envelope Materials', 40, curY);
      curY += 16;
      doc.rect(40, curY, 515, 1).fill('#e2e8f0');
      curY += 8;

      doc.rect(40, curY, 515, 18).fill('#f1f5f9');
      doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold');
      doc.text('Envelope Component', 48, curY + 4);
      doc.text('Selected Material', 180, curY + 4);
      doc.text('Conductivity (k)', 380, curY + 4);
      doc.text('Thickness', 470, curY + 4);
      curY += 20;

      const mats = shelter.materials || {};
      const matRows = [
        ['Wall Envelope', mats.wallMaterial?.name || 'Rammed Earth', `${safeNum(mats.wallMaterial?.thermalConductivity, 0.8)} W/mK`, `${safeNum(shelter.geometry?.wallThickness, 0.25)} m`],
        ['Roof Structure', mats.roofMaterial?.name || 'Galvanized Sheet', `${safeNum(mats.roofMaterial?.thermalConductivity, 0.35)} W/mK`, `${safeNum(shelter.geometry?.roofThickness, 0.2)} m`],
        ['Floor Slab', mats.floorMaterial?.name || 'Insulated Concrete', `${safeNum(mats.floorMaterial?.thermalConductivity, 1.1)} W/mK`, `${safeNum(shelter.geometry?.floorThickness, 0.15)} m`],
        ['Thermal Insulation', mats.insulationMaterial?.name || 'PUF Insulation', `${safeNum(mats.insulationMaterial?.thermalConductivity, 0.024)} W/mK`, '0.10 m'],
        ['Glazing Windows', mats.windowMaterial?.name || 'Double Low-E', `${safeNum(mats.windowMaterial?.thermalConductivity, 1.2)} W/mK`, `${safeNum(shelter.openings?.windowCount, 2)} units (${safeNum(shelter.openings?.windowArea, 2.5)}m²)`],
        ['Entrance Doors', mats.doorMaterial?.name || 'Timber Door', `${safeNum(mats.doorMaterial?.thermalConductivity, 0.13)} W/mK`, `${safeNum(shelter.openings?.doorCount, 1)} units (${safeNum(shelter.openings?.doorArea, 1.8)}m²)`]
      ];

      doc.font('Helvetica').fontSize(8.5);
      matRows.forEach(([comp, name, k, thick], i) => {
        if (i % 2 === 1) doc.rect(40, curY - 2, 515, 16).fill('#f8fafc');
        doc.fillColor('#334155');
        doc.text(comp, 48, curY);
        doc.text(name, 180, curY);
        doc.text(k, 380, curY);
        doc.text(thick, 470, curY);
        curY += 16;
      });

      curY += 14;

      // ================= SECTION 3: THERMAL PERFORMANCE KPI METRICS =================
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#0369a1').text('3. Thermal Performance KPI Metrics', 40, curY);
      curY += 16;
      doc.rect(40, curY, 515, 1).fill('#e2e8f0');
      curY += 8;

      doc.rect(40, curY, 515, 18).fill('#f1f5f9');
      doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold');
      doc.text('Performance Metric', 48, curY + 4);
      doc.text('Calculated Value', 260, curY + 4);
      doc.text('Engineering Target / Units', 410, curY + 4);
      curY += 20;

      const kpis = [
        ['Average Indoor Temperature', `${safeNum(m.avgIndoorTemp).toFixed(1)} °C`, 'Target: > 15 °C'],
        ['Minimum Indoor Temperature', `${safeNum(m.minIndoorTemp).toFixed(1)} °C`, 'Sub-zero minimum'],
        ['Maximum Indoor Temperature', `${safeNum(m.maxIndoorTemp).toFixed(1)} °C`, 'Solar midday peak'],
        ['Thermal Comfort Index (18-24°C)', `${safeNum(m.comfortPercentage).toFixed(1)} %`, 'Percent of hours in comfort zone'],
        ['Total Solar Energy Captured', `${safeNum(m.totalSolarGain).toFixed(2)} kWh`, 'Cumulative passive solar gain'],
        ['Total Conduction & Sky Loss', `${safeNum(m.totalHeatLoss).toFixed(2)} kWh`, 'Cumulative thermal loss'],
        ['Peak Thermal Heat Loss', `${safeNum(m.peakHeatLoss).toFixed(1)} W`, 'Maximum heating load']
      ];

      doc.font('Helvetica').fontSize(8.5);
      kpis.forEach(([name, val, unit], i) => {
        if (i % 2 === 1) doc.rect(40, curY - 2, 515, 16).fill('#f8fafc');
        doc.fillColor('#334155');
        doc.text(name, 48, curY);
        doc.text(val, 260, curY);
        doc.text(unit, 410, curY);
        curY += 16;
      });

      doc.fontSize(8).fillColor('#94a3b8').text('Confidential - DRDO Defense Research & Development Organisation', 40, 780, { align: 'center' });

      // ================= PAGE 2 =================
      doc.addPage();
      curY = 40;

      // ================= SECTION 4: 24-HOUR INDOOR VS AMBIENT TEMPERATURE PROFILE =================
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#0369a1').text('4. 24-Hour Indoor vs. Ambient Temperature Profile', 40, curY);
      curY += 16;
      doc.rect(40, curY, 515, 1).fill('#e2e8f0');
      curY += 10;

      // Render Vector Line Chart
      const chartX = 70;
      const chartY = curY;
      const chartWidth = 460;
      const chartHeight = 130;

      // Draw Chart Background Box
      doc.rect(chartX, chartY, chartWidth, chartHeight).fillAndStroke('#f8fafc', '#cbd5e1');

      // Temperature bounds for Y-axis
      let validTemps = [-25, 30];
      if (timeSeries.length > 0) {
        timeSeries.forEach(p => {
          validTemps.push(safeNum(p.indoorTemperature));
          validTemps.push(safeNum(p.ambientTemperature));
        });
      }
      const minY = Math.floor(Math.min(...validTemps) / 5) * 5;
      const maxY = Math.ceil(Math.max(...validTemps) / 5) * 5;
      const rangeY = (maxY - minY) || 10;

      // Gridlines & Y-Axis Labels
      const gridSteps = 5;
      doc.fontSize(7.5).font('Helvetica').fillColor('#64748b');
      for (let g = 0; g <= gridSteps; g++) {
        const valY = minY + (rangeY / gridSteps) * g;
        const py = chartY + chartHeight - (g / gridSteps) * chartHeight;

        doc.moveTo(chartX, py).lineTo(chartX + chartWidth, py).stroke('#e2e8f0');
        doc.text(`${valY.toFixed(0)}°C`, chartX - 25, py - 3, { width: 20, align: 'right' });
      }

      // X-Axis Lines & Labels
      if (timeSeries.length > 0) {
        const xStep = chartWidth / Math.max(1, timeSeries.length - 1);

        // Draw Ambient Line (Gray Dashed)
        doc.save().strokeColor('#94a3b8').lineWidth(1.2).dash(3, { space: 3 });
        timeSeries.forEach((p, idx) => {
          const ambT = safeNum(p.ambientTemperature);
          const px = chartX + idx * xStep;
          const py = chartY + chartHeight - ((ambT - minY) / rangeY) * chartHeight;
          if (idx === 0) doc.moveTo(px, py);
          else doc.lineTo(px, py);
        });
        doc.stroke().restore();

        // Draw Indoor Line (Sky Blue Solid)
        doc.save().strokeColor('#0284c7').lineWidth(2.2);
        timeSeries.forEach((p, idx) => {
          const inT = safeNum(p.indoorTemperature);
          const px = chartX + idx * xStep;
          const py = chartY + chartHeight - ((inT - minY) / rangeY) * chartHeight;
          if (idx === 0) doc.moveTo(px, py);
          else doc.lineTo(px, py);
        });
        doc.stroke().restore();

        // X-axis Hour Ticks
        for (let idx = 0; idx < timeSeries.length; idx += 4) {
          const px = chartX + idx * xStep;
          const label = `${String(idx).padStart(2, '0')}:00`;
          doc.text(label, px - 12, chartY + chartHeight + 4, { width: 25, align: 'center' });
        }
      }

      // Graph Legend
      const legendY = chartY + chartHeight + 16;
      doc.rect(chartX, legendY, 12, 3).fill('#0284c7');
      doc.fillColor('#0369a1').fontSize(8.5).font('Helvetica-Bold').text('Indoor Temp (°C)', chartX + 16, legendY - 3);

      doc.rect(chartX + 140, legendY, 12, 2).fill('#94a3b8');
      doc.fillColor('#64748b').fontSize(8.5).font('Helvetica').text('Location Ambient Temp (°C)', chartX + 156, legendY - 3);

      curY = legendY + 24;

      // ================= SECTION 5: ENVELOPE HEAT LOSS COMPONENT BREAKDOWN TABLE =================
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#0369a1').text('5. Envelope Heat Loss Component Breakdown', 40, curY);
      curY += 16;
      doc.rect(40, curY, 515, 1).fill('#e2e8f0');
      curY += 8;

      // Represented cleanly as a structured table
      doc.rect(40, curY, 515, 18).fill('#f1f5f9');
      doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold');
      doc.text('Envelope Component', 48, curY + 4);
      doc.text('Average Conduction Loss (W)', 240, curY + 4);
      doc.text('Share of Total Loss (%)', 410, curY + 4);
      curY += 20;

      const totalConductionSum = safeNum(breakdown.wallConduction) +
                                 safeNum(breakdown.roofConduction) +
                                 safeNum(breakdown.floorConduction) +
                                 safeNum(breakdown.windowConduction) +
                                 safeNum(breakdown.doorConduction) || 1;

      const breakdownRows = [
        ['Walls Conduction', safeNum(breakdown.wallConduction)],
        ['Roof Conduction', safeNum(breakdown.roofConduction)],
        ['Floor Conduction', safeNum(breakdown.floorConduction)],
        ['Windows Conduction', safeNum(breakdown.windowConduction)],
        ['Doors Conduction', safeNum(breakdown.doorConduction)]
      ];

      doc.font('Helvetica').fontSize(8.5);
      breakdownRows.forEach(([comp, val], i) => {
        if (i % 2 === 1) doc.rect(40, curY - 2, 515, 16).fill('#f8fafc');
        const pct = ((val / totalConductionSum) * 100).toFixed(1);
        doc.fillColor('#334155');
        doc.text(comp, 48, curY);
        doc.text(`${val.toFixed(1)} W`, 240, curY);
        doc.text(`${pct} %`, 410, curY);
        curY += 16;
      });

      curY += 16;

      // ================= SECTION 6: ENGINEERING RECOMMENDATIONS =================
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#0369a1').text('6. Engineering Recommendations', 40, curY);
      curY += 16;
      doc.rect(40, curY, 515, 1).fill('#e2e8f0');
      curY += 8;

      doc.fontSize(8.5).font('Helvetica').fillColor('#1e293b');
      doc.text(
        simulation.aiExplanation ||
        `The predicted ${shelterShape} shelter design optimizes thermal resistance and solar gain for the specified climatic location. Additional PUF insulation panels are recommended for sub-zero night hours.`,
        40,
        curY,
        { width: 515, align: 'justify' }
      );

      // Footer on Page 2
      doc.fontSize(8).fillColor('#94a3b8').text('Confidential - DRDO Defense Research & Development Organisation', 40, 780, { align: 'center' });

      doc.end();
      stream.on('finish', () => resolve(outputPath));
      stream.on('error', (err) => reject(err));
    } catch (err) {
      console.error('[PDF Generator Exception]:', err);
      reject(err);
    }
  });
}

module.exports = {
  generateSimulationPDF
};
