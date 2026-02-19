/// <reference types="@types/google.maps" />

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const MAP_SCRIPT_BASE = "/api/maps/js?v=weekly&libraries=marker,places,geocoding,geometry";

function loadMapScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = MAP_SCRIPT_BASE;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Maps script"));
    document.head.appendChild(script);
  });
}

interface MapViewProps {
  className?: string;
  initialCenter?: google.maps.LatLngLiteral;
  initialZoom?: number;
  onMapReady?: (map: google.maps.Map) => void;
}

export function MapView({
  className,
  initialCenter = { lat: 45.5017, lng: -73.5673 },
  initialZoom = 12,
  onMapReady,
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map | null>(null);
  const [error, setError] = useState<string | null>(null);
  const onMapReadyRef = useRef(onMapReady);
  onMapReadyRef.current = onMapReady;

  useEffect(() => {
    let cancelled = false;
    loadMapScript()
      .then(() => {
        if (cancelled || !mapContainer.current) return;
        map.current = new (window as any).google.maps.Map(mapContainer.current, {
          zoom: initialZoom,
          center: initialCenter,
          mapTypeControl: true,
          fullscreenControl: true,
          zoomControl: true,
          streetViewControl: true,
          mapId: "DEMO_MAP_ID",
          gestureHandling: "greedy",
        });
        onMapReadyRef.current?.(map.current);
      })
      .catch(() => {
        if (!cancelled) setError("Map unavailable");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className={cn("w-full h-[500px] flex items-center justify-center bg-muted text-muted-foreground", className)}>
        Map unavailable — ensure GOOGLE_MAPS_API_KEY is set
      </div>
    );
  }
  return (
    <div ref={mapContainer} className={cn("w-full h-[500px]", className)} />
  );
}
