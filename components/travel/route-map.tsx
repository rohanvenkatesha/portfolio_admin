"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import type { Waypoint } from "@/content/posts";
import { cn } from "@/lib/utils";

/**
 * The route drawn on a real map.
 *
 * Leaflet is written to directly rather than through a React wrapper, matching
 * how three.js is used elsewhere here: the map is an imperative object with its
 * own lifecycle, and a reconciler in between would only add a layer to debug.
 *
 * Tiles are CARTO's dark basemap over OpenStreetMap data — free, no API key, no
 * billing account, and dark by default. A light basemap under this palette
 * would be the brightest thing on the page by a wide margin.
 *
 * Markers use divIcon rather than Leaflet's default pin. The default references
 * image files by relative URL, which breaks under a bundler; building the pin
 * from markup sidesteps that entirely and lets it carry the accent colour.
 */
export function RouteMap({
  waypoints,
  className,
}: {
  waypoints: Waypoint[];
  className?: string;
}) {
  const holder = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = holder.current;
    if (!node || waypoints.length === 0) return;

    let cancelled = false;
    // Held outside the async body so cleanup can reach it even if the effect
    // is torn down mid-import.
    let map: import("leaflet").Map | null = null;

    (async () => {
      const L = await import("leaflet");
      if (cancelled || !holder.current) return;

      map = L.map(node, {
        // A route map is for reading, not exploring — wheel zoom would hijack
        // the page scroll. Clicking the map enables it.
        scrollWheelZoom: false,
        zoomControl: true,
        attributionControl: true,
      });

      map.on("click", () => map?.scrollWheelZoom.enable());
      map.on("mouseout", () => map?.scrollWheelZoom.disable());

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      }).addTo(map);

      const points: [number, number][] = waypoints.map((w) => [w.lat, w.lng]);

      // Read the live accent so the line follows the theme.
      const accent =
        getComputedStyle(document.documentElement).getPropertyValue("--brand").trim() || "#ff5a1f";

      if (points.length > 1) {
        L.polyline(points, {
          color: accent,
          weight: 3,
          opacity: 0.9,
          lineJoin: "round",
        }).addTo(map);
      }

      waypoints.forEach((waypoint, index) => {
        const icon = L.divIcon({
          className: "",
          html:
            `<span style="display:grid;place-items:center;width:26px;height:26px;border-radius:9999px;` +
            `background:${accent};color:#fff;font:600 11px/1 ui-monospace,monospace;` +
            `box-shadow:0 0 0 3px rgba(0,0,0,.55)">${index + 1}</span>`,
          iconSize: [26, 26],
          iconAnchor: [13, 13],
        });

        L.marker([waypoint.lat, waypoint.lng], { icon, title: waypoint.name })
          .addTo(map!)
          .bindPopup(
            `<strong>${escapeHtml(waypoint.name)}</strong>` +
              (waypoint.note ? `<br>${escapeHtml(waypoint.note)}` : "")
          );
      });

      if (points.length === 1) {
        map.setView(points[0], 9);
      } else {
        map.fitBounds(L.latLngBounds(points), { padding: [36, 36] });
      }
    })();

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [waypoints]);

  if (waypoints.length === 0) return null;

  return (
    <div
      ref={holder}
      // Leaflet paints its own white background; the token keeps the tile gaps
      // and the area outside the bounds in the site's palette.
      className={cn("z-0 h-[22rem] w-full rounded-2xl border border-white/10 bg-panel-2", className)}
      style={{ colorScheme: "dark" }}
    />
  );
}

/**
 * Popups take an HTML string, which is the one place in this feature where
 * stored text becomes markup — so it's escaped here rather than trusted.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
