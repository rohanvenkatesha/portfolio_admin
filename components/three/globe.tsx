"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { readThemeColor } from "@/lib/theme-color";
import { feature } from "topojson-client";
import type { FeatureCollection, MultiPolygon, Polygon, Position } from "geojson";
import type { Topology } from "topojson-specification";
import landTopology from "world-atlas/land-110m.json";

export type GlobeMarker = {
  id: string;
  lat: number;
  lng: number;
  label: string;
};

const RADIUS = 2;

/** Convert geographic coordinates to a point on the sphere. */
function latLngToVec3(lat: number, lng: number, radius: number) {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lng + 180) * Math.PI) / 180;
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

/**
 * Real coastlines, decoded once at module scope from Natural Earth 110m data
 * (~54KB, bundled — no map API, no network request, works offline).
 *
 * Each ring becomes a run of line segments on the sphere, flattened into a
 * single Float32Array so the whole world draws in one draw call.
 */
const COASTLINE_POSITIONS = (() => {
  const topology = landTopology as unknown as Topology;
  const land = feature(topology, topology.objects.land) as unknown as FeatureCollection<
    Polygon | MultiPolygon
  >;

  const points: number[] = [];
  const surface = RADIUS * 1.001; // lift a hair off the sphere to avoid z-fighting

  const addRing = (ring: Position[]) => {
    for (let i = 0; i < ring.length - 1; i++) {
      const a = latLngToVec3(ring[i][1], ring[i][0], surface);
      const b = latLngToVec3(ring[i + 1][1], ring[i + 1][0], surface);
      points.push(a.x, a.y, a.z, b.x, b.y, b.z);
    }
  };

  for (const f of land.features) {
    const geometry = f.geometry;
    if (geometry.type === "Polygon") {
      geometry.coordinates.forEach(addRing);
    } else if (geometry.type === "MultiPolygon") {
      geometry.coordinates.forEach((polygon) => polygon.forEach(addRing));
    }
  }

  return new Float32Array(points);
})();

/** Latitude/longitude graticule, every 30°, as a faint reference frame. */
function buildGraticule(radius: number, step = 30) {
  const points: number[] = [];
  const push = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const a = latLngToVec3(lat1, lng1, radius);
    const b = latLngToVec3(lat2, lng2, radius);
    points.push(a.x, a.y, a.z, b.x, b.y, b.z);
  };

  // Parallels
  for (let lat = -60; lat <= 60; lat += step) {
    for (let lng = -180; lng < 180; lng += 5) push(lat, lng, lat, lng + 5);
  }
  // Meridians
  for (let lng = -180; lng < 180; lng += step) {
    for (let lat = -90; lat < 90; lat += 5) push(lat, lng, lat + 5, lng);
  }

  return new Float32Array(points);
}

const GRATICULE_POSITIONS = buildGraticule(RADIUS * 0.999);

/**
 * Interactive globe with real coastline geometry. Markers are placed by true
 * latitude/longitude, so a pin sits exactly where the place is.
 * Drag to rotate; click a pin to select it.
 */
