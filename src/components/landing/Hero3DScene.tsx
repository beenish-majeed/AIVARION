import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface SceneObjectProps {
  isPaused: boolean;
}

const CoreRingMesh: React.FC<SceneObjectProps> = ({ isPaused }) => {
  const groupRef = useRef<THREE.Group>(null);
  const outerRingRef = useRef<THREE.Mesh>(null);
  const innerRingRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const glowLightRef = useRef<THREE.PointLight>(null);

  // Mouse coordinate interpolation target
  const mouse = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  // Scroll coordinate interpolation target
  const scrollOffset = useRef({ current: 0, target: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      mouse.current.targetX = (e.clientX / innerWidth) * 2 - 1;
      mouse.current.targetY = -(e.clientY / innerHeight) * 2 + 1;
    };

    const handleScroll = () => {
      scrollOffset.current.target = window.scrollY;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Hot Pink brand material
  const pinkMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color('#FF2DA8'),
      emissive: new THREE.Color('#800045'),
      emissiveIntensity: 0.35,
      metalness: 0.75,
      roughness: 0.22,
      wireframe: false,
    });
  }, []);

  // Dark core material with subtle chartreuse inner accent
  const coreMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color('#0B0B0B'),
      metalness: 0.9,
      roughness: 0.4,
    });
  }, []);

  // Subtle Chartreuse core accent
  const chartreuseMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color('#D4FF3F'),
      emissive: new THREE.Color('#D4FF3F'),
      emissiveIntensity: 0.8,
      metalness: 0.2,
      roughness: 0.1,
    });
  }, []);

  useFrame((state, delta) => {
    if (isPaused) return;

    // Smooth lerp mouse tracking with refined organic damping
    mouse.current.x += (mouse.current.targetX - mouse.current.x) * 0.08;
    mouse.current.y += (mouse.current.targetY - mouse.current.y) * 0.08;

    // Smooth lerp scroll tracking
    scrollOffset.current.current +=
      (scrollOffset.current.target - scrollOffset.current.current) * 0.07;
    const scrollFactor = scrollOffset.current.current * 0.002;

    const time = state.clock.getElapsedTime();

    if (groupRef.current) {
      // Coordinated 3D tilt and depth recession on pointer and scroll
      groupRef.current.rotation.x = -scrollFactor * 0.45 + mouse.current.y * 0.25;
      groupRef.current.rotation.y = scrollFactor * 0.75 + mouse.current.x * 0.35;
      groupRef.current.rotation.z = Math.sin(scrollFactor * 0.4) * 0.15;
      groupRef.current.position.y = -Math.min(1.4, scrollFactor * 0.6);
      groupRef.current.position.z = -Math.min(1.8, scrollFactor * 0.85);
    }

    if (outerRingRef.current) {
      outerRingRef.current.rotation.x = Math.sin(time * 0.4) * 0.25 + mouse.current.y * 0.45 + scrollFactor * 0.4;
      outerRingRef.current.rotation.y = time * 0.38 + mouse.current.x * 0.55 + scrollFactor * 0.6;
      outerRingRef.current.rotation.z = Math.cos(time * 0.3) * 0.15;
      const ringScale = 1 + Math.min(0.2, scrollFactor * 0.1);
      outerRingRef.current.scale.set(ringScale, ringScale, ringScale);
    }

    if (innerRingRef.current) {
      innerRingRef.current.rotation.x = -Math.sin(time * 0.3) * 0.22 - mouse.current.y * 0.35 - scrollFactor * 0.5;
      innerRingRef.current.rotation.y = -time * 0.28 - mouse.current.x * 0.45 - scrollFactor * 0.45;
      innerRingRef.current.rotation.z = Math.sin(time * 0.4) * 0.2;
    }

    if (coreRef.current) {
      coreRef.current.rotation.y = time * 0.22 + scrollFactor * 0.35;
      const pulse = 1 + Math.sin(time * 2) * 0.035;
      coreRef.current.scale.set(pulse, pulse, pulse);
    }

    if (glowLightRef.current) {
      const mouseDist = Math.sqrt(mouse.current.x * mouse.current.x + mouse.current.y * mouse.current.y);
      glowLightRef.current.intensity = 1.8 + Math.sin(time * 3) * 0.4 + Math.min(1.1, scrollFactor) + mouseDist * 0.45;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Outer Hot Pink Ribbon Ring (Torus) */}
      <mesh ref={outerRingRef} material={pinkMaterial}>
        <torusGeometry args={[2.2, 0.28, 36, 100]} />
      </mesh>

      {/* Secondary inclined Orbit Ribbon */}
      <mesh ref={innerRingRef} material={pinkMaterial} rotation={[Math.PI / 3, 0, Math.PI / 4]}>
        <torusGeometry args={[2.0, 0.14, 24, 80]} />
      </mesh>

      {/* Central Dark Core Sphere */}
      <mesh ref={coreRef} material={coreMaterial}>
        <sphereGeometry args={[1.0, 32, 32]} />
      </mesh>

      {/* Embedded Chartreuse Focus Sphere */}
      <mesh material={chartreuseMaterial} position={[0, 0, 0]}>
        <sphereGeometry args={[0.35, 24, 24]} />
      </mesh>

      {/* Lighting setup inside group */}
      <pointLight ref={glowLightRef} color="#FF2DA8" intensity={2} distance={8} />
      <pointLight color="#D4FF3F" intensity={1.2} distance={4} position={[0, 0, 1]} />
    </group>
  );
};

interface Hero3DSceneProps {
  isPaused?: boolean;
}

export const Hero3DScene: React.FC<Hero3DSceneProps> = ({ isPaused = false }) => {
  return (
    <div className="w-full h-full min-h-[380px] sm:min-h-[480px] relative pointer-events-none select-none">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 45 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        dpr={[1, 1.5]}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={1.5} color="#FFFFFF" />
        <directionalLight position={[-5, -5, -3]} intensity={0.8} color="#FF2DA8" />
        <CoreRingMesh isPaused={isPaused} />
      </Canvas>
    </div>
  );
};

export default Hero3DScene;
