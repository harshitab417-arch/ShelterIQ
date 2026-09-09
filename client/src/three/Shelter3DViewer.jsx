import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, Html } from '@react-three/drei';
import * as THREE from 'three';
import HeatFlowParticles from './HeatFlowParticles';
import CompassIndicator from './CompassIndicator';
import { getThermalColor } from '../components/ClimateTimeMachine/timeMachineAdapter';

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

  return geom;
}

/**
 * Mathematically constructs a true Semi-Cylindrical Arch for the Quonset shelter.
 */
function createQuonsetShellGeometry(radius, length, radialSegments = 48) {
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

  return geom;
}

/**
 * Creates Flush Semicircular End-Wall for Quonset
 */
function createSemicircleGeometry(radius, segments = 48) {
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

    positions.push(0, 0, 0, x1, y1, 0, x2, y2, 0);
    normals.push(0, 0, 1, 0, 0, 1, 0, 0, 1);
    uvs.push(0.5, 0, (x1 / radius + 1) * 0.5, y1 / radius, (x2 / radius + 1) * 0.5, y2 / radius);
  }

  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));

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
      {/* Frame */}
      <mesh position={[0, 0, 0.025]}>
        <boxGeometry args={[w, h, 0.05]} />
        <meshStandardMaterial
          color={isThermal ? '#0f172a' : (isXRay ? '#1e293b' : '#f3f3f3')}
          transparent={isXRay}
          opacity={isXRay ? 0.4 : 1.0}
          roughness={0.55}
        />
      </mesh>
      {/* Glass */}
      <mesh position={[0, 0, 0.062]}>
        <boxGeometry args={[gw, gh, 0.04]} />
        <meshStandardMaterial
          color={isThermal ? glassColor : (isXRay ? '#38bdf8' : '#a8d8ea')}
          transparent
          opacity={isXRay ? 0.45 : (isThermal ? 0.9 : 0.72)}
          roughness={0.06}
          metalness={isXRay ? 0.4 : 0.1}
        />
      </mesh>
      {mullions && !isXRay && (
        <>
          <mesh position={[0, 0, 0.075]}>
            <boxGeometry args={[gw, 0.04 * scale, 0.025]} />
            <meshStandardMaterial color={isThermal ? '#334155' : '#e0e0e0'} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0, 0.075]}>
            <boxGeometry args={[0.04 * scale, gh, 0.025]} />
            <meshStandardMaterial color={isThermal ? '#334155' : '#e0e0e0'} roughness={0.4} />
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
      {/* Door frame */}
      <mesh position={[0, 0, 0.025]} castShadow>
        <boxGeometry args={[frameW, frameH, 0.05]} />
        <meshStandardMaterial
          color={isThermal ? '#0f172a' : (isXRay ? '#1e293b' : '#f3f3f3')}
          transparent={isXRay}
          opacity={isXRay ? 0.4 : 1.0}
          roughness={0.55}
        />
      </mesh>
      {/* Door panel */}
      <mesh position={[0, 0, 0.065]}>
        <boxGeometry args={[panelW, panelH, 0.04]} />
        <meshStandardMaterial
          color={isThermal ? doorColor : (isXRay ? '#78350f' : '#4a2910')}
          transparent={isXRay}
          opacity={isXRay ? 0.45 : 1.0}
          roughness={0.88}
        />
      </mesh>
      {/* Brass door handle */}
      {!isXRay && (
        <mesh position={[handleX, 0, 0.1]}>
          <sphereGeometry args={[0.048 * scale, 10, 10]} />
          <meshStandardMaterial color="#c8920a" roughness={0.15} metalness={0.92} />
        </mesh>
      )}
      {/* Concrete doorstep */}
      <mesh position={[0, -frameH / 2 + 0.05, 0.24]} receiveShadow>
        <boxGeometry args={[frameW + 0.25, 0.1, 0.52]} />
        <meshStandardMaterial
          color={isThermal ? '#334155' : (isXRay ? '#1e293b' : '#999999')}
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
  thermalHourData = null
}) {
  const normShape = (shape || design?.shape || 'rectangle').toLowerCase();
  const orientation = design?.orientation !== undefined ? Number(design.orientation) : 180;
  const windowArea = Number(openings?.windowArea) || 2.5;

  const doorCount = Math.max(0, Number(openings?.doorCount !== undefined ? openings.doorCount : (openings?.doors !== undefined ? openings.doors : 1)));
  const windowCount = Math.max(0, Number(openings?.windowCount !== undefined ? openings.windowCount : (openings?.windows !== undefined ? openings.windows : 2)));

  const norm = componentLosses.normalized || {};
  const isThermal = viewMode === 'thermal';
  const isXRay = viewMode === 'heatflow';

  // Component-specific colors for Thermal Performance colormap
  const wallThermalColor = useMemo(() => getThermalColor(norm.walls || 0.4), [norm.walls]);
  const roofThermalColor = useMemo(() => getThermalColor(norm.roof || 0.6), [norm.roof]);
  const floorThermalColor = useMemo(() => getThermalColor(norm.floor || 0.2), [norm.floor]);
  const winThermalColor = useMemo(() => getThermalColor(norm.windows || 0.5), [norm.windows]);
  const doorThermalColor = useMemo(() => getThermalColor(norm.doors || 0.3), [norm.doors]);

  // Normal realistic colors
  const normalEnvelopeColor = '#d4c5a0';
  const normalRoofColor = normShape === 'a-frame' ? '#6b4c2a' : (normShape === 'quonset' ? '#8fa8a8' : '#8a9496');

  // Resolved active materials
  const wallMatProps = useMemo(() => {
    if (isXRay) {
      return { color: '#1e293b', transparent: true, opacity: 0.35, roughness: 0.2, metalness: 0.5 };
    }
    if (isThermal) {
      return { color: wallThermalColor, roughness: 0.75, metalness: 0.05 };
    }
    return { color: normalEnvelopeColor, roughness: 0.85, metalness: 0.0 };
  }, [isXRay, isThermal, wallThermalColor]);

  const roofMatProps = useMemo(() => {
    if (isXRay) {
      return { color: '#334155', transparent: true, opacity: 0.35, roughness: 0.2, metalness: 0.5, side: THREE.DoubleSide };
    }
    if (isThermal) {
      return { color: roofThermalColor, roughness: 0.70, metalness: 0.05, side: THREE.DoubleSide };
    }
    return { color: normalRoofColor, roughness: 0.72, metalness: normShape === 'quonset' ? 0.55 : 0.0, side: THREE.DoubleSide };
  }, [isXRay, isThermal, roofThermalColor, normalRoofColor, normShape]);

  const floorMatProps = useMemo(() => {
    if (isXRay) {
      return { color: '#0f172a', transparent: true, opacity: 0.6, roughness: 0.5 };
    }
    if (isThermal) {
      return { color: floorThermalColor, roughness: 0.85 };
    }
    return { color: '#999999', roughness: 0.95 };
  }, [isXRay, isThermal, floorThermalColor]);

  // Dimension extractions
  const L = Math.max(1.0, Number(dimensions.length || dimensions.L || 6.0));
  const W = Math.max(1.0, Number(dimensions.width || dimensions.W || 4.0));
  const H = Math.max(1.0, Number(dimensions.height || dimensions.wallHeight || dimensions.H || 2.8));
  const R = Math.max(1.0, Number(dimensions.radius || dimensions.R || W / 2 || 3.0));
  const domeH = Math.max(1.0, Number(dimensions.domeHeight || H || 2.8));
  const ridgeH = Math.max(1.5, Number(dimensions.ridgeHeight || H || 3.8));

  const ROOF_OVH_SIDE = 0.35;
  const ROOF_OVH_END  = 0.45;
  const ridgeAboveWall = Math.max(0.9, H * 0.43);

  const aframeGeometry      = useMemo(() => createAFrameGeometry(W, ridgeH, L), [W, ridgeH, L]);
  const realisticRoofGeom   = useMemo(() => createAFrameGeometry(W + ROOF_OVH_SIDE * 2, ridgeAboveWall, L + ROOF_OVH_END * 2), [W, ridgeAboveWall, L]);
  const quonsetShellGeometry = useMemo(() => createQuonsetShellGeometry(W / 2, L, 48), [W, L]);
  const quonsetEndGeometry   = useMemo(() => createSemicircleGeometry(W / 2, 48), [W]);

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

  return (
    <group rotation={[0, (orientation * Math.PI) / 180, 0]}>
      {/* ─── 1. RECTANGLE SHELTER ─── */}
      {(normShape === 'rectangle' || normShape === 'rectangular') && (
        <group>
          {/* Ground patch */}
          {!isXRay && (
            <mesh position={[0, -0.18, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
              <planeGeometry args={[W + 8, L + 8]} />
              <meshStandardMaterial color={isThermal ? '#1e293b' : '#567a3c'} roughness={1.0} metalness={0.0} />
            </mesh>
          )}

          {/* Concrete foundation plinth */}
          <mesh position={[0, -0.07, 0]} castShadow receiveShadow>
            <boxGeometry args={[W + 0.38, 0.14, L + 0.38]} />
            <meshStandardMaterial {...floorMatProps} />
          </mesh>

          {/* Walls */}
          <mesh position={[0, H / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[W, H, L]} />
            <meshStandardMaterial {...wallMatProps} />
          </mesh>

          {/* Gable roof */}
          <mesh geometry={realisticRoofGeom} position={[0, H, 0]} castShadow receiveShadow>
            <meshStandardMaterial {...roofMatProps} />
          </mesh>

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

          {/* Decorative bushes (Normal mode only) */}
          {viewMode === 'normal' && (
            <>
              <mesh position={[-W * 0.38, 0.32, L / 2 + 0.28]} castShadow>
                <sphereGeometry args={[0.46, 9, 9]} />
                <meshStandardMaterial color="#2e7d32" roughness={1.0} />
              </mesh>
              <mesh position={[W * 0.48 + 0.1, 0.28, L / 2 + 0.22]} castShadow>
                <sphereGeometry args={[0.38, 9, 9]} />
                <meshStandardMaterial color="#33691e" roughness={1.0} />
              </mesh>
            </>
          )}
        </group>
      )}

      {/* ─── 2. DOME SHELTER ─── */}
      {normShape === 'dome' && (
        <group>
          {!isXRay && (
            <mesh position={[0, -0.18, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
              <circleGeometry args={[R + 4.5, 48]} />
              <meshStandardMaterial color={isThermal ? '#1e293b' : '#567a3c'} roughness={1.0} />
            </mesh>
          )}

          {/* Foundation */}
          <mesh position={[0, -0.07, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow castShadow>
            <circleGeometry args={[R + 0.25, 48]} />
            <meshStandardMaterial {...floorMatProps} />
          </mesh>

          {/* Cylindrical ring wall */}
          <mesh position={[0, 0.65, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[R, R, 1.3, 48, 1, true]} />
            <meshStandardMaterial {...wallMatProps} />
          </mesh>

          {/* Spherical dome cap shell */}
          <mesh position={[0, 1.3, 0]} castShadow receiveShadow>
            <sphereGeometry
              args={[
                R,
                48,
                24,
                0,
                Math.PI * 2,
                0,
                Math.min(Math.PI / 2, (domeH / R) * (Math.PI / 2))
              ]}
            />
            <meshStandardMaterial {...roofMatProps} />
          </mesh>

          {/* Interior floor disc */}
          <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <circleGeometry args={[R, 48]} />
            <meshStandardMaterial {...floorMatProps} />
          </mesh>

          {/* Glazing band */}
          {windowCount > 0 && (
            <mesh position={[0, 1.3, 0]}>
              <torusGeometry args={[R * 0.98, 0.18, 8, 48, Math.min(Math.PI * 2, Math.PI * 0.4 * windowCount)]} />
              <meshStandardMaterial
                color={isThermal ? winThermalColor : (isXRay ? '#38bdf8' : '#a8d8ea')}
                transparent
                opacity={isXRay ? 0.45 : 0.65}
                roughness={0.05}
                metalness={0.1}
              />
            </mesh>
          )}

          {/* Dome Doors */}
          {Array.from({ length: doorCount }).map((_, idx) => {
            const angle = (idx * (Math.PI * 2 / Math.max(1, doorCount)));
            const dx = Math.sin(angle) * (R * 0.98);
            const dz = Math.cos(angle) * (R * 0.98);
            return (
              <SingleDoor
                key={`dome-door-${idx}`}
                position={[dx, 1.05, dz]}
                rotation={[0, angle, 0]}
                scale={0.95}
                viewMode={viewMode}
                doorColor={doorThermalColor}
              />
            );
          })}

          {/* Dome Windows */}
          {Array.from({ length: windowCount }).map((_, idx) => {
            const angle = (idx + 0.5) * (Math.PI * 2 / Math.max(1, windowCount));
            const wx = Math.sin(angle) * (R * 0.98);
            const wz = Math.cos(angle) * (R * 0.98);
            return (
              <SingleWindow
                key={`dome-win-${idx}`}
                position={[wx, 0.7, wz]}
                rotation={[0, angle, 0]}
                scale={winScale * 0.85}
                viewMode={viewMode}
                glassColor={winThermalColor}
              />
            );
          })}
        </group>
      )}

      {/* ─── 3. A-FRAME SHELTER ─── */}
      {(normShape === 'a-frame' || normShape === 'aframe') && (
        <group>
          {!isXRay && (
            <mesh position={[0, -0.18, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
              <planeGeometry args={[W + 8, L + 8]} />
              <meshStandardMaterial color={isThermal ? '#1e293b' : '#567a3c'} roughness={1.0} />
            </mesh>
          )}

          <mesh position={[0, -0.07, 0]} castShadow receiveShadow>
            <boxGeometry args={[W + 0.4, 0.14, L + 0.4]} />
            <meshStandardMaterial {...floorMatProps} />
          </mesh>

          {/* Main A-frame roof slopes */}
          <mesh geometry={aframeGeometry} castShadow receiveShadow>
            <meshStandardMaterial {...roofMatProps} />
          </mesh>

          {/* Inner wall section */}
          <mesh position={[0, 0.7, 0]} castShadow>
            <boxGeometry args={[W * 0.95, 1.4, L + 0.01]} />
            <meshStandardMaterial {...wallMatProps} />
          </mesh>

          {doorCount >= 1 && (
            <SingleDoor position={[0, 1.0, -L / 2]} rotation={[0, Math.PI, 0]} scale={0.95} viewMode={viewMode} doorColor={doorThermalColor} />
          )}
          {doorCount >= 2 && (
            <SingleDoor position={[0, 1.0, L / 2]} rotation={[0, 0, 0]} scale={0.95} viewMode={viewMode} doorColor={doorThermalColor} />
          )}

          {windowCount >= 1 && (
            <SingleWindow position={[0, ridgeH * 0.62, -L / 2]} rotation={[0, Math.PI, 0]} scale={winScale * 0.9} mullions={false} viewMode={viewMode} glassColor={winThermalColor} />
          )}
          {windowCount >= 2 && (
            <SingleWindow position={[0, ridgeH * 0.55, L / 2]} rotation={[0, 0, 0]} scale={winScale * 0.85} mullions={false} viewMode={viewMode} glassColor={winThermalColor} />
          )}
        </group>
      )}

      {/* ─── 4. QUONSET ARCH SHELTER ─── */}
      {normShape === 'quonset' && (
        <group>
          {!isXRay && (
            <mesh position={[0, -0.18, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
              <planeGeometry args={[W + 8, L + 8]} />
              <meshStandardMaterial color={isThermal ? '#1e293b' : '#567a3c'} roughness={1.0} />
            </mesh>
          )}

          <mesh position={[0, -0.07, 0]} castShadow receiveShadow>
            <boxGeometry args={[W + 0.4, 0.14, L + 0.4]} />
            <meshStandardMaterial {...floorMatProps} />
          </mesh>

          {/* Continuous arch shell */}
          <mesh geometry={quonsetShellGeometry} castShadow receiveShadow>
            <meshStandardMaterial {...roofMatProps} />
          </mesh>

          {/* End-walls */}
          <mesh geometry={quonsetEndGeometry} position={[0, 0, -L / 2]} rotation={[0, Math.PI, 0]} castShadow receiveShadow>
            <meshStandardMaterial {...wallMatProps} />
          </mesh>
          <mesh geometry={quonsetEndGeometry} position={[0, 0, L / 2]} castShadow receiveShadow>
            <meshStandardMaterial {...wallMatProps} />
          </mesh>

          {doorCount >= 1 && (
            <SingleDoor position={[0, 1.05, -L / 2]} rotation={[0, Math.PI, 0]} scale={0.95} viewMode={viewMode} doorColor={doorThermalColor} />
          )}
          {doorCount >= 2 && (
            <SingleDoor position={[0, 1.05, L / 2]} rotation={[0, 0, 0]} scale={0.95} viewMode={viewMode} doorColor={doorThermalColor} />
          )}

          {windowCount >= 1 && (
            <SingleWindow position={[-W * 0.3, (W / 2) * 0.48, -L / 2]} rotation={[0, Math.PI, 0]} scale={winScale * 0.85} viewMode={viewMode} glassColor={winThermalColor} />
          )}
          {windowCount >= 2 && (
            <SingleWindow position={[W * 0.3, (W / 2) * 0.48, -L / 2]} rotation={[0, Math.PI, 0]} scale={winScale * 0.85} viewMode={viewMode} glassColor={winThermalColor} />
          )}
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
  // Diurnal sun position calculation
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
      {/* Glowing Sun Sphere */}
      <mesh>
        <sphereGeometry args={[0.45, 20, 20]} />
        <meshBasicMaterial color="#fbbf24" />
      </mesh>
      {/* Sun Glow Corona */}
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

      {/* Sun Ray pointing towards center */}
      <mesh position={[-sunX * 0.4, -sunY * 0.4, -sunZ * 0.4]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.015, 0.03, sunDist * 0.7, 8]} />
        <meshBasicMaterial color="#fef08a" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

function CameraController({ bounds = 6 }) {
  const { camera } = useThree();
  useEffect(() => {
    const dist = Math.max(8, bounds * 1.5);
    camera.position.set(dist * 0.8, dist * 0.6, dist);
    camera.lookAt(0, 1.5, 0);
  }, [bounds, camera]);
  return null;
}

/**
 * Universal Shelter 3D Viewer & Climate Time Machine Viewport
 * Retains 100% backwards compatibility with other pages while supporting 3 visualization modes.
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
  showCompass = true
}) {
  const controlsRef = useRef();

  const handleResetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  const activeDimensions = { ...geometry, ...dimensions };
  const activeShape = shape || design?.shape || 'rectangle';
  const activeOrientation = orientation !== null ? Number(orientation) : Number(design?.orientation || openings?.openingOrientation || 180);

  const activeHourPoint = timeSeriesPoint || thermalHourData || null;
  const hour = activeHourPoint?.hour !== undefined
    ? Number(activeHourPoint.hour)
    : (currentHour !== undefined ? Number(currentHour) : 12);

  const isDaytime = hour >= 6 && hour <= 18;
  const solarRad = activeHourPoint?.solarRadiation !== undefined ? activeHourPoint.solarRadiation : (activeHourPoint?.solarGain || 400);

  // Background sky and fog colors based on time of day and mode
  const skyColor = useMemo(() => {
    if (viewMode === 'heatflow') return '#090d16';
    if (viewMode === 'thermal') return '#0f172a';
    return isDaytime ? '#cce8f5' : '#0b1329';
  }, [viewMode, isDaytime]);

  const maxDim = Math.max(
    Number(activeDimensions.length || 6),
    Number(activeDimensions.width || 4),
    Number(activeDimensions.radius ? activeDimensions.radius * 2 : 4),
    Number(activeDimensions.height || activeDimensions.ridgeHeight || 3)
  );

  return (
    <div
      style={{ height: `${height}px` }}
      className="relative w-full bg-slate-950 rounded-2xl overflow-hidden border border-slate-700/80 shadow-inner"
    >
      {/* Floating Reset Camera Button */}
      <div className="absolute top-3 right-3 z-10">
        <button
          onClick={handleResetCamera}
          className="px-2.5 py-1 bg-slate-900/85 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 rounded-lg text-xs shadow font-medium transition"
        >
          Reset Camera
        </button>
      </div>

      <Canvas
        shadows
        gl={{ antialias: true, preserveDrawingBuffer: false }}
        camera={{ position: [8, 6, 10], fov: 45 }}
      >
        <color attach="background" args={[skyColor]} />
        <fog attach="fog" args={[skyColor, 26, 60]} />

        {/* Lighting Configuration */}
        {isDaytime ? (
          <>
            <ambientLight intensity={viewMode === 'heatflow' ? 0.3 : 0.45} color="#fff8f0" />
            <hemisphereLight skyColor="#b3d9f5" groundColor="#334155" intensity={0.4} />
            <directionalLight
              position={[10, 16, 10]}
              intensity={viewMode === 'heatflow' ? 0.8 : 1.35}
              castShadow={viewMode === 'normal'}
              shadow-mapSize-width={2048}
              shadow-mapSize-height={2048}
              shadow-camera-far={55}
              shadow-bias={-0.0005}
            />
            <directionalLight position={[-6, 8, -8]} intensity={0.3} color="#ddeeff" />
          </>
        ) : (
          <>
            {/* Night-time Moonlight Lighting */}
            <ambientLight intensity={0.25} color="#1e293b" />
            <hemisphereLight skyColor="#1e293b" groundColor="#090d16" intensity={0.2} />
            <directionalLight position={[6, 12, 6]} intensity={0.35} color="#94a3b8" />
          </>
        )}

        <CameraController bounds={maxDim} />

        {/* Shelter Mesh Root */}
        <group rotation={[0, ((activeOrientation - 180) * Math.PI) / 180, 0]}>
          <ShelterMesh
            shape={activeShape}
            dimensions={activeDimensions}
            design={{ ...design, orientation: activeOrientation }}
            openings={openings}
            viewMode={viewMode}
            componentLosses={componentLosses}
            flowDirection={flowDirection}
            thermalHourData={activeHourPoint}
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

        {/* Ground Grid */}
        <Grid
          infiniteGrid
          cellSize={1}
          cellThickness={0.6}
          cellColor={viewMode === 'normal' ? '#a8c896' : '#38bdf8'}
          sectionSize={5}
          sectionThickness={1.2}
          sectionColor={viewMode === 'normal' ? '#7aaa6a' : '#0284c7'}
          fadeDistance={28}
          fadeStrength={1.5}
        />

        <OrbitControls ref={controlsRef} makeDefault minDistance={2.5} maxDistance={35} />
      </Canvas>

      <div className="absolute bottom-2.5 left-3 z-10 text-[10px] text-slate-400 bg-slate-900/80 backdrop-blur px-2.5 py-1 rounded-lg border border-slate-700 shadow">
        🖱️ Left-Click: Rotate | Right-Click: Pan | Scroll: Zoom
      </div>
    </div>
  );
}
