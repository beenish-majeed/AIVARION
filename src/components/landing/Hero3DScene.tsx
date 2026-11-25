import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface AbstractGlowFieldProps {
  isPaused: boolean;
  pullProgress?: number;
}

// Procedural soft blurred circular texture for glowing points of light
function createSoftGlowTexture(): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.2, 'rgba(255, 220, 245, 0.9)');
    gradient.addColorStop(0.45, 'rgba(255, 45, 168, 0.4)');
    gradient.addColorStop(0.8, 'rgba(255, 45, 168, 0.08)');
    gradient.addColorStop(1, 'rgba(11, 11, 11, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  return texture;
}

const ParticleRibbonWave: React.FC<AbstractGlowFieldProps> = ({ isPaused, pullProgress = 0 }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const groupRef = useRef<THREE.Group>(null);
  const mouse = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isFinePointer = window.matchMedia('(pointer: fine)').matches;
    if (!isFinePointer) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      mouse.current.targetX = (e.clientX / innerWidth) * 2 - 1;
      mouse.current.targetY = -(e.clientY / innerHeight) * 2 + 1;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // 1200 points of light in pink and white arranged in a wave/curved ribbon
  const particleCount = 1200;

  const [positions, initialPositions, colors, scales] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const initPos = new Float32Array(particleCount * 3);
    const cols = new Float32Array(particleCount * 3);
    const scs = new Float32Array(particleCount);

    const pink = new THREE.Color('#FF2DA8');
    const white = new THREE.Color('#FFFFFF');
    const lightPink = new THREE.Color('#FF80D0');

    for (let i = 0; i < particleCount; i++) {
      // Parametric ribbon spine: u along ribbon length [-3.8, 3.8]
      const u = (Math.random() - 0.5) * 7.6;
      // Cross ribbon coordinate v [-1.1, 1.1]
      const v = (Math.random() - 0.5) * 2.2;
      // Gentle depth displacement w [-0.8, 0.8]
      const w = (Math.random() - 0.5) * 1.6;

      // Ribbon wave formula
      const spineY = Math.sin(u * 0.75) * 0.85 + Math.cos(u * 0.35) * 0.4;
      const spineZ = Math.sin(u * 0.55) * 1.1;

      // Normal and binormal offsets to form curved ribbon volume
      const x = u + (Math.random() - 0.5) * 0.35;
      const y = spineY + v * 0.65 + (Math.random() - 0.5) * 0.25;
      const z = spineZ + w * 0.5 + (Math.random() - 0.5) * 0.35;

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      initPos[i * 3] = x;
      initPos[i * 3 + 1] = y;
      initPos[i * 3 + 2] = z;

      // Colors: ~60% Hot Pink, ~25% Light Pink, ~15% Pure White highlights
      const rnd = Math.random();
      const chosenColor = rnd < 0.6 ? pink : rnd < 0.85 ? lightPink : white;
      cols[i * 3] = chosenColor.r;
      cols[i * 3 + 1] = chosenColor.g;
      cols[i * 3 + 2] = chosenColor.b;

      // Scale variation for depth
      scs[i] = 0.5 + Math.random() * 0.9;
    }

    return [pos, initPos, cols, scs];
  }, [particleCount]);

  const glowTexture = useMemo(() => createSoftGlowTexture(), []);

  useFrame((state) => {
    if (isPaused) return;

    // Organic pointer damping
    mouse.current.x += (mouse.current.targetX - mouse.current.x) * 0.05;
    mouse.current.y += (mouse.current.targetY - mouse.current.y) * 0.05;

    const time = state.clock.getElapsedTime();

    if (groupRef.current) {
      // Gentle floating motion and mouse parallax
      groupRef.current.rotation.y = time * 0.08 + mouse.current.x * 0.15;
      groupRef.current.rotation.x = Math.sin(time * 0.15) * 0.06 + mouse.current.y * 0.12;
      groupRef.current.rotation.z = Math.cos(time * 0.12) * 0.04;
    }

    if (pointsRef.current) {
      const geo = pointsRef.current.geometry;
      const posAttr = geo.attributes.position as THREE.BufferAttribute;

      for (let i = 0; i < particleCount; i++) {
        const idx = i * 3;
        const ix = initialPositions[idx];
        const iy = initialPositions[idx + 1];
        const iz = initialPositions[idx + 2];

        // Wave undulation across the ribbon
        const wave = Math.sin(time * 0.8 + ix * 0.9 + iz * 0.5) * 0.12;
        const driftX = Math.cos(time * 0.3 + i * 0.05) * 0.03;
        const driftZ = Math.sin(time * 0.35 + i * 0.05) * 0.03;

        posAttr.array[idx] = ix + driftX;
        posAttr.array[idx + 1] = iy + wave;
        posAttr.array[idx + 2] = iz + driftZ;
      }
      posAttr.needsUpdate = true;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.24}
          vertexColors
          map={glowTexture}
          transparent
          opacity={0.88}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          sizeAttenuation
        />
      </points>
      <ambientLight intensity={0.25} />
      <pointLight color="#FF2DA8" intensity={2} distance={8} position={[0, 0, 1]} />
    </group>
  );
};

interface Hero3DSceneProps {
  isPaused?: boolean;
  pullProgress?: number;
}

export const Hero3DScene: React.FC<Hero3DSceneProps> = ({ isPaused = false, pullProgress = 0 }) => {
  return (
    <div className="w-full h-full min-h-[380px] sm:min-h-[500px] relative pointer-events-none select-none">
      <Canvas
        camera={{ position: [0, 0, 5.0], fov: 46 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        dpr={[1, 1.5]}
      >
        <ParticleRibbonWave isPaused={isPaused} pullProgress={pullProgress} />
      </Canvas>
    </div>
  );
};

export default Hero3DScene;
