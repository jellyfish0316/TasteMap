import { AdvancedMarker, Pin } from "@vis.gl/react-google-maps";

import type { PlaceSummary } from "@/types/place";

interface PlacePinProps {
  place: PlaceSummary;
  selected: boolean;
  onClick: (placeId: string) => void;
}

// One map pin for a saved place. Skips places we don't have coordinates for.
export default function PlacePin({ place, selected, onClick }: PlacePinProps) {
  if (place.lat == null || place.lng == null) return null;
  return (
    <AdvancedMarker
      position={{ lat: place.lat, lng: place.lng }}
      onClick={() => onClick(place.id)}
      title={place.name}
    >
      <Pin
        background={selected ? "#ea580c" : "#f97316"}
        borderColor={selected ? "#9a3412" : "#c2410c"}
        glyphColor="#ffffff"
        scale={selected ? 1.3 : 1}
      />
    </AdvancedMarker>
  );
}
