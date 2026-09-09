import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { getThermalColor } from '../components/ClimateTimeMachine/timeMachineAdapter';

/**
 * Animated 3D Arrow and Particle Stream Component for a single heat pathway
 */
function SingleHeatPathway({
  position,
  direction = [0, 0, 1],
  normMagnitude = 0.5,
  pct = 20,
  label = '',
  flowDirection = 'OUTWARD',
  showLabel = true
}) {
  const particleGroupRef = useRef();

  // Normalize direction vector
  const dirVec = useMemo(() => {
    const v = new THREE.Vector3(...direction).normalize();
    if (flowDirection === 'INWARD') {
      v.negate();
    }
    return v;
  }, [direction, flowDirection]);

  // Compute rotation quaternion to align with dirVec
  const quat = useMemo(() => {
    const defaultUp = new THREE.Vector3(0, 1, 0);
    const q = new THREE.Quaternion();
    q.setFromUnitVectors(defaultUp, dirVec);
    return q;
  }, [dirVec]);

  const color = useMemo(() => getThermalColor(normMagnitude), [normMagnitude]);

  // Arrow geometry dimensions scaled by real relative magnitude
  const length = 1.0 + normMagnitude * 0.8;
  const thickness = 0.04 + normMagnitude * 0.06;
  const coneRadius = 0.12 + normMagnitude * 0.1;
  const coneHeight = 0.35 + normMagnitude * 0.2;

  // Discrete particles along the pathway
  const particleCount = Math.max(3, Math.round(normMagnitude * 6));
  const particleOffsets = useMemo(() => {
    return Array.from({ length: particleCount }, (_, i) => i / particleCount);
  }, [particleCount]);

  useFrame((_, delta) => {
    if (particleGroupRef.current) {
      const speed = (0.8 + normMagnitude * 1.5) * delta;
      particleGroupRef.current.children.forEach((child) => {
        child.position.y += speed;
        if (child.position.y > length) {
          child.position.y = 0;
        }
      });
    }
  });

  return (
    <group position={position}>
      {/* Orient entire pathway along dirVec */}
      <group quaternion={quat}>
        {/* Main Arrow Stem */}
        <mesh position={[0, length / 2, 0]}>
          <cylinderGeometry args={[thickness, thickness, length, 12]} />
          <meshBasicMaterial color={color} transparent opacity={0.75} />
        </mesh>

        {/* Arrow Head */}
        <mesh position={[0, length + coneHeight / 2, 0]}>
          <coneGeometry args={[coneRadius, coneHeight, 16]} />
          <meshBasicMaterial color={color} />
        </mesh>

        {/* Animated Particle Stream along the shaft */}
        <group ref={particleGroupRef}>
          {particleOffsets.map((offset, idx) => (
            <mesh key={`p-${idx}`} position={[0, offset * length, 0]}>
              <sphereGeometry args={[thickness * 1.5, 8, 8]} />
              <meshBasicMaterial color="#ffffff" transparent opacity={0.9} />
            </mesh>
          ))}
        </group>
      </group>

      {/* 3D Component Loss Percentage Badge */}
      {showLabel && label && pct > 0 && (
        <Html position={[dirVec.x * (length + 0.6), dirVec.y * (length + 0.6) + 0.2, dirVec.z * (length + 0.6)]} center>
          <div className="bg-slate-950/90 text-white border border-slate-700 px-2 py-0.5 rounded text-[10px] font-mono font-bold shadow-xl whitespace-nowrap flex items-center gap-1">
            <span style={{ color }}>●</span>
            <span>{label}:</span>
            <span style={{ color }}>{pct}%</span>
          </div>
        </Html>
      )}
    </group>
  );
}

