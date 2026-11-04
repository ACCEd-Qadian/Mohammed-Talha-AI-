import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface AIOrb3DProps {
  theme: 'dark' | 'light';
  state?: 'idle' | 'listening' | 'thinking';
  size?: number;
}

export const AIOrb3D: React.FC<AIOrb3DProps> = ({
  theme,
  state = 'idle',
  size,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const stateRef = useRef(state);
  const themeRef = useRef(theme);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect software WebGL guard
    const isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch (e) {
        return false;
      }
    })();

    const getDim = () => {
      const w = container.clientWidth || size || 140;
      const h = container.clientHeight || size || 140;
      return { width: w, height: h };
    };

    const { width, height } = getDim();

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 4.1;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = theme === 'dark' ? 1.2 : 1.0;
    container.appendChild(renderer.domElement);

    // Root Group for 3D AI Core
    const coreGroup = new THREE.Group();
    scene.add(coreGroup);

    // 1. Central Quantum Nucleus (Geometric 3D Crystal)
    const nucleusGeo = new THREE.IcosahedronGeometry(0.85, 2);
    const isDark = themeRef.current === 'dark';

    const nucleusMat = new THREE.MeshStandardMaterial({
      color: isDark ? 0x06b6d4 : 0x0284c7,
      roughness: 0.15,
      metalness: 0.85,
      wireframe: true,
      transparent: true,
      opacity: isDark ? 0.85 : 0.65,
    });
    const nucleusMesh = new THREE.Mesh(nucleusGeo, nucleusMat);
    coreGroup.add(nucleusMesh);

    // Inner glowing sphere
    const innerGlowGeo = new THREE.SphereGeometry(0.55, 32, 32);
    const innerGlowMat = new THREE.MeshBasicMaterial({
      color: isDark ? 0x38bdf8 : 0x0ea5e9,
      transparent: true,
      opacity: isDark ? 0.35 : 0.25,
    });
    const innerGlowMesh = new THREE.Mesh(innerGlowGeo, innerGlowMat);
    coreGroup.add(innerGlowMesh);

    // 2. Gyroscopic Orbit Ring 1 (Cyan)
    const ring1Geo = new THREE.TorusGeometry(1.35, 0.022, 16, 80);
    const ring1Mat = new THREE.MeshStandardMaterial({
      color: isDark ? 0x22d3ee : 0x0284c7,
      metalness: 0.95,
      roughness: 0.1,
    });
    const ring1Mesh = new THREE.Mesh(ring1Geo, ring1Mat);
    ring1Mesh.rotation.x = Math.PI / 3;
    coreGroup.add(ring1Mesh);

    // 3. Gyroscopic Orbit Ring 2 (Violet / Indigo)
    const ring2Geo = new THREE.TorusGeometry(1.5, 0.018, 16, 80);
    const ring2Mat = new THREE.MeshStandardMaterial({
      color: isDark ? 0x818cf8 : 0x6366f1,
      metalness: 0.9,
      roughness: 0.15,
    });
    const ring2Mesh = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2Mesh.rotation.y = Math.PI / 4;
    ring2Mesh.rotation.x = -Math.PI / 6;
    coreGroup.add(ring2Mesh);

    // 4. Orbital Neural Particle Ring
    const particleCount = isSoftwareGl ? 60 : 160;
    const particlePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const radius = 1.1 + Math.random() * 0.9;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI * 0.8;

      particlePositions[i * 3] = radius * Math.cos(theta) * Math.cos(phi);
      particlePositions[i * 3 + 1] = radius * Math.sin(phi);
      particlePositions[i * 3 + 2] = radius * Math.sin(theta) * Math.cos(phi);
    }

    const particlesGeo = new THREE.BufferGeometry();
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    // Circle particle texture
    const canvas = document.createElement('canvas');
    canvas.width = 48;
    canvas.height = 48;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(24, 24, 0, 24, 24, 24);
      grad.addColorStop(0, 'rgba(255,255,255,1)');
      grad.addColorStop(0.4, 'rgba(56,189,248,0.8)');
      grad.addColorStop(1, 'rgba(56,189,248,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 48, 48);
    }
    const particleTex = new THREE.CanvasTexture(canvas);

    const particlesMat = new THREE.PointsMaterial({
      size: 0.075,
      map: particleTex,
      transparent: true,
      blending: isDark ? THREE.AdditiveBlending : THREE.NormalBlending,
      depthWrite: false,
      color: isDark ? 0x38bdf8 : 0x0284c7,
    });
    const particleSystem = new THREE.Points(particlesGeo, particlesMat);
    coreGroup.add(particleSystem);

    // Studio Lighting
    const keyLight = new THREE.DirectionalLight(0xffffff, isDark ? 2.2 : 2.5);
    keyLight.position.set(4, 5, 4);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, isDark ? 1.5 : 1.2);
    fillLight.position.set(-4, -2, -2);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight(isDark ? 0x818cf8 : 0x6366f1, isDark ? 2.5 : 1.5, 10);
    rimLight.position.set(0, 3, -3);
    scene.add(rimLight);

    const ambientLight = new THREE.AmbientLight(isDark ? 0x090d16 : 0xf1f5f9, isDark ? 0.8 : 1.2);
    scene.add(ambientLight);

    // Mouse & Touch Tracking with Interactivity
    let targetRotX = 0;
    let targetRotY = 0;
    let isDragging = false;
    let lastPointerX = 0;
    let lastPointerY = 0;

    const handlePointerDown = (e: PointerEvent) => {
      isDragging = true;
      lastPointerX = e.clientX;
      lastPointerY = e.clientY;
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (isDragging) {
        const deltaX = (e.clientX - lastPointerX) * 0.015;
        const deltaY = (e.clientY - lastPointerY) * 0.015;
        targetRotY += deltaX;
        targetRotX += deltaY;
        lastPointerX = e.clientX;
        lastPointerY = e.clientY;
      } else {
        const rect = container.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
        targetRotY = x * 0.45;
        targetRotX = -y * 0.45;
      }
    };

    const handlePointerUp = () => {
      isDragging = false;
    };

    container.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    // Animation Loop
    let animId = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      const dt = clock.getDelta();
      const time = clock.getElapsedTime();

      let speedMult = 1.0;
      if (stateRef.current === 'thinking') speedMult = 2.8;
      if (stateRef.current === 'listening') speedMult = 1.8;

      nucleusMesh.rotation.y += 0.45 * dt * speedMult;
      nucleusMesh.rotation.x += 0.25 * dt * speedMult;

      ring1Mesh.rotation.z += 0.65 * dt * speedMult;
      ring2Mesh.rotation.y += -0.55 * dt * speedMult;
      ring2Mesh.rotation.z += 0.35 * dt * speedMult;

      particleSystem.rotation.y += 0.18 * dt * speedMult;
      particleSystem.rotation.x += 0.08 * dt * speedMult;

      const breathe = 1 + Math.sin(time * 2.2 * speedMult) * (stateRef.current === 'thinking' ? 0.09 : 0.04);
      nucleusMesh.scale.set(breathe, breathe, breathe);
      innerGlowMesh.scale.set(breathe * 1.05, breathe * 1.05, breathe * 1.05);

      coreGroup.rotation.y = THREE.MathUtils.damp(coreGroup.rotation.y, targetRotY, 4, dt);
      coreGroup.rotation.x = THREE.MathUtils.damp(coreGroup.rotation.x, targetRotX, 4, dt);

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };

    animate();

    // Resize Observer for dynamic fluid scaling
    const resizeObserver = new ResizeObserver(() => {
      if (!container) return;
      const w = container.clientWidth || size || 140;
      const h = container.clientHeight || size || 140;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      resizeObserver.disconnect();
      if (container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      nucleusGeo.dispose();
      nucleusMat.dispose();
      innerGlowGeo.dispose();
      innerGlowMat.dispose();
      ring1Geo.dispose();
      ring1Mat.dispose();
      ring2Geo.dispose();
      ring2Mat.dispose();
      particlesGeo.dispose();
      particlesMat.dispose();
      particleTex.dispose();
      renderer.dispose();
    };
  }, [theme, size]);

  return (
    <div
      ref={mountRef}
      className="relative flex items-center justify-center cursor-grab active:cursor-grabbing select-none w-32 h-32 sm:w-40 sm:h-40 md:w-44 md:h-44"
      title="Touch or Drag to rotate TALHA AI 3D Core"
    />
  );
};
