import React, { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Html } from '@react-three/drei';
import * as THREE from 'three';

function getMaterialColor(mat, defaultColor) {
  if (!mat || !mat.name) return defaultColor;
  const name = mat.name.toLowerCase();
  if (name.includes('earth') || name.includes('mud')) return '#b45309';
  if (name.includes('stone') || name.includes('masonry')) return '#78716c';
  if (name.includes('straw') || name.includes('clay')) return '#d97706';
  if (name.includes('metal') || name.includes('galvanized')) return '#334155';
  if (name.includes('puf') || name.includes('eps') || name.includes('insulation') || name.includes('sandwich')) return '#0284c7';
  if (name.includes('wood') || name.includes('timber') || name.includes('thatch')) return '#78350f';
  if (name.includes('glass') || name.includes('glazing')) return '#38bdf8';
  if (name.includes('aac') || name.includes('aerated')) return '#e2e8f0';
  if (name.includes('brick') || name.includes('fired')) return '#c2410c';
  if (name.includes('icf') || name.includes('concrete form')) return '#94a3b8';
  if (name.includes('rock wool') || name.includes('mineral')) return '#fbbf24';
  return defaultColor;
}

/**
 * Distribute windows across 4 walls: front, back, left, right (round-robin)
 * Strictly offset from doors to eliminate overlaps!
 */
function distributeWindows(windowCount, length, width, height, winWidth, winHeight, doorCount = 1) {
  const windows = [];
  if (windowCount <= 0) return windows;

  const walls = [
    { name: 'front', axis: 'z', sign: 1, span: width, depth: length },
    { name: 'left',  axis: 'x', sign: -1, span: length, depth: width },
    { name: 'right', axis: 'x', sign: 1, span: length, depth: width },
    { name: 'back',  axis: 'z', sign: -1, span: width, depth: length }
  ];

  // Assign windows round-robin across walls
  const wallAssignments = [0, 0, 0, 0];
  for (let i = 0; i < windowCount; i++) {
    const wallIdx = i % walls.length;
    wallAssignments[wallIdx]++;
  }

  wallAssignments.forEach((count, wallIdx) => {
    if (!count) return;
    const wall = walls[wallIdx];
    const y = height / 2 + 0.2;

    if (wall.name === 'front' || wall.name === 'back') {
      // If door exists on this facade, place windows strictly on left side (x <= -0.2)
      const hasDoor = (wall.name === 'front' && doorCount >= 1) || (wall.name === 'back' && doorCount >= 2);
      const minX = -wall.span / 2 + 0.5;
      const maxX = hasDoor ? -0.3 : wall.span / 2 - 0.5;
      const step = count > 1 ? Math.max(0.6, (maxX - minX) / (count - 1)) : 0;
      const startX = count === 1 ? (minX + maxX) / 2 : minX;

      for (let i = 0; i < count; i++) {
        const posX = Math.min(maxX, startX + i * step);
        windows.push({
          x: posX,
          y,
          z: (wall.depth / 2 + 0.04) * wall.sign,
          rotationY: wall.name === 'back' ? Math.PI : 0,
          w: Math.min(winWidth, Math.abs(maxX - minX) / count),
          h: winHeight
        });
      }
    } else {
      // Left / Right side walls
      const minZ = -wall.span / 2 + 0.5;
      const maxZ = wall.span / 2 - 0.5;
      const step = count > 1 ? (maxZ - minZ) / (count - 1) : 0;
      const startZ = count === 1 ? 0 : minZ;

      for (let i = 0; i < count; i++) {
        const posZ = startZ + i * step;
        windows.push({
          x: (wall.depth / 2 + 0.04) * wall.sign,
          y,
          z: posZ,
          rotationY: wall.name === 'right' ? Math.PI / 2 : -Math.PI / 2,
          w: Math.min(winWidth, wall.span * 0.4),
          h: winHeight
        });
      }
    }
  });

  return windows;
}

