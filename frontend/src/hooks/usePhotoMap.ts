import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import type { PhotoPoint } from "../types";
import {
  addDynamicGeoJsonLayer,
  setDynamicGeoJsonLayerVisibility,
} from "../mapLayers/dynamicGeoJsonLayer";
import { fetchGisLayerGeoJson } from "../services/gisLayerService";
import type { GisLayerSummary } from "../types/gis";

type UsePhotoMapOptions = {
  isMapVisible: boolean;
  photos: PhotoPoint[];
  focusPhotoId: string | null;
  gisLayers: GisLayerSummary[];
  visibleLayerIds: string[];
  uploadedGeoJson: any | null;
  onMarkerClick: (photo: PhotoPoint) => void;
};

// Owns Mapbox setup, marker rendering, and map movement behavior.
export function usePhotoMap({
  isMapVisible,
  photos,
  focusPhotoId,
  gisLayers,
  visibleLayerIds,
  onMarkerClick,
  uploadedGeoJson,
}: UsePhotoMapOptions) {

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const onMarkerClickRef = useRef(onMarkerClick);
  const photoSignatureRef = useRef("");
  const loadedGisLayerIdsRef = useRef<Set<string>>(new Set());
  const [mapLoadVersion, setMapLoadVersion] = useState(0);

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
    map.on("load", () => {
      map.resize();
      setMapLoadVersion((version) => version + 1);
    });

    window.setTimeout(() => {
      map.resize();
    }, 100);

    
    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      loadedGisLayerIdsRef.current.clear();
      map.remove();
      mapRef.current = null;
    };
  }, [isMapVisible]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !isMapVisible || !map.isStyleLoaded()) return;

    const visibleLayerIdSet = new Set(visibleLayerIds);
    const availableLayerById = new Map(
      gisLayers.map((layer) => [layer.tableName, layer]),
    );

    // Hide unchecked layers while keeping already fetched GeoJSON cached on the map.
    gisLayers.forEach((layer) => {
      if (loadedGisLayerIdsRef.current.has(layer.tableName)) {
        setDynamicGeoJsonLayerVisibility(
          map,
          layer.tableName,
          visibleLayerIdSet.has(layer.tableName),
        );
      }
    });

    visibleLayerIds.forEach((tableName) => {
      const layer = availableLayerById.get(tableName);

      if (!layer || loadedGisLayerIdsRef.current.has(tableName)) return;

      fetchGisLayerGeoJson(tableName)
        .then((geoJson) => {
          if (!mapRef.current || !mapRef.current.isStyleLoaded()) return;

          addDynamicGeoJsonLayer(
            mapRef.current,
            layer,
            geoJson,
            visibleLayerIds.includes(tableName),
          );
          loadedGisLayerIdsRef.current.add(tableName);
        })
        .catch((error) => {
          console.error(`Layer load failed for ${tableName}`, error);
        });
    });
  }, [gisLayers, isMapVisible, mapLoadVersion, visibleLayerIds]);

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


  useEffect(() => {
  const map = mapRef.current;

  if (!map || !uploadedGeoJson || !map.isStyleLoaded()) return;

  addDynamicGeoJsonLayer(
    map,
    {
      tableName: "uploaded-shapefile",
      label: "Uploaded Shapefile",
    },
    uploadedGeoJson,
    true,
  );

  const bounds = new mapboxgl.LngLatBounds();

  uploadedGeoJson.features.forEach((feature: any) => {
    const coords = feature.geometry.coordinates;

    if (feature.geometry.type === "Point") {
      bounds.extend(coords);
    }
  });

  if (!bounds.isEmpty()) {
    map.fitBounds(bounds, {
      padding: 50,
    });
  }
}, [uploadedGeoJson]);

  return {
    mapContainerRef,
    flyToPhoto,
  };
}
