"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const NODE_COUNT = 110;
const LINK_DISTANCE = 2.5;
const MAX_LINKS = 900;
const BOUNDS = { x: 11, y: 6.5, z: 6 };

/**
 * WebGL node network: drifting points wired together whenever they come within
 * LINK_DISTANCE of each other, with the camera easing toward the pointer.
 *
 * Written against three.js directly (no reconciler) so it stays a single
 * self-contained effect: one scene, one RAF loop, full teardown on unmount.
 * Pauses when scrolled out of view and renders one static frame under
 * prefers-reduced-motion.
 */
export function HeroNetwork({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    /* ---------------- Renderer / scene / camera ---------------- */
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
    } catch {
      // No WebGL available — the CSS gradients behind this canvas carry the design.
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x09090b, 0.055);

    const camera = new THREE.PerspectiveCamera(
      62,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 0, 13);

    /* ---------------- Nodes ---------------- */
    const positions = new Float32Array(NODE_COUNT * 3);
    const velocities = new Float32Array(NODE_COUNT * 3);
    const colors = new Float32Array(NODE_COUNT * 3);
    const sizes = new Float32Array(NODE_COUNT);

    const palette = [
      new THREE.Color(0xff5a1f), // cyan
      new THREE.Color(0xff9a5c), // violet
      new THREE.Color(0xffd0a8), // amber
      new THREE.Color(0xf4f4f5), // near-white
    ];

    for (let i = 0; i < NODE_COUNT; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * BOUNDS.x * 2;
      positions[i3 + 1] = (Math.random() - 0.5) * BOUNDS.y * 2;
      positions[i3 + 2] = (Math.random() - 0.5) * BOUNDS.z * 2;

      velocities[i3] = (Math.random() - 0.5) * 0.006;
      velocities[i3 + 1] = (Math.random() - 0.5) * 0.006;
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.004;

      // Weight the palette toward white so the accents stay accents
      const color = palette[Math.random() < 0.55 ? 3 : Math.floor(Math.random() * 3)];
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;

      sizes[i] = Math.random() * 0.06 + 0.03;
    }

    // Soft round sprite so points aren't hard squares
    const sprite = (() => {
      const size = 64;
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
        gradient.addColorStop(0, "rgba(255,255,255,1)");
        gradient.addColorStop(0.35, "rgba(255,255,255,0.85)");
        gradient.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);
      }
      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      return texture;
    })();

    const nodeGeometry = new THREE.BufferGeometry();
    nodeGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    nodeGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const nodeMaterial = new THREE.PointsMaterial({
      size: 0.19,
      map: sprite,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });

    const points = new THREE.Points(nodeGeometry, nodeMaterial);
    scene.add(points);

    /* ---------------- Links ---------------- */
    const linkPositions = new Float32Array(MAX_LINKS * 6);
    const linkColors = new Float32Array(MAX_LINKS * 6);
    const linkGeometry = new THREE.BufferGeometry();
    linkGeometry.setAttribute("position", new THREE.BufferAttribute(linkPositions, 3));
    linkGeometry.setAttribute("color", new THREE.BufferAttribute(linkColors, 3));

    const linkMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.34,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const links = new THREE.LineSegments(linkGeometry, linkMaterial);
    scene.add(links);

    /* ---------------- Pointer ---------------- */
    const pointer = { x: 0, y: 0 };
    const cameraTarget = { x: 0, y: 0 };

    const onPointerMove = (e: PointerEvent) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    /* ---------------- Frame loop ---------------- */
    const linkColorA = new THREE.Color();
    const linkColorB = new THREE.Color();

    function step(animate: boolean) {
      const pos = nodeGeometry.attributes.position.array as Float32Array;

      if (animate) {
        for (let i = 0; i < NODE_COUNT; i++) {
          const i3 = i * 3;
          pos[i3] += velocities[i3];
          pos[i3 + 1] += velocities[i3 + 1];
          pos[i3 + 2] += velocities[i3 + 2];

          // Bounce off the invisible box
          if (Math.abs(pos[i3]) > BOUNDS.x) velocities[i3] *= -1;
          if (Math.abs(pos[i3 + 1]) > BOUNDS.y) velocities[i3 + 1] *= -1;
          if (Math.abs(pos[i3 + 2]) > BOUNDS.z) velocities[i3 + 2] *= -1;
        }
        nodeGeometry.attributes.position.needsUpdate = true;
      }

      // Rebuild the link set for this frame
      let linkIndex = 0;
      for (let i = 0; i < NODE_COUNT && linkIndex < MAX_LINKS; i++) {
        const i3 = i * 3;
        for (let j = i + 1; j < NODE_COUNT && linkIndex < MAX_LINKS; j++) {
          const j3 = j * 3;
          const dx = pos[i3] - pos[j3];
          const dy = pos[i3 + 1] - pos[j3 + 1];
          const dz = pos[i3 + 2] - pos[j3 + 2];
          const distSq = dx * dx + dy * dy + dz * dz;
          if (distSq > LINK_DISTANCE * LINK_DISTANCE) continue;

          // Fade each link out as the pair drifts apart
          const strength = 1 - Math.sqrt(distSq) / LINK_DISTANCE;
          const l6 = linkIndex * 6;

          linkPositions[l6] = pos[i3];
          linkPositions[l6 + 1] = pos[i3 + 1];
          linkPositions[l6 + 2] = pos[i3 + 2];
          linkPositions[l6 + 3] = pos[j3];
          linkPositions[l6 + 4] = pos[j3 + 1];
          linkPositions[l6 + 5] = pos[j3 + 2];

          linkColorA.setRGB(colors[i3], colors[i3 + 1], colors[i3 + 2]).multiplyScalar(strength);
          linkColorB.setRGB(colors[j3], colors[j3 + 1], colors[j3 + 2]).multiplyScalar(strength);

          linkColors[l6] = linkColorA.r;
          linkColors[l6 + 1] = linkColorA.g;
          linkColors[l6 + 2] = linkColorA.b;
          linkColors[l6 + 3] = linkColorB.r;
          linkColors[l6 + 4] = linkColorB.g;
          linkColors[l6 + 5] = linkColorB.b;

          linkIndex++;
        }
      }

      linkGeometry.setDrawRange(0, linkIndex * 2);
      linkGeometry.attributes.position.needsUpdate = true;
      linkGeometry.attributes.color.needsUpdate = true;

      if (animate) {
        // Ease the camera toward the pointer for a parallax feel
        cameraTarget.x += (pointer.x * 1.5 - cameraTarget.x) * 0.035;
        cameraTarget.y += (pointer.y * 0.9 - cameraTarget.y) * 0.035;
        camera.position.x = cameraTarget.x;
        camera.position.y = cameraTarget.y;
        points.rotation.y += 0.0007;
        links.rotation.y = points.rotation.y;
      }

      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    }

    let frameId = 0;
    let running = false;

    const loop = () => {
      step(true);
      frameId = requestAnimationFrame(loop);
    };

    const start = () => {
      if (running || prefersReducedMotion) return;
      running = true;
      frameId = requestAnimationFrame(loop);
    };

    const stop = () => {
      running = false;
      cancelAnimationFrame(frameId);
    };

    // Only burn frames while the hero is actually on screen
    const observer = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? start() : stop()),
      { threshold: 0.01 }
    );
    observer.observe(container);

    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVisibility);

    // Always paint at least one frame, including under reduced-motion
    step(false);
    if (!prefersReducedMotion) start();

    /* ---------------- Resize ---------------- */
    const resizeObserver = new ResizeObserver(() => {
      const { clientWidth, clientHeight } = container;
      if (!clientWidth || !clientHeight) return;
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(clientWidth, clientHeight);
      step(false);
    });
    resizeObserver.observe(container);

    /* ---------------- Teardown ---------------- */
    return () => {
      stop();
      observer.disconnect();
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onPointerMove);

      nodeGeometry.dispose();
      nodeMaterial.dispose();
      linkGeometry.dispose();
      linkMaterial.dispose();
      sprite.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={containerRef} aria-hidden className={className} />;
}
