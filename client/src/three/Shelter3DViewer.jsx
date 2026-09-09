import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Html } from '@react-three/drei';
import * as THREE from 'three';
import HeatFlowParticles from './HeatFlowParticles';
import CompassIndicator from './CompassIndicator';
import { getThermalColor } from '../components/ClimateTimeMachine/timeMachineAdapter';

/**
 * Climate Environment Configurations
 */
export const CLIMATE_ENVIRONMENTS = {
  snowy: {
    id: 'snowy',
    label: 'Snowy / Alpine',
    tagline: 'Extreme Cold / High Altitude',
    icon: '❄️',
    skyColorDay: '#dbeafe',
    skyColorNight: '#0a1224',
    fogColor: '#e0f2fe',
    fogNear: 22,
    fogFar: 56,
    groundColor: '#eef4f8',
    gridCellColor: '#cbd5e1',
    gridSectionColor: '#94a3b8',
    ambientColor: '#f0f6fc',
    sunColor: '#fffbf5',
    sunIntensity: 1.35
  },
  sunny: {
    id: 'sunny',
    label: 'Sunny / Desert',
    tagline: 'Hot Arid / High Solar Radiation',
    icon: '☀️',
    skyColorDay: '#60a5fa',
    skyColorNight: '#090d1c',
    fogColor: '#bfdbfe',
    fogNear: 25,
    fogFar: 65,
    groundColor: '#dfb780',
    gridCellColor: '#eab308',
    gridSectionColor: '#ca8a04',
    ambientColor: '#fef3c7',
    sunColor: '#fffbeb',
    sunIntensity: 1.55
  },
  coastal: {
    id: 'coastal',
    label: 'Coastal / Maritime',
    tagline: 'High Humidity / Ocean Front',
    icon: '🌊',
    skyColorDay: '#7dd3fc',
    skyColorNight: '#081226',
    fogColor: '#bae6fd',
    fogNear: 24,
    fogFar: 60,
    groundColor: '#e5d7ba',
    gridCellColor: '#38bdf8',
    gridSectionColor: '#0284c7',
    ambientColor: '#f0f9ff',
    sunColor: '#fffbf0',
    sunIntensity: 1.4
  },
  rainy: {
    id: 'rainy',
    label: 'Rainy / Monsoon',
    tagline: 'Overcast / High Precipitation',
    icon: '🌧️',
    skyColorDay: '#64748b',
    skyColorNight: '#0a0e1a',
    fogColor: '#475569',
    fogNear: 16,
    fogFar: 46,
    groundColor: '#3d4856',
    gridCellColor: '#64748b',
    gridSectionColor: '#475569',
    ambientColor: '#cbd5e1',
    sunColor: '#94a3b8',
    sunIntensity: 0.8
  },
  forest: {
    id: 'forest',
    label: 'Forest / Valley',
    tagline: 'Temperate / Alpine Woodlands',
    icon: '🌲',
    skyColorDay: '#93c5fd',
    skyColorNight: '#07151f',
    fogColor: '#bae6fd',
    fogNear: 22,
    fogFar: 55,
    groundColor: '#366938',
    gridCellColor: '#86efac',
    gridSectionColor: '#22c55e',
    ambientColor: '#ecfdf5',
    sunColor: '#fef9c3',
    sunIntensity: 1.35
  }
};

/**
 * Detects appropriate climate region background based on location and temperature.
 */
export function detectClimateRegion({ climate, temperature, location, meanAmbient }) {
  const temp = (typeof temperature === 'number' && !isNaN(temperature))
    ? temperature
    : (climate?.temperature !== undefined
        ? Number(climate.temperature)
        : (climate?.dataPoints?.length
            ? climate.dataPoints.reduce((acc, p) => acc + (Number(p.ambientTemperature) || 0), 0) / climate.dataPoints.length
            : null));

  const locStr = `${location || ''} ${climate?.location || ''} ${climate?.name || ''} ${climate?.climateType || ''}`.toLowerCase();

  // Extreme cold / sub-zero / Siachen / Leh / Dras
  if (
    (temp !== null && temp <= 2) ||
    locStr.includes('leh') ||
    locStr.includes('siachen') ||
    locStr.includes('dras') ||
    locStr.includes('ladakh') ||
    locStr.includes('kargil') ||
    locStr.includes('snow') ||
    locStr.includes('arctic') ||
    locStr.includes('glacier') ||
    locStr.includes('alpine') ||
    locStr.includes('himalaya') ||
    locStr.includes('nyoma') ||
    (climate?.elevation && climate.elevation > 3000)
  ) {
    return 'snowy';
  }

  // Coastal / Beach / Islands
  if (
    locStr.includes('coastal') ||
    locStr.includes('beach') ||
    locStr.includes('island') ||
    locStr.includes('goa') ||
    locStr.includes('mumbai') ||
    locStr.includes('chennai') ||
    locStr.includes('kochi') ||
    locStr.includes('vizag') ||
    locStr.includes('port') ||
    locStr.includes('ocean') ||
    locStr.includes('sea')
  ) {
    return 'coastal';
  }

  // Rainy / Monsoon / Cherrapunji / Assam
  if (
    locStr.includes('rain') ||
    locStr.includes('monsoon') ||
    locStr.includes('cherrapunji') ||
    locStr.includes('mawsynram') ||
    locStr.includes('assam') ||
    locStr.includes('wet') ||
    locStr.includes('meghalaya')
  ) {
    return 'rainy';
  }

  // Forest / Alpine Valley
  if (
    (temp !== null && temp > 8 && temp <= 22) ||
    locStr.includes('forest') ||
    locStr.includes('valley') ||
    locStr.includes('shimla') ||
    locStr.includes('manali') ||
    locStr.includes('dehradun') ||
    locStr.includes('ooty') ||
    locStr.includes('wayanad') ||
    locStr.includes('pine') ||
    locStr.includes('woodland')
  ) {
    return 'forest';
  }

  // Sunny / Desert / Hot Plains
  if (
    (temp !== null && temp > 25) ||
    locStr.includes('desert') ||
    locStr.includes('sunny') ||
    locStr.includes('rajasthan') ||
    locStr.includes('jodhpur') ||
    locStr.includes('thar') ||
    locStr.includes('arid') ||
    locStr.includes('delhi') ||
    locStr.includes('plains')
  ) {
    return 'sunny';
  }

  return temp !== null && temp <= 5 ? 'snowy' : 'sunny';
}

/**
 * Mathematically constructs a true Triangular Prism BufferGeometry for the A-Frame shelter.
 */
function createAFrameGeometry(width, height, length) {
  const w2 = width / 2;
  const l2 = length / 2;
  const geom = new THREE.BufferGeometry();

  const p0 = [-w2, 0, -l2];
  const p1 = [ w2, 0, -l2];
  const p2 = [  0, height, -l2];
  const p3 = [-w2, 0,  l2];
  const p4 = [ w2, 0,  l2];
  const p5 = [  0, height,  l2];

  const positions = [];
  const normals = [];
  const uvs = [];

  function addTriangle(vA, vB, vC) {
    positions.push(...vA, ...vB, ...vC);
    const cb = new THREE.Vector3().subVectors(new THREE.Vector3(...vC), new THREE.Vector3(...vB));
    const ab = new THREE.Vector3().subVectors(new THREE.Vector3(...vA), new THREE.Vector3(...vB));
    const norm = new THREE.Vector3().crossVectors(ab, cb).normalize();
    for (let i = 0; i < 3; i++) {
      normals.push(norm.x, norm.y, norm.z);
    }
    uvs.push(0, 0, 1, 0, 0.5, 1);
  }

  function addQuad(vA, vB, vC, vD) {
    addTriangle(vA, vB, vC);
    addTriangle(vA, vC, vD);
  }

  addTriangle(p0, p1, p2);
  addTriangle(p4, p3, p5);
  addQuad(p3, p0, p2, p5);
  addQuad(p1, p4, p5, p2);
  addQuad(p0, p3, p4, p1);

  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.computeVertexNormals();

  return geom;
}

/**
 * Creates a clean vertical 2D triangular gable end-wall BufferGeometry for A-Frame and Rectangle gable.
 * Faces +Z in the XY plane.
 */
