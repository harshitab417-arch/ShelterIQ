import React, { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Text, Html } from '@react-three/drei';
import * as THREE from 'three';

function BuildingModel({ geometry, design, openings }) {
  const { length = 6.0, width = 4.0, height = 2.8, wallThickness = 0.3 } = geometry;
  const { orientation = 180, roofAngle = 25 } = design;
  const { windowCount = 2, windowArea = 2.5, doorArea = 1.8 } = openings;

  const roofHeight = (width / 2) * Math.tan((roofAngle * Math.PI) / 180);

  return (
    <group rotation={[0, (orientation * Math.PI) / 180, 0]}>
      {/* Main Opaque Walls */}
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, height, length]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.6} metalness={0.1} />
      </mesh>

      {/* Pitched Roof */}
      <mesh position={[0, height + roofHeight / 2, 0]} castShadow receiveShadow>
        <coneGeometry args={[Math.sqrt(width * width + length * length) / 2, roofHeight, 4]} />
        <meshStandardMaterial color="#0284c7" roughness={0.4} />
      </mesh>

      {/* Glazing / Windows (South Facade) */}
      <mesh position={[0, height / 2, length / 2 + 0.05]}>
        <boxGeometry args={[Math.min(width - 0.8, Math.sqrt(windowArea) * 1.2), 1.2, 0.08]} />
        <meshStandardMaterial color="#38bdf8" transparent opacity={0.7} roughness={0.1} />
      </mesh>

      {/* Entrance Door */}
      <mesh position={[width / 3, 1.0, length / 2 + 0.05]}>
        <boxGeometry args={[0.9, 2.0, 0.08]} />
        <meshStandardMaterial color="#78350f" roughness={0.8} />
      </mesh>

      {/* Dimension Markers */}
      <Html position={[0, height + roofHeight + 0.6, 0]} center>
        <div className="bg-white/90 border border-slate-300 text-slate-700 text-xs px-2 py-1 rounded shadow font-mono">
          {length}m x {width}m x {(height + roofHeight).toFixed(1)}m
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
      <mesh>
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

export default function Shelter3DViewer({ geometry, design, openings }) {
  const controlsRef = useRef();

  const handleResetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  return (
    <div className="relative w-full h-[400px] bg-slate-100 rounded-xl overflow-hidden border border-slate-200 shadow-inner">
      {/* Floating Control Button */}
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

        <BuildingModel geometry={geometry} design={design} openings={openings} />
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
