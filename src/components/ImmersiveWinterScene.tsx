'use client';

import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  Points, 
  PointMaterial, 
  Sky, 
  Stars, 
  Environment,
  Float,
  Text,
  Center,
  Sphere
} from '@react-three/drei';
import * as THREE from 'three';

// 3D Snowfall System
function SnowSystem({ count = 1000 }) {
  const meshRef = useRef<THREE.Points>(null);
  
  const particles = useMemo(() => {
    const temp = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      temp[i * 3] = (Math.random() - 0.5) * 100; // x
      temp[i * 3 + 1] = Math.random() * 100 - 20; // y
      temp[i * 3 + 2] = (Math.random() - 0.5) * 100; // z
    }
    return temp;
  }, [count]);

  const velocities = useMemo(() => {
    const temp = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      temp[i * 3] = (Math.random() - 0.5) * 0.2; // x velocity
      temp[i * 3 + 1] = -Math.random() * 0.5 - 0.1; // y velocity (falling)
      temp[i * 3 + 2] = (Math.random() - 0.5) * 0.2; // z velocity
    }
    return temp;
  }, [count]);

  useFrame((state) => {
    if (!meshRef.current) return;
    
    const positions = meshRef.current.geometry.attributes.position.array as Float32Array;
    
    for (let i = 0; i < count; i++) {
      // Update positions based on velocities
      positions[i * 3] += velocities[i * 3] + Math.sin(state.clock.elapsedTime + positions[i * 3] * 0.01) * 0.01;
      positions[i * 3 + 1] += velocities[i * 3 + 1];
      positions[i * 3 + 2] += velocities[i * 3 + 2];
      
      // Reset particles that fall too low
      if (positions[i * 3 + 1] < -30) {
        positions[i * 3 + 1] = 50;
        positions[i * 3] = (Math.random() - 0.5) * 100;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 100;
      }
    }
    
    meshRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <Points ref={meshRef} positions={particles} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#ffffff"
        size={0.3}
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
}

// 3D Floating Wisdom Crystals
function WisdomCrystals() {
  const crystals = useMemo<Array<{ position: [number, number, number]; text: string; color: string }>>(() => [
    { position: [-15, 8, -20], text: "Insight", color: "#a855f7" },
    { position: [20, 12, -30], text: "Harmony", color: "#3b82f6" },
    { position: [-8, 15, 10], text: "Presence", color: "#6366f1" },
    { position: [12, 6, 25], text: "Stillness", color: "#8b5cf6" },
    { position: [-25, 10, 5], text: "Wisdom", color: "#5b21b6" }
  ], []);

  return (
    <>
      {crystals.map((crystal, index) => (
        <Float
          key={index}
          position={crystal.position}
          rotationIntensity={0.3}
          floatIntensity={0.5}
          speed={0.5}
        >
          <Center>
            <group>
              {/* Crystal Geometry */}
              <Sphere args={[0.8, 8, 6]}>
                <meshPhysicalMaterial
                  color={crystal.color}
                  transmission={0.9}
                  opacity={0.7}
                  metalness={0.1}
                  roughness={0.1}
                  ior={1.4}
                  thickness={0.5}
                  transparent
                />
              </Sphere>
              
              {/* Glow Effect */}
              <Sphere args={[1.2, 16, 16]}>
                <meshBasicMaterial
                  color={crystal.color}
                  transparent
                  opacity={0.1}
                />
              </Sphere>
              
              {/* Floating Text */}
              <Text
                fontSize={0.5}
                position={[0, -2, 0]}
                color="#000000"
                anchorX="center"
                anchorY="middle"
              >
                {crystal.text}
              </Text>
            </group>
          </Center>
        </Float>
      ))}
    </>
  );
}

// Winter Landscape with Dreamy Movement
function WinterLandscape() {
  const mountainPositions = useMemo<Array<{ basePosition: [number, number, number]; size: [number, number, number]; swaySpeed: number; swayAmount: number }>>(() =>
    Array.from({ length: 8 }, () => ({
      basePosition: [
        (Math.random() - 0.5) * 150,
        Math.random() * 10 + 5,
        -50 - Math.random() * 50
      ] as [number, number, number],
      size: [
        Math.random() * 8 + 4,
        Math.random() * 15 + 10,
        8
      ] as [number, number, number],
      swaySpeed: Math.random() * 0.3 + 0.1,
      swayAmount: Math.random() * 2 + 1
    }))
  , []);

  const treePositions = useMemo<Array<{ basePosition: [number, number, number]; swaySpeed: number; swayAmount: number }>>(() =>
    Array.from({ length: 15 }, () => ({
      basePosition: [
        (Math.random() - 0.5) * 80,
        -2,
        (Math.random() - 0.5) * 60
      ] as [number, number, number],
      swaySpeed: Math.random() * 0.5 + 0.2,
      swayAmount: Math.random() * 1.5 + 0.5
    }))
  , []);

  return (
    <>
      {/* Ground plane with Eira's winter colors */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -5, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial 
          color="#f1f5f9" 
          roughness={0.6}
          metalness={0.2}
          emissive="#e0e7ff"
          emissiveIntensity={0.05}
        />
      </mesh>
      
      {/* Slowly Swaying Mountains */}
      {mountainPositions.map((mountain, i) => {
        const MountainMesh = () => {
          const meshRef = useRef<THREE.Mesh>(null);
          
          useFrame((state) => {
            if (!meshRef.current) return;
            // Very slow mountain sway - like they're breathing
            meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime * mountain.swaySpeed) * (mountain.swayAmount * 0.02);
            meshRef.current.position.x = mountain.basePosition[0] + Math.sin(state.clock.elapsedTime * mountain.swaySpeed * 0.7) * mountain.swayAmount;
          });
          
          return (
            <mesh
              ref={meshRef}
              position={mountain.basePosition}
              castShadow
            >
              <coneGeometry args={mountain.size} />
              <meshStandardMaterial 
                color="#cbd5e1" 
                emissive="#6366f1"
                emissiveIntensity={0.03}
                roughness={0.7}
                metalness={0.1}
              />
            </mesh>
          );
        };
        
        return <MountainMesh key={i} />;
      })}
      
      {/* Dreamy Swaying Trees */}
      {treePositions.map((tree, i) => {
        const TreeGroup = () => {
          const groupRef = useRef<THREE.Group>(null);
          
          useFrame((state) => {
            if (!groupRef.current) return;
            // Trees sway like they're in a gentle, mystical breeze
            groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * tree.swaySpeed) * (tree.swayAmount * 0.05);
            groupRef.current.position.x = tree.basePosition[0] + Math.sin(state.clock.elapsedTime * tree.swaySpeed * 0.8) * (tree.swayAmount * 0.3);
            groupRef.current.position.y = tree.basePosition[1] + Math.sin(state.clock.elapsedTime * tree.swaySpeed * 0.6) * (tree.swayAmount * 0.1);
          });
          
          return (
            <group ref={groupRef} position={tree.basePosition}>
              {/* Tree trunk with Eira's colors */}
              <mesh>
                <cylinderGeometry args={[0.3, 0.5, 4]} />
                <meshStandardMaterial 
                  color="#475569" 
                  emissive="#312e81"
                  emissiveIntensity={0.02}
                />
              </mesh>
              
              {/* Tree foliage with purple undertones */}
              <mesh position={[0, 3, 0]}>
                <coneGeometry args={[2, 4, 8]} />
                <meshStandardMaterial 
                  color="#1e293b" 
                  emissive="#4c1d95"
                  emissiveIntensity={0.04}
                  roughness={0.8}
                />
              </mesh>
              
              {/* Snow on tree with subtle indigo tint */}
              <mesh position={[0, 3.5, 0]}>
                <coneGeometry args={[1.8, 0.5, 8]} />
                <meshStandardMaterial 
                  color="#f8fafc" 
                  emissive="#e0e7ff"
                  emissiveIntensity={0.08}
                  roughness={0.3}
                  metalness={0.1}
                />
              </mesh>
            </group>
          );
        };
        
        return <TreeGroup key={i} />;
      })}
    </>
  );
}

