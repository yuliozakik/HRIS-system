"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, Marker, TileLayer } from "react-leaflet";
import L from "leaflet";

// Leaflet's default marker image assets don't resolve under Next.js's
// bundler; a simple colored div-icon sidesteps that entirely.
const dotIcon = L.divIcon({
  className: "",
  html: '<span style="display:block;width:16px;height:16px;border-radius:9999px;background:#2563eb;border:3px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4)"></span>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

export default function LocationMap({
  lat,
  lng,
  height = 180,
  zoom = 16,
}: {
  lat: number;
  lng: number;
  height?: number;
  zoom?: number;
}) {
  return (
    <div
      className="overflow-hidden rounded-lg border border-border-subtle"
      style={{ height }}
    >
      <MapContainer
        center={[lat, lng]}
        zoom={zoom}
        scrollWheelZoom={false}
        dragging={false}
        doubleClickZoom={false}
        zoomControl={false}
        attributionControl={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={[lat, lng]} icon={dotIcon} />
      </MapContainer>
    </div>
  );
}