export function Globe({
  markers,
  selectedId,
  onSelect,
  className,
}: {
  markers: GlobeMarker[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Kept in refs so changing selection or handler never rebuilds the scene
  const selectedRef = useRef<string | undefined>(selectedId);
  const onSelectRef = useRef(onSelect);

  useEffect(() => {
    selectedRef.current = selectedId;
  }, [selectedId]);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Canvases take numeric hex, so read the live accent from CSS.
    const BRAND = readThemeColor("--color-brand-500", 0xff5a1f);
    const BRAND_SOFT = readThemeColor("--color-brand-300", 0xff9a5c);
    const BRAND_PALE = readThemeColor("--color-brand-200", 0xffd0a8);

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    } catch {
      return;
    }

    const size = () => ({
      w: container.clientWidth || 1,
      h: container.clientHeight || 1,
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(size().w, size().h);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, size().w / size().h, 0.1, 100);
    camera.position.set(0, 0, 6.4);

    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    /* ---------------- Sphere shell ---------------- */

    // Solid inner sphere: hides far-side coastlines and pins so the globe
    // reads as opaque rather than a see-through wireframe ball.
    const coreGeometry = new THREE.SphereGeometry(RADIUS * 0.995, 64, 48);
    const coreMaterial = new THREE.MeshBasicMaterial({ color: 0x111114 });
    globeGroup.add(new THREE.Mesh(coreGeometry, coreMaterial));

    // Faint lat/long graticule behind the land
    const graticuleGeometry = new THREE.BufferGeometry();
    graticuleGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(GRATICULE_POSITIONS, 3)
    );
    const graticuleMaterial = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.07,
    });
    globeGroup.add(new THREE.LineSegments(graticuleGeometry, graticuleMaterial));

    // Real continent outlines — Natural Earth 110m, one draw call
    const coastGeometry = new THREE.BufferGeometry();
    coastGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(COASTLINE_POSITIONS, 3)
    );
    const coastMaterial = new THREE.LineBasicMaterial({
      color: BRAND_SOFT,
      transparent: true,
      opacity: 0.85,
    });
    globeGroup.add(new THREE.LineSegments(coastGeometry, coastMaterial));

    // Atmosphere: a slightly larger sphere rendered from the inside
    const atmosphereGeometry = new THREE.SphereGeometry(RADIUS * 1.16, 48, 32);
    const atmosphereMaterial = new THREE.MeshBasicMaterial({
      color: BRAND,
      transparent: true,
      opacity: 0.055,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    globeGroup.add(new THREE.Mesh(atmosphereGeometry, atmosphereMaterial));

    /* ---------------- Markers ---------------- */
    const pinGeometry = new THREE.SphereGeometry(0.055, 16, 16);
    const ringGeometry = new THREE.RingGeometry(0.075, 0.095, 24);

    type Pin = {
      id: string;
      dot: THREE.Mesh;
      ring: THREE.Mesh;
      beam: THREE.Line;
      material: THREE.MeshBasicMaterial;
      ringMaterial: THREE.MeshBasicMaterial;
      beamMaterial: THREE.LineBasicMaterial;
    };

    const pins: Pin[] = markers.map((marker) => {
      const base = latLngToVec3(marker.lat, marker.lng, RADIUS);
      const tip = latLngToVec3(marker.lat, marker.lng, RADIUS * 1.22);

      const material = new THREE.MeshBasicMaterial({ color: BRAND });
      const dot = new THREE.Mesh(pinGeometry, material);
      dot.position.copy(tip);
      dot.userData.markerId = marker.id;

      const ringMaterial = new THREE.MeshBasicMaterial({
        color: BRAND,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.position.copy(tip);
      ring.lookAt(0, 0, 0);

      const beamMaterial = new THREE.LineBasicMaterial({
        color: BRAND,
        transparent: true,
        opacity: 0.45,
      });
      const beam = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([base, tip]),
        beamMaterial
      );

      globeGroup.add(dot, ring, beam);
      return { id: marker.id, dot, ring, beam, material, ringMaterial, beamMaterial };
    });

    /* ---------------- Interaction ---------------- */
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();

    let dragging = false;
    let dragMoved = 0;
    let lastX = 0;
    let lastY = 0;
    let velocityY = 0.0022;
    let velocityX = 0;
    let targetTiltX = 0.18;

    const canvas = renderer.domElement;
    canvas.style.touchAction = "pan-y";
    canvas.style.cursor = "grab";

    const onPointerDown = (e: PointerEvent) => {
      dragging = true;
      dragMoved = 0;
      lastX = e.clientX;
      lastY = e.clientY;
      canvas.style.cursor = "grabbing";
      canvas.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      dragMoved += Math.abs(dx) + Math.abs(dy);
      lastX = e.clientX;
      lastY = e.clientY;
      velocityY = dx * 0.005;
      velocityX = dy * 0.004;
      globeGroup.rotation.y += velocityY;
      targetTiltX = THREE.MathUtils.clamp(targetTiltX + velocityX, -0.9, 0.9);
    };

    const onPointerUp = (e: PointerEvent) => {
      if (dragging && dragMoved < 6) {
        // Treated as a click, not a drag → try to select a pin
        const rect = canvas.getBoundingClientRect();
        ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        ndc.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
        raycaster.setFromCamera(ndc, camera);
        const hits = raycaster.intersectObjects(pins.map((p) => p.dot), false);
        const id = hits[0]?.object.userData.markerId as string | undefined;
        if (id) onSelectRef.current?.(id);
      }
      dragging = false;
      canvas.style.cursor = "grab";
      if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);

    /* ---------------- Frame loop ---------------- */
    const selectedColor = new THREE.Color(BRAND_PALE);
    const idleColor = new THREE.Color(BRAND);
    let elapsed = 0;

    const render = (animate: boolean) => {
      if (animate) {
        elapsed += 0.016;
        if (!dragging) {
          // Ease back to a gentle idle spin after a drag
          velocityY += (0.0022 - velocityY) * 0.02;
          globeGroup.rotation.y += velocityY;
        }
        globeGroup.rotation.x += (targetTiltX - globeGroup.rotation.x) * 0.05;
      }

      for (const pin of pins) {
        const isSelected = pin.id === selectedRef.current;
        const target = isSelected ? selectedColor : idleColor;
        pin.material.color.lerp(target, 0.12);
        pin.ringMaterial.color.lerp(target, 0.12);
        pin.beamMaterial.color.lerp(target, 0.12);

        // Selected pin gets a bigger, breathing ring
        const pulse = isSelected ? 1.5 + Math.sin(elapsed * 3) * 0.28 : 1;
        pin.ring.scale.setScalar(pulse);
        pin.dot.scale.setScalar(isSelected ? 1.45 : 1);
        pin.ringMaterial.opacity = isSelected ? 0.85 : 0.4;
      }

      renderer.render(scene, camera);
    };

    let frameId = 0;
    let running = false;

    const loop = () => {
      render(true);
      frameId = requestAnimationFrame(loop);
    };
    const start = () => {
      if (running) return;
      running = true;
      frameId = requestAnimationFrame(loop);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(frameId);
    };

    const observer = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? start() : stop()),
      { threshold: 0.05 }
    );
    observer.observe(container);

    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVisibility);

    render(false);
    if (!prefersReducedMotion) start();

    const resizeObserver = new ResizeObserver(() => {
      const { w, h } = size();
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      render(false);
    });
    resizeObserver.observe(container);

    /* ---------------- Teardown ---------------- */
    return () => {
      stop();
      observer.disconnect();
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);

      coreGeometry.dispose();
      coreMaterial.dispose();
      graticuleGeometry.dispose();
      graticuleMaterial.dispose();
      coastGeometry.dispose();
      coastMaterial.dispose();
      atmosphereGeometry.dispose();
      atmosphereMaterial.dispose();
      pinGeometry.dispose();
      ringGeometry.dispose();
      for (const pin of pins) {
        pin.material.dispose();
        pin.ringMaterial.dispose();
        pin.beamMaterial.dispose();
        pin.beam.geometry.dispose();
      }
      renderer.dispose();
      if (canvas.parentNode === container) container.removeChild(canvas);
    };
  }, [markers]);

  return <div ref={containerRef} className={className} />;
}
