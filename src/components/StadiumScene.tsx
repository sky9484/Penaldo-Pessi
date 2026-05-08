import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Physics, RigidBody, CuboidCollider, RapierRigidBody } from '@react-three/rapier';
import { Environment, OrbitControls, Sky } from '@react-three/drei';
import * as THREE from 'three';

import { useGameStore } from '../store/useGameStore';

function Striker({ isKicking }: { isKicking: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const legRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const torsoRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Mesh>(null);

  const kickPhase = useRef(0);

  useFrame((state, delta) => {
    if (!legRef.current || !torsoRef.current || !leftArmRef.current || !rightArmRef.current || !groupRef.current || !leftLegRef.current) return;
    
    if (isKicking) {
      kickPhase.current += delta;
      
      // 'Soccer Penalty Kick' Animation
      // Phase 1: Run Up (0 - 0.3s)
      if (kickPhase.current < 0.3) {
        groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, 4.8, 10 * delta);
        const runCycle = Math.sin(kickPhase.current * 30);
        leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, runCycle * 0.8, 15 * delta);
        rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, -runCycle * 0.8, 15 * delta);
        leftLegRef.current.rotation.x = THREE.MathUtils.lerp(leftLegRef.current.rotation.x, -runCycle * 0.8, 15 * delta);
        legRef.current.rotation.x = THREE.MathUtils.lerp(legRef.current.rotation.x, runCycle * 0.8, 15 * delta);
        torsoRef.current.rotation.x = THREE.MathUtils.lerp(torsoRef.current.rotation.x, Math.PI / 12, 10 * delta);
        torsoRef.current.position.y = THREE.MathUtils.lerp(torsoRef.current.position.y, 1.2, 10 * delta);
        groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, 0, 10 * delta);
      } 
      // Phase 2: Wind Up (0.3s - 0.5s)
      else if (kickPhase.current < 0.5) {
        leftLegRef.current.rotation.x = THREE.MathUtils.lerp(leftLegRef.current.rotation.x, 0, 15 * delta);
        legRef.current.rotation.x = THREE.MathUtils.lerp(legRef.current.rotation.x, -Math.PI / 2.5, 20 * delta); // Leg way back
        torsoRef.current.rotation.x = THREE.MathUtils.lerp(torsoRef.current.rotation.x, Math.PI / 8, 15 * delta);
        torsoRef.current.rotation.y = THREE.MathUtils.lerp(torsoRef.current.rotation.y, -Math.PI / 12, 10 * delta);
        leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, -Math.PI / 3, 15 * delta);
        rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, Math.PI / 3, 15 * delta);
        torsoRef.current.position.y = THREE.MathUtils.lerp(torsoRef.current.position.y, 1.2, 10 * delta);
        groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, 0, 10 * delta);
      } 
      // Phase 3: Strike - Foot reaches ball exactly at 0.6s (0.5s - 0.6s)
      else if (kickPhase.current < 0.6) {
        groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, 4.4, 15 * delta); // Step into kick
        legRef.current.rotation.x = THREE.MathUtils.lerp(legRef.current.rotation.x, 0.2, 40 * delta); // Rapid forward swing to hit ball
        torsoRef.current.rotation.x = THREE.MathUtils.lerp(torsoRef.current.rotation.x, -Math.PI / 16, 20 * delta);
        torsoRef.current.rotation.y = THREE.MathUtils.lerp(torsoRef.current.rotation.y, 0, 15 * delta);
        leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, Math.PI / 6, 20 * delta);
        rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, -Math.PI / 4, 20 * delta);
        torsoRef.current.position.y = THREE.MathUtils.lerp(torsoRef.current.position.y, 1.2, 10 * delta);
        groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, 0, 10 * delta);
      }
      // Phase 4: Follow Through (0.6s - 0.8s) - Impulse happens precisely at start of this phase
      else {
        legRef.current.rotation.x = THREE.MathUtils.lerp(legRef.current.rotation.x, Math.PI / 2.5, 15 * delta); // Follow through high
        torsoRef.current.rotation.x = THREE.MathUtils.lerp(torsoRef.current.rotation.x, -Math.PI / 8, 10 * delta);
      }
    } else {
      kickPhase.current = 0;
      
      // 'Idle' Animation: Step back smoothly and breathe
      groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, 6.0, 5 * delta);
      groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, 0.5, 5 * delta);
      
      legRef.current.rotation.x = THREE.MathUtils.lerp(legRef.current.rotation.x, 0, 10 * delta);
      leftLegRef.current.rotation.x = THREE.MathUtils.lerp(leftLegRef.current.rotation.x, 0, 10 * delta);
      torsoRef.current.rotation.x = THREE.MathUtils.lerp(torsoRef.current.rotation.x, 0, 10 * delta);
      torsoRef.current.rotation.y = THREE.MathUtils.lerp(torsoRef.current.rotation.y, 0, 10 * delta);
      
      const idleTime = state.clock.elapsedTime;
      const targetTorsoY = 1.2 + Math.sin(idleTime * 2) * 0.05;
      torsoRef.current.position.y = THREE.MathUtils.lerp(torsoRef.current.position.y, targetTorsoY, 5 * delta);
      
      const bob = Math.sin(idleTime * 4) * 0.1;
      leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, bob, 5 * delta);
      rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, -bob, 5 * delta);
      
      const targetGroupY = Math.max(0, Math.sin(idleTime * 8) * 0.02);
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetGroupY, 5 * delta);
    }
  });

  return (
    <group ref={groupRef} position={[0.5, 0, 6.0]}>
      {/* Torso Group to allow leaning */}
      <group ref={torsoRef} position={[0, 1.2, 0]}>
        <mesh position={[0, 0.3, 0]} castShadow>
          <boxGeometry args={[0.6, 1.2, 0.4]} />
          <meshStandardMaterial color="#4f46e5" />
        </mesh>
        {/* Head */}
        <mesh position={[0, 1.1, 0]} castShadow>
          <sphereGeometry args={[0.25]} />
          <meshStandardMaterial color="#fcd34d" />
        </mesh>

        {/* Left Arm */}
        <group ref={leftArmRef} position={[-0.35, 0.8, 0]}>
          <mesh position={[-0.1, -0.4, 0]} castShadow>
            <boxGeometry args={[0.15, 0.8, 0.15]} />
            <meshStandardMaterial color="#c7d2fe" />
          </mesh>
        </group>
        
        {/* Right Arm */}
        <group ref={rightArmRef} position={[0.35, 0.8, 0]}>
          <mesh position={[0.1, -0.4, 0]} castShadow>
            <boxGeometry args={[0.15, 0.8, 0.15]} />
            <meshStandardMaterial color="#c7d2fe" />
          </mesh>
        </group>
      </group>

      {/* Left Leg (Plant) */}
      <mesh ref={leftLegRef} position={[-0.2, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 1]} />
        <meshStandardMaterial color="#1e3a8a" />
      </mesh>
      
      {/* Right Leg (Kicking), pivot from top */}
      <group position={[0.2, 1, 0]} ref={legRef}>
        <mesh position={[0, -0.5, 0]} castShadow>
          <cylinderGeometry args={[0.1, 0.1, 1]} />
          <meshStandardMaterial color="#1e3a8a" />
        </mesh>
        {/* Foot */}
        <mesh position={[0, -1, 0.1]} castShadow>
          <boxGeometry args={[0.2, 0.1, 0.3]} />
          <meshStandardMaterial color="#111827" />
        </mesh>
      </group>
    </group>
  );
}

