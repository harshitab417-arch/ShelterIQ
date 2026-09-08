import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, Html } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Mathematically constructs a true Triangular Prism BufferGeometry for the A-Frame shelter.
 * Vertices:
 * Front Triangle: (-W/2, 0, -L/2), (W/2, 0, -L/2), (0, H, -L/2)
 * Rear Triangle:  (-W/2, 0,  L/2), (W/2, 0,  L/2), (0, H,  L/2)
 */
function createAFrameGeometry(width, height, length) {
  const w2 = width / 2;
  const l2 = length / 2;
  const geom = new THREE.BufferGeometry();

  // 6 key vertices
  const p0 = [-w2, 0, -l2]; // Front left
  const p1 = [ w2, 0, -l2]; // Front right
  const p2 = [  0, height, -l2]; // Front ridge apex
  const p3 = [-w2, 0,  l2]; // Rear left
  const p4 = [ w2, 0,  l2]; // Rear right
  const p5 = [  0, height,  l2]; // Rear ridge apex

  const positions = [];
  const normals = [];
  const uvs = [];

  function addTriangle(vA, vB, vC) {
    positions.push(...vA, ...vB, ...vC);
    
    // Compute face normal
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

  // 1. Front Triangular End-Wall
  addTriangle(p0, p1, p2);

  // 2. Rear Triangular End-Wall
  addTriangle(p4, p3, p5);

  // 3. Left Sloping Roof Face (p0 -> p3 -> p5 -> p2)
  addQuad(p3, p0, p2, p5);

  // 4. Right Sloping Roof Face (p1 -> p4 -> p5 -> p2)
  addQuad(p1, p4, p5, p2);

  // 5. Floor Base (p0 -> p1 -> p4 -> p3)
  addQuad(p0, p3, p4, p1);

  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));

  return geom;
}

/**
 * Mathematically constructs a true Semi-Cylindrical Arch for the Quonset shelter.
 * Cylinder axis runs continuously along length (Z axis from -L/2 to L/2).
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

    // Arch profiles in X-Y plane
    const x1 = -radius * Math.cos(theta1);
    const y1 =  radius * Math.sin(theta1);
    const x2 = -radius * Math.cos(theta2);
    const y2 =  radius * Math.sin(theta2);

    // 4 Quad vertices along length
    const v0 = [x1, y1, -l2];
    const v1 = [x2, y2, -l2];
    const v2 = [x2, y2,  l2];
    const v3 = [x1, y1,  l2];

    // Face Normals
    const n1 = [x1 / radius, y1 / radius, 0];
    const n2 = [x2 / radius, y2 / radius, 0];

    // Triangle 1: v0 -> v1 -> v2
    positions.push(...v0, ...v1, ...v2);
    normals.push(...n1, ...n2, ...n2);
    uvs.push(i / radialSegments, 0, (i + 1) / radialSegments, 0, (i + 1) / radialSegments, 1);

    // Triangle 2: v0 -> v2 -> v3
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

/**
 * 3D Geometry Builder for Rectangle, Dome, A-Frame, and Quonset Shelters
 */
