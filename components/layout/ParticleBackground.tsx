"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";

/**
 * ParticleBackground
 *
 * Renders a full-screen WebGL particle field behind the UI.
 * - Uses a single Points draw call (fast).
 * - Updates positions in-place each frame (no React re-renders).
 * - Reacts to mouse movement with a ripple + subtle swirl flow.
 *
 * Beginner note:
 * - In WebGL, we store many particle positions in a Float32Array.
 * - Each particle uses 3 numbers: x, y, z.
 * - Updating the array + marking it "needsUpdate" lets the GPU re-draw smoothly.
 */

const PARTICLE_CONFIG = {
  count: 2000,
  minRadius: 14,
  maxRadius: 26,
  size: 0.05,
  opacity: 0.6,
  mouseInfluence: 3.0,
  rippleDistance: 6.0,
  returnSpeed: 0.08,
  swirlStrength: 0.9,
  floatAmplitude: 0.35,
  floatFrequency: 0.55,
  rotationSpeed: { x: 0.04, y: 0.06 }, // radians per second
  colors: ["#d9823b", "#f0c36a", "#5b7f84", "#f5e9da"] as const,
} as const;

const LOGO_CONFIG = {
  count: 36, // balanced density so logos feel like easter eggs
  minRadius: 14,
  maxRadius: 24,
  size: 1.8,
  opacity: 0.9,
  floatAmplitude: 0.55,
  floatFrequency: 0.5,
  mouseInfluence: 1.35,
  swirlStrength: 0.4,
  returnSpeed: 0.12,
  alphaTest: 0.15,
} as const;

// A tiny deterministic "random" helper (pure and repeatable).
// We use this instead of Math.random() to satisfy strict React lint rules.
function fract(n: number) {
  return n - Math.floor(n);
}

function rand01(index: number, seed: number) {
  return fract(Math.sin(index * 12.9898 + seed * 78.233) * 43758.5453123);
}

const PALETTE = PARTICLE_CONFIG.colors.map((hex) => new THREE.Color(hex));

type MouseNdcRef = React.RefObject<{ x: number; y: number; active: boolean }>;

