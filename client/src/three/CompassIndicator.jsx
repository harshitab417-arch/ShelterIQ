import React from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

export default function CompassIndicator({ radius = 5.5, orientation = 180 }) {
  const cardinalRadius = radius + 0.5;

  return (
    <group position={[0, -0.05, 0]}>
      {/* Outer Compass Circle Line */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius - 0.05, radius + 0.05, 64]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.35} side={THREE.DoubleSide} />
      </mesh>

      {/* North Label (0° / +Z in standard world or -Z depending on coordinates) */}
      {/* In Three.js standard coordinates, Z+ is South (180°) and Z- is North (0°) */}
      <group position={[0, 0.1, -cardinalRadius]}>
        <mesh>
          <sphereGeometry args={[0.15, 12, 12]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
        <Html center position={[0, 0.4, 0]}>
          <div className="bg-red-900/90 text-white border border-red-500 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold whitespace-nowrap shadow">
            N (0°)
          </div>
        </Html>
      </group>

      {/* East Label (90° / +X) */}
      <group position={[cardinalRadius, 0.1, 0]}>
        <mesh>
          <sphereGeometry args={[0.1, 12, 12]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
        <Html center position={[0, 0.35, 0]}>
          <div className="bg-slate-900/90 text-sky-300 border border-slate-700 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold whitespace-nowrap shadow">
            E (90°)
          </div>
        </Html>
      </group>

      {/* South Label (180° / +Z) */}
      <group position={[0, 0.1, cardinalRadius]}>
        <mesh>
          <sphereGeometry args={[0.1, 12, 12]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
        <Html center position={[0, 0.35, 0]}>
          <div className="bg-slate-900/90 text-sky-300 border border-slate-700 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold whitespace-nowrap shadow">
            S (180°)
          </div>
        </Html>
      </group>

      {/* West Label (270° / -X) */}
      <group position={[-cardinalRadius, 0.1, 0]}>
        <mesh>
          <sphereGeometry args={[0.1, 12, 12]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
        <Html center position={[0, 0.35, 0]}>
          <div className="bg-slate-900/90 text-sky-300 border border-slate-700 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold whitespace-nowrap shadow">
            W (270°)
          </div>
        </Html>
      </group>

      {/* Dynamic Orientation Pointer Arrow on Ground */}
      <group rotation={[0, ((180 - orientation) * Math.PI) / 180, 0]}>
        <mesh position={[0, 0.02, radius * 0.5]} rotation={[-Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.22, 0.7, 16]} />
          <meshBasicMaterial color="#f59e0b" />
        </mesh>
        <mesh position={[0, 0.02, radius * 0.25]} rotation={[-Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.04, 0.04, radius * 0.5, 8]} />
          <meshBasicMaterial color="#f59e0b" />
        </mesh>
      </group>
    </group>
  );
}
