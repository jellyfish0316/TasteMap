import { useEffect } from "react";
import { APIProvider, Map, useMap } from "@vis.gl/react-google-maps";

import type { PlaceSummary } from "@/types/place";

import PlacePin from "./PlacePin";

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
// DEMO_MAP_ID lets AdvancedMarkers render in development without a Cloud Map ID.
const MAP_ID = "DEMO_MAP_ID";
// Default view: Taiwan-ish, until we have pins to fit.
const DEFAULT_CENTER = { lat: 23.7, lng: 120.9 };

interface MapViewProps {
  pins: PlaceSummary[];
  selectedPlaceId: string | null;
  onSelectPin: (placeId: string) => void;
  // When set, fly the camera here (a selected pin or a searched place).
  focus: { lat: number; lng: number } | null;
}

// Google-Maps-style pan+zoom to a target whenever `focus` changes.
function CameraController({ focus }: { focus: MapViewProps["focus"] }) {
  const map = useMap();
  useEffect(() => {
    if (!map || !focus) return;
    map.panTo(focus);
    map.setZoom(16);
  }, [map, focus]);
  return null;
}

export default function MapView({ pins, selectedPlaceId, onSelectPin, focus }: MapViewProps) {
  if (!API_KEY) {
    return (
      <div className="flex h-full items-center justify-center bg-neutral-100 p-6 text-center text-sm text-neutral-500">
        Set <code className="mx-1 rounded bg-neutral-200 px-1">VITE_GOOGLE_MAPS_API_KEY</code> in
        your .env.local to enable the map.
      </div>
    );
  }

  const located = pins.filter((p) => p.lat != null && p.lng != null);
  const center = located.length
    ? { lat: located[0].lat as number, lng: located[0].lng as number }
    : DEFAULT_CENTER;

  return (
    <APIProvider apiKey={API_KEY}>
      <Map
        mapId={MAP_ID}
        defaultCenter={center}
        defaultZoom={located.length ? 12 : 8}
        gestureHandling="greedy"
        disableDefaultUI={false}
        className="h-full w-full"
      >
        <CameraController focus={focus} />
        {located.map((place) => (
          <PlacePin
            key={place.id}
            place={place}
            selected={place.id === selectedPlaceId}
            onClick={onSelectPin}
          />
        ))}
      </Map>
    </APIProvider>
  );
}
