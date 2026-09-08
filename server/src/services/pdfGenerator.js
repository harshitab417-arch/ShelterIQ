/**
 * Report Service - PDFKit Engineering Report Generator
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

function generateSimulationPDF(simulation, outputPath) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);

      // Header Banner
      doc.rect(40, 40, 515, 60).fill('#0284c7'); // Sky blue accent
      doc.fillColor('#ffffff')
         .fontSize(18)
         .font('Helvetica-Bold')
         .text('DRDO PASSIVE SHELTER THERMAL DESIGN REPORT', 55, 52);
      
      doc.fontSize(10)
         .font('Helvetica')
         .text(`Generated: ${new Date().toLocaleDateString()} | Project Ref: ${simulation._id || 'SIM-2026'}`, 55, 76);

      doc.fillColor('#1e293b').moveDown(3);

      // Section 1: Executive Summary & Project Details
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#0369a1').text('1. Executive Summary & Setup');
      doc.underline(40, doc.y, 515, 1, { color: '#e2e8f0' });
      doc.moveDown(0.5);

      const m = simulation.results.metrics;
      const shelter = simulation.shelter;
      const climate = simulation.climateDataset;

      doc.fontSize(10).font('Helvetica').fillColor('#334155');
      doc.text(`Shelter Name: ${shelter.name || simulation.name}`);
      doc.text(`Location / Climate: ${climate.location || 'High Altitude Region (Ladakh)'}`);
      doc.text(`Geometry Dimensions: ${shelter.geometry.length}m (L) x ${shelter.geometry.width}m (W) x ${shelter.geometry.height}m (H)`);
      doc.text(`Wall Material: ${shelter.materials.wallMaterial.name} (k = ${shelter.materials.wallMaterial.thermalConductivity} W/mK)`);
      doc.text(`Roof Material: ${shelter.materials.roofMaterial.name} (k = ${shelter.materials.roofMaterial.thermalConductivity} W/mK)`);
      doc.moveDown();

      // Section 2: Thermal Performance Metrics Table
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#0369a1').text('2. Thermal Performance KPI Metrics');
      doc.moveDown(0.5);

      const tableTop = doc.y;
      doc.rect(40, tableTop, 515, 20).fill('#f1f5f9');
      doc.fillColor('#0f172a').fontSize(10).font('Helvetica-Bold');
      doc.text('Performance Metric', 50, tableTop + 5);
      doc.text('Calculated Value', 250, tableTop + 5);
      doc.text('Engineering Target / Units', 400, tableTop + 5);

      let yPos = tableTop + 25;
      const kpis = [
        ['Average Indoor Temperature', `${m.avgIndoorTemp} °C`, 'Target: > 15 °C'],
        ['Minimum Indoor Temperature', `${m.minIndoorTemp} °C`, 'Sub-zero minimum'],
        ['Maximum Indoor Temperature', `${m.maxIndoorTemp} °C`, 'Solar midday peak'],
        ['Thermal Comfort Index (18-24°C)', `${m.comfortPercentage} %`, 'Percent of hours in comfort zone'],
        ['Total Solar Energy Captured', `${m.totalSolarGain} kWh`, 'Cumulative passive solar gain'],
        ['Total Conduction & Sky Heat Loss', `${m.totalHeatLoss} kWh`, 'Cumulative thermal loss'],
        ['Peak Thermal Heat Loss', `${m.peakHeatLoss} W`, 'Maximum heating load']
      ];

      doc.font('Helvetica').fontSize(9);
      kpis.forEach(([name, val, unit], i) => {
        if (i % 2 === 1) doc.rect(40, yPos - 2, 515, 18).fill('#f8fafc');
        doc.fillColor('#334155');
        doc.text(name, 50, yPos);
        doc.text(val, 250, yPos);
        doc.text(unit, 400, yPos);
        yPos += 20;
      });

      doc.y = yPos + 15;

      // Section 3: Physics Model & Assumptions
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#0369a1').text('3. Physics Model Assumptions & Limitations');
      doc.moveDown(0.5);
      doc.fontSize(9).font('Helvetica').fillColor('#475569');
      (simulation.assumptions || [
        'Single-zone transient lumped-capacitance thermal model.',
        'High-altitude atmospheric pressure correction applied.',
        '1D multi-layer thermal conduction resistance calculations.',
        'Swinbank longwave sky radiation exchange model.'
      ]).forEach(asm => {
        doc.text(`• ${asm}`);
      });

      doc.moveDown();

      // Section 4: AI Analysis & Recommendations
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#0369a1').text('4. Engineering Recommendations');
      doc.moveDown(0.5);
      doc.fontSize(9).font('Helvetica').fillColor('#1e293b');
      doc.text(simulation.aiExplanation || 'The design provides structural passive thermal storage. Additional PUF roof insulation is recommended to reduce night heat loss.', {
        width: 515,
        align: 'justify'
      });

      // Footer
      doc.fontSize(8).fillColor('#94a3b8').text('Confidential - DRDO Defense Research & Development Organisation', 40, 780, { align: 'center' });

      doc.end();
      stream.on('finish', () => resolve(outputPath));
      stream.on('error', (err) => reject(err));
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  generateSimulationPDF
};
