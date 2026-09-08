/**
 * Physics Engine - Standardized Multi-Shape Geometry Calculator
 *
 * Computes exact thermodynamic surface areas, enclosed volumes,
 * and surface-to-volume ratios for 4 shelter shapes:
 * 1. Rectangular
 * 2. Dome (Spherical Cap)
 * 3. A-Frame (Triangular Prism)
 * 4. Quonset (Semi-Cylindrical Arch)
 */

/**
 * Validate input dimensions
 */
function validateDimensions(shape, dimensions) {
  const errors = [];
  if (!dimensions || typeof dimensions !== 'object') {
    return ['Invalid dimensions object provided.'];
  }

  const checkPositive = (name, val, min = 0.5, max = 50) => {
    const num = Number(val);
    if (isNaN(num) || num <= 0) {
      errors.push(`${name} must be a positive number greater than 0.`);
    } else if (num < min) {
      errors.push(`${name} is unrealistically small (minimum ${min}m).`);
    } else if (num > max) {
      errors.push(`${name} exceeds realistic shelter dimensions (maximum ${max}m).`);
    }
  };

  const normShape = (shape || 'rectangle').toLowerCase().trim();

  switch (normShape) {
    case 'rectangle':
    case 'rectangular':
      checkPositive('Length', dimensions.length || dimensions.L);
      checkPositive('Width', dimensions.width || dimensions.W);
      checkPositive('Height', dimensions.height || dimensions.wallHeight || dimensions.H);
      break;

    case 'dome':
      checkPositive('Base Radius', dimensions.radius || dimensions.R || (dimensions.diameter ? dimensions.diameter / 2 : null));
      checkPositive('Dome Height', dimensions.domeHeight || dimensions.height || dimensions.H);
      break;

    case 'a-frame':
    case 'aframe':
      checkPositive('Length', dimensions.length || dimensions.L);
      checkPositive('Width', dimensions.width || dimensions.W);
      checkPositive('Ridge Height', dimensions.ridgeHeight || dimensions.height || dimensions.H);
      break;

    case 'quonset':
      checkPositive('Length', dimensions.length || dimensions.L);
      checkPositive('Width', dimensions.width || dimensions.W);
      break;

    default:
      errors.push(`Unsupported shelter shape "${shape}". Supported: rectangle, dome, a-frame, quonset.`);
  }

  return errors;
}

/**
 * Standardized Geometry Calculation
 *
 * @param {string} shape - 'rectangle' | 'dome' | 'a-frame' | 'quonset'
 * @param {object} dimensions - shape-specific measurements (meters)
 * @param {object} openings - { windowArea, doorArea, windowCount, doorCount }
 * @returns {object} Standardized geometry data structure
 */
