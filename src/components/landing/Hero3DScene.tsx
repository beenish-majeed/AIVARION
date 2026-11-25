import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface AbstractGlowFieldProps {
  isPaused: boolean;
  pullProgress?: number;
}

// Procedural soft circular glow texture for glowing particles
function createGlowDotTexture(): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 45, 168, 1)');
    gradient.addColorStop(0.2, 'rgba(255, 45, 168, 0.85)');
    gradient.addColorStop(0.5, 'rgba(255, 45, 168, 0.25)');
    gradient.addColorStop(1, 'rgba(11, 11, 11, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
  }
  return new THREE.CanvasTexture(canvas);
}

const GlowFieldObjects: React.FC<AbstractGlowFieldProps> = ({ isPaused, pullProgress = 0 }) => {
  const groupRef = useRef<THREE.Group>(null);
  const pointsRef = useRef<THREE.Points>(null);
  const streaksGroupRef = useRef<THREE.Group>(null);

  // Mouse coordinate interpolation target
  const mouse = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  useEffect(() => {
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

  // 1. Generate abstract particle field positions
  const particleCount = 750;
  const [positions, initialPositions, particleScales] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const initPos = new Float32Array(particleCount * 3);
    const scales = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      // Cylindrical / disc distribution with gentle 3D depth
      const radius = 0.5 + Math.pow(Math.random(), 0.7) * 2.8;
      const theta = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 2.2;

      const x = Math.cos(theta) * radius;
      const z = Math.sin(theta) * radius;

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      initPos[i * 3] = x;
      initPos[i * 3 + 1] = y;
      initPos[i * 3 + 2] = z;

      scales[i] = 0.6 + Math.random() * 0.8;
    }

    return [pos, initPos, scales];
  }, []);

  const pointTexture = useMemo(() => createGlowDotTexture(), []);

  // 2. Abstract soft light streaks (smooth 3D curves)
  const streakCurves = useMemo(() => {
    const curves = [];
    // 5 abstract orbital ribbon curves around center
    const configs = [
      { rx: 2.2, ry: 1.2, rz: 1.8, tiltX: 0.3, tiltY: 0.2, tiltZ: 0.1 },
      { rx: 1.9, ry: 1.7, rz: 1.3, tiltX: -0.4, tiltY: 0.5, tiltZ: -0.2 },
      { rx: 2.5, ry: 0.8, rz: 2.1, tiltX: 0.5, tiltY: -0.3, tiltZ: 0.4 },
      { rx: 1.6, ry: 2.0, rz: 1.5, tiltX: -0.2, tiltY: 0.4, tiltZ: 0.3 },
      { rx: 2.7, ry: 1.4, rz: 1.9, tiltX: 0.1, tiltY: -0.5, tiltZ: -0.3 },
    ];

    for (const c of configs) {
      const pts = [];
      const segments = 64;
      for (let i = 0; i <= segments; i++) {
        const t = (i / segments) * Math.PI * 2;
        const x = Math.cos(t) * c.rx;
        const y = Math.sin(t) * c.ry;
        const z = Math.sin(t * 2) * 0.4 + Math.cos(t) * c.rz * 0.3;

        // Apply tilts
        const p = new THREE.Vector3(x, y, z);
        p.applyAxisAngle(new THREE.Vector3(1, 0, 0), c.tiltX);
        p.applyAxisAngle(new THREE.Vector3(0, 1, 0), c.tiltY);
        p.applyAxisAngle(new THREE.Vector3(0, 0, 1), c.tiltZ);
        pts.push(p);
      }
      const curve = new THREE.CatmullRomCurve3(pts, true);
      curves.push(curve);
    }
    return curves;
  }, []);

  // Material for abstract light streaks in Hot Pink
  const streakMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: new THREE.Color('#FF2DA8'),
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
      wireframe: false,
    });
  }, []);

  useFrame((state, delta) => {
    if (isPaused) return;

    // Smooth subtle pointer response
    mouse.current.x += (mouse.current.targetX - mouse.current.x) * 0.05;
    mouse.current.y += (mouse.current.targetY - mouse.current.y) * 0.05;

    const time = state.clock.getElapsedTime();

    // Black hole pull and burst dynamics driven by pullProgress (0 to 1)
    let pullScale = 1;
    let pullRotation = 0;
    let pullOpacity = 1;

    if (pullProgress <= 0.45) {
      // Inward pull & spiral acceleration
      const norm = pullProgress / 0.45;
      pullScale = 1 - norm * 0.78;
      pullRotation = norm * Math.PI * 3;
      pullOpacity = 1;
    } else if (pullProgress <= 0.7) {
      // Compression & hold beat at vortex singularity
      pullScale = 0.22;
      pullRotation = Math.PI * 3 + (pullProgress - 0.45) * 4;
      pullOpacity = 1;
    } else {
      // Outward burst into next section
      const burstNorm = (pullProgress - 0.7) / 0.3;
      pullScale = 0.22 + burstNorm * 5.8;
      pullRotation = Math.PI * 3 + 1 + burstNorm * Math.PI * 2;
      pullOpacity = Math.max(0, 1 - burstNorm * 1.3);
    }

    if (groupRef.current) {
      // Coordinated tilt, mouse influence, and black hole pull
      groupRef.current.rotation.x = mouse.current.y * 0.18 + Math.sin(time * 0.15) * 0.04;
      groupRef.current.rotation.y = time * 0.12 + mouse.current.x * 0.22 + pullRotation * 0.6;
      groupRef.current.rotation.z = Math.cos(time * 0.12) * 0.03 + pullRotation * 0.4;
      groupRef.current.scale.set(pullScale, pullScale, pullScale);
    }

    if (streaksGroupRef.current) {
      streaksGroupRef.current.rotation.y = -time * 0.08 - pullRotation * 0.8;
      streaksGroupRef.current.rotation.x = Math.sin(time * 0.2) * 0.05;
      streaksGroupRef.current.scale.set(pullScale, pullScale, pullScale);
    }

    // Dynamic subtle particle drift
    if (pointsRef.current) {
      const geo = pointsRef.current.geometry;
      const posAttr = geo.attributes.position as THREE.BufferAttribute;
      const mat = pointsRef.current.material as THREE.PointsMaterial;
      if (mat) {
        mat.opacity = 0.8 * pullOpacity;
      }

      for (let i = 0; i < particleCount; i++) {
        const idx = i * 3;
        const initX = initialPositions[idx];
        const initY = initialPositions[idx + 1];
        const initZ = initialPositions[idx + 2];

        // Wave undulation + vortex swirl
        const wave = Math.sin(time * 0.6 + initX * 1.5 + initZ * 1.5) * 0.08;

        posAttr.array[idx] = initX + Math.cos(time * 0.25 + i) * 0.04;
        posAttr.array[idx + 1] = initY + wave;
        posAttr.array[idx + 2] = initZ + Math.sin(time * 0.25 + i) * 0.04;
      }
      posAttr.needsUpdate = true;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Abstract Glowing Particle Cloud */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.16}
          map={pointTexture}
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          color="#FF2DA8"
        />
      </points>

      {/* Abstract Soft Light Streaks */}
      <group ref={streaksGroupRef}>
        {streakCurves.map((curve, idx) => (
          <mesh key={idx} material={streakMaterial}>
            <tubeGeometry args={[curve, 64, 0.018, 8, true]} />
          </mesh>
        ))}
      </group>

      {/* Center soft core glow light */}
      <pointLight color="#FF2DA8" intensity={2.5} distance={7} position={[0, 0, 0]} />
    </group>
  );
};

interface Hero3DSceneProps {
  isPaused?: boolean;
  pullProgress?: number;
}

export const Hero3DScene: React.FC<Hero3DSceneProps> = ({ isPaused = false, pullProgress = 0 }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => {
      // ResizeObserver ensures canvas renderer resizes cleanly with the window
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full absolute inset-0 pointer-events-none select-none overflow-hidden">
      <Canvas
        camera={{ position: [0, 0, 5.2], fov: 48 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        dpr={[1, 1.5]}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
      >
        <ambientLight intensity={0.25} />
        <GlowFieldObjects isPaused={isPaused} pullProgress={pullProgress} />
      </Canvas>
    </div>
  );
};

export default Hero3DScene;