function ShelterMesh({ shape = 'rectangle', dimensions = {}, design = {}, openings = {}, thermalHourData = null }) {
  const normShape = (shape || design?.shape || 'rectangle').toLowerCase();
  const orientation = design?.orientation || 180;
  const windowArea = Number(openings?.windowArea) || 2.5;

  // Temperature-driven thermal color tinting
  const envelopeColor = useMemo(() => {
    if (!thermalHourData) return '#94a3b8'; // Crisp slate engineering gray
    const tin = thermalHourData.indoorTemperature;
    if (tin >= 22) return '#ea580c'; // Warm orange
    if (tin >= 18) return '#10b981'; // Optimal green comfort
    if (tin >= 12) return '#38bdf8'; // Moderate cool
    if (tin >= 0)  return '#60a5fa'; // Cold blue
    return '#818cf8';                // Freezing sub-zero
  }, [thermalHourData]);

  const roofColor = useMemo(() => {
    if (!thermalHourData) return '#0284c7';
    if (thermalHourData.solarGain > 350) return '#f59e0b'; // Solar warmed
    return '#0369a1';
  }, [thermalHourData]);

  // Dimension extractions with defaults
  const L = Math.max(1.0, Number(dimensions.length || dimensions.L || 6.0));
  const W = Math.max(1.0, Number(dimensions.width || dimensions.W || 4.0));
  const H = Math.max(1.0, Number(dimensions.height || dimensions.wallHeight || dimensions.H || 2.8));
  const R = Math.max(1.0, Number(dimensions.radius || dimensions.R || (dimensions.diameter ? dimensions.diameter / 2 : W / 2) || 3.0));
  const domeH = Math.max(1.0, Number(dimensions.domeHeight || H || 2.8));
  const ridgeH = Math.max(1.5, Number(dimensions.ridgeHeight || H || 3.8));

  // Precompute custom geometries
  const aframeGeometry = useMemo(() => createAFrameGeometry(W, ridgeH, L), [W, ridgeH, L]);
  const quonsetShellGeometry = useMemo(() => createQuonsetShellGeometry(W / 2, L, 48), [W, L]);
  const quonsetEndGeometry = useMemo(() => createSemicircleGeometry(W / 2, 48), [W]);

  return (
    <group rotation={[0, (orientation * Math.PI) / 180, 0]}>
      {/* ─── 1. RECTANGLE WITH GABLE ROOF ─── */}
      {(normShape === 'rectangle' || normShape === 'rectangular') && (
        <group>
          {/* Main Opaque Walls */}
          <mesh position={[0, H / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[W, H, L]} />
            <meshStandardMaterial color={envelopeColor} roughness={0.6} metalness={0.1} />
          </mesh>

          {/* Pitched Gable Roof */}
          <mesh position={[0, H + 0.5, 0]} castShadow receiveShadow>
            <coneGeometry args={[Math.sqrt(W * W + L * L) / 2, 1.0, 4]} />
            <meshStandardMaterial color={roofColor} roughness={0.4} />
          </mesh>

          {/* Window on South Face */}
          <mesh position={[0, H / 2, L / 2 + 0.02]}>
            <boxGeometry args={[Math.min(W * 0.7, Math.sqrt(windowArea) * 1.1), 1.1, 0.04]} />
            <meshStandardMaterial color="#38bdf8" transparent opacity={0.8} roughness={0.1} />
          </mesh>

          {/* Entrance Door */}
          <mesh position={[W / 4, 0.9, L / 2 + 0.02]}>
            <boxGeometry args={[0.9, 1.8, 0.04]} />
            <meshStandardMaterial color="#78350f" roughness={0.8} />
          </mesh>

          <Html position={[0, H + 1.8, 0]} center>
            <div className="bg-slate-900/85 text-white text-[10px] px-2 py-0.5 rounded shadow font-mono whitespace-nowrap">
              Rectangle: {L.toFixed(1)}m × {W.toFixed(1)}m × {H.toFixed(1)}m
            </div>
          </Html>
        </group>
      )}

      {/* ─── 2. DOME (Spherical Cap) ─── */}
      {normShape === 'dome' && (
        <group>
          {/* Spherical Cap Shell */}
          <mesh position={[0, 0, 0]} castShadow receiveShadow>
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
            <meshStandardMaterial color={envelopeColor} roughness={0.5} metalness={0.15} side={THREE.DoubleSide} />
          </mesh>

          {/* Base Floor Plate */}
          <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[R, 48]} />
            <meshStandardMaterial color="#475569" roughness={0.9} />
          </mesh>

          {/* South Glazing Window */}
          <mesh position={[0, domeH * 0.45, R * 0.85]} rotation={[0.4, 0, 0]}>
            <boxGeometry args={[Math.min(R * 1.2, Math.sqrt(windowArea)), 0.9, 0.05]} />
            <meshStandardMaterial color="#38bdf8" transparent opacity={0.8} />
          </mesh>

          {/* Flush Entrance Portal */}
          <mesh position={[0, 0.9, R * 0.96]}>
            <boxGeometry args={[0.85, 1.8, 0.1]} />
            <meshStandardMaterial color="#78350f" roughness={0.8} />
          </mesh>

          <Html position={[0, domeH + 1.0, 0]} center>
            <div className="bg-slate-900/85 text-white text-[10px] px-2 py-0.5 rounded shadow font-mono whitespace-nowrap">
              Dome: Radius {R.toFixed(1)}m | Peak {domeH.toFixed(1)}m
            </div>
          </Html>
        </group>
      )}

      {/* ─── 3. A-FRAME (True Triangular Prism) ─── */}
      {(normShape === 'a-frame' || normShape === 'aframe') && (
        <group>
          {/* Triangular Prism Geometry */}
          <mesh geometry={aframeGeometry} castShadow receiveShadow>
            <meshStandardMaterial color={roofColor} roughness={0.5} side={THREE.DoubleSide} />
          </mesh>

          {/* Front Entrance Door */}
          <mesh position={[0, 0.9, -L / 2 - 0.02]}>
            <boxGeometry args={[0.85, 1.8, 0.04]} />
            <meshStandardMaterial color="#78350f" roughness={0.8} />
          </mesh>

          {/* Front Glazing Window */}
          <mesh position={[0, ridgeH * 0.55, -L / 2 - 0.02]}>
            <boxGeometry args={[Math.min(W * 0.5, Math.sqrt(windowArea)), 0.9, 0.04]} />
            <meshStandardMaterial color="#38bdf8" transparent opacity={0.8} />
          </mesh>

          <Html position={[0, ridgeH + 0.8, 0]} center>
            <div className="bg-slate-900/85 text-white text-[10px] px-2 py-0.5 rounded shadow font-mono whitespace-nowrap">
              A-Frame: {L.toFixed(1)}m × {W.toFixed(1)}m × {ridgeH.toFixed(1)}m
            </div>
          </Html>
        </group>
      )}

      {/* ─── 4. QUONSET (True Semi-Cylindrical Arch) ─── */}
      {normShape === 'quonset' && (
        <group>
          {/* Continuous Semi-Cylindrical Shell */}
          <mesh geometry={quonsetShellGeometry} castShadow receiveShadow>
            <meshStandardMaterial color={roofColor} roughness={0.4} metalness={0.2} side={THREE.DoubleSide} />
          </mesh>

          {/* Front End-Wall */}
          <mesh geometry={quonsetEndGeometry} position={[0, 0, -L / 2]} rotation={[0, Math.PI, 0]} castShadow receiveShadow>
            <meshStandardMaterial color={envelopeColor} roughness={0.6} side={THREE.DoubleSide} />
          </mesh>

          {/* Rear End-Wall */}
          <mesh geometry={quonsetEndGeometry} position={[0, 0, L / 2]} castShadow receiveShadow>
            <meshStandardMaterial color={envelopeColor} roughness={0.6} side={THREE.DoubleSide} />
          </mesh>

          {/* Base Floor Plate */}
          <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[W, L]} />
            <meshStandardMaterial color="#475569" roughness={0.9} />
          </mesh>

          {/* Front Entrance Door */}
          <mesh position={[0, 0.9, -L / 2 - 0.02]}>
            <boxGeometry args={[0.85, 1.8, 0.04]} />
            <meshStandardMaterial color="#78350f" roughness={0.8} />
          </mesh>

          {/* Front Glazing Window */}
          <mesh position={[0, (W / 2) * 0.55, -L / 2 - 0.02]}>
            <boxGeometry args={[Math.min((W / 2) * 1.1, Math.sqrt(windowArea)), 0.8, 0.04]} />
            <meshStandardMaterial color="#38bdf8" transparent opacity={0.8} />
          </mesh>

          <Html position={[0, (W / 2) + 0.8, 0]} center>
            <div className="bg-slate-900/85 text-white text-[10px] px-2 py-0.5 rounded shadow font-mono whitespace-nowrap">
              Quonset: {L.toFixed(1)}m length | {W.toFixed(1)}m arch span
            </div>
          </Html>
        </group>
      )}
    </group>
  );
}

