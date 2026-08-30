"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import type { Waypoint } from "@/content/posts";
import { cn } from "@/lib/utils";

/**
 * The route drawn on a real map, treated as an instrument rather than a widget.
 *
 * Leaflet is written to directly rather than through a React wrapper, matching
 * how three.js is used elsewhere here: the map is an imperative object with its
 * own lifecycle, and a reconciler in between would only add a layer to debug.
 *
 * The previous version was a stock CARTO basemap with a flat orange line on it —
 * legible, and completely inert next to everything around it. What changed:
 *
 * - Labels are split onto their own pane above the route, so place names stay
 *   readable instead of being painted over by the line.
 * - The basemap is pushed down in contrast and brightness by CSS filter, which
 *   lets the accent read as the brightest thing in the frame.
 * - The route is drawn twice — a wide blurred pass for the glow, a thin dashed
 *   pass on top that crawls along the path — so it reads as a direction
 *   travelled rather than a shape.
 * - Markers pulse, and the frame carries a HUD: corner ticks and a live
 *   coordinate readout that follows the cursor.
 *
 * Tiles are Esri's Dark Gray Canvas: free, no API key, no billing account. See
 * the note at the layer itself for why they are not CARTO's any more.
 */
export function RouteMap({
  waypoints,
  className,
  focusIndex = null,
}: {
  waypoints: Waypoint[];
  className?: string;
  /** Stop to fly to and open, driven by the list beside the map. */
  focusIndex?: number | null;
}) {
  const holder = useRef<HTMLDivElement>(null);
  /**
   * The map and its markers, kept in refs so the focus effect below can reach
   * them without re-running the whole initialisation.
   */
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const markersRef = useRef<import("leaflet").Marker[]>([]);
  /** Mirrors the cursor position into the HUD readout. */
  const [cursor, setCursor] = useState<{ lat: number; lng: number } | null>(null);

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
        zoomControl: false,
        attributionControl: true,
      });

      map.on("click", () => map?.scrollWheelZoom.enable());
      map.on("mouseout", () => {
        map?.scrollWheelZoom.disable();
        setCursor(null);
      });
      map.on("mousemove", (event: import("leaflet").LeafletMouseEvent) => {
        setCursor({ lat: event.latlng.lat, lng: event.latlng.lng });
      });

      // Zoom sits bottom-right, clear of the HUD readout in the top-left.
      L.control.zoom({ position: "bottomright" }).addTo(map);

      /**
       * Labels ride in their own pane above the route.
       *
       * Leaflet stacks overlays above every tile layer, so a single labelled
       * basemap would have put the route line straight through the place names.
       * Splitting them means the line can be as loud as it likes.
       */
      map.createPane("labels");
      const labelPane = map.getPane("labels");
      if (labelPane) {
        labelPane.style.zIndex = "650";
        labelPane.style.pointerEvents = "none";
      }

      /**
       * Esri's Dark Gray Canvas, in two layers.
       *
       * This was CARTO's dark basemap, which used to be free and keyless and is
       * not any more: their tiles now come back stamped "API KEY REQUIRED"
       * across the image. They still render, so nothing errored and nothing
       * 404'd — the map simply looked broken.
       *
       * Esri publishes this style without a key, and usefully splits the base
       * from its labels exactly the way the pane setup above wants. It tops out
       * at zoom 16 rather than 19, which is far closer in than any route map
       * needs.
       */
      const esri = "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas";

      L.tileLayer(`${esri}/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}`, {
        maxZoom: 16,
        attribution:
          'Tiles &copy; <a href="https://www.esri.com/">Esri</a> &mdash; Esri, HERE, Garmin, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      L.tileLayer(`${esri}/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}`, {
        maxZoom: 16,
        pane: "labels",
        opacity: 0.85,
      }).addTo(map);

      const points: [number, number][] = waypoints.map((w) => [w.lat, w.lng]);

      // Read the live accent so the line follows the theme.
      const accent =
        getComputedStyle(document.documentElement).getPropertyValue("--brand").trim() || "#ff5a1f";

      if (points.length > 1) {
        // Wide, blurred, underneath — the bloom.
        L.polyline(points, {
          color: accent,
          weight: 14,
          opacity: 0.22,
          lineJoin: "round",
          className: "route-glow",
          interactive: false,
        }).addTo(map);

        // Thin and dashed on top, crawling forwards.
        L.polyline(points, {
          color: accent,
          weight: 2.5,
          opacity: 1,
          lineJoin: "round",
          className: "route-line",
          interactive: false,
        }).addTo(map);
      }

      waypoints.forEach((waypoint, index) => {
        const last = index === waypoints.length - 1;
        const icon = L.divIcon({
          className: "",
          // Built from markup rather than Leaflet's default pin, whose relative
          // image URLs break under a bundler — and this way it carries the
          // accent and its own animation.
          html:
            `<span class="route-pin${last ? " route-pin-last" : ""}" ` +
            `style="--pin:${accent}">${index + 1}</span>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        const marker = L.marker([waypoint.lat, waypoint.lng], { icon, title: waypoint.name })
          .addTo(map!)
          .bindPopup(
            `<strong>${escapeHtml(waypoint.name)}</strong>` +
              (waypoint.note ? `<br>${escapeHtml(waypoint.note)}` : "")
          );

        markersRef.current[index] = marker;
      });

      mapRef.current = map;

      /**
       * `maxZoom` matters more than it looks.
       *
       * Every stop sharing a position — one stop, or several that were saved
       * before coordinates were validated — collapses the bounds to a point,
       * and `fitBounds` answers that by going to the layer's maximum zoom. At
       * z19 you are looking at a few hundred metres of blank tile, which reads
       * as a map that failed to load rather than one that is merely very close.
       */
      if (points.length === 1) {
        map.setView(points[0], 9);
      } else {
        map.fitBounds(L.latLngBounds(points), { padding: [48, 48], maxZoom: 12 });
      }
    })();

    return () => {
      cancelled = true;
      map?.remove();
      mapRef.current = null;
      markersRef.current = [];
    };
  }, [waypoints]);

  /**
   * Fly to the stop the list is pointing at.
   *
   * Separate from initialisation so hovering a stop pans the existing map
   * rather than tearing it down and rebuilding it. Zoom is left alone — the
   * reader chose the current one, and yanking it in as well loses the sense of
   * where the stop sits on the whole route.
   */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || focusIndex === null) return;

    const waypoint = waypoints[focusIndex];
    const marker = markersRef.current[focusIndex];
    if (!waypoint) return;

    map.flyTo([waypoint.lat, waypoint.lng], Math.max(map.getZoom(), 8), { duration: 0.7 });
    marker?.openPopup();
  }, [focusIndex, waypoints]);

  if (waypoints.length === 0) return null;

  return (
    <div className={cn("route-frame group relative overflow-hidden", className)}>
      <div
        ref={holder}
        // Leaflet paints its own white background; the token keeps the tile gaps
        // and the area outside the bounds in the site's palette.
        className="route-canvas absolute inset-0 z-0 bg-panel-2"
        style={{ colorScheme: "dark" }}
      />

      {/* ---- HUD ----------------------------------------------------------
          Purely decorative and pointer-transparent, so none of it can get
          between the cursor and the map underneath. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-[600]">
        <Corner className="left-3 top-3 border-l border-t" />
        <Corner className="right-3 top-3 border-r border-t" />
        <Corner className="bottom-3 left-3 border-b border-l" />
        <Corner className="bottom-3 right-3 border-b border-r" />

        {/* Right-hand side, because the stop list now overlays the left. The
            zoom control sits bottom-right, so this stays at the top. */}
        {cursor ? (
          <div className="absolute right-5 top-5 font-mono text-[10px] tabular-nums tracking-wider text-white/45">
            {cursor.lat.toFixed(4)}, {cursor.lng.toFixed(4)}
          </div>
        ) : (
          <div className="absolute right-5 top-5 font-mono text-[10px] uppercase tracking-[0.18em] text-white/30">
            Click to zoom
          </div>
        )}
      </div>
    </div>
  );
}

function Corner({ className }: { className: string }) {
  return <span className={cn("absolute h-4 w-4 border-brand-500/60", className)} />;
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