function ParticleField({ mouseNdcRef }: { mouseNdcRef: MouseNdcRef }) {
  const pointsRef = useRef<THREE.Points>(null);
  const posAttrRef = useRef<THREE.BufferAttribute>(null);
  const logoPointsRef = useRef<THREE.Points>(null);
  const logoPosAttrRef = useRef<THREE.BufferAttribute>(null);

  const logoTexture = useLoader(THREE.TextureLoader, "/logos/nano-banana.png");

  useEffect(() => {
    logoTexture.colorSpace = THREE.SRGBColorSpace;
    logoTexture.anisotropy = 8;
    logoTexture.needsUpdate = true;
  }, [logoTexture]);

  const data = useMemo(() => {
    const basePositions = new Float32Array(PARTICLE_CONFIG.count * 3);
    const colors = new Float32Array(PARTICLE_CONFIG.count * 3);
    const phases = new Float32Array(PARTICLE_CONFIG.count);
    const floatSpeeds = new Float32Array(PARTICLE_CONFIG.count);
    const initialPositions = new Float32Array(PARTICLE_CONFIG.count * 3);

    for (let i = 0; i < PARTICLE_CONFIG.count; i++) {
      // Even-ish distribution in a sphere (spherical coordinates)
      const radius =
        PARTICLE_CONFIG.minRadius +
        rand01(i, 1) * (PARTICLE_CONFIG.maxRadius - PARTICLE_CONFIG.minRadius);
      const theta = rand01(i, 2) * Math.PI * 2;
      const u = rand01(i, 3) * 2 - 1; // -1..1
      const phi = Math.acos(u);

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      const i3 = i * 3;
      initialPositions[i3] = x;
      initialPositions[i3 + 1] = y;
      initialPositions[i3 + 2] = z;

      basePositions[i3] = x;
      basePositions[i3 + 1] = y;
      basePositions[i3 + 2] = z;

      // Randomize colors (stored per-vertex)
      const c = PALETTE[Math.floor(rand01(i, 4) * PALETTE.length)];
      colors[i3] = c.r;
      colors[i3 + 1] = c.g;
      colors[i3 + 2] = c.b;

      // Per-particle animation controls
      phases[i] = rand01(i, 5) * Math.PI * 2;
      floatSpeeds[i] = 0.4 + rand01(i, 6) * 0.9;
    }

    return { initialPositions, basePositions, colors, phases, floatSpeeds };
  }, []);

  const logoData = useMemo(() => {
    const basePositions = new Float32Array(LOGO_CONFIG.count * 3);
    const initialPositions = new Float32Array(LOGO_CONFIG.count * 3);
    const phases = new Float32Array(LOGO_CONFIG.count);
    const floatSpeeds = new Float32Array(LOGO_CONFIG.count);

    for (let i = 0; i < LOGO_CONFIG.count; i++) {
      const radius =
        LOGO_CONFIG.minRadius +
        rand01(i, 11) * (LOGO_CONFIG.maxRadius - LOGO_CONFIG.minRadius);
      const theta = rand01(i, 12) * Math.PI * 2;
      const u = rand01(i, 13) * 2 - 1;
      const phi = Math.acos(u);

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      const i3 = i * 3;
      basePositions[i3] = x;
      basePositions[i3 + 1] = y;
      basePositions[i3 + 2] = z;

      initialPositions[i3] = x;
      initialPositions[i3 + 1] = y;
      initialPositions[i3 + 2] = z;

      phases[i] = rand01(i, 14) * Math.PI * 2;
      floatSpeeds[i] = 0.65 + rand01(i, 15) * 0.75;
    }

    return { basePositions, initialPositions, phases, floatSpeeds };
  }, []);

  // Mark the position attribute as dynamic (we update it every frame).
  useEffect(() => {
    if (posAttrRef.current) {
      posAttrRef.current.setUsage(THREE.DynamicDrawUsage);
    }
    if (logoPosAttrRef.current) {
      logoPosAttrRef.current.setUsage(THREE.DynamicDrawUsage);
    }
  }, []);

  // Reusable vectors to avoid allocations each frame.
  const mouseVector = useMemo(() => new THREE.Vector3(), []);
  const up = useMemo(() => new THREE.Vector3(0, 1, 0), []);

  useFrame((state, delta) => {
    if (!pointsRef.current || !posAttrRef.current) return;

    const mouse = mouseNdcRef.current;
    if (!mouse || !mouse.active) {
      mouseVector.set(9999, 9999, 0);
    } else {
      // Convert mouse from normalized screen space (-1..1) into our world-ish space.
      // The multipliers should "match" the particle spread, so the effect feels natural.
      mouseVector.set(mouse.x * 10, mouse.y * 7, 0);
    }

    const positions = posAttrRef.current.array as Float32Array;
    const { basePositions, phases, floatSpeeds } = data;
    const t = state.clock.elapsedTime;

    for (let i = 0; i < PARTICLE_CONFIG.count; i++) {
      const i3 = i * 3;
      const origX = basePositions[i3];
      const origY = basePositions[i3 + 1];
      const origZ = basePositions[i3 + 2];

      // Gentle breathing / float motion (keeps the scene alive even without mouse movement)
      const phase = phases[i];
      const floatOffset =
        Math.sin(t * PARTICLE_CONFIG.floatFrequency * floatSpeeds[i] + phase) *
        PARTICLE_CONFIG.floatAmplitude;

      // Distance to the mouse (in 3D world space)
      const dx = origX - mouseVector.x;
      const dy = origY - mouseVector.y;
      const dz = origZ - mouseVector.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist < PARTICLE_CONFIG.rippleDistance) {
        // Push away from the mouse (ripple)
        const force = (PARTICLE_CONFIG.rippleDistance - dist) / PARTICLE_CONFIG.rippleDistance;
        const len = dist > 0 ? dist : 1;
        const dirX = dx / len;
        const dirY = dy / len;
        const dirZ = dz / len;

        // Swirl (flow) perpendicular to the direction away from mouse
        // cross(dir, up) gives a sideways vector.
        const swirlX = dirY * up.z - dirZ * up.y;
        const swirlY = dirZ * up.x - dirX * up.z;
        const swirlZ = dirX * up.y - dirY * up.x;

        positions[i3] =
          origX +
          dirX * force * PARTICLE_CONFIG.mouseInfluence +
          swirlX * force * PARTICLE_CONFIG.swirlStrength;
        positions[i3 + 1] =
          origY +
          dirY * force * PARTICLE_CONFIG.mouseInfluence +
          swirlY * force * PARTICLE_CONFIG.swirlStrength;
        positions[i3 + 2] =
          origZ +
          dirZ * force * (PARTICLE_CONFIG.mouseInfluence * 0.55) +
          swirlZ * force * (PARTICLE_CONFIG.swirlStrength * 0.55);
      } else {
        // Smoothly return to base positions (lerp)
        positions[i3] = THREE.MathUtils.lerp(positions[i3], origX, PARTICLE_CONFIG.returnSpeed);
        positions[i3 + 1] = THREE.MathUtils.lerp(
          positions[i3 + 1],
          origY,
          PARTICLE_CONFIG.returnSpeed
        );
        positions[i3 + 2] = THREE.MathUtils.lerp(positions[i3 + 2], origZ, PARTICLE_CONFIG.returnSpeed);
      }

      // Add float after interaction so it stays visible.
      positions[i3] += floatOffset * 0.6;
      positions[i3 + 1] += floatOffset * 0.5;
      positions[i3 + 2] += floatOffset * 0.4;
    }

    posAttrRef.current.needsUpdate = true;

    // Subtle global rotation (slow parallax-like movement)
    pointsRef.current.rotation.x += PARTICLE_CONFIG.rotationSpeed.x * delta;
    pointsRef.current.rotation.y += PARTICLE_CONFIG.rotationSpeed.y * delta;

    if (!logoPosAttrRef.current || !logoPointsRef.current) return;

    const logoPositionArray = logoPosAttrRef.current.array as Float32Array;
    const {
      basePositions: logoBasePositions,
      phases: logoPhases,
      floatSpeeds: logoFloatSpeeds,
    } = logoData;

    for (let i = 0; i < LOGO_CONFIG.count; i++) {
      const i3 = i * 3;
      const origX = logoBasePositions[i3];
      const origY = logoBasePositions[i3 + 1];
      const origZ = logoBasePositions[i3 + 2];

      const phase = logoPhases[i];
      const floatOffset =
        Math.sin(t * LOGO_CONFIG.floatFrequency * logoFloatSpeeds[i] + phase) *
        LOGO_CONFIG.floatAmplitude;

      const dx = origX - mouseVector.x;
      const dy = origY - mouseVector.y;
      const dz = origZ - mouseVector.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist < PARTICLE_CONFIG.rippleDistance) {
        const force = (PARTICLE_CONFIG.rippleDistance - dist) / PARTICLE_CONFIG.rippleDistance;
        const len = dist > 0 ? dist : 1;
        const dirX = dx / len;
        const dirY = dy / len;
        const dirZ = dz / len;

        const swirlX = dirY * up.z - dirZ * up.y;
        const swirlY = dirZ * up.x - dirX * up.z;
        const swirlZ = dirX * up.y - dirY * up.x;

        logoPositionArray[i3] =
          origX +
          dirX * force * LOGO_CONFIG.mouseInfluence +
          swirlX * force * LOGO_CONFIG.swirlStrength;
        logoPositionArray[i3 + 1] =
          origY +
          dirY * force * LOGO_CONFIG.mouseInfluence +
          swirlY * force * LOGO_CONFIG.swirlStrength;
        logoPositionArray[i3 + 2] =
          origZ +
          dirZ * force * (LOGO_CONFIG.mouseInfluence * 0.65) +
          swirlZ * force * (LOGO_CONFIG.swirlStrength * 0.55);
      } else {
        logoPositionArray[i3] = THREE.MathUtils.lerp(
          logoPositionArray[i3],
          origX,
          LOGO_CONFIG.returnSpeed
        );
        logoPositionArray[i3 + 1] = THREE.MathUtils.lerp(
          logoPositionArray[i3 + 1],
          origY,
          LOGO_CONFIG.returnSpeed
        );
        logoPositionArray[i3 + 2] = THREE.MathUtils.lerp(
          logoPositionArray[i3 + 2],
          origZ,
          LOGO_CONFIG.returnSpeed
        );
      }

      // Small drift so logos feel alive; initial positions are baked into the buffer.
      logoPositionArray[i3] += floatOffset * 0.6;
      logoPositionArray[i3 + 1] += floatOffset * 0.5;
      logoPositionArray[i3 + 2] += floatOffset * 0.4;
    }

    logoPosAttrRef.current.needsUpdate = true;

    logoPointsRef.current.rotation.x += PARTICLE_CONFIG.rotationSpeed.x * delta * 0.8;
    logoPointsRef.current.rotation.y += PARTICLE_CONFIG.rotationSpeed.y * delta * 0.8;
  });

  return (
    <group>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute ref={posAttrRef} attach="attributes-position" args={[data.initialPositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[data.colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={PARTICLE_CONFIG.size}
          transparent
          opacity={PARTICLE_CONFIG.opacity}
          depthWrite={false}
          vertexColors
          blending={THREE.AdditiveBlending}
          sizeAttenuation
        />
      </points>

      <points ref={logoPointsRef}>
        <bufferGeometry>
          <bufferAttribute
            ref={logoPosAttrRef}
            attach="attributes-position"
            args={[logoData.initialPositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          map={logoTexture}
          size={LOGO_CONFIG.size}
          transparent
          opacity={LOGO_CONFIG.opacity}
          depthWrite={false}
          alphaTest={LOGO_CONFIG.alphaTest}
          blending={THREE.NormalBlending}
          sizeAttenuation
        />
      </points>
    </group>
  );
}

export function ParticleBackground() {
  const mouseNdcRef = useRef({ x: 0, y: 0, active: false });

  // Track mouse in window space so the Canvas can stay pointer-events: none.
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      mouseNdcRef.current.active = true;
      mouseNdcRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouseNdcRef.current.y = -((event.clientY / window.innerHeight) * 2 - 1);
    };

    const handleMouseLeave = () => {
      mouseNdcRef.current.active = false;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseout", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseout", handleMouseLeave);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    >
      <Canvas
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
        camera={{ position: [0, 0, 20], fov: 55, near: 0.1, far: 100 }}
      >
        {/* Dark base behind particles (keeps contrast consistent) */}
        <color attach="background" args={["#0c0b09"]} />
        <ambientLight intensity={0.35} />
        <ParticleField mouseNdcRef={mouseNdcRef} />
      </Canvas>
    </div>
  );
}

