import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface AbstractGlowFieldProps {
  isPaused: boolean;
  pullProgress?: number;
}

// Procedural soft glowing bokeh disc texture with smooth photographic falloff
function createBokehDiscTexture(): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.18, 'rgba(255, 80, 190, 0.95)');
    gradient.addColorStop(0.48, 'rgba(255, 45, 168, 0.45)');
    gradient.addColorStop(0.8, 'rgba(255, 45, 168, 0.08)');
    gradient.addColorStop(1, 'rgba(11, 11, 11, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
  }
  return new THREE.CanvasTexture(canvas);
}

// Procedural large out-of-focus foreground bokeh disc (depth of field simulation)
function createForegroundBokehTexture(): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const gradient = ctx.createRadialGradient(64, 64, 18, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(255, 95, 195, 0.65)');
    gradient.addColorStop(0.45, 'rgba(255, 45, 168, 0.38)');
    gradient.addColorStop(0.82, 'rgba(255, 45, 168, 0.12)');
    gradient.addColorStop(1, 'rgba(11, 11, 11, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
  }
  return new THREE.CanvasTexture(canvas);
}

const GlowFieldObjects: React.FC<AbstractGlowFieldProps> = ({ isPaused, pullProgress = 0 }) => {
  const groupRef = useRef<THREE.Group>(null);
  const wavePointsRef = useRef<THREE.Points>(null);
  const bokehPointsRef = useRef<THREE.Points>(null);
  const bgPointsRef = useRef<THREE.Points>(null);
  const coreGlowRef = useRef<THREE.Mesh>(null);

  // Mouse coordinate interpolation target for organic follower response
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

  // Textures
  const bokehTexture = useMemo(() => createBokehDiscTexture(), []);
  const foregroundBokehTexture = useMemo(() => createForegroundBokehTexture(), []);

  // 1. Layer 1: Midground Crescent Valley Particle Wave (1250 particles)
  // Forms a sweeping 3D amphitheater/valley dipping low in the center-bottom and wrapping up the sides
  const waveParticleCount = 1250;
  const [wavePositions, waveInitialPos, waveColors] = useMemo(() => {
    const pos = new Float32Array(waveParticleCount * 3);
    const initPos = new Float32Array(waveParticleCount * 3);
    const colors = new Float32Array(waveParticleCount * 3);

    const pinkColor = new THREE.Color('#FF2DA8');
    const roseColor = new THREE.Color('#FF68C5');
    const deepPink = new THREE.Color('#C4157A');
    const whiteColor = new THREE.Color('#FFFFFF');
    const chartreuseColor = new THREE.Color('#D4FF3F');

    for (let i = 0; i < waveParticleCount; i++) {
      const u = Math.random();
      const x = (u - 0.5) * 9.6; // span across viewport width
      const z = -12.0 + Math.random() * 16.0; // extended path for 5-6 second forward walking flythrough

      // Base crescent / U-shaped valley elevation:
      // High on wings (x = +/-4.2 -> y ~ 0.8), dipping low in center (x = 0 -> y ~ -1.4)
      const uValley = Math.pow(x / 4.5, 2);
      const baseY = -1.35 + uValley * 2.2 - (z * 0.04);

      // Organic rolling harmonic wave undulation
      const ripple = Math.sin(x * 0.85 + 0.5) * 0.32 + Math.cos(z * 0.8) * 0.2;

      // Vertical thickness dispersion (dense floral-particle meadow)
      const thickness = (Math.random() - 0.5) * 0.45;

      const y = baseY + ripple + thickness;

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      initPos[i * 3] = x;
      initPos[i * 3 + 1] = y;
      initPos[i * 3 + 2] = z;

      // Color variation in Hot Pink brand palette
      const randColor = Math.random();
      let chosenColor = pinkColor;
      if (randColor < 0.45) {
        chosenColor = pinkColor;
      } else if (randColor < 0.75) {
        chosenColor = roseColor;
      } else if (randColor < 0.94) {
        chosenColor = deepPink;
      } else if (randColor < 0.985) {
        chosenColor = whiteColor;
      } else {
        // Minimal chartreuse spark (1.5% of particles)
        chosenColor = chartreuseColor;
      }

      colors[i * 3] = chosenColor.r;
      colors[i * 3 + 1] = chosenColor.g;
      colors[i * 3 + 2] = chosenColor.b;
    }

    return [pos, initPos, colors];
  }, []);

  // 2. Layer 2: Foreground Depth-of-Field Bokeh Discs (65 large soft blur particles)
  const bokehCount = 65;
  const [bokehPositions, bokehInitPos] = useMemo(() => {
    const pos = new Float32Array(bokehCount * 3);
    const initPos = new Float32Array(bokehCount * 3);

    for (let i = 0; i < bokehCount; i++) {
      // Clustered near lower foreground close to camera
      const side = Math.random() > 0.5 ? 1 : -1;
      const x = side * (1.1 + Math.random() * 3.5);
      const y = -2.3 + Math.random() * 1.5;
      const z = 2.1 + Math.random() * 2.2;

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      initPos[i * 3] = x;
      initPos[i * 3 + 1] = y;
      initPos[i * 3 + 2] = z;
    }

    return [pos, initPos];
  }, []);

  // 3. Layer 3: Deep Background Atmospheric Depth (260 particles)
  const bgCount = 260;
  const [bgPositions, bgInitPos] = useMemo(() => {
    const pos = new Float32Array(bgCount * 3);
    const initPos = new Float32Array(bgCount * 3);

    for (let i = 0; i < bgCount; i++) {
      const x = (Math.random() - 0.5) * 11.0;
      const y = -0.8 + Math.random() * 4.0;
      const z = -4.2 + Math.random() * 2.5;

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      initPos[i * 3] = x;
      initPos[i * 3 + 1] = y;
      initPos[i * 3 + 2] = z;
    }

    return [pos, initPos];
  }, []);

  useFrame((state) => {
    if (isPaused) return;

    // Follower mouse easing
    mouse.current.x += (mouse.current.targetX - mouse.current.x) * 0.05;
    mouse.current.y += (mouse.current.targetY - mouse.current.y) * 0.05;

    const time = state.clock.getElapsedTime();

    // First-person forward walk motion through the particle valley (5-6s scroll distance)
    const walkAdvanceZ = pullProgress * 13.0;
    const walkCadence = pullProgress * Math.PI * 10;
    const walkBobY = Math.sin(walkCadence) * 0.075 * (pullProgress > 0 ? 1 : 0);
    const walkSwayX = Math.cos(walkCadence * 0.5) * 0.045 * (pullProgress > 0 ? 1 : 0);

    if (groupRef.current) {
      groupRef.current.position.z = walkAdvanceZ;
      groupRef.current.position.y = -walkBobY;
      groupRef.current.position.x = -walkSwayX + mouse.current.x * 0.16;
      groupRef.current.rotation.y = mouse.current.x * 0.07;
      groupRef.current.rotation.x = -mouse.current.y * 0.05;
    }

    // Dynamic wave undulation
    if (wavePointsRef.current) {
      const geo = wavePointsRef.current.geometry;
      const posAttr = geo.attributes.position as THREE.BufferAttribute;
      const mat = wavePointsRef.current.material as THREE.PointsMaterial;

      let walkOpacity = 0.88;
      if (pullProgress > 0.85) {
        // Soft cinematic fade at the conclusion of the walk into the next section
        walkOpacity = Math.max(0.1, 0.88 - (pullProgress - 0.85) * 4.5);
      }

      if (mat) {
        mat.opacity = walkOpacity;
      }

      for (let i = 0; i < waveParticleCount; i++) {
        const idx = i * 3;
        const ix = waveInitialPos[idx];
        const iy = waveInitialPos[idx + 1];
        const iz = waveInitialPos[idx + 2];

        // Organic undulating meadow wave
        const wave = Math.sin(time * 0.75 + ix * 0.75 + iz * 0.55) * 0.07;
        posAttr.array[idx] = ix;
        posAttr.array[idx + 1] = iy + wave;
        posAttr.array[idx + 2] = iz;
      }
      posAttr.needsUpdate = true;
    }

    // Foreground bokeh discs gentle floating drift
    if (bokehPointsRef.current) {
      const geo = bokehPointsRef.current.geometry;
      const posAttr = geo.attributes.position as THREE.BufferAttribute;
      const mat = bokehPointsRef.current.material as THREE.PointsMaterial;

      if (mat) {
        mat.opacity = Math.max(0, 0.45 - pullProgress * 0.6);
      }

      for (let i = 0; i < bokehCount; i++) {
        const idx = i * 3;
        const ix = bokehInitPos[idx];
        const iy = bokehInitPos[idx + 1];
        const iz = bokehInitPos[idx + 2];

        posAttr.array[idx] = ix + Math.sin(time * 0.32 + i) * 0.07 + mouse.current.x * 0.22;
        posAttr.array[idx + 1] = iy + Math.cos(time * 0.35 + i) * 0.06 + mouse.current.y * 0.14;
        posAttr.array[idx + 2] = iz;
      }
      posAttr.needsUpdate = true;
    }

    // Core glow pool pulsating intensity
    if (coreGlowRef.current) {
      const glowMat = coreGlowRef.current.material as THREE.MeshBasicMaterial;
      if (glowMat) {
        const pulse = 0.35 + Math.sin(time * 1.2) * 0.08;
        glowMat.opacity = Math.max(0, (pulse + pullProgress * 0.4) * (1 - pullProgress * 0.8));
      }
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Layer 3: Deep Background Atmospheric Stardust */}
      <points ref={bgPointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[bgPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.08}
          map={bokehTexture}
          transparent
          opacity={0.35}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          color="#FF2DA8"
        />
      </points>

      {/* Layer 1: Midground Crescent Valley Particle Wave */}
      <points ref={wavePointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[wavePositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[waveColors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.16}
          map={bokehTexture}
          vertexColors
          transparent
          opacity={0.88}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Layer 2: Foreground Depth-of-Field Bokeh Discs */}
      <points ref={bokehPointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[bokehPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.65}
          map={foregroundBokehTexture}
          transparent
          opacity={0.45}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          color="#FF2DA8"
        />
      </points>

      {/* Soft Luminous Light Pool in the Basin Center */}
      <mesh ref={coreGlowRef} position={[0, -1.35, 0.4]} rotation={[-Math.PI / 2.5, 0, 0]}>
        <planeGeometry args={[4.2, 2.4]} />
        <meshBasicMaterial
          map={foregroundBokehTexture}
          transparent
          opacity={0.38}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          color="#FF2DA8"
        />
      </mesh>

      {/* Cinematic Luminous Core Point Lights */}
      <pointLight color="#FF2DA8" intensity={3.0} distance={7} position={[0, -1.35, 0.6]} />
      <pointLight color="#FF68C5" intensity={1.6} distance={4.5} position={[0, -0.9, 1.1]} />
    </group>
  );
};

// Responsive camera framing for window resize & mobile orientation changes
const ResponsiveCamera: React.FC = () => {
  const { camera, size } = useThree();

  useEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;

    const aspect = size.width / Math.max(1, size.height);
    if (aspect < 0.8) {
      // Mobile portrait (390x844 etc)
      camera.fov = 64;
      camera.position.set(0, 0.2, 5.8);
    } else if (aspect < 1.3) {
      // Tablet / square
      camera.fov = 54;
      camera.position.set(0, 0.1, 5.4);
    } else {
      // Desktop / widescreen (1366x768, 1920x1080)
      camera.fov = 46;
      camera.position.set(0, 0, 5.0);
    }
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
  }, [camera, size]);

  return null;
};

interface Hero3DSceneProps {
  isPaused?: boolean;
  pullProgress?: number;
}

export const Hero3DScene: React.FC<Hero3DSceneProps> = ({ isPaused = false, pullProgress = 0 }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => {});
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full absolute inset-0 pointer-events-none select-none overflow-hidden">
      <Canvas
        camera={{ position: [0, 0, 5.0], fov: 46 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        dpr={[1, 1.5]}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
      >
        <ResponsiveCamera />
        <ambientLight intensity={0.25} />
        <GlowFieldObjects isPaused={isPaused} pullProgress={pullProgress} />
      </Canvas>
    </div>
  );
};

export default Hero3DScene;