// Aurora Effect with Eira's Purple-Blue Palette
function Aurora() {
  const meshRef = useRef<THREE.Mesh>(null);
  const mesh2Ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current || !mesh2Ref.current) return;
    const material1 = meshRef.current.material as THREE.MeshBasicMaterial;
    const material2 = mesh2Ref.current.material as THREE.MeshBasicMaterial;
    material1.opacity = 0.2 + Math.sin(state.clock.elapsedTime * 0.3) * 0.08;
    material2.opacity = 0.15 + Math.sin(state.clock.elapsedTime * 0.4 + 1) * 0.06;
  });
  
  return (
    <>
      {/* Primary aurora - purple */}
      <mesh ref={meshRef} position={[0, 25, -50]}>
        <planeGeometry args={[120, 25]} />
        <meshBasicMaterial
          color="#a855f7"
          transparent
          opacity={0.2}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Secondary aurora - blue */}
      <mesh ref={mesh2Ref} position={[30, 30, -60]}>
        <planeGeometry args={[80, 15]} />
        <meshBasicMaterial
          color="#3b82f6"
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
        />
      </mesh>
    </>
  );
}

// Camera Controller
function CameraController() {
  const { camera } = useThree();
  
  useFrame((state) => {
    // Gentle camera movement for immersion
    camera.position.x = Math.sin(state.clock.elapsedTime * 0.1) * 2;
    camera.position.y = 2 + Math.sin(state.clock.elapsedTime * 0.15) * 0.5;
    camera.lookAt(0, 0, 0);
  });
  
  return null;
}

// Main 3D Scene
function Scene() {
  return (
    <>
      {/* Eira's Signature Lighting */}
      <ambientLight intensity={0.3} color="#e0e7ff" /> {/* Indigo ambient */}
      <directionalLight
        position={[10, 20, 5]}
        intensity={0.6}
        color="#c7d2fe" 
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      {/* Additional purple accent lighting */}
      <pointLight
        position={[-20, 15, 10]}
        intensity={0.4}
        color="#a855f7"
        distance={100}
      />
      <pointLight
        position={[20, 12, -15]}
        intensity={0.3}
        color="#3b82f6"
        distance={80}
      />
      
      {/* Environment with Eira's Colors */}
      <Sky
        distance={450000}
        sunPosition={[0, 0.3, -1]}
        inclination={0.7}
        azimuth={0.3}
        mieCoefficient={0.005}
        mieDirectionalG={0.8}
        rayleigh={2}
        turbidity={20}
      />
      <Stars
        radius={300}
        depth={60}
        count={1000}
        factor={7}
        saturation={0}
        fade={true}
      />
      
      {/* 3D Elements */}
      <SnowSystem count={2000} />
      <WinterLandscape />
      <WisdomCrystals />
      <Aurora />
      
      {/* Camera */}
      <CameraController />
    </>
  );
}

// Main Component
export default function ImmersiveWinterScene() {
  return (
    <div className="absolute inset-0 -z-10">
      <Canvas
        shadows
        camera={{ 
          position: [0, 5, 15], 
          fov: 60,
          near: 0.1,
          far: 1000
        }}
        gl={{ 
          antialias: true, 
          alpha: true,
          powerPreference: "high-performance"
        }}
      >
        <Scene />
      </Canvas>
    </div>
  );
}