export default function HeatFlowParticles({
  shape = 'rectangle',
  dimensions = {},
  componentLosses = {},
  flowDirection = 'OUTWARD'
}) {
  const normShape = (shape || 'rectangle').toLowerCase();

  const L = Math.max(1.0, Number(dimensions.length || dimensions.L || 6.0));
  const W = Math.max(1.0, Number(dimensions.width || dimensions.W || 4.0));
  const H = Math.max(1.0, Number(dimensions.height || dimensions.wallHeight || dimensions.H || 2.8));
  const R = Math.max(1.0, Number(dimensions.radius || dimensions.R || W / 2 || 3.0));
  const ridgeH = Math.max(1.5, Number(dimensions.ridgeHeight || H || 3.8));

  const pct = componentLosses.percentages || {};
  const norm = componentLosses.normalized || {};

  const wallNorm = norm.walls || 0.4;
  const roofNorm = norm.roof || 0.6;
  const floorNorm = norm.floor || 0.2;
  const winNorm = norm.windows || 0.5;
  const doorNorm = norm.doors || 0.3;

  return (
    <group>
      {/* 1. RECTANGULAR SHELTER HEAT PATHWAYS */}
      {(normShape === 'rectangle' || normShape === 'rectangular') && (
        <group>
          {/* Front Wall Arrow */}
          <SingleHeatPathway
            position={[0, H * 0.5, L / 2]}
            direction={[0, 0, 1]}
            normMagnitude={wallNorm}
            pct={pct.walls}
            label="Walls"
            flowDirection={flowDirection}
            showLabel={true}
          />
          {/* Rear Wall Arrow */}
          <SingleHeatPathway
            position={[0, H * 0.5, -L / 2]}
            direction={[0, 0, -1]}
            normMagnitude={wallNorm}
            pct={pct.walls}
            flowDirection={flowDirection}
            showLabel={false}
          />
          {/* Left Wall Arrow */}
          <SingleHeatPathway
            position={[-W / 2, H * 0.5, 0]}
            direction={[-1, 0, 0]}
            normMagnitude={wallNorm}
            pct={pct.walls}
            flowDirection={flowDirection}
            showLabel={false}
          />
          {/* Right Wall Arrow */}
          <SingleHeatPathway
            position={[W / 2, H * 0.5, 0]}
            direction={[1, 0, 0]}
            normMagnitude={wallNorm}
            pct={pct.walls}
            flowDirection={flowDirection}
            showLabel={false}
          />

          {/* Roof Left Slope Arrow */}
          <SingleHeatPathway
            position={[-W * 0.25, H + 0.6, 0]}
            direction={[-0.5, 0.86, 0]}
            normMagnitude={roofNorm}
            pct={pct.roof}
            label="Roof"
            flowDirection={flowDirection}
            showLabel={true}
          />
          {/* Roof Right Slope Arrow */}
          <SingleHeatPathway
            position={[W * 0.25, H + 0.6, 0]}
            direction={[0.5, 0.86, 0]}
            normMagnitude={roofNorm}
            pct={pct.roof}
            flowDirection={flowDirection}
            showLabel={false}
          />

          {/* Window Aperture Arrow */}
          <SingleHeatPathway
            position={[-W * 0.26, H * 0.58, L / 2 + 0.1]}
            direction={[0, 0, 1]}
            normMagnitude={winNorm}
            pct={pct.windows}
            label="Windows"
            flowDirection={flowDirection}
            showLabel={true}
          />

          {/* Door Aperture Arrow */}
          <SingleHeatPathway
            position={[W * 0.2, H * 0.44, L / 2 + 0.1]}
            direction={[0, 0, 1]}
            normMagnitude={doorNorm}
            pct={pct.doors}
            label="Doors"
            flowDirection={flowDirection}
            showLabel={true}
          />

          {/* Floor / Ground Foundation Heat Loss Arrow */}
          <SingleHeatPathway
            position={[0, 0.05, 0]}
            direction={[0, -1, 0]}
            normMagnitude={floorNorm}
            pct={pct.floor}
            label="Floor"
            flowDirection={flowDirection}
            showLabel={true}
          />
        </group>
      )}

      {/* 2. DOME SHELTER HEAT PATHWAYS */}
      {normShape === 'dome' && (
        <group>
          {/* Dome Top Apex Arrow */}
          <SingleHeatPathway
            position={[0, R + 1.2, 0]}
            direction={[0, 1, 0]}
            normMagnitude={roofNorm}
            pct={pct.roof}
            label="Dome Shell"
            flowDirection={flowDirection}
            showLabel={true}
          />
          {/* Radial Envelope Arrows */}
          <SingleHeatPathway
            position={[R * 0.7, 1.2, R * 0.7]}
            direction={[0.7, 0.5, 0.7]}
            normMagnitude={wallNorm}
            pct={pct.walls}
            label="Walls"
            flowDirection={flowDirection}
            showLabel={true}
          />
          <SingleHeatPathway
            position={[-R * 0.7, 1.2, -R * 0.7]}
            direction={[-0.7, 0.5, -0.7]}
            normMagnitude={wallNorm}
            pct={pct.walls}
            flowDirection={flowDirection}
            showLabel={false}
          />
          {/* Window Band Arrow */}
          <SingleHeatPathway
            position={[0, 0.8, R * 0.95]}
            direction={[0, 0, 1]}
            normMagnitude={winNorm}
            pct={pct.windows}
            label="Windows"
            flowDirection={flowDirection}
            showLabel={true}
          />
          {/* Floor Foundation Arrow */}
          <SingleHeatPathway
            position={[0, 0.05, 0]}
            direction={[0, -1, 0]}
            normMagnitude={floorNorm}
            pct={pct.floor}
            label="Floor"
            flowDirection={flowDirection}
            showLabel={true}
          />
        </group>
      )}

      {/* 3. A-FRAME SHELTER HEAT PATHWAYS */}
      {(normShape === 'a-frame' || normShape === 'aframe') && (
        <group>
          {/* Left Roof Face Arrow */}
          <SingleHeatPathway
            position={[-W * 0.25, ridgeH * 0.5, 0]}
            direction={[-0.7, 0.7, 0]}
            normMagnitude={roofNorm}
            pct={pct.roof}
            label="Roof Slope"
            flowDirection={flowDirection}
            showLabel={true}
          />
          {/* Right Roof Face Arrow */}
          <SingleHeatPathway
            position={[W * 0.25, ridgeH * 0.5, 0]}
            direction={[0.7, 0.7, 0]}
            normMagnitude={roofNorm}
            pct={pct.roof}
            flowDirection={flowDirection}
            showLabel={false}
          />
          {/* Front End-Wall Arrow */}
          <SingleHeatPathway
            position={[0, ridgeH * 0.35, -L / 2]}
            direction={[0, 0, -1]}
            normMagnitude={wallNorm}
            pct={pct.walls}
            label="End Walls"
            flowDirection={flowDirection}
            showLabel={true}
          />
          {/* Window Arrow */}
          <SingleHeatPathway
            position={[0, ridgeH * 0.62, -L / 2 - 0.05]}
            direction={[0, 0, -1]}
            normMagnitude={winNorm}
            pct={pct.windows}
            label="Windows"
            flowDirection={flowDirection}
            showLabel={true}
          />
          {/* Floor Arrow */}
          <SingleHeatPathway
            position={[0, 0.05, 0]}
            direction={[0, -1, 0]}
            normMagnitude={floorNorm}
            pct={pct.floor}
            label="Floor"
            flowDirection={flowDirection}
            showLabel={true}
          />
        </group>
      )}

      {/* 4. QUONSET SHELTER HEAT PATHWAYS */}
      {normShape === 'quonset' && (
        <group>
          {/* Arch Top Arrow */}
          <SingleHeatPathway
            position={[0, W / 2 + 0.2, 0]}
            direction={[0, 1, 0]}
            normMagnitude={roofNorm}
            pct={pct.roof}
            label="Arch Shell"
            flowDirection={flowDirection}
            showLabel={true}
          />
          {/* Arch Side Flank Arrow */}
          <SingleHeatPathway
            position={[W * 0.4, (W / 2) * 0.6, 0]}
            direction={[0.8, 0.4, 0]}
            normMagnitude={roofNorm}
            pct={pct.roof}
            flowDirection={flowDirection}
            showLabel={false}
          />
          {/* Front Semicircular End-Wall Arrow */}
          <SingleHeatPathway
            position={[0, (W / 2) * 0.4, -L / 2]}
            direction={[0, 0, -1]}
            normMagnitude={wallNorm}
            pct={pct.walls}
            label="End Walls"
            flowDirection={flowDirection}
            showLabel={true}
          />
          {/* Window Arrow */}
          <SingleHeatPathway
            position={[-W * 0.3, (W / 2) * 0.48, -L / 2 - 0.05]}
            direction={[0, 0, -1]}
            normMagnitude={winNorm}
            pct={pct.windows}
            label="Windows"
            flowDirection={flowDirection}
            showLabel={true}
          />
          {/* Floor Arrow */}
          <SingleHeatPathway
            position={[0, 0.05, 0]}
            direction={[0, -1, 0]}
            normMagnitude={floorNorm}
            pct={pct.floor}
            label="Floor"
            flowDirection={flowDirection}
            showLabel={true}
          />
        </group>
      )}
    </group>
  );
}