function calculateGeometry(shape = 'rectangle', dimensions = {}, openings = {}) {
  const normShape = (shape || 'rectangle').toLowerCase().trim();
  const windowArea = Number(openings.windowArea) || 0;
  const doorArea = Number(openings.doorArea) || (Number(openings.doorCount) ? openings.doorCount * 1.8 : 1.8);
  const totalOpeningsArea = windowArea + doorArea;

  let floorArea = 0;
  let grossWallArea = 0;
  let opaqueWallArea = 0;
  let roofArea = 0;
  let curvedEnvelopeArea = 0;
  let volume = 0;
  let characteristicHeight = 2.8;
  let description = '';

  if (normShape === 'rectangle' || normShape === 'rectangular') {
    const L = Number(dimensions.length || dimensions.L || 6.0);
    const W = Number(dimensions.width || dimensions.W || 4.0);
    const H = Number(dimensions.height || dimensions.wallHeight || dimensions.H || 2.8);
    const roofAngle = Number(dimensions.roofAngle || 25);

    floorArea = L * W;
    grossWallArea = 2 * (L + W) * H;
    
    // Pitched Gable Roof addition
    const roofAngleRad = (roofAngle * Math.PI) / 180;
    const ridgeH = (W / 2) * Math.tan(roofAngleRad);
    const gableTriangleArea = 2 * (0.5 * W * ridgeH); // 2 triangular gable ends
    
    roofArea = (2 * L * (W / 2)) / Math.cos(roofAngleRad); // 2 sloped roof panels
    volume = (L * W * H) + (0.5 * W * ridgeH * L);
    
    const totalVerticalWall = grossWallArea + gableTriangleArea;
    opaqueWallArea = Math.max(0, totalVerticalWall - totalOpeningsArea);
    characteristicHeight = H + ridgeH / 2;
    description = `Rectangular Box (${L.toFixed(1)}m × ${W.toFixed(1)}m × ${H.toFixed(1)}m) with Gable Roof`;
  }
  else if (normShape === 'dome') {
    const R = Number(dimensions.radius || dimensions.R || (dimensions.width ? dimensions.width / 2 : 3.0));
    const H = Number(dimensions.domeHeight || dimensions.height || dimensions.H || 2.8);

    // Spherical Cap Geometry:
    // Equivalent sphere radius r_sph = (R^2 + H^2) / (2 * H)
    const rSph = (R * R + H * H) / (2 * H);
    
    floorArea = Math.PI * R * R;
    curvedEnvelopeArea = 2 * Math.PI * rSph * H; // = PI * (R^2 + H^2)
    volume = (Math.PI * H / 6) * (3 * R * R + H * H);
    
    // In a dome, openings are integrated into the curved shell
    opaqueWallArea = 0;
    roofArea = 0;
    characteristicHeight = H;
    description = `Geodesic / Spherical Cap Dome (Base Radius ${R.toFixed(1)}m, Peak Height ${H.toFixed(1)}m)`;
  }
  else if (normShape === 'a-frame' || normShape === 'aframe') {
    const L = Number(dimensions.length || dimensions.L || 6.0);
    const W = Number(dimensions.width || dimensions.W || 5.0);
    const H = Number(dimensions.ridgeHeight || dimensions.height || dimensions.H || 4.0);

    floorArea = L * W;
    const slopeLength = Math.sqrt((W / 2) * (W / 2) + H * H);
    roofArea = 2 * L * slopeLength; // 2 sloping roof panels extending to ground
    const endWallGrossArea = W * H; // 2 triangular ends: 2 * (0.5 * W * H) = W * H
    
    volume = 0.5 * W * H * L; // Triangular prism volume
    opaqueWallArea = Math.max(0, endWallGrossArea - totalOpeningsArea);
    characteristicHeight = H / 2;
    description = `A-Frame Triangular Prism (${L.toFixed(1)}m length, ${W.toFixed(1)}m base, ${H.toFixed(1)}m ridge)`;
  }
  else if (normShape === 'quonset') {
    const L = Number(dimensions.length || dimensions.L || 6.0);
    const W = Number(dimensions.width || dimensions.W || 4.5);
    const R = W / 2; // Semi-circle radius
    const H = dimensions.height ? Number(dimensions.height) : R;

    floorArea = L * W;
    // Semi-cylinder arch
    curvedEnvelopeArea = Math.PI * R * L;
    const endWallsGross = Math.PI * R * R; // 2 semicircular ends: 2 * (0.5 * PI * R^2) = PI * R^2
    
    volume = 0.5 * Math.PI * R * R * L;
    opaqueWallArea = Math.max(0, endWallsGross - totalOpeningsArea);
    characteristicHeight = R;
    description = `Quonset Semi-Cylindrical Arch (${L.toFixed(1)}m length, ${W.toFixed(1)}m arch span)`;
  }

  // Total exposed exterior envelope area (surfaces interacting with outdoor ambient air and radiation)
  const exposedEnvelopeArea = opaqueWallArea + roofArea + curvedEnvelopeArea + totalOpeningsArea;
  const surfaceAreaToVolumeRatio = volume > 0 ? exposedEnvelopeArea / volume : 0;

  return {
    shape: normShape,
    dimensions: { ...dimensions },
    floorArea: Number(floorArea.toFixed(2)),
    opaqueWallArea: Number(opaqueWallArea.toFixed(2)),
    roofArea: Number(roofArea.toFixed(2)),
    curvedEnvelopeArea: Number(curvedEnvelopeArea.toFixed(2)),
    glazingArea: Number(windowArea.toFixed(2)),
    doorArea: Number(doorArea.toFixed(2)),
    totalOpeningsArea: Number(totalOpeningsArea.toFixed(2)),
    exposedEnvelopeArea: Number(exposedEnvelopeArea.toFixed(2)),
    volume: Number(volume.toFixed(2)),
    surfaceAreaToVolumeRatio: Number(surfaceAreaToVolumeRatio.toFixed(3)),
    characteristicHeight: Number(characteristicHeight.toFixed(2)),
    description
  };
}

/**
 * Generate equivalent dimensions for fair shape comparison normalized to a target floor area.
 * Keeps usable floor area and standard usable height constant.
 */
function createEquivalentDimensions(targetFloorArea = 24.0, baseHeight = 2.8) {
  // 1. Rectangle (aspect ratio 1.5 : 1 => L * W = A, L = 1.5W => 1.5 W^2 = A => W = sqrt(A/1.5))
  const rectW = Math.sqrt(targetFloorArea / 1.5);
  const rectL = targetFloorArea / rectW;

  // 2. Dome (PI * R^2 = A => R = sqrt(A / PI))
  const domeR = Math.sqrt(targetFloorArea / Math.PI);
  const domeH = Math.min(domeR, baseHeight);

  // 3. A-Frame (L * W = A, aspect ratio 1.2 : 1 => W = sqrt(A / 1.2), Ridge height = 3.8m for head clearance)
  const aframeW = Math.sqrt(targetFloorArea / 1.2);
  const aframeL = targetFloorArea / aframeW;
  const aframeH = Math.max(3.5, baseHeight * 1.35);

  // 4. Quonset (L * W = A, with span W = 4.2m => L = A / 4.2)
  const quonsetW = Math.min(5.0, Math.max(3.5, Math.sqrt(targetFloorArea)));
  const quonsetL = targetFloorArea / quonsetW;

  return {
    rectangle: { length: Number(rectL.toFixed(1)), width: Number(rectW.toFixed(1)), height: Number(baseHeight.toFixed(1)) },
    dome: { radius: Number(domeR.toFixed(1)), domeHeight: Number(domeH.toFixed(1)) },
    aframe: { length: Number(aframeL.toFixed(1)), width: Number(aframeW.toFixed(1)), ridgeHeight: Number(aframeH.toFixed(1)) },
    quonset: { length: Number(quonsetL.toFixed(1)), width: Number(quonsetW.toFixed(1)) }
  };
}

module.exports = {
  calculateGeometry,
  validateDimensions,
  createEquivalentDimensions
};