function createAFrameGableWallGeometry(width, height) {
  const w2 = width / 2;
  const geom = new THREE.BufferGeometry();
  const positions = [
    -w2, 0, 0,
     w2, 0, 0,
      0, height, 0
  ];
  const normals = [
    0, 0, 1,
    0, 0, 1,
    0, 0, 1
  ];
  const uvs = [
    0, 0,
    1, 0,
    0.5, 1
  ];
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  return geom;
}

/**
 * Creates sloped roof panels with realistic eaves and overhangs.
 * Eaves begin slightly below y = 0 (-0.05) to cleanly cap and seal the wall line with zero gaps.
 */
function createAFrameRoofGeometry(width, height, length, overhangSide = 0.25, overhangEnd = 0.35) {
  const geom = new THREE.BufferGeometry();
  const w2 = width / 2;
  const l2 = length / 2;
  const oSide = overhangSide;
  const oEnd = overhangEnd;

  const pitchAngle = Math.atan2(height, w2);
  const extraApexY = oSide * Math.tan(pitchAngle) * 0.45;

  const apexY = height + extraApexY;
  const eaveY = -0.05;
  const leftX = -w2 - oSide;
  const rightX = w2 + oSide;
  const zNear = l2 + oEnd;
  const zFar = -l2 - oEnd;

  const positions = [];
  const normals = [];
  const uvs = [];

  function addQuad(v0, v1, v2, v3, norm) {
    positions.push(...v0, ...v1, ...v2);
    positions.push(...v0, ...v2, ...v3);
    for (let i = 0; i < 6; i++) {
      normals.push(...norm);
    }
    uvs.push(0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1);
  }

  const leftNorm = [-Math.sin(pitchAngle), Math.cos(pitchAngle), 0];
  const rightNorm = [Math.sin(pitchAngle), Math.cos(pitchAngle), 0];

  // Left slope
  addQuad(
    [leftX, eaveY, zFar],
    [0, apexY, zFar],
    [0, apexY, zNear],
    [leftX, eaveY, zNear],
    leftNorm
  );

  // Right slope
  addQuad(
    [0, apexY, zFar],
    [rightX, eaveY, zFar],
    [rightX, eaveY, zNear],
    [0, apexY, zNear],
    rightNorm
  );

  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.computeVertexNormals();
  return geom;
}

/**
 * Semi-Cylindrical Arch for Quonset shelter with smooth outward normals.
 */
function createQuonsetShellGeometry(radius, length, radialSegments = 64) {
  const geom = new THREE.BufferGeometry();
  const l2 = length / 2;
  const positions = [];
  const normals = [];
  const uvs = [];

  for (let i = 0; i < radialSegments; i++) {
    const theta1 = (i / radialSegments) * Math.PI;
    const theta2 = ((i + 1) / radialSegments) * Math.PI;

    const x1 = -radius * Math.cos(theta1);
    const y1 =  radius * Math.sin(theta1);
    const x2 = -radius * Math.cos(theta2);
    const y2 =  radius * Math.sin(theta2);

    const v0 = [x1, y1, -l2];
    const v1 = [x2, y2, -l2];
    const v2 = [x2, y2,  l2];
    const v3 = [x1, y1,  l2];

    const n1 = [x1 / radius, y1 / radius, 0];
    const n2 = [x2 / radius, y2 / radius, 0];

    positions.push(...v0, ...v1, ...v2);
    normals.push(...n1, ...n2, ...n2);
    uvs.push(i / radialSegments, 0, (i + 1) / radialSegments, 0, (i + 1) / radialSegments, 1);

    positions.push(...v0, ...v2, ...v3);
    normals.push(...n1, ...n2, ...n1);
    uvs.push(i / radialSegments, 0, (i + 1) / radialSegments, 1, i / radialSegments, 1);
  }

  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.computeVertexNormals();

  return geom;
}

/**
 * Semicircular End-Wall for Quonset with counter-clockwise winding facing +Z.
 */
function createSemicircleGeometry(radius, segments = 64) {
  const geom = new THREE.BufferGeometry();
  const positions = [];
  const normals = [];
  const uvs = [];

  for (let i = 0; i < segments; i++) {
    const theta1 = (i / segments) * Math.PI;
    const theta2 = ((i + 1) / segments) * Math.PI;

    const x1 = -radius * Math.cos(theta1);
    const y1 =  radius * Math.sin(theta1);
    const x2 = -radius * Math.cos(theta2);
    const y2 =  radius * Math.sin(theta2);

    positions.push(0, 0, 0, x2, y2, 0, x1, y1, 0);
    normals.push(0, 0, 1, 0, 0, 1, 0, 0, 1);
    uvs.push(0.5, 0, (x2 / radius + 1) * 0.5, y2 / radius, (x1 / radius + 1) * 0.5, y1 / radius);
  }

  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.computeVertexNormals();

  return geom;
}

function SingleWindow({ position, rotation = [0, 0, 0], scale = 1, mullions = true, viewMode = 'normal', glassColor = '#a8d8ea' }) {
  const w = 1.14 * scale;
  const h = 1.14 * scale;
  const gw = 0.94 * scale;
  const gh = 0.94 * scale;

  const isXRay = viewMode === 'heatflow';
  const isThermal = viewMode === 'thermal';

  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0, 0.025]}>
        <boxGeometry args={[w, h, 0.05]} />
        <meshStandardMaterial
          color={isThermal ? '#0f172a' : (isXRay ? '#1e293b' : '#334155')}
          transparent={isXRay}
          opacity={isXRay ? 0.4 : 1.0}
          roughness={0.55}
        />
      </mesh>
      <mesh position={[0, 0, 0.062]}>
        <boxGeometry args={[gw, gh, 0.04]} />
        <meshStandardMaterial
          color={isThermal ? glassColor : (isXRay ? '#38bdf8' : '#7dd3fc')}
          transparent
          opacity={isXRay ? 0.45 : (isThermal ? 0.9 : 0.78)}
          roughness={0.06}
          metalness={isXRay ? 0.4 : 0.15}
        />
      </mesh>
      {mullions && !isXRay && (
        <>
          <mesh position={[0, 0, 0.075]}>
            <boxGeometry args={[gw, 0.04 * scale, 0.025]} />
            <meshStandardMaterial color={isThermal ? '#334155' : '#e2e8f0'} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0, 0.075]}>
            <boxGeometry args={[0.04 * scale, gh, 0.025]} />
            <meshStandardMaterial color={isThermal ? '#334155' : '#e2e8f0'} roughness={0.4} />
          </mesh>
        </>
      )}
    </group>
  );
}

function SingleDoor({ position, rotation = [0, 0, 0], scale = 1, handleSide = 'left', viewMode = 'normal', doorColor = '#4a2910' }) {
  const frameW = 1.1 * scale;
  const frameH = 2.2 * scale;
  const panelW = 0.92 * scale;
  const panelH = 2.04 * scale;
  const handleX = (handleSide === 'left' ? -1 : 1) * (0.3 * scale);

  const isXRay = viewMode === 'heatflow';
  const isThermal = viewMode === 'thermal';

  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0, 0.025]} castShadow>
        <boxGeometry args={[frameW, frameH, 0.06]} />
        <meshStandardMaterial
          color={isThermal ? '#0f172a' : (isXRay ? '#1e293b' : '#334155')}
          transparent={isXRay}
          opacity={isXRay ? 0.4 : 1.0}
          roughness={0.55}
        />
      </mesh>
      <mesh position={[0, 0, 0.065]}>
        <boxGeometry args={[panelW, panelH, 0.04]} />
        <meshStandardMaterial
          color={isThermal ? doorColor : (isXRay ? '#78350f' : '#5c3a21')}
          transparent={isXRay}
          opacity={isXRay ? 0.45 : 1.0}
          roughness={0.82}
        />
      </mesh>
      {!isXRay && (
        <mesh position={[handleX, 0, 0.1]}>
          <sphereGeometry args={[0.048 * scale, 10, 10]} />
          <meshStandardMaterial color="#fbbf24" roughness={0.15} metalness={0.92} />
        </mesh>
      )}
      <mesh position={[0, -frameH / 2 + 0.04, 0.18]} receiveShadow>
        <boxGeometry args={[frameW + 0.2, 0.08, 0.4]} />
        <meshStandardMaterial
          color={isThermal ? '#334155' : (isXRay ? '#1e293b' : '#94a3b8')}
          transparent={isXRay}
          opacity={isXRay ? 0.5 : 1.0}
          roughness={0.92}
        />
      </mesh>
    </group>
  );
}