/**
 * Distribute doors: door 0 on front right, door 1 on back right, etc.
 */
function distributeDoors(doorCount, length, width, height, doorWidth, doorHeight) {
  const doors = [];
  if (doorCount <= 0) return doors;

  const positions = [
    { x: Math.min(width * 0.25, width / 2 - 0.7), z: length / 2 + 0.05, rotY: 0 },            // front right
    { x: Math.min(width * 0.25, width / 2 - 0.7), z: -(length / 2 + 0.05), rotY: Math.PI },     // back right
    { x: -(width / 2 + 0.05), z: 0, rotY: -Math.PI / 2 },                                   // left center
    { x: width / 2 + 0.05, z: 0, rotY: Math.PI / 2 }                                        // right center
  ];

  for (let i = 0; i < Math.min(doorCount, positions.length); i++) {
    doors.push({
      ...positions[i],
      y: doorHeight / 2,
      w: doorWidth,
      h: doorHeight
    });
  }
  return doors;
}

/* =================== SHAPE RENDERERS =================== */

function RectangularShape({ width, height, length, wallColor, roofColor, roofAngle }) {
  const roofHeight = (width / 2) * Math.tan((roofAngle * Math.PI) / 180);
  return (
    <>
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, height, length]} />
        <meshStandardMaterial color={wallColor} roughness={0.6} metalness={0.1} />
      </mesh>
      <mesh position={[0, height + roofHeight / 2, 0]} castShadow receiveShadow>
        <coneGeometry args={[Math.sqrt(width * width + length * length) / 2, roofHeight, 4]} />
        <meshStandardMaterial color={roofColor} roughness={0.4} />
      </mesh>
    </>
  );
}