function PitchLines() {
  return (
    <group position={[0, 0.01, 0]}>
      {/* Main Goal Line */}
      <mesh position={[0, 0, -10]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[40, 0.1]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
      </mesh>

      {/* Goal Area (Small Box) - width 12, depth 4 */}
      <mesh position={[0, 0, -6]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12, 0.1]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
      </mesh>
      <mesh position={[-6, 0, -8]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.1, 4]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
      </mesh>
      <mesh position={[6, 0, -8]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.1, 4]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
      </mesh>

      {/* Penalty Area (Large Box) - width 26, depth 16.5 */}
      {/* Box ends at z = 6.5 (from -10) */}
      <mesh position={[0, 0, 6.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[26, 0.1]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
      </mesh>
      <mesh position={[-13, 0, -1.75]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.1, 16.5]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
      </mesh>
      <mesh position={[13, 0, -1.75]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.1, 16.5]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
      </mesh>

      {/* Penalty Spot */}
      <mesh position={[0, 0, 4]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.2, 32]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
      </mesh>

      {/* Penalty Arc (Semi-circle outside the penalty area) */}
      <mesh position={[0, 0, 4]} rotation={[-Math.PI / 2, 0, 0]}>
        {/* RingGeometry: innerRadius, outerRadius, thetaSegments, phiSegments, thetaStart, thetaLength */}
        <ringGeometry args={[4.9, 5, 32, 1, Math.PI - 1.05, 2.1]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
      </mesh>
    </group>
  );
}

function StadiumStands() {
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const count = 3000;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  const colorArray = useMemo(() => {
    const colors = [new THREE.Color('#ef4444'), new THREE.Color('#3b82f6'), new THREE.Color('#ffffff')];
    const array = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      color.toArray(array, i * 3);
    }
    return array;
  }, [count]);

  useEffect(() => {
    if (meshRef.current) {
      let idx = 0;
      for (let side = 0; side < 3; side++) {
        for (let i = 0; i < 1000; i++) {
          const rank = Math.floor(i / 100); 
          const col = i % 100;
          
          let x, y, z;
          y = rank * 0.8 + 2;
          
          if (side === 0) { // Behind goal
            x = (col - 50) * 0.6;
            z = -15 - rank * 1.2;
          } else if (side === 1) { // Left
            x = -20 - rank * 1.2;
            z = (col - 30) * 0.6;
          } else { // Right
            x = 20 + rank * 1.2;
            z = (col - 30) * 0.6;
          }
          
          dummy.position.set(x, y, z);
          dummy.rotation.y = (Math.random() - 0.5) * 0.5;
          dummy.updateMatrix();
          meshRef.current.setMatrixAt(idx++, dummy.matrix);
        }
      }
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [dummy]);

  useFrame((state) => {
    if (meshRef.current) {
      // Crowd jumping effect
      meshRef.current.position.y = Math.max(0, Math.sin(state.clock.elapsedTime * 8) * 0.1);
    }
  });

  return (
    <group>
      {/* Bleacher blocks */}
      <mesh position={[0, 4, -20]} receiveShadow>
        <boxGeometry args={[80, 8, 12]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      <mesh position={[-25, 4, 0]} receiveShadow>
        <boxGeometry args={[12, 8, 60]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      <mesh position={[25, 4, 0]} receiveShadow>
        <boxGeometry args={[12, 8, 60]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>

      <instancedMesh ref={meshRef} args={[undefined as any, undefined as any, count]} castShadow receiveShadow>
        <boxGeometry args={[0.3, 0.6, 0.3]}>
          <instancedBufferAttribute attach="attributes-color" args={[colorArray, 3]} />
        </boxGeometry>
        <meshStandardMaterial vertexColors roughness={0.8} />
      </instancedMesh>
    </group>
  );
}

function Goalie({ ballRef }: { ballRef: React.RefObject<RapierRigidBody | null> }) {
  const goalieRef = useRef<RapierRigidBody>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (!ballRef.current || !goalieRef.current) return;

    const ballPos = ballRef.current.translation();
    const ballVel = ballRef.current.linvel();
    const goaliePos = goalieRef.current.translation();

    let targetX = 0;
    let targetY = 1.0;
    let diveState: 'idle' | 'left' | 'right' = 'idle';

    // React if the ball is moving fast enough towards the goal
    if (ballVel.z < -2 && ballPos.z > -10) {
      // Predict ball position at z = -9.5 (goalie's position)
      const timeToReachGoalie = (-9.5 - ballPos.z) / ballVel.z;
      
      if (timeToReachGoalie > 0) {
        // Calculate predicted intersection point based on velocity and time
        // Including a basic gravity estimate for Y
        const predictedX = ballPos.x + ballVel.x * timeToReachGoalie;
        const predictedY = Math.max(0.5, ballPos.y + ballVel.y * timeToReachGoalie + 0.5 * -9.81 * (timeToReachGoalie * timeToReachGoalie)); 

        targetX = THREE.MathUtils.clamp(predictedX, -3.5, 3.5);
        targetY = THREE.MathUtils.clamp(predictedY, 1.0, 2.5);

        if (targetX < -1.0) diveState = 'left';
        else if (targetX > 1.0) diveState = 'right';
      }
    }

    // Move goalie towards target smoothly
    const speed = 6.0; // Reaction speed
    goalieRef.current.setNextKinematicTranslation({
      x: THREE.MathUtils.lerp(goaliePos.x, targetX, speed * delta),
      y: THREE.MathUtils.lerp(goaliePos.y, targetY, speed * delta),
      z: -9.5 // Stay on the line
    });

    // Rotate the Rigidbody for diving
    const currentRot = goalieRef.current.rotation();
    const euler = new THREE.Euler().setFromQuaternion(new THREE.Quaternion(currentRot.x, currentRot.y, currentRot.z, currentRot.w));
    
    let targetRotZ = 0;
    if (diveState === 'left') targetRotZ = Math.PI / 2.2;
    else if (diveState === 'right') targetRotZ = -Math.PI / 2.2;
    
    euler.z = THREE.MathUtils.lerp(euler.z, targetRotZ, speed * delta);
    const nextQuat = new THREE.Quaternion().setFromEuler(euler);
    goalieRef.current.setNextKinematicRotation(nextQuat);

    // Animate arms based on dive state
    if (diveState === 'left') {
      if (leftArmRef.current) leftArmRef.current.rotation.z = THREE.MathUtils.lerp(leftArmRef.current.rotation.z, Math.PI / 1.5, speed * delta);
      if (rightArmRef.current) rightArmRef.current.rotation.z = THREE.MathUtils.lerp(rightArmRef.current.rotation.z, -Math.PI / 8, speed * delta);
    } else if (diveState === 'right') {
      if (rightArmRef.current) rightArmRef.current.rotation.z = THREE.MathUtils.lerp(rightArmRef.current.rotation.z, -Math.PI / 1.5, speed * delta);
      if (leftArmRef.current) leftArmRef.current.rotation.z = THREE.MathUtils.lerp(leftArmRef.current.rotation.z, Math.PI / 8, speed * delta);
    } else {
      // Idle arms
      const bob = Math.sin(state.clock.elapsedTime * 4) * 0.1;
      if (leftArmRef.current) leftArmRef.current.rotation.z = THREE.MathUtils.lerp(leftArmRef.current.rotation.z, Math.PI / 8 + bob, speed * delta);
      if (rightArmRef.current) rightArmRef.current.rotation.z = THREE.MathUtils.lerp(rightArmRef.current.rotation.z, -Math.PI / 8 - bob, speed * delta);
    }
  });

  return (
    <RigidBody 
      ref={goalieRef} 
      type="kinematicPosition" 
      position={[0, 1.0, -9.5]}
      colliders="hull"
    >
      <group>
        {/* Torso */}
        <mesh position={[0, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.8, 1.2, 0.4]} />
          <meshStandardMaterial color="#ef4444" roughness={0.6} />
        </mesh>
        {/* Head */}
        <mesh position={[0, 0.8, 0]} castShadow receiveShadow>
          <sphereGeometry args={[0.25]} />
          <meshStandardMaterial color="#fcd34d" />
        </mesh>
        
        {/* Left Arm Group */}
        <group ref={leftArmRef} position={[-0.45, 0.4, 0]}>
          <mesh position={[-0.1, -0.4, 0]} castShadow>
            <boxGeometry args={[0.2, 0.8, 0.2]} />
            <meshStandardMaterial color="#ef4444" />
          </mesh>
          {/* Hand/Glove */}
          <mesh position={[-0.1, -0.9, 0]} castShadow>
             <boxGeometry args={[0.25, 0.3, 0.25]} />
             <meshStandardMaterial color="#1f2937" />
          </mesh>
        </group>
        
        {/* Right Arm Group */}
        <group ref={rightArmRef} position={[0.45, 0.4, 0]}>
          <mesh position={[0.1, -0.4, 0]} castShadow>
            <boxGeometry args={[0.2, 0.8, 0.2]} />
            <meshStandardMaterial color="#ef4444" />
          </mesh>
           {/* Hand/Glove */}
          <mesh position={[0.1, -0.9, 0]} castShadow>
             <boxGeometry args={[0.25, 0.3, 0.25]} />
             <meshStandardMaterial color="#1f2937" />
          </mesh>
        </group>
        
        {/* Legs */}
        <mesh position={[0, -0.9, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.8, 0.6, 0.4]} />
          <meshStandardMaterial color="#1e3a8a" />
        </mesh>
      </group>
    </RigidBody>
  );
}

function GoalNet({ isHit }: { isHit: boolean }) {
  const netRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (!netRef.current) return;
    // Bulge backwards and pull the sides in slightly when hit
    const targetScaleZ = isHit ? 2.2 : 1;
    const targetScaleXY = isHit ? 0.95 : 1;
    
    // Animate the scale with different speeds for hit vs return
    const speed = isHit ? 12 : 4; 
    
    netRef.current.scale.z = THREE.MathUtils.lerp(netRef.current.scale.z, targetScaleZ, speed * delta);
    netRef.current.scale.y = THREE.MathUtils.lerp(netRef.current.scale.y, targetScaleXY, speed * delta);
    netRef.current.scale.x = THREE.MathUtils.lerp(netRef.current.scale.x, targetScaleXY, speed * delta);
  });

  return (
    <group position={[0, 1.5, 0]}>
      <group ref={netRef}>
        {/* The visual net. Anchored at z=0 so it stretches backwards (into negative z) */}
        <mesh position={[0, 0, -1]} receiveShadow>
          <boxGeometry args={[7.8, 2.9, 2]} />
          <meshStandardMaterial color="#dddddd" wireframe transparent opacity={0.4} />
        </mesh>
      </group>
    </group>
  );
}

function Confetti({ active }: { active: boolean }) {
  const count = 200;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  const particles = useMemo(() => {
    return Array.from({ length: count }, () => ({
      position: new THREE.Vector3((Math.random() - 0.5) * 8, Math.random() * 2 + 2, -9 + (Math.random() - 0.5) * 2),
      velocity: new THREE.Vector3((Math.random() - 0.5) * 8, Math.random() * 8 + 4, Math.random() * 4),
      rotation: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI),
      spin: new THREE.Euler(Math.random() * 10, Math.random() * 10, Math.random() * 10),
    }));
  }, [count]);

  const colorArray = useMemo(() => {
    const colors = [new THREE.Color('#fcd34d'), new THREE.Color('#3b82f6'), new THREE.Color('#ef4444'), new THREE.Color('#10b981'), new THREE.Color('#a855f7')];
    const array = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
       colors[Math.floor(Math.random() * colors.length)].toArray(array, i * 3);
    }
    return array;
  }, [count]);

  // Reset function
  const resetParticles = () => {
    particles.forEach(particle => {
      particle.position.set((Math.random() - 0.5) * 8, Math.random() * 2 + 2, -9 + (Math.random() - 0.5) * 2);
      particle.velocity.set((Math.random() - 0.5) * 8, Math.random() * 8 + 4, Math.random() * 4);
    });
  };

  useEffect(() => {
    if (active) resetParticles();
  }, [active]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    if (!active) {
      meshRef.current.visible = false;
      return;
    }
    meshRef.current.visible = true;

    particles.forEach((particle, i) => {
      particle.velocity.y -= 9.8 * delta; // Gravity
      particle.position.addScaledVector(particle.velocity, delta);
      particle.rotation.x += particle.spin.x * delta;
      particle.rotation.y += particle.spin.y * delta;
      particle.rotation.z += particle.spin.z * delta;

      // Bounce off ground
      if (particle.position.y < 0) {
        particle.position.y = 0;
        particle.velocity.y *= -0.5;
      }

      dummy.position.copy(particle.position);
      dummy.rotation.copy(particle.rotation);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined as any, undefined as any, count]} visible={false}>
      <planeGeometry args={[0.15, 0.15]} />
      <meshBasicMaterial vertexColors side={THREE.DoubleSide} />
      <instancedBufferAttribute attach="attributes-color" args={[colorArray, 3]} />
    </instancedMesh>
  );
}

function GoalFlash({ active }: { active: boolean }) {
  const lightRef = useRef<THREE.PointLight>(null);
  const timeActive = useRef(0);

  useEffect(() => {
    if (active) {
      timeActive.current = 0;
    }
  }, [active]);

  useFrame((state, delta) => {
    if (!lightRef.current) return;
    if (active) {
       timeActive.current += delta;
       // Quick flash: max intensity immediately, fade out over 1 second
       if (timeActive.current < 0.1) {
          lightRef.current.intensity = THREE.MathUtils.lerp(lightRef.current.intensity, 50, 30 * delta);
       } else if (timeActive.current < 1.0) {
          lightRef.current.intensity = THREE.MathUtils.lerp(lightRef.current.intensity, 0, 5 * delta);
       } else {
          lightRef.current.intensity = 0;
       }
    } else {
       lightRef.current.intensity = 0;
    }
  });

  return <pointLight ref={lightRef} position={[0, 4, -9]} intensity={0} distance={30} color="#ffffff" />;
}

export function StadiumScene({ ballRef }: { ballRef: React.RefObject<RapierRigidBody | null> }) {
  const [goalScored, setGoalScored] = useState(false);
  const { isKicking, setRoundResult, roundResult } = useGameStore();
  
  useEffect(() => {
    if (roundResult === 'GOAL') {
      setGoalScored(true);
      const timer = setTimeout(() => setGoalScored(false), 3000); // 3 seconds of confetti
      return () => clearTimeout(timer);
    } else {
      setGoalScored(false);
    }
  }, [roundResult]);

  // Goalposts material
  const goalMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.1 }), []);

  return (
    <Canvas shadows camera={{ position: [0, 4, 12], fov: 45 }}>
      <Sky sunPosition={[100, 20, 100]} turbidity={0.1} rayleigh={0.5} />
      <ambientLight intensity={0.5} />
      <directionalLight 
        castShadow 
        position={[10, 20, 10]} 
        intensity={1.5} 
        shadow-mapSize={[1024, 1024]}
      >
         <orthographicCamera attach="shadow-camera" args={[-10, 10, 10, -10]} />
      </directionalLight>

      <Physics>
        <StadiumStands />
        <Confetti active={goalScored} />
        <GoalFlash active={goalScored} />
        {/* Grass Pitch */}
        <RigidBody type="fixed" friction={2} restitution={0.5}>
          <mesh receiveShadow position={[0, -0.5, 0]}>
            <boxGeometry args={[80, 1, 80]} />
            <meshStandardMaterial color="#2d5a27" />
          </mesh>
        </RigidBody>

        <PitchLines />

        {/* The Goal */}
        <group position={[0, 0, -10]}>
          {/* Left Post */}
          <RigidBody type="fixed">
            <mesh castShadow receiveShadow position={[-4, 1.5, 0]} material={goalMaterial}>
              <cylinderGeometry args={[0.1, 0.1, 3]} />
            </mesh>
          </RigidBody>
          
          {/* Right Post */}
          <RigidBody type="fixed">
             <mesh castShadow receiveShadow position={[4, 1.5, 0]} material={goalMaterial}>
              <cylinderGeometry args={[0.1, 0.1, 3]} />
            </mesh>
          </RigidBody>
          
          {/* Crossbar */}
          <RigidBody type="fixed">
            <mesh castShadow receiveShadow position={[0, 3, 0]} rotation={[0, 0, Math.PI / 2]} material={goalMaterial}>
              <cylinderGeometry args={[0.1, 0.1, 8]} />
            </mesh>
          </RigidBody>

          <GoalNet isHit={goalScored} />

          {/* Goal Line Sensor */}
          <RigidBody 
            type="fixed" 
            sensor 
            onIntersectionEnter={() => {
              if (useGameStore.getState().roundResult !== 'GOAL') {
                setRoundResult('GOAL');
              }
            }}
          >
            {/* Placed just behind the goal line */}
            <CuboidCollider position={[0, 1.5, -0.5]} args={[3.8, 1.4, 0.5]} />
          </RigidBody>

          {/* Invisible Back Net Bounding Boxes */}
          <RigidBody type="fixed">
            <CuboidCollider position={[0, 1.5, -2]} args={[4, 1.5, 0.1]} /> {/* Back */}
            <CuboidCollider position={[-4, 1.5, -1]} args={[0.1, 1.5, 1]} /> {/* Left */}
            <CuboidCollider position={[4, 1.5, -1]} args={[0.1, 1.5, 1]} />  {/* Right */}
          </RigidBody>
        </group>

        {/* The AI Goalie */}
        <Goalie ballRef={ballRef} />

        {/* The Player / Striker */}
        <Striker isKicking={isKicking} />

        {/* The Soccer Ball */}
        <RigidBody 
          ref={ballRef}
          name="football"
          type="dynamic" 
          colliders="ball" 
          restitution={0.8}
          friction={0.5}
          position={[0, 0.5, 4]} // Penalty spot
          mass={0.43} // standard soccer ball mass in kg
        >
          <mesh castShadow receiveShadow>
            <sphereGeometry args={[0.3, 32, 32]} />
            <meshStandardMaterial color="#ffffff" roughness={0.4} />
          </mesh>
        </RigidBody>
      </Physics>

      <OrbitControls 
        enablePan={false} 
        enableZoom={false} 
        minPolarAngle={Math.PI / 4} 
        maxPolarAngle={Math.PI / 2 - 0.1}
      />
    </Canvas>
  );
}
