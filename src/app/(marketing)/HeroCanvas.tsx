// @ts-nocheck
'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

/* ─── Custom shader material for rippling orbs ──────────────── */
const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime;
  uniform vec2 uMouse;
  uniform float uVelocity;
  uniform float uScrollSpeed;
  uniform vec2 uResolution;

  varying vec2 vUv;

  // Simplex-like noise
  vec3 mod289(vec3 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                       -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                            + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
                             dot(x12.zw,x12.zw)), 0.0);
    m = m*m; m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0+h*h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
    vec2 uv = vUv;
    float aspect = uResolution.x / uResolution.y;
    vec2 p = (uv - 0.5) * vec2(aspect, 1.0);

    // Mouse-driven distortion
    float vel = clamp(uVelocity, 0.0, 1.0);
    float scroll = clamp(uScrollSpeed, 0.0, 1.0);

    // Time-based ripple
    float t = uTime * 0.15;
    float distort = (vel * 0.4 + scroll * 0.3) + 0.1;

    float n1 = snoise(p * 1.5 + t + uMouse * 0.3) * distort;
    float n2 = snoise(p * 2.0 - t * 1.3 + uMouse.yx * 0.2) * distort * 0.8;

    // Orb 1: Soft Frost Violet (#0396A6 / #14B8A6)
    vec2 orb1Pos = vec2(-0.3 + sin(t * 0.7) * 0.15, 0.1 + cos(t * 0.5) * 0.1);
    float d1 = length(p - orb1Pos + vec2(n1, n2) * 0.3);
    float orb1 = smoothstep(0.65, 0.0, d1);
    vec3 col1 = vec3(0.372, 0.137, 0.784); // #0396A6

    // Orb 2: Warm Amber Accent (#D97706)
    vec2 orb2Pos = vec2(0.25 + cos(t * 0.6) * 0.12, -0.15 + sin(t * 0.8) * 0.1);
    float d2 = length(p - orb2Pos + vec2(n2, n1) * 0.25);
    float orb2 = smoothstep(0.6, 0.0, d2);
    vec3 col2 = vec3(0.851, 0.467, 0.024); // #D97706

    // Orb 3: Light Sky Cyan (#38BDF8)
    vec2 orb3Pos = vec2(0.0 + sin(t * 0.9) * 0.1, 0.25 + cos(t * 0.4) * 0.15);
    float d3 = length(p - orb3Pos + vec2(n1 * 0.5, n2 * 0.5) * 0.2);
    float orb3 = smoothstep(0.55, 0.0, d3);
    vec3 col3 = vec3(0.220, 0.741, 0.973); // #38BDF8

    // Composite — ultra-light white-shade fluid radiance
    vec3 color = vec3(0.988, 0.984, 0.976); // #FFFFFF ultra-light white base
    color = mix(color, col1, orb1 * 0.06);
    color = mix(color, col2, orb2 * 0.04);
    color = mix(color, col3, orb3 * 0.03);

    // Overall subtle vignette
    float vignette = 1.0 - smoothstep(0.4, 1.2, length(p));
    float alpha = clamp((orb1 * 0.10 + orb2 * 0.06 + orb3 * 0.06) * vignette, 0.0, 0.25);

    gl_FragColor = vec4(color, alpha);
  }
`;

/* ─── Fullscreen Quad with shader ───────────────────────────── */
function OrbShaderPlane() {
  const meshRef = useRef<THREE.Mesh>(null);
  const { size, viewport } = useThree();

  const mouseRef = useRef({ x: 0, y: 0 });
  const velocityRef = useRef(0);
  const scrollSpeedRef = useRef(0);
  const prevMouseRef = useRef({ x: 0, y: 0 });
  const prevScrollRef = useRef(0);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uVelocity: { value: 0 },
      uScrollSpeed: { value: 0 },
      uResolution: { value: new THREE.Vector2(size.width, size.height) },
    }),
    []
  );

  // Track mouse
  useMemo(() => {
    if (typeof window === 'undefined') return;
    const onMove = (e: MouseEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = -(e.clientY / window.innerHeight) * 2 + 1;
      const dx = nx - prevMouseRef.current.x;
      const dy = ny - prevMouseRef.current.y;
      velocityRef.current = Math.sqrt(dx * dx + dy * dy);
      prevMouseRef.current = { x: nx, y: ny };
      mouseRef.current = { x: nx, y: ny };
    };
    const onScroll = () => {
      const sy = window.scrollY;
      scrollSpeedRef.current = Math.abs(sy - prevScrollRef.current) / 100;
      prevScrollRef.current = sy;
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material as THREE.ShaderMaterial;
    mat.uniforms.uTime.value = clock.getElapsedTime();
    mat.uniforms.uMouse.value.set(mouseRef.current.x, mouseRef.current.y);
    // Smoothly decay velocity
    velocityRef.current *= 0.92;
    scrollSpeedRef.current *= 0.92;
    mat.uniforms.uVelocity.value = velocityRef.current;
    mat.uniforms.uScrollSpeed.value = scrollSpeedRef.current;
    mat.uniforms.uResolution.value.set(size.width, size.height);
  });

  return (
    <mesh ref={meshRef} scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        depthWrite={false}
      />
    </mesh>
  );
}

/* ─── Exported Canvas wrapper ───────────────────────────────── */
export default function HeroCanvas() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none' }}
    >
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 1], fov: 75 }}
        style={{ width: '100%', height: '100%' }}
        gl={{ alpha: true, antialias: false, powerPreference: 'high-performance' }}
      >
        <OrbShaderPlane />
      </Canvas>
    </div>
  );
}
