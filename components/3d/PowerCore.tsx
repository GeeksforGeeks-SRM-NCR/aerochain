import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, Group } from 'three';
import * as THREE from 'three';

// Fix for TypeScript errors
declare global {
  namespace JSX {
    interface IntrinsicElements {
      group: any;
      mesh: any;
      icosahedronGeometry: any;
      meshStandardMaterial: any;
      octahedronGeometry: any;
      torusGeometry: any;
      dodecahedronGeometry: any;
      meshBasicMaterial: any;
      points: any;
      bufferGeometry: any;
      bufferAttribute: any;
      pointsMaterial: any;
      pointLight: any;
      ambientLight: any;
    }
  }
}

interface PowerCoreProps {
  scale?: number;
}

const PowerCore: React.FC<PowerCoreProps> = ({ scale = 1 }) => {
  const groupRef = useRef<Group>(null);
  const coreRef = useRef<Mesh>(null);
  const ringRef = useRef<Mesh>(null);
  const outerRef = useRef<Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);
  
  // Refs for smooth animation values (Linear Interpolation)
  const targetRotation = useRef({ x: 0, y: 0 });
  const currentRotation = useRef({ x: 0, y: 0 });

  // Generate particles
  const particleCount = 400;
  const positions = new Float32Array(particleCount * 3);
  for(let i=0; i<particleCount * 3; i++) {
    positions[i] = (Math.random() - 0.5) * 15;
  }

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const scrollY = window.scrollY; 
    
    // Smooth Mouse Tracking Logic
    // 1. Get target from mouse position
    targetRotation.current.x = state.pointer.y * 0.5; // Mouse Y controls Rotation X
    targetRotation.current.y = state.pointer.x * 0.5; // Mouse X controls Rotation Y

    // 2. Lerp current values towards target (0.1 factor for smoothness)
    currentRotation.current.x = THREE.MathUtils.lerp(currentRotation.current.x, targetRotation.current.x, 0.1);
    currentRotation.current.y = THREE.MathUtils.lerp(currentRotation.current.y, targetRotation.current.y, 0.1);

    if (groupRef.current) {
      // Base rotation + mouse influence
      groupRef.current.rotation.y = t * 0.1 + currentRotation.current.y;
      groupRef.current.rotation.x = currentRotation.current.x + (scrollY * 0.0005);
      
      // Smooth bobbing motion
      groupRef.current.position.y = Math.sin(t * 0.5) * 0.2 - (scrollY * 0.002);
    }
    
    if (coreRef.current) {
      // Smooth pulsing heartbeat
      coreRef.current.rotation.y = t * 0.5;
      coreRef.current.rotation.z = t * 0.2;
      
      const s = 1.0 + Math.sin(t * 2) * 0.05; // Gentle pulse
      coreRef.current.scale.set(s, s, s);
    }
    
    if (ringRef.current) {
      // Gyroscopic motion
      ringRef.current.rotation.x = t * 0.3;
      ringRef.current.rotation.y = t * 0.1;
      ringRef.current.scale.setScalar(1.6 + Math.sin(t * 1.5) * 0.05);
    }

    if (outerRef.current) {
       // Slow outer shell rotation
       outerRef.current.rotation.x = -t * 0.1;
       outerRef.current.rotation.z = t * 0.05;
       
       // Breathing scale
       const scale = 2.5 + Math.cos(t * 0.5) * 0.1;
       outerRef.current.scale.set(scale, scale, scale);
    }
    
    if (particlesRef.current) {
        particlesRef.current.rotation.y = -t * 0.05;
        particlesRef.current.position.y = -scrollY * 0.001;
    }
  });

  return (
    <group ref={groupRef} scale={scale}>
      {/* Inner Glowing Core */}
      <mesh ref={coreRef}>
        <icosahedronGeometry args={[1, 2]} />
        <meshStandardMaterial 
            color="#00F0FF" 
            emissive="#00F0FF" 
            emissiveIntensity={4} 
            wireframe={true}
        />
      </mesh>
      
      {/* Solid inner shape */}
      <mesh scale={0.8}>
        <octahedronGeometry args={[1, 0]} />
         <meshStandardMaterial 
            color="#050505" 
            roughness={0.2} 
            metalness={0.9} 
        />
      </mesh>

      {/* Rotating Ring - Cyan */}
      <mesh ref={ringRef} scale={1.8}>
        <torusGeometry args={[1.2, 0.02, 16, 100]} />
        <meshStandardMaterial 
            color="#000" 
            roughness={0.1} 
            metalness={1}
            emissive="#00F0FF"
            emissiveIntensity={0.8}
        />
      </mesh>

      {/* Outer Wireframe Shield */}
      <mesh ref={outerRef} scale={2.5}>
        <dodecahedronGeometry args={[1.5, 0]} />
        <meshBasicMaterial 
            color="#ffffff" 
            wireframe 
            transparent 
            opacity={0.05} 
        />
      </mesh>

      {/* Floating Particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
            <bufferAttribute 
                attach="attributes-position" 
                count={particleCount} 
                array={positions} 
                itemSize={3} 
            />
        </bufferGeometry>
        <pointsMaterial 
            size={0.06} 
            color="#00F0FF" 
            transparent 
            opacity={0.6} 
            sizeAttenuation 
        />
      </points>
      
      <pointLight position={[0, 0, 0]} intensity={6} color="#00F0FF" distance={15} />
      <ambientLight intensity={0.5} />
    </group>
  );
};

export default PowerCore;