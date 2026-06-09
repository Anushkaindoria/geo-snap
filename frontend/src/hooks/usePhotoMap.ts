import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import type { PhotoPoint } from "../types";
import { MAP_LAYER_CONFIGS } from "../mapLayers/mapLayerConfig";

type UsePhotoMapOptions = {
  isMapVisible: boolean;
  photos: PhotoPoint[];
  focusPhotoId: string | null;
  visibleLayerIds: string[];
  onMarkerClick: (photo: PhotoPoint) => void;
};

// Owns Mapbox setup, marker rendering, and map movement behavior.
export function usePhotoMap({
  isMapVisible,
  photos,
  focusPhotoId,
  visibleLayerIds,
  onMarkerClick,
}: UsePhotoMapOptions) {

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const onMarkerClickRef = useRef(onMarkerClick);
  const photoSignatureRef = useRef("");

  // Keep the latest marker click handler without forcing marker re-creation on every render.
  useEffect(() => {
    onMarkerClickRef.current = onMarkerClick;
  }, [onMarkerClick]);

  useEffect(() => {
    if (!isMapVisible || !mapContainerRef.current || mapRef.current) return;

    // Mapbox is created only when the map screen is visible.
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [72.8777, 19.0760],
      zoom: 10,
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    mapRef.current = map;

    // Resize fixes the common blank-side issue after React mounts the map container.
   map.on("load", async () => {
  map.resize();

  // Register every GeoServer/WMS layer once, then keep it hidden until checked.
  MAP_LAYER_CONFIGS.forEach((layer) => {
    layer.addLayer(map);
  });
  syncMapLayerVisibility(map, visibleLayerIds);
});

    window.setTimeout(() => {
      map.resize();
    }, 100);

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, [isMapVisible]);

  useEffect(() => {
    if (!mapRef.current || !isMapVisible) return;

    syncMapLayerVisibility(mapRef.current, visibleLayerIds);
  }, [isMapVisible, visibleLayerIds]);

  useEffect(() => {
    if (!mapRef.current || !isMapVisible) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    photos.forEach((photo) => {
      const markerElement = document.createElement("button");
      markerElement.className = "photo-marker";
      markerElement.type = "button";
      markerElement.setAttribute("aria-label", `Open ${photo.name}`);
      markerElement.addEventListener("click", () => onMarkerClickRef.current(photo));

      const marker = new mapboxgl.Marker({ element: markerElement })
        .setLngLat([photo.lng, photo.lat])
        .addTo(mapRef.current!);

      markersRef.current.push(marker);
    });

    if (photos.length > 0) {
      const photoSignature = photos.map((photo) => photo.id).join("|");
      const hasPhotoSetChanged = photoSignatureRef.current !== photoSignature;
      const focusedPhoto = focusPhotoId
        ? photos.find((photo) => photo.id === focusPhotoId)
        : undefined;
      const latestPhoto = photos[photos.length - 1];
      const targetPhoto = focusedPhoto || (hasPhotoSetChanged ? latestPhoto : undefined);

      photoSignatureRef.current = photoSignature;

      if (!targetPhoto) return;

      // Keep the selected marker stable; only fall back to latest after a real upload/load.
      mapRef.current.resize();
      mapRef.current.flyTo({
        center: [targetPhoto.lng, targetPhoto.lat],
        zoom: 15,
        essential: true,
      });
    }
  }, [isMapVisible, photos, focusPhotoId]);

  function flyToPhoto(photo: PhotoPoint) {
    if (!mapRef.current) return;

    // List clicks only move the map; image preview is intentionally reserved for marker clicks.
    mapRef.current.flyTo({
      center: [photo.lng, photo.lat],
      zoom: 16,
      essential: true,
    });
  }

  return {
    mapContainerRef,
    flyToPhoto,
  };
}

function syncMapLayerVisibility(map: mapboxgl.Map, visibleLayerIds: string[]) {
  MAP_LAYER_CONFIGS.forEach((layer) => {
    if (!map.getLayer(layer.id)) return;

    map.setLayoutProperty(
      layer.id,
      "visibility",
      visibleLayerIds.includes(layer.id) ? "visible" : "none",
    );
  });
}
