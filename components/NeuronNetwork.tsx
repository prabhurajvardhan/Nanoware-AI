'use client';
import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function Network() {
  const group = useRef<THREE.Group>(null);
  const particleCount = 80;
  const maxDistance = 1.2;

  // Generate random points in a sphere
  const [positions, linesData] = useMemo(() => {
    const pos = [];
    for (let i = 0; i < particleCount; i++) {
        const r = 2.5 * Math.cbrt(Math.random());
        const theta = Math.random() * 2 * Math.PI;
        const phi = Math.acos(2 * Math.random() - 1);
        pos.push(new THREE.Vector3(
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.sin(phi) * Math.sin(theta),
          r * Math.cos(phi)
        ));
    }

    // Precalculate lines
    const lineIndices = [];
    for (let i = 0; i < particleCount; i++) {
      for (let j = i + 1; j < particleCount; j++) {
        if (pos[i].distanceTo(pos[j]) < maxDistance) {
          lineIndices.push(i, j);
        }
      }
    }

    const positionsArray = new Float32Array(particleCount * 3);
    pos.forEach((v, i) => {
        positionsArray[i*3] = v.x;
        positionsArray[i*3+1] = v.y;
        positionsArray[i*3+2] = v.z;
    });

    const linePositions = new Float32Array(lineIndices.length * 3);
    lineIndices.forEach((idx, i) => {
        linePositions[i*3] = pos[idx].x;
        linePositions[i*3+1] = pos[idx].y;
        linePositions[i*3+2] = pos[idx].z;
    });

    return [positionsArray, linePositions];
  }, []);

  useFrame((state, delta) => {
    if (group.current) {
      group.current.rotation.y -= delta * 0.05;
      group.current.rotation.x += delta * 0.02;
    }
  });

  return (
    <group ref={group}>
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={positions.length / 3}
            array={positions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial size={0.04} color="#0F172A" opacity={0.6} transparent sizeAttenuation />
      </points>

      <lineSegments>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={linesData.length / 3}
            array={linesData}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#C6A15B" opacity={0.15} transparent linewidth={1} />
      </lineSegments>
    </group>
  );
}

export default function NeuronNetwork() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none opacity-60">
      <Canvas camera={{ position: [0, 0, 4.5], fov: 60 }}>
        <ambientLight intensity={1.0} />
        <Network />
      </Canvas>
    </div>
  );
}