function DomeShape({ width, height, length, wallColor, roofColor }) {
  const floorArea = width * length;
  const radius = Math.sqrt(floorArea / Math.PI);
  const domeHeight = radius * 0.8;
  return (
    <>
      {/* Base cylindrical wall */}
      <mesh position={[0, height * 0.3, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[radius, radius, height * 0.6, 32]} />
        <meshStandardMaterial color={wallColor} roughness={0.6} metalness={0.1} />
      </mesh>
      {/* Dome top (hemisphere) */}
      <mesh position={[0, height * 0.6, 0]} castShadow receiveShadow>
        <sphereGeometry args={[radius, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={roofColor} roughness={0.4} side={THREE.DoubleSide} />
      </mesh>
    </>
  );
}

function OctagonalShape({ width, height, length, wallColor, roofColor, roofAngle }) {
  const floorArea = width * length;
  const radius = Math.sqrt(floorArea / Math.PI) * 1.05;
  const roofHeight = radius * 0.35;
  return (
    <>
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[radius, radius, height, 8]} />
        <meshStandardMaterial color={wallColor} roughness={0.6} metalness={0.1} />
      </mesh>
      <mesh position={[0, height + roofHeight / 2, 0]} castShadow receiveShadow>
        <coneGeometry args={[radius * 1.1, roofHeight, 8]} />
        <meshStandardMaterial color={roofColor} roughness={0.4} />
      </mesh>
    </>
  );
}

function LShapeModel({ width, height, length, wallColor, roofColor, roofAngle }) {
  const mainL = length;
  const mainW = width * 0.6;
  const wingL = length * 0.5;
  const wingW = width * 0.4;
  const roofH = 0.15;

  return (
    <>
      {/* Main block */}
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[mainW, height, mainL]} />
        <meshStandardMaterial color={wallColor} roughness={0.6} metalness={0.1} />
      </mesh>
      {/* Flat roof - main */}
      <mesh position={[0, height + roofH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[mainW + 0.1, roofH, mainL + 0.1]} />
        <meshStandardMaterial color={roofColor} roughness={0.4} />
      </mesh>
      {/* Wing block */}
      <mesh position={[mainW / 2 + wingW / 2, height / 2, -mainL / 2 + wingL / 2]} castShadow receiveShadow>
        <boxGeometry args={[wingW, height, wingL]} />
        <meshStandardMaterial color={wallColor} roughness={0.6} metalness={0.1} />
      </mesh>
      {/* Flat roof - wing */}
      <mesh position={[mainW / 2 + wingW / 2, height + roofH / 2, -mainL / 2 + wingL / 2]} castShadow receiveShadow>
        <boxGeometry args={[wingW + 0.1, roofH, wingL + 0.1]} />
        <meshStandardMaterial color={roofColor} roughness={0.4} />
      </mesh>
    </>
  );
}

/* =================== MAIN BUILDING MODEL =================== */

function BuildingModel({ geometry, design, openings, materials }) {
  const { length = 6.0, width = 4.0, height = 2.8, wallThickness = 0.3 } = geometry || {};
  const { orientation = 180, roofAngle = 25, shape = 'Rectangular' } = design || {};
  const { windowCount = 2, windowArea = 2.5, doorCount = 1, doorArea = 1.8 } = openings || {};

  const wallColor = getMaterialColor(materials?.wallMaterial, '#cbd5e1');
  const roofColor = getMaterialColor(materials?.roofMaterial, '#0284c7');
  const windowColor = getMaterialColor(materials?.windowMaterial, '#38bdf8');
  const doorColor = getMaterialColor(materials?.doorMaterial, '#78350f');

  // Compute individual window geometry
  const validWinCount = Math.max(0, parseInt(windowCount) || 0);
  const totalWinArea = Math.max(0, parseFloat(windowArea) || 0);
  const singleWinArea = validWinCount > 0 ? totalWinArea / validWinCount : 0;
  const winHeight = singleWinArea > 0 ? Math.min(height * 0.5, Math.max(0.6, Math.sqrt(singleWinArea * 0.8))) : 0;
  const winWidth = singleWinArea > 0 ? Math.min(width * 0.6, singleWinArea / winHeight) : 0;

  // Compute individual door geometry
  const validDoorCount = Math.max(0, parseInt(doorCount) || 0);
  const totalDoorArea = Math.max(0, parseFloat(doorArea) || 0);
  const singleDoorArea = validDoorCount > 0 ? totalDoorArea / validDoorCount : 0;
  const dWidth = singleDoorArea > 0 ? 0.9 : 0;
  const dHeight = singleDoorArea > 0 ? Math.min(height * 0.8, Math.max(1.8, singleDoorArea / dWidth)) : 0;

  // Distribute across walls
  const windowElements = distributeWindows(validWinCount, length, width, height, winWidth, winHeight, validDoorCount);
  const doorElements = distributeDoors(validDoorCount, length, width, height, dWidth, dHeight);

  // Determine shape-specific top height for label positioning
  const roofHeight = (width / 2) * Math.tan((roofAngle * Math.PI) / 180);
  const shapeLower = (shape || 'Rectangular').toLowerCase();
  let labelY = height + roofHeight + 0.6;
  if (shapeLower === 'dome') {
    const r = Math.sqrt(width * length / Math.PI);
    labelY = height * 0.6 + r + 0.6;
  } else if (shapeLower === 'l-shape') {
    labelY = height + 0.8;
  }

  return (
    <group rotation={[0, (orientation * Math.PI) / 180, 0]}>
      {/* Render shape-specific building envelope */}
      {shapeLower === 'dome' && (
        <DomeShape width={width} height={height} length={length} wallColor={wallColor} roofColor={roofColor} />
      )}
      {shapeLower === 'octagonal' && (
        <OctagonalShape width={width} height={height} length={length} wallColor={wallColor} roofColor={roofColor} roofAngle={roofAngle} />
      )}
      {shapeLower === 'l-shape' && (
        <LShapeModel width={width} height={height} length={length} wallColor={wallColor} roofColor={roofColor} roofAngle={roofAngle} />
      )}
      {(shapeLower === 'rectangular' || (!['dome', 'octagonal', 'l-shape'].includes(shapeLower))) && (
        <RectangularShape width={width} height={height} length={length} wallColor={wallColor} roofColor={roofColor} roofAngle={roofAngle} />
      )}

      {/* Render Windows distributed across multiple walls */}
      {windowElements.map((win, i) => (
        <mesh key={`win_${i}`} position={[win.x, win.y, win.z]} rotation={[0, win.rotationY, 0]}>
          <boxGeometry args={[win.w, win.h, 0.08]} />
          <meshStandardMaterial color={windowColor} transparent opacity={0.75} roughness={0.1} />
        </mesh>
      ))}

      {/* Render Doors distributed across walls */}
      {doorElements.map((door, i) => (
        <mesh key={`door_${i}`} position={[door.x, door.y, door.z]} rotation={[0, door.rotY, 0]}>
          <boxGeometry args={[door.w, door.h, 0.10]} />
          <meshStandardMaterial color={doorColor} roughness={0.8} />
        </mesh>
      ))}

      {/* Dimension & Shape Badge */}
      <Html position={[0, labelY, 0]} center>
        <div className="bg-white/95 border border-slate-300 text-slate-800 text-[11px] px-3 py-1.5 rounded-lg shadow-md font-mono space-y-0.5 text-center">
          <div className="font-bold text-sky-700">{length}m (L) × {width}m (W) × {height}m (H)</div>
          <div className="text-[10px] text-slate-500">
            Shape: {shape} | Windows: {validWinCount} ({totalWinArea}m²) | Doors: {validDoorCount} ({totalDoorArea}m²)
          </div>
        </div>
      </Html>
    </group>
  );
}

function SolarVectorArrow({ orientation = 180 }) {
  const rad = (orientation * Math.PI) / 180;
  const dirX = Math.sin(rad) * 6;
  const dirZ = Math.cos(rad) * 6;

  return (
    <group position={[dirX, 4, dirZ]}>
      <mesh castShadow>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshBasicMaterial color="#f59e0b" />
      </mesh>
      <Html center>
        <div className="bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 text-[10px] font-bold rounded shadow">
          ☀️ Sun Radiation Vector ({orientation}°)
        </div>
      </Html>
    </group>
  );
}

export default function Shelter3DViewer({ geometry, design, openings, materials }) {
  const controlsRef = useRef();

  const handleResetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  return (
    <div className="relative w-full h-[400px] bg-slate-100 rounded-xl overflow-hidden border border-slate-200 shadow-inner">
      {/* Floating Camera Reset Button */}
      <div className="absolute top-3 right-3 z-10 flex gap-2">
        <button
          onClick={handleResetCamera}
          className="px-3 py-1 bg-white/90 hover:bg-white text-slate-700 border border-slate-300 rounded text-xs shadow-sm font-medium transition"
        >
          Reset Camera
        </button>
      </div>

      <Canvas camera={{ position: [8, 6, 10], fov: 45 }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[10, 15, 10]} intensity={1.2} castShadow />

        <BuildingModel geometry={geometry} design={design} openings={openings} materials={materials} />
        <SolarVectorArrow orientation={design?.orientation || 180} />

        <Grid
          infiniteGrid
          cellSize={1}
          cellThickness={1}
          cellColor="#cbd5e1"
          sectionSize={5}
          sectionThickness={1.5}
          sectionColor="#94a3b8"
          fadeDistance={30}
        />

        <OrbitControls ref={controlsRef} makeDefault minDistance={3} maxDistance={25} />
      </Canvas>

      <div className="absolute bottom-2 left-3 z-10 text-[11px] text-slate-500 bg-white/80 px-2 py-1 rounded border border-slate-200">
        🖱️ Left-Click: Rotate | Right-Click: Pan | Scroll: Zoom
      </div>
    </div>
  );
}