function SolarVectorArrow({ orientation = 180 }) {
  const rad = (orientation * Math.PI) / 180;
  const dirX = Math.sin(rad) * 6.5;
  const dirZ = Math.cos(rad) * 6.5;

  return (
    <group position={[dirX, 4.5, dirZ]}>
      <mesh>
        <sphereGeometry args={[0.35, 16, 16]} />
        <meshBasicMaterial color="#f59e0b" />
      </mesh>
      <Html center>
        <div className="bg-amber-100/95 text-amber-900 border border-amber-300 px-2 py-0.5 text-[9px] font-bold rounded shadow whitespace-nowrap">
          ☀️ Solar Vector ({orientation}°)
        </div>
      </Html>
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

export default function Shelter3DViewer({
  shape = 'rectangle',
  geometry = {},
  dimensions = {},
  design = {},
  openings = {},
  thermalHourData = null,
  height = 360
}) {
  const controlsRef = useRef();

  const handleResetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  const activeDimensions = { ...geometry, ...dimensions };
  const activeShape = shape || design?.shape || 'rectangle';

  // Compute bounding scale for camera placement
  const maxDim = Math.max(
    Number(activeDimensions.length || 6),
    Number(activeDimensions.width || 4),
    Number(activeDimensions.radius ? activeDimensions.radius * 2 : 4),
    Number(activeDimensions.height || activeDimensions.ridgeHeight || 3)
  );

  return (
    <div
      style={{ height: `${height}px` }}
      className="relative w-full bg-slate-950/5 rounded-xl overflow-hidden border border-slate-200 shadow-inner"
    >
      {/* Floating Header Controls */}
      <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-2">
        {thermalHourData && (
          <div className="bg-white/95 backdrop-blur border border-slate-200 px-2.5 py-1 rounded-lg text-xs shadow-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></span>
            <span className="font-semibold text-slate-700">
              Indoor: <span className="text-sky-700 font-bold">{thermalHourData.indoorTemperature}°C</span>
            </span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-500">
              Amb: <span className="text-slate-700 font-bold">{thermalHourData.ambientTemperature}°C</span>
            </span>
          </div>
        )}
        <button
          onClick={handleResetCamera}
          className="px-2.5 py-1 bg-white/90 hover:bg-white text-slate-700 border border-slate-300 rounded-lg text-xs shadow-sm font-medium transition"
        >
          Reset Camera
        </button>
      </div>

      <Canvas camera={{ position: [8, 6, 10], fov: 45 }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[10, 15, 10]} intensity={1.2} castShadow />

        <CameraController bounds={maxDim} />

        <ShelterMesh
          shape={activeShape}
          dimensions={activeDimensions}
          design={design}
          openings={openings}
          thermalHourData={thermalHourData}
        />
        <SolarVectorArrow orientation={design?.orientation || openings?.openingOrientation || 180} />

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

        <OrbitControls ref={controlsRef} makeDefault minDistance={2.5} maxDistance={35} />
      </Canvas>

      <div className="absolute bottom-2 left-3 z-10 text-[10px] text-slate-500 bg-white/90 backdrop-blur px-2 py-0.5 rounded border border-slate-200">
        🖱️ Rotate: Left-Click | Pan: Right-Click | Zoom: Scroll
      </div>
    </div>
  );
}