/**
 * 3D Geometry Builder for Rectangle, Dome, A-Frame, and Quonset Shelters
 */
function ShelterMesh({
  shape = 'rectangle',
  dimensions = {},
  design = {},
  openings = {},
  viewMode = 'normal',
  componentLosses = {},
  flowDirection = 'OUTWARD',
  thermalHourData = null,
  isSnowy = true,
  envId = 'snowy'
}) {
  const normShape = (shape || design?.shape || 'rectangle').toLowerCase();
  const windowArea = Number(openings?.windowArea) || 2.5;

  const doorCount = Math.max(0, Number(openings?.doorCount !== undefined ? openings.doorCount : (openings?.doors !== undefined ? openings.doors : 1)));
  const windowCount = Math.max(0, Number(openings?.windowCount !== undefined ? openings.windowCount : (openings?.windows !== undefined ? openings.windows : 2)));

  const norm = componentLosses.normalized || {};
  const isThermal = viewMode === 'thermal';
  const isXRay = viewMode === 'heatflow';

  const wallThermalColor = useMemo(() => getThermalColor(norm.walls || 0.4), [norm.walls]);
  const roofThermalColor = useMemo(() => getThermalColor(norm.roof || 0.6), [norm.roof]);
  const floorThermalColor = useMemo(() => getThermalColor(norm.floor || 0.2), [norm.floor]);
  const winThermalColor = useMemo(() => getThermalColor(norm.windows || 0.5), [norm.windows]);
  const doorThermalColor = useMemo(() => getThermalColor(norm.doors || 0.3), [norm.doors]);

  // Environment-adapted realistic materials
  const normalEnvelopeColor = normShape === 'quonset'
    ? '#cbd5e1'
    : (normShape === 'dome' ? '#e2e8f0' : (envId === 'sunny' ? '#d8b488' : '#d4c5a0'));

  const normalRoofColor = normShape === 'a-frame'
    ? '#6b4c2a'
    : (normShape === 'quonset' ? '#64748b' : (normShape === 'dome' ? '#475569' : '#8a9496'));

  const wallMatProps = useMemo(() => {
    if (isXRay) {
      return { color: '#1e293b', transparent: true, opacity: 0.35, roughness: 0.2, metalness: 0.5 };
    }
    if (isThermal) {
      return { color: wallThermalColor, roughness: 0.75, metalness: 0.05, side: THREE.DoubleSide };
    }
    return { color: normalEnvelopeColor, roughness: 0.85, metalness: 0.05, side: THREE.DoubleSide };
  }, [isXRay, isThermal, wallThermalColor, normalEnvelopeColor]);

  const roofMatProps = useMemo(() => {
    if (isXRay) {
      return { color: '#334155', transparent: true, opacity: 0.35, roughness: 0.2, metalness: 0.5, side: THREE.DoubleSide };
    }
    if (isThermal) {
      return { color: roofThermalColor, roughness: 0.70, metalness: 0.05, side: THREE.DoubleSide };
    }
    return {
      color: normalRoofColor,
      roughness: normShape === 'quonset' ? 0.45 : 0.65,
      metalness: normShape === 'quonset' ? 0.4 : (normShape === 'dome' ? 0.2 : 0.0),
      side: THREE.DoubleSide
    };
  }, [isXRay, isThermal, roofThermalColor, normalRoofColor, normShape]);

  const floorMatProps = useMemo(() => {
    if (isXRay) {
      return { color: '#0f172a', transparent: true, opacity: 0.6, roughness: 0.5 };
    }
    if (isThermal) {
      return { color: floorThermalColor, roughness: 0.85 };
    }
    return { color: '#94a3b8', roughness: 0.92 };
  }, [isXRay, isThermal, floorThermalColor]);

  // Dimension extractions
  const L = Math.max(1.0, Number(dimensions.length || dimensions.L || 6.0));
  const W = Math.max(1.0, Number(dimensions.width || dimensions.W || 4.0));
  const H = Math.max(1.0, Number(dimensions.height || dimensions.wallHeight || dimensions.H || 2.8));
  const R = Math.max(1.0, Number(dimensions.radius || dimensions.R || W / 2 || 3.0));
  const domeH = Math.max(1.0, Number(dimensions.domeHeight || H || 2.8));
  const ridgeH = Math.max(1.5, Number(dimensions.ridgeHeight || H || 3.8));

  const ROOF_OVH_SIDE = 0.32;
  const ROOF_OVH_END  = 0.42;
  const ridgeAboveWall = Math.max(0.85, H * 0.42);

  // Rectangle Roof Geometries: ZERO gap between roof and room walls!
  const rectGableGeom       = useMemo(() => createAFrameGableWallGeometry(W, ridgeAboveWall), [W, ridgeAboveWall]);
  const rectRoofPanelsGeom  = useMemo(() => createAFrameRoofGeometry(W, ridgeAboveWall, L, ROOF_OVH_SIDE, ROOF_OVH_END), [W, ridgeAboveWall, L]);

  // A-Frame & Quonset Geometries
  const aframeGeometry      = useMemo(() => createAFrameGeometry(W, ridgeH, L), [W, ridgeH, L]);
  const aframeGableGeom     = useMemo(() => createAFrameGableWallGeometry(W, ridgeH), [W, ridgeH]);
  const aframeRoofGeom      = useMemo(() => createAFrameRoofGeometry(W, ridgeH, L), [W, ridgeH, L]);
  const quonsetShellGeometry = useMemo(() => createQuonsetShellGeometry(W / 2, L, 64), [W, L]);
  const quonsetEndGeometry   = useMemo(() => createSemicircleGeometry(W / 2, 64), [W]);

  const quonsetRibOffsets = useMemo(() => {
    const numBays = Math.max(3, Math.min(8, Math.round(L / 1.1)));
    const offsets = [];
    for (let i = 0; i <= numBays; i++) {
      offsets.push(-L / 2 + (i / numBays) * L);
    }
    return offsets;
  }, [L]);

  const winScale = useMemo(() => {
    if (windowCount <= 0) return 0.9;
    const avgArea = windowArea / windowCount;
    return Math.max(0.7, Math.min(1.35, Math.sqrt(avgArea / 1.1)));
  }, [windowCount, windowArea]);

  const rectDoorSlots = useMemo(() => {
    const slots = [];
    if (doorCount <= 0) return slots;
    slots.push({ pos: [W * 0.2, H * 0.44, L / 2], rot: [0, 0, 0] });
    if (doorCount >= 2) slots.push({ pos: [-W * 0.2, H * 0.44, -L / 2], rot: [0, Math.PI, 0] });
    if (doorCount >= 3) slots.push({ pos: [-W / 2, H * 0.44, 0], rot: [0, -Math.PI / 2, 0] });
    if (doorCount >= 4) slots.push({ pos: [W / 2, H * 0.44, 0], rot: [0, Math.PI / 2, 0] });
    return slots;
  }, [doorCount, W, H, L]);

  const rectWindowSlots = useMemo(() => {
    const slots = [];
    if (windowCount <= 0) return slots;
    const candidates = [
      { pos: [-W * 0.26, H * 0.58, L / 2], rot: [0, 0, 0] },
      { pos: [-W / 2, H * 0.58, -L * 0.12], rot: [0, -Math.PI / 2, 0] },
      { pos: [W / 2, H * 0.58, -L * 0.12], rot: [0, Math.PI / 2, 0] },
      { pos: [W * 0.26, H * 0.58, -L / 2], rot: [0, Math.PI, 0] },
      { pos: [-W * 0.26, H * 0.58, -L / 2], rot: [0, Math.PI, 0] },
      { pos: [-W / 2, H * 0.58, L * 0.25], rot: [0, -Math.PI / 2, 0] },
      { pos: [W / 2, H * 0.58, L * 0.25], rot: [0, Math.PI / 2, 0] },
    ];
    for (let i = 0; i < windowCount; i++) {
      if (i < candidates.length) {
        slots.push(candidates[i]);
      } else {
        const wallSide = (i % 2 === 0) ? -W / 2 : W / 2;
        const rot = (i % 2 === 0) ? [0, -Math.PI / 2, 0] : [0, Math.PI / 2, 0];
        const zPos = ((i % 5) / 5 - 0.5) * L * 0.75;
        slots.push({ pos: [wallSide, H * 0.58, zPos], rot });
      }
    }
    return slots;
  }, [windowCount, W, H, L]);

  const domeDrumHeight = 1.15;
  const domeCapHeight = Math.max(0.9, domeH - domeDrumHeight);

  return (
    <group>
      {/* ─── 1. RECTANGLE SHELTER (ZERO GAP GABLE ROOF) ─── */}
      {(normShape === 'rectangle' || normShape === 'rectangular') && (
        <group>
          {/* Foundation pad */}
          {!isXRay && (
            <mesh position={[0, -0.06, 0]} castShadow receiveShadow>
              <boxGeometry args={[W + 0.4, 0.12, L + 0.4]} />
              <meshStandardMaterial {...floorMatProps} />
            </mesh>
          )}

          {/* Main Room Box Walls (height H, from y = 0 to y = H) */}
          <mesh position={[0, H / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[W, H, L]} />
            <meshStandardMaterial {...wallMatProps} />
          </mesh>

          {/* Front Gable End-Wall (Closes triangular attic space above front wall at z = L/2) */}
          <mesh
            geometry={rectGableGeom}
            position={[0, H, L / 2]}
            castShadow
            receiveShadow
          >
            <meshStandardMaterial {...wallMatProps} />
          </mesh>

          {/* Back Gable End-Wall (Closes triangular attic space above back wall at z = -L/2) */}
          <mesh
            geometry={rectGableGeom}
            position={[0, H, -L / 2]}
            rotation={[0, Math.PI, 0]}
            castShadow
            receiveShadow
          >
            <meshStandardMaterial {...wallMatProps} />
          </mesh>

          {/* Sloped Gable Roof Panels (Eaves start at y = H - 0.05 capping wall top snugly) */}
          <mesh
            position={[0, H, 0]}
            castShadow
            receiveShadow
            geometry={rectRoofPanelsGeom}
          >
            <meshStandardMaterial {...roofMatProps} />
          </mesh>

          {/* Roof Ridge Cap Beam along top apex */}
          <mesh position={[0, H + ridgeAboveWall + 0.04, 0]}>
            <boxGeometry args={[0.16, 0.08, L + ROOF_OVH_END * 2 + 0.08]} />
            <meshStandardMaterial color={isThermal ? '#334155' : '#334155'} roughness={0.6} />
          </mesh>

          {/* Roof Ridge Snow Strip in Snowy Mode */}
          {viewMode === 'normal' && isSnowy && (
            <mesh position={[0, H + ridgeAboveWall + 0.09, 0]}>
              <boxGeometry args={[0.22, 0.04, L + ROOF_OVH_END * 2 + 0.1]} />
              <meshStandardMaterial color="#ffffff" roughness={0.95} />
            </mesh>
          )}

          {/* Doors */}
          {rectDoorSlots.map((d, idx) => (
            <SingleDoor
              key={`rect-door-${idx}`}
              position={d.pos}
              rotation={d.rot}
              scale={1}
              handleSide={idx % 2 === 0 ? 'left' : 'right'}
              viewMode={viewMode}
              doorColor={doorThermalColor}
            />
          ))}

          {/* Windows */}
          {rectWindowSlots.map((w, idx) => (
            <SingleWindow
              key={`rect-win-${idx}`}
              position={w.pos}
              rotation={w.rot}
              scale={winScale}
              viewMode={viewMode}
              glassColor={winThermalColor}
            />
          ))}

          {/* Environment-Adapted Landscape Details (Normal mode only) */}
          {viewMode === 'normal' && isSnowy && (
            <>
              <group position={[-W * 0.42, 0.35, L / 2 + 0.38]}>
                <mesh castShadow>
                  <coneGeometry args={[0.38, 0.7, 7]} />
                  <meshStandardMaterial color="#1e3a1e" roughness={0.9} />
                </mesh>
                <mesh position={[0, 0.22, 0]}>
                  <coneGeometry args={[0.22, 0.3, 7]} />
                  <meshStandardMaterial color="#f8fafc" roughness={0.95} />
                </mesh>
              </group>
              <group position={[W * 0.46, 0.28, L / 2 + 0.32]}>
                <mesh castShadow>
                  <coneGeometry args={[0.3, 0.55, 7]} />
                  <meshStandardMaterial color="#234223" roughness={0.9} />
                </mesh>
                <mesh position={[0, 0.16, 0]}>
                  <coneGeometry args={[0.18, 0.25, 7]} />
                  <meshStandardMaterial color="#f8fafc" roughness={0.95} />
                </mesh>
              </group>
            </>
          )}

          {viewMode === 'normal' && envId === 'forest' && (
            <group position={[-W * 0.45, 0.4, L / 2 + 0.35]}>
              <mesh castShadow>
                <coneGeometry args={[0.42, 0.8, 7]} />
                <meshStandardMaterial color="#1b4332" roughness={0.9} />
              </mesh>
            </group>
          )}

          {viewMode === 'normal' && envId === 'sunny' && (
            <group position={[-W * 0.45, 0.25, L / 2 + 0.35]}>
              <mesh castShadow>
                <dodecahedronGeometry args={[0.32, 0]} />
                <meshStandardMaterial color="#b08968" roughness={0.9} />
              </mesh>
            </group>
          )}
        </group>
      )}

      {/* ─── 2. DOME SHELTER (HIGH-ALTITUDE GEODESIC POLAR DOME) ─── */}
      {normShape === 'dome' && (
        <group>
          <mesh position={[0, -0.06, 0]} receiveShadow castShadow>
            <cylinderGeometry args={[R + 0.3, R + 0.4, 0.12, 64]} />
            <meshStandardMaterial {...floorMatProps} />
          </mesh>

          <mesh position={[0, domeDrumHeight / 2, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[R, R, domeDrumHeight, 64, 1, false]} />
            <meshStandardMaterial {...wallMatProps} />
          </mesh>

          <mesh position={[0, domeDrumHeight, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[R, 0.035, 8, 64]} />
            <meshStandardMaterial color={isThermal ? '#334155' : '#475569'} roughness={0.4} metalness={0.5} />
          </mesh>

          <mesh
            position={[0, domeDrumHeight, 0]}
            scale={[1, domeCapHeight / R, 1]}
            castShadow
            receiveShadow
          >
            <sphereGeometry args={[R, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial {...roofMatProps} />
          </mesh>

          {viewMode === 'normal' && isSnowy && (
            <mesh
              position={[0, domeDrumHeight + domeCapHeight * 0.72, 0]}
              scale={[1, domeCapHeight / R, 1]}
            >
              <sphereGeometry args={[R * 0.45, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2.8]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.95} />
            </mesh>
          )}

          <group position={[0, domeDrumHeight + domeCapHeight, 0]}>
            <mesh position={[0, 0.1, 0]}>
              <cylinderGeometry args={[0.35, 0.42, 0.2, 24]} />
              <meshStandardMaterial color={isThermal ? '#334155' : '#334155'} roughness={0.4} metalness={0.6} />
            </mesh>
            <mesh position={[0, 0.22, 0]}>
              <coneGeometry args={[0.44, 0.15, 24]} />
              <meshStandardMaterial color={viewMode === 'normal' && isSnowy ? '#ffffff' : '#64748b'} roughness={0.8} />
            </mesh>
          </group>

          {/* Front Insulated Airlock Vestibule */}
          <group position={[0, 0, R * 0.72]}>
            <mesh position={[0, 1.1, 0.45]} castShadow receiveShadow>
              <boxGeometry args={[1.5, 2.2, 0.9]} />
              <meshStandardMaterial {...wallMatProps} />
            </mesh>
            <mesh position={[0, 2.25, 0.45]} rotation={[0.06, 0, 0]} castShadow receiveShadow>
              <boxGeometry args={[1.62, 0.1, 1.0]} />
              <meshStandardMaterial {...roofMatProps} />
            </mesh>
            {viewMode === 'normal' && isSnowy && (
              <mesh position={[0, 2.31, 0.45]} rotation={[0.06, 0, 0]}>
                <boxGeometry args={[1.64, 0.03, 1.02]} />
                <meshStandardMaterial color="#ffffff" roughness={0.95} />
              </mesh>
            )}
            {doorCount >= 1 && (
              <SingleDoor
                position={[0, 1.05, 0.9]}
                rotation={[0, 0, 0]}
                scale={0.95}
                viewMode={viewMode}
                doorColor={doorThermalColor}
              />
            )}
          </group>

          {doorCount >= 2 && (
            <group position={[0, 0, -R * 0.72]} rotation={[0, Math.PI, 0]}>
              <mesh position={[0, 1.1, 0.45]} castShadow receiveShadow>
                <boxGeometry args={[1.5, 2.2, 0.9]} />
                <meshStandardMaterial {...wallMatProps} />
              </mesh>
              <mesh position={[0, 2.25, 0.45]} rotation={[0.06, 0, 0]} castShadow receiveShadow>
                <boxGeometry args={[1.62, 0.1, 1.0]} />
                <meshStandardMaterial {...roofMatProps} />
              </mesh>
              <SingleDoor
                position={[0, 1.05, 0.9]}
                rotation={[0, 0, 0]}
                scale={0.95}
                viewMode={viewMode}
                doorColor={doorThermalColor}
              />
            </group>
          )}

          {Array.from({ length: windowCount }).map((_, idx) => {
            const sideSign = (idx % 2 === 0 ? 1 : -1);
            const slotIndex = Math.floor(idx / 2);
            const angle = sideSign * (0.65 + slotIndex * 0.55);

            const wx = Math.sin(angle) * (R * 0.99);
            const wz = Math.cos(angle) * (R * 0.99);
            const collarW = 1.18 * winScale * 0.85;
            const collarH = 1.18 * winScale * 0.85;

            return (
              <group key={`dome-win-group-${idx}`} position={[wx, 0.72, wz]} rotation={[0, angle, 0]}>
                <mesh position={[0, 0, 0.015]}>
                  <boxGeometry args={[collarW + 0.08, collarH + 0.08, 0.12]} />
                  <meshStandardMaterial color={isThermal ? '#0f172a' : '#475569'} roughness={0.5} />
                </mesh>
                <SingleWindow
                  position={[0, 0, 0.06]}
                  scale={winScale * 0.82}
                  viewMode={viewMode}
                  glassColor={winThermalColor}
                />
              </group>
            );
          })}
        </group>
      )}

      {/* ─── 3. A-FRAME SHELTER ─── */}
      {(normShape === 'a-frame' || normShape === 'aframe') && (
        <group>
          <mesh position={[0, -0.07, 0]} castShadow receiveShadow>
            <boxGeometry args={[W + 0.4, 0.14, L + 0.4]} />
            <meshStandardMaterial {...floorMatProps} />
          </mesh>

          <mesh geometry={aframeRoofGeom} castShadow receiveShadow>
            <meshStandardMaterial {...roofMatProps} />
          </mesh>

          <mesh geometry={aframeGableGeom} position={[0, 0, L / 2]} castShadow receiveShadow>
            <meshStandardMaterial {...wallMatProps} />
          </mesh>

          <mesh geometry={aframeGableGeom} position={[0, 0, -L / 2]} rotation={[0, Math.PI, 0]} castShadow receiveShadow>
            <meshStandardMaterial {...wallMatProps} />
          </mesh>

          <mesh position={[0, ridgeH + 0.04, 0]}>
            <boxGeometry args={[0.12, 0.1, L + 0.7]} />
            <meshStandardMaterial color={isThermal ? '#334155' : '#3d2817'} roughness={0.7} />
          </mesh>

          {viewMode === 'normal' && isSnowy && (
            <mesh position={[0, ridgeH + 0.1, 0]}>
              <boxGeometry args={[0.2, 0.04, L + 0.8]} />
              <meshStandardMaterial color="#ffffff" roughness={0.95} />
            </mesh>
          )}

          {doorCount >= 1 && (
            <SingleDoor
              position={[0, 0.95, L / 2]}
              rotation={[0, 0, 0]}
              scale={Math.min(0.92, (ridgeH * 0.46) / 1.8)}
              viewMode={viewMode}
              doorColor={doorThermalColor}
            />
          )}
          {doorCount >= 2 && (
            <SingleDoor
              position={[0, 0.95, -L / 2]}
              rotation={[0, Math.PI, 0]}
              scale={Math.min(0.92, (ridgeH * 0.46) / 1.8)}
              viewMode={viewMode}
              doorColor={doorThermalColor}
            />
          )}

          {windowCount >= 1 && (
            <SingleWindow
              position={[0, ridgeH * 0.65, L / 2]}
              rotation={[0, 0, 0]}
              scale={Math.min(0.72, winScale * 0.7)}
              mullions={true}
              viewMode={viewMode}
              glassColor={winThermalColor}
            />
          )}
          {windowCount >= 2 && (
            <SingleWindow
              position={[0, ridgeH * 0.65, -L / 2]}
              rotation={[0, Math.PI, 0]}
              scale={Math.min(0.72, winScale * 0.7)}
              mullions={true}
              viewMode={viewMode}
              glassColor={winThermalColor}
            />
          )}
          {windowCount >= 3 && (
            <SingleWindow
              position={[-W * 0.24, ridgeH * 0.44, 0]}
              rotation={[0, 0, Math.atan2(ridgeH, W / 2) - Math.PI / 2]}
              scale={Math.min(0.68, winScale * 0.62)}
              mullions={true}
              viewMode={viewMode}
              glassColor={winThermalColor}
            />
          )}
          {windowCount >= 4 && (
            <SingleWindow
              position={[W * 0.24, ridgeH * 0.44, 0]}
              rotation={[0, 0, -Math.atan2(ridgeH, W / 2) + Math.PI / 2]}
              scale={Math.min(0.68, winScale * 0.62)}
              mullions={true}
              viewMode={viewMode}
              glassColor={winThermalColor}
            />
          )}
        </group>
      )}

      {/* ─── 4. QUONSET ARCH SHELTER ─── */}
      {normShape === 'quonset' && (
        <group>
          <mesh position={[0, -0.07, 0]} castShadow receiveShadow>
            <boxGeometry args={[W + 0.4, 0.14, L + 0.4]} />
            <meshStandardMaterial {...floorMatProps} />
          </mesh>

          <mesh position={[-W / 2, 0.05, 0]}>
            <boxGeometry args={[0.12, 0.1, L + 0.2]} />
            <meshStandardMaterial color={isThermal ? '#334155' : '#334155'} roughness={0.4} metalness={0.6} />
          </mesh>
          <mesh position={[W / 2, 0.05, 0]}>
            <boxGeometry args={[0.12, 0.1, L + 0.2]} />
            <meshStandardMaterial color={isThermal ? '#334155' : '#334155'} roughness={0.4} metalness={0.6} />
          </mesh>

          <mesh geometry={quonsetShellGeometry} castShadow receiveShadow>
            <meshStandardMaterial {...roofMatProps} />
          </mesh>

          <mesh geometry={quonsetEndGeometry} position={[0, 0, L / 2]} castShadow receiveShadow>
            <meshStandardMaterial {...wallMatProps} />
          </mesh>

          <mesh geometry={quonsetEndGeometry} position={[0, 0, -L / 2]} rotation={[0, Math.PI, 0]} castShadow receiveShadow>
            <meshStandardMaterial {...wallMatProps} />
          </mesh>

          {quonsetRibOffsets.map((zOff, i) => (
            <mesh key={`quonset-rib-${i}`} position={[0, 0, zOff]}>
              <torusGeometry args={[W / 2 + 0.015, 0.032, 8, 64, Math.PI]} />
              <meshStandardMaterial color={isThermal ? '#334155' : '#475569'} roughness={0.4} metalness={0.5} />
            </mesh>
          ))}

          {viewMode === 'normal' && isSnowy && (
            <mesh position={[0, W / 2 + 0.02, 0]}>
              <boxGeometry args={[0.42, 0.025, L + 0.1]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.95} />
            </mesh>
          )}

          {doorCount >= 1 && (() => {
            const archR = W / 2;
            const doorScale = Math.min(0.85, (archR * 0.74) / 2.0);
            const doorH = 2.2 * doorScale;
            const doorY = doorH / 2;

            return (
              <group key="quonset-front-door">
                <mesh position={[0, doorH + 0.04, L / 2 + 0.035]}>
                  <boxGeometry args={[1.25 * doorScale, 0.06, 0.06]} />
                  <meshStandardMaterial color="#334155" roughness={0.5} />
                </mesh>
                <SingleDoor
                  position={[0, doorY, L / 2 + 0.01]}
                  rotation={[0, 0, 0]}
                  scale={doorScale}
                  viewMode={viewMode}
                  doorColor={doorThermalColor}
                />
              </group>
            );
          })()}

          {doorCount >= 2 && (() => {
            const archR = W / 2;
            const doorScale = Math.min(0.85, (archR * 0.74) / 2.0);
            const doorH = 2.2 * doorScale;
            const doorY = doorH / 2;

            return (
              <group key="quonset-back-door">
                <mesh position={[0, doorH + 0.04, -L / 2 - 0.035]}>
                  <boxGeometry args={[1.25 * doorScale, 0.06, 0.06]} />
                  <meshStandardMaterial color="#334155" roughness={0.5} />
                </mesh>
                <SingleDoor
                  position={[0, doorY, -L / 2 - 0.01]}
                  rotation={[0, Math.PI, 0]}
                  scale={doorScale}
                  viewMode={viewMode}
                  doorColor={doorThermalColor}
                />
              </group>
            );
          })()}

          {windowCount >= 1 && (() => {
            const archR = W / 2;
            const winX = archR * 0.48;
            const winY = archR * 0.40;
            const winS = Math.min(0.56, winScale * 0.52);

            return (
              <SingleWindow
                key="quonset-win-1"
                position={[-winX, winY, L / 2 + 0.02]}
                rotation={[0, 0, 0]}
                scale={winS}
                viewMode={viewMode}
                glassColor={winThermalColor}
              />
            );
          })()}
          {windowCount >= 2 && (() => {
            const archR = W / 2;
            const winX = archR * 0.48;
            const winY = archR * 0.40;
            const winS = Math.min(0.56, winScale * 0.52);

            return (
              <SingleWindow
                key="quonset-win-2"
                position={[winX, winY, L / 2 + 0.02]}
                rotation={[0, 0, 0]}
                scale={winS}
                viewMode={viewMode}
                glassColor={winThermalColor}
              />
            );
          })()}
          {windowCount >= 3 && (() => {
            const archR = W / 2;
            const winX = archR * 0.48;
            const winY = archR * 0.40;
            const winS = Math.min(0.56, winScale * 0.52);

            return (
              <SingleWindow
                key="quonset-win-3"
                position={[-winX, winY, -L / 2 - 0.02]}
                rotation={[0, Math.PI, 0]}
                scale={winS}
                viewMode={viewMode}
                glassColor={winThermalColor}
              />
            );
          })()}
          {windowCount >= 4 && (() => {
            const archR = W / 2;
            const winX = archR * 0.48;
            const winY = archR * 0.40;
            const winS = Math.min(0.56, winScale * 0.52);

            return (
              <SingleWindow
                key="quonset-win-4"
                position={[winX, winY, -L / 2 - 0.02]}
                rotation={[0, Math.PI, 0]}
                scale={winS}
                viewMode={viewMode}
                glassColor={winThermalColor}
              />
            );
          })()}
        </group>
      )}

      {/* ─── Mode 3: Animated Heat Flow Particles & Pathways ─── */}
      {isXRay && (
        <HeatFlowParticles
          shape={normShape}
          dimensions={dimensions}
          componentLosses={componentLosses}
          flowDirection={flowDirection}
        />
      )}
    </group>
  );
}

/**
 * 3D Sun Sphere & Solar Exposure Vector Ray
 */
function SolarVectorIndicator({ orientation = 180, hour = 12, solarRad = 500 }) {
  const hourAngle = ((hour - 12) * 15 * Math.PI) / 180;
  const isDaytime = hour >= 6 && hour <= 18;

  const sunDist = 9.0;
  const sunX = Math.sin(hourAngle) * sunDist;
  const sunY = isDaytime ? Math.max(1.5, Math.cos(hourAngle) * 7.5 + 1.0) : -4.0;
  const sunZ = Math.cos(hourAngle) * 5.0 + 3.0;

  if (!isDaytime) return null;

  const radText = solarRad !== undefined && solarRad !== null && !isNaN(solarRad)
    ? `${Math.round(solarRad)} W/m²`
    : 'Active';

  return (
    <group position={[sunX, sunY, sunZ]}>
      <mesh>
        <sphereGeometry args={[0.45, 20, 20]} />
        <meshBasicMaterial color="#fbbf24" />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.7, 16, 16]} />
        <meshBasicMaterial color="#f59e0b" transparent opacity={0.35} />
      </mesh>

      <Html center position={[0, 0.9, 0]}>
        <div className="bg-amber-100/95 text-amber-900 border border-amber-400 px-2 py-0.5 text-[9px] font-mono font-bold rounded shadow-lg whitespace-nowrap flex items-center gap-1">
          <span>☀️ Sun:</span>
          <span>{radText}</span>
        </div>
      </Html>

      <mesh position={[-sunX * 0.4, -sunY * 0.4, -sunZ * 0.4]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.015, 0.03, sunDist * 0.7, 8]} />
        <meshBasicMaterial color="#fef08a" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

/**
 * Animated Falling Snow Particle System
 */
function FallingSnow({ count = 220, bounds = 18 }) {
  const pointsRef = useRef();

  const [positions, velocities] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 0] = (Math.random() - 0.5) * bounds * 2;
      pos[i * 3 + 1] = Math.random() * 12;
      pos[i * 3 + 2] = (Math.random() - 0.5) * bounds * 2;

      vel[i * 3 + 0] = (Math.random() - 0.5) * 0.3;
      vel[i * 3 + 1] = 0.8 + Math.random() * 1.0;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
    }
    return [pos, vel];
  }, [count, bounds]);

  useFrame((state, delta) => {
    if (!pointsRef.current) return;
    const geom = pointsRef.current.geometry;
    const posAttr = geom.attributes.position;
    if (!posAttr) return;
    const array = posAttr.array;

    for (let i = 0; i < count; i++) {
      array[i * 3 + 1] -= velocities[i * 3 + 1] * delta;
      array[i * 3 + 0] += Math.sin(state.clock.elapsedTime * 0.7 + i) * 0.005;
      array[i * 3 + 2] += Math.cos(state.clock.elapsedTime * 0.5 + i) * 0.005;

      if (array[i * 3 + 1] < 0) {
        array[i * 3 + 1] = 11 + Math.random() * 2.5;
        array[i * 3 + 0] = (Math.random() - 0.5) * bounds * 2;
        array[i * 3 + 2] = (Math.random() - 0.5) * bounds * 2;
      }
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#ffffff"
        size={0.15}
        transparent
        opacity={0.82}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

/**
 * Animated Falling Rain Particle System
 */
function RainFall({ count = 360, bounds = 20 }) {
  const pointsRef = useRef();

  const [positions, velocities] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 0] = (Math.random() - 0.5) * bounds * 2;
      pos[i * 3 + 1] = Math.random() * 14;
      pos[i * 3 + 2] = (Math.random() - 0.5) * bounds * 2;
      vel[i] = 9.5 + Math.random() * 6.5;
    }
    return [pos, vel];
  }, [count, bounds]);

  useFrame((state, delta) => {
    if (!pointsRef.current) return;
    const geom = pointsRef.current.geometry;
    const posAttr = geom.attributes.position;
    if (!posAttr) return;
    const arr = posAttr.array;

    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] -= velocities[i] * delta;
      arr[i * 3 + 0] -= 1.2 * delta; // rain angle slant
      if (arr[i * 3 + 1] < 0) {
        arr[i * 3 + 1] = 13 + Math.random() * 2;
        arr[i * 3 + 0] = (Math.random() - 0.5) * bounds * 2;
        arr[i * 3 + 2] = (Math.random() - 0.5) * bounds * 2;
      }
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#93c5fd"
        size={0.11}
        transparent
        opacity={0.65}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

/**
 * Distant Himalayan Alpine Mountain Range (Snowy Mode)
 */
function HimalayanMountains({ radius = 26, count = 26 }) {
  const peaks = useMemo(() => {
    const items = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const dist = radius + Math.sin(i * 3.7) * 2.2;
      const x = Math.sin(angle) * dist;
      const z = Math.cos(angle) * dist;
      const height = 4.2 + Math.sin(i * 2.1 + 1.2) * 2.0 + (i % 3 === 0 ? 2.4 : 0);
      const width = 3.6 + Math.cos(i * 1.5) * 1.1;
      items.push({ x, z, height, width, angle });
    }
    return items;
  }, [radius, count]);

  return (
    <group position={[0, -0.15, 0]}>
      {peaks.map((p, idx) => (
        <group key={`peak-${idx}`} position={[p.x, p.height / 2, p.z]}>
          <mesh rotation={[0, p.angle, 0]} castShadow={false}>
            <coneGeometry args={[p.width, p.height, 5]} />
            <meshStandardMaterial color="#7b8e9e" roughness={0.96} />
          </mesh>
          <mesh position={[0, p.height * 0.28, 0]} rotation={[0, p.angle, 0]} castShadow={false}>
            <coneGeometry args={[p.width * 0.44, p.height * 0.44, 5]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.92} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/**
 * Distant Desert Sandstone Plateaus (Sunny Mode)
 */
function DesertPlateaus({ radius = 26, count = 18 }) {
  const plateaus = useMemo(() => {
    const items = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const dist = radius + Math.sin(i * 2.9) * 2.2;
      const x = Math.sin(angle) * dist;
      const z = Math.cos(angle) * dist;
      const width = 4.0 + Math.sin(i * 1.7) * 1.2;
      const height = 2.4 + Math.cos(i * 2.3) * 1.1;
      items.push({ x, z, width, height });
    }
    return items;
  }, [radius, count]);

  return (
    <group position={[0, 0, 0]}>
      {plateaus.map((p, idx) => (
        <mesh key={`plateau-${idx}`} position={[p.x, p.height / 2, p.z]}>
          <cylinderGeometry args={[p.width * 0.72, p.width, p.height, 7]} />
          <meshStandardMaterial color="#b08968" roughness={0.94} />
        </mesh>
      ))}
    </group>
  );
}

/**
 * Low-poly Forest Conifers (Forest Mode)
 */
function ForestPineTrees({ radius = 22, count = 22 }) {
  const trees = useMemo(() => {
    const items = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const dist = radius + Math.sin(i * 3.1) * 2.2;
      const x = Math.sin(angle) * dist;
      const z = Math.cos(angle) * dist;
      const scale = 0.85 + Math.sin(i * 2.5) * 0.3;
      items.push({ x, z, scale });
    }
    return items;
  }, [radius, count]);

  return (
    <group position={[0, 0, 0]}>
      {trees.map((t, idx) => (
        <group key={`tree-${idx}`} position={[t.x, 0, t.z]} scale={t.scale}>
          <mesh position={[0, 0.4, 0]}>
            <cylinderGeometry args={[0.12, 0.16, 0.8, 6]} />
            <meshStandardMaterial color="#4a2c11" roughness={0.9} />
          </mesh>
          <mesh position={[0, 1.1, 0]}>
            <coneGeometry args={[1.05, 1.2, 7]} />
            <meshStandardMaterial color="#1b4332" roughness={0.85} />
          </mesh>
          <mesh position={[0, 1.8, 0]}>
            <coneGeometry args={[0.8, 1.0, 7]} />
            <meshStandardMaterial color="#2d6a4f" roughness={0.85} />
          </mesh>
          <mesh position={[0, 2.4, 0]}>
            <coneGeometry args={[0.55, 0.85, 7]} />
            <meshStandardMaterial color="#40916c" roughness={0.85} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/**
 * Distant Coastal Ocean Ring (Coastal Mode)
 */
function CoastalOcean({ radius = 28 }) {
  return (
    <group position={[0, -0.04, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[18, radius + 10, 48]} />
        <meshStandardMaterial color="#0284c7" roughness={0.12} metalness={0.45} />
      </mesh>
    </group>
  );
}

/**
 * Camera Controller
 */
function CameraController({ bounds = 6, height = 3, shape = 'rectangle', controlsRef }) {
  const { camera } = useThree();

  useEffect(() => {
    const targetY = Math.max(1.0, height * 0.45);
    const camDist = Math.max(11.0, bounds * 1.9);

    const azim = 0.54;
    const elev = 0.38;

    const posX = camDist * Math.sin(azim) * Math.cos(elev);
    const posY = targetY + camDist * Math.sin(elev);
    const posZ = camDist * Math.cos(azim) * Math.cos(elev);

    camera.position.set(posX, posY, posZ);
    camera.lookAt(0, targetY, 0);

    if (controlsRef?.current) {
      controlsRef.current.target.set(0, targetY, 0);
      controlsRef.current.update();
      controlsRef.current.saveState();
    }
  }, [bounds, height, shape, camera, controlsRef]);

  return null;
}

/**
 * Universal Shelter 3D Viewer & Climate Time Machine Viewport
 */
export default function Shelter3DViewer({
  shape = 'rectangle',
  geometry = {},
  dimensions = {},
  design = {},
  openings = {},
  orientation = null,
  viewMode = 'normal',
  componentLosses = {},
  flowDirection = 'OUTWARD',
  timeSeriesPoint = null,
  currentHour = 12,
  thermalHourData = null,
  height = 420,
  showCompass = true,
  // Climate input props:
  climate = null,
  environment = null, // 'snowy' | 'sunny' | 'coastal' | 'rainy' | 'forest'
  onEnvironmentChange = null
}) {
  const controlsRef = useRef();
  const [envMenuOpen, setEnvMenuOpen] = useState(false);

  const activeDimensions = { ...geometry, ...dimensions };
  const activeShape = shape || design?.shape || 'rectangle';
  const activeOrientation = orientation !== null ? Number(orientation) : Number(design?.orientation || openings?.openingOrientation || 180);

  const activeHourPoint = timeSeriesPoint || thermalHourData || null;
  const hour = activeHourPoint?.hour !== undefined
    ? Number(activeHourPoint.hour)
    : (currentHour !== undefined ? Number(currentHour) : 12);

  const isDaytime = hour >= 6 && hour <= 18;
  const solarRad = activeHourPoint?.solarRadiation !== undefined ? activeHourPoint.solarRadiation : (activeHourPoint?.solarGain || 400);

  const shelterHeight = Number(
    activeDimensions.height ||
    activeDimensions.ridgeHeight ||
    activeDimensions.domeHeight ||
    (activeShape === 'quonset' ? (Number(activeDimensions.width || 4.5) / 2) : 3)
  );

  const maxDim = Math.max(
    Number(activeDimensions.length || 6),
    Number(activeDimensions.width || 4),
    Number(activeDimensions.radius ? activeDimensions.radius * 2 : 4),
    shelterHeight
  );

  // Auto-detect climate region based on temperature and location
  const autoDetectedEnv = useMemo(() => {
    return detectClimateRegion({
      climate: climate || design?.climate,
      temperature: activeHourPoint?.ambientTemperature,
      location: climate?.location || climate?.name || design?.location
    });
  }, [climate, design, activeHourPoint]);

  // Local environment selection overrides auto-detection if changed by user
  const [selectedEnv, setSelectedEnv] = useState(environment || null);

  useEffect(() => {
    if (environment) setSelectedEnv(environment);
  }, [environment]);

  const activeEnvId = selectedEnv || autoDetectedEnv;
  const activeEnv = CLIMATE_ENVIRONMENTS[activeEnvId] || CLIMATE_ENVIRONMENTS.snowy;
  const isSnowy = activeEnvId === 'snowy';

  const handleSelectEnv = (id) => {
    setSelectedEnv(id);
    setEnvMenuOpen(false);
    if (onEnvironmentChange) onEnvironmentChange(id);
  };

  const handleResetCamera = () => {
    if (controlsRef.current) {
      const targetY = Math.max(1.0, shelterHeight * 0.45);
      const camDist = Math.max(11.0, maxDim * 1.9);
      const azim = 0.54;
      const elev = 0.38;

      const posX = camDist * Math.sin(azim) * Math.cos(elev);
      const posY = targetY + camDist * Math.sin(elev);
      const posZ = camDist * Math.cos(azim) * Math.cos(elev);

      controlsRef.current.object.position.set(posX, posY, posZ);
      controlsRef.current.target.set(0, targetY, 0);
      controlsRef.current.update();
    }
  };

  const isSimMode = viewMode === 'heatflow' || viewMode === 'thermal';

  const skyColor = useMemo(() => {
    if (viewMode === 'heatflow') return '#090d16';
    if (viewMode === 'thermal') return '#0f172a';
    return isDaytime ? activeEnv.skyColorDay : activeEnv.skyColorNight;
  }, [viewMode, isDaytime, activeEnv]);

  return (
    <div
      style={{ height: `${height}px` }}
      className="relative w-full bg-slate-950 rounded-2xl overflow-hidden border border-slate-700/80 shadow-inner"
    >
      {/* Floating Climate Region Environment Dropdown Selector */}
      <div className="absolute top-3 left-3 z-20">
        <div className="relative">
          <button
            onClick={() => setEnvMenuOpen(!envMenuOpen)}
            className="px-2.5 py-1.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/90 rounded-lg text-xs font-semibold shadow-md flex items-center gap-1.5 backdrop-blur-sm transition"
          >
            <span className="text-sm">{activeEnv.icon}</span>
            <span className="text-white font-bold">{activeEnv.label}</span>
            <span className="text-[10px] text-slate-400">▾</span>
          </button>

          {envMenuOpen && (
            <div className="absolute top-full left-0 mt-1 w-52 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-xl shadow-2xl p-1 z-30 space-y-0.5 animate-in fade-in zoom-in-95">
              <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                Select Climate Region
              </div>
              {Object.values(CLIMATE_ENVIRONMENTS).map((env) => {
                const isActive = env.id === activeEnvId;
                return (
                  <button
                    key={env.id}
                    onClick={() => handleSelectEnv(env.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 text-left rounded-lg text-xs transition ${
                      isActive
                        ? 'bg-sky-600/30 text-sky-200 border border-sky-500/50 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span>{env.icon}</span>
                      <span>{env.label}</span>
                    </span>
                    {isActive && <span className="text-sky-400 text-[10px]">✓</span>}
                  </button>
                );
              })}
              {autoDetectedEnv && (
                <div className="pt-1 px-2 pb-0.5 border-t border-slate-800 text-[9px] text-slate-400 flex items-center justify-between">
                  <span>Detected Region:</span>
                  <span className="text-sky-300 font-semibold">{CLIMATE_ENVIRONMENTS[autoDetectedEnv]?.icon} {CLIMATE_ENVIRONMENTS[autoDetectedEnv]?.label}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Floating Reset Camera Button */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
        <button
          onClick={handleResetCamera}
          className="px-2.5 py-1.5 bg-slate-900/85 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 rounded-lg text-xs shadow font-medium transition flex items-center gap-1"
        >
          <span>⟲</span>
          <span>Default View</span>
        </button>
      </div>

      <Canvas
        shadows
        gl={{ antialias: true, preserveDrawingBuffer: false }}
        camera={{ position: [5.3, 5.0, 9.1], fov: 38 }}
      >
        <color attach="background" args={[skyColor]} />
        <fog
          attach="fog"
          args={[
            skyColor,
            isSimMode ? 26 : activeEnv.fogNear,
            isSimMode ? 60 : activeEnv.fogFar
          ]}
        />

        {/* Dynamic Lighting based on Active Environment */}
        {isDaytime ? (
          <>
            <ambientLight
              intensity={isSimMode ? 0.3 : 0.52}
              color={activeEnv.ambientColor}
            />
            <hemisphereLight
              skyColor={activeEnv.skyColorDay}
              groundColor={activeEnv.groundColor}
              intensity={0.45}
            />
            <directionalLight
              position={[10, 16, 10]}
              intensity={isSimMode ? 0.8 : activeEnv.sunIntensity}
              color={activeEnv.sunColor}
              castShadow={viewMode === 'normal'}
              shadow-mapSize-width={2048}
              shadow-mapSize-height={2048}
              shadow-camera-far={55}
              shadow-bias={-0.0005}
            />
            <directionalLight position={[-8, 7, -8]} intensity={0.35} color={activeEnv.skyColorDay} />
          </>
        ) : (
          <>
            <ambientLight intensity={0.25} color="#1e293b" />
            <hemisphereLight skyColor="#1e293b" groundColor="#090d16" intensity={0.2} />
            <directionalLight position={[6, 12, 6]} intensity={0.38} color="#94a3b8" />
          </>
        )}

        <CameraController bounds={maxDim} height={shelterHeight} shape={activeShape} controlsRef={controlsRef} />

        {/* ── Environment Background Scenery (Normal mode) ── */}
        {!isSimMode && (
          <>
            {/* 1. Snowy / Alpine */}
            {activeEnvId === 'snowy' && (
              <>
                <HimalayanMountains radius={26} count={26} />
                <FallingSnow count={220} bounds={18} />
              </>
            )}

            {/* 2. Sunny / Desert */}
            {activeEnvId === 'sunny' && (
              <DesertPlateaus radius={26} count={18} />
            )}

            {/* 3. Coastal / Ocean */}
            {activeEnvId === 'coastal' && (
              <CoastalOcean radius={28} />
            )}

            {/* 4. Rainy / Monsoon */}
            {activeEnvId === 'rainy' && (
              <RainFall count={360} bounds={20} />
            )}

            {/* 5. Forest / Alpine Valley */}
            {activeEnvId === 'forest' && (
              <ForestPineTrees radius={22} count={22} />
            )}
          </>
        )}

        {/* Ground Terrain Mesh */}
        <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[28, 64]} />
          <meshStandardMaterial
            color={isSimMode ? '#0f172a' : (isDaytime ? activeEnv.groundColor : '#1e293b')}
            roughness={activeEnvId === 'rainy' ? 0.45 : 0.94}
            metalness={activeEnvId === 'rainy' ? 0.2 : 0.03}
          />
        </mesh>

        {/* Shelter Mesh Root */}
        <group rotation={[0, ((180 - activeOrientation) * Math.PI) / 180, 0]}>
          <ShelterMesh
            shape={activeShape}
            dimensions={activeDimensions}
            design={{ ...design, orientation: activeOrientation }}
            openings={openings}
            viewMode={viewMode}
            componentLosses={componentLosses}
            flowDirection={flowDirection}
            thermalHourData={activeHourPoint}
            isSnowy={isSnowy}
            envId={activeEnvId}
          />
        </group>

        {/* 3D Compass on Ground */}
        {showCompass && (
          <CompassIndicator radius={maxDim * 0.9} orientation={activeOrientation} />
        )}

        {/* Solar Vector Indicator */}
        {viewMode === 'normal' && (
          <SolarVectorIndicator orientation={activeOrientation} hour={hour} solarRad={solarRad} />
        )}

        {/* Ground Grid - Styled for Cold Climate or Environmental Coordinates */}
        <Grid
          infiniteGrid
          cellSize={1}
          cellThickness={0.5}
          cellColor={isSimMode ? '#38bdf8' : (isDaytime ? activeEnv.gridCellColor : '#334155')}
          sectionSize={5}
          sectionThickness={1.0}
          sectionColor={isSimMode ? '#0284c7' : (isDaytime ? activeEnv.gridSectionColor : '#475569')}
          fadeDistance={28}
          fadeStrength={1.6}
        />

        <OrbitControls
          ref={controlsRef}
          makeDefault
          enableDamping
          dampingFactor={0.08}
          minDistance={2.5}
          maxDistance={38}
        />
      </Canvas>

      <div className="absolute bottom-2.5 left-3 z-10 text-[10px] text-slate-300 bg-slate-900/80 backdrop-blur px-2.5 py-1 rounded-lg border border-slate-700 shadow flex items-center gap-2">
        <span>🖱️ Left-Click: Rotate</span>
        <span>•</span>
        <span>Right-Click: Pan</span>
        <span>•</span>
        <span>Scroll: Zoom</span>
      </div>
    </div>
  );
}
