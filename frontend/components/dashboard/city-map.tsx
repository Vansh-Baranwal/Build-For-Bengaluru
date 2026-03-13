"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface MapIssue {
  id: string;
  type: "pothole" | "garbage" | "flooding" | "drainage" | "streetlight";
  priority: "high" | "medium" | "low";
  location: string;
  lat: number;
  lng: number;
}

const issues: MapIssue[] = [
  { id: "1", type: "pothole", priority: "high", location: "Whitefield Main Road", lat: 12.9698, lng: 77.7500 },
  { id: "2", type: "garbage", priority: "medium", location: "Koramangala 4th Block", lat: 12.9352, lng: 77.6245 },
  { id: "3", type: "flooding", priority: "high", location: "Silk Board Junction", lat: 12.9177, lng: 77.6238 },
  { id: "4", type: "drainage", priority: "medium", location: "Majestic Bus Stand", lat: 12.9766, lng: 77.5713 },
  { id: "5", type: "streetlight", priority: "low", location: "Indiranagar 100ft Road", lat: 12.9784, lng: 77.6408 },
  { id: "6", type: "pothole", priority: "medium", location: "Electronic City Phase 1", lat: 12.8399, lng: 77.6770 },
  { id: "7", type: "garbage", priority: "high", location: "Marathahalli Bridge", lat: 12.9591, lng: 77.6974 },
  { id: "8", type: "flooding", priority: "medium", location: "Hebbal Lake Area", lat: 13.0358, lng: 77.5970 },
  { id: "9", type: "streetlight", priority: "low", location: "JP Nagar 6th Phase", lat: 12.9063, lng: 77.5857 },
  { id: "10", type: "drainage", priority: "high", location: "KR Market Area", lat: 12.9614, lng: 77.5786 },
];

const issueColors: Record<string, string> = {
  pothole: "#ef4444",
  garbage: "#f97316",
  flooding: "#3b82f6",
  drainage: "#a855f7",
  streetlight: "#eab308",
};

const createMarkerIcon = (color: string) => {
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};

export function CityMap() {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Initialize map centered on Bengaluru
    const map = L.map(containerRef.current, {
      center: [12.9716, 77.5946],
      zoom: 12,
      zoomControl: true,
    });

    // Add tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    mapRef.current = map;

    // Cleanup
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Add markers based on filter
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers
    mapRef.current.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        mapRef.current?.removeLayer(layer);
      }
    });

    // Filter and add markers
    const filteredIssues = selectedType
      ? issues.filter((issue) => issue.type === selectedType)
      : issues;

    filteredIssues.forEach((issue) => {
      const marker = L.marker([issue.lat, issue.lng], {
        icon: createMarkerIcon(issueColors[issue.type]),
      }).addTo(mapRef.current!);

      marker.bindPopup(`
        <div style="min-width: 150px;">
          <p style="font-weight: 600; text-transform: capitalize; margin: 0 0 4px 0;">${issue.type}</p>
          <p style="font-size: 12px; color: #666; margin: 0 0 4px 0;">${issue.location}</p>
          <p style="font-size: 12px; margin: 0;">
            Priority: <span style="font-weight: 500; text-transform: capitalize;">${issue.priority}</span>
          </p>
        </div>
      `);
    });
  }, [selectedType]);

  const filterButtons = [
    { key: null, label: "All Issues" },
    { key: "pothole", label: "Potholes", color: issueColors.pothole },
    { key: "garbage", label: "Garbage", color: issueColors.garbage },
    { key: "flooding", label: "Flooding", color: issueColors.flooding },
    { key: "drainage", label: "Drainage", color: issueColors.drainage },
    { key: "streetlight", label: "Streetlight", color: issueColors.streetlight },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        {filterButtons.map((btn) => (
          <button
            key={btn.key ?? "all"}
            onClick={() => setSelectedType(btn.key)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedType === btn.key
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border text-card-foreground hover:bg-muted"
            }`}
          >
            {btn.color && (
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: btn.color }}
              />
            )}
            {btn.label}
          </button>
        ))}
      </div>

      {/* Map Container */}
      <div
        ref={containerRef}
        className="flex-1 min-h-[400px] rounded-lg overflow-hidden border border-border"
      />

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4 text-sm">
        {Object.entries(issueColors).map(([type, color]) => (
          <div key={type} className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="capitalize text-muted-foreground">{type}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
