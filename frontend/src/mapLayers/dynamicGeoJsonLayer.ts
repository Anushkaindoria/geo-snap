import type { Map as MapboxMap } from "mapbox-gl";
import type { GeoJsonFeatureCollection, GisLayerSummary } from "../types/gis";

const SOURCE_PREFIX = "postgis-source";
const LAYER_PREFIX = "postgis-layer";

type DynamicLayerIds = {
  sourceId: string;
  fillId: string;
  outlineId: string;
  lineId: string;
  pointId: string;
};

// Adds one reusable Mapbox source for a PostGIS layer and style layers for every supported geometry family.
export function addDynamicGeoJsonLayer(
  map: MapboxMap,
  layer: GisLayerSummary,
  data: GeoJsonFeatureCollection,
  visible: boolean,
) {
  const ids = getDynamicLayerIds(layer.tableName);
  const color = getStableLayerColor(layer.tableName);
  const visibility = visible ? "visible" : "none";

  if (!map.getSource(ids.sourceId)) {
    map.addSource(ids.sourceId, {
      type: "geojson",
      data,
    });
  }

  if (!map.getLayer(ids.fillId)) {
    map.addLayer({
      id: ids.fillId,
      type: "fill",
      source: ids.sourceId,
      filter: ["match", ["geometry-type"], ["Polygon", "MultiPolygon"], true, false],
      layout: { visibility },
      paint: {
        "fill-color": color,
        "fill-opacity": 0.22,
      },
    });
  }

  if (!map.getLayer(ids.outlineId)) {
    map.addLayer({
      id: ids.outlineId,
      type: "line",
      source: ids.sourceId,
      filter: ["match", ["geometry-type"], ["Polygon", "MultiPolygon"], true, false],
      layout: { visibility },
      paint: {
        "line-color": color,
        "line-width": 1.8,
        "line-opacity": 0.9,
      },
    });
  }

  if (!map.getLayer(ids.lineId)) {
    map.addLayer({
      id: ids.lineId,
      type: "line",
      source: ids.sourceId,
      filter: ["match", ["geometry-type"], ["LineString", "MultiLineString"], true, false],
      layout: { visibility },
      paint: {
        "line-color": color,
        "line-width": 2.8,
        "line-opacity": 0.95,
      },
    });
  }

  if (!map.getLayer(ids.pointId)) {
    map.addLayer({
      id: ids.pointId,
      type: "circle",
      source: ids.sourceId,
      filter: ["match", ["geometry-type"], ["Point", "MultiPoint"], true, false],
      layout: { visibility },
      paint: {
        "circle-color": color,
        "circle-radius": 5,
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 1.5,
      },
    });
  }
}

// Keeps loaded layers cached and toggles visibility without re-fetching GeoJSON.
export function setDynamicGeoJsonLayerVisibility(
  map: MapboxMap,
  tableName: string,
  visible: boolean,
) {
  const visibility = visible ? "visible" : "none";
  const ids = getDynamicLayerIds(tableName);

  [ids.fillId, ids.outlineId, ids.lineId, ids.pointId].forEach((layerId) => {
    if (map.getLayer(layerId)) {
      map.setLayoutProperty(layerId, "visibility", visibility);
    }
  });
}

export function getDynamicLayerIds(tableName: string): DynamicLayerIds {
  const safeTableName = tableName.replace(/[^a-zA-Z0-9_-]/g, "-");

  return {
    sourceId: `${SOURCE_PREFIX}-${safeTableName}`,
    fillId: `${LAYER_PREFIX}-${safeTableName}-fill`,
    outlineId: `${LAYER_PREFIX}-${safeTableName}-outline`,
    lineId: `${LAYER_PREFIX}-${safeTableName}-line`,
    pointId: `${LAYER_PREFIX}-${safeTableName}-point`,
  };
}

const LAYER_COLORS = [
  "#FF0000", // Red
  "#0000FF", // Blue
  "#00AA00", // Green
  "#FF8C00", // Orange
  "#800080", // Purple
  "#00CED1", // Cyan
  "#FF1493", // Pink
  "#8B4513", // Brown
  "#808000", // Olive
  "#000080", // Navy
  "#FFD700", // Gold
  "#228B22", // Forest Green
  "#4B0082", // Indigo
  "#DC143C", // Crimson
  "#20B2AA", // Teal
  "#A0522D", // Sienna
  "#9932CC", // Dark Orchid
  "#2F4F4F", // Slate Gray
  "#FF69B4", // Hot Pink
  "#1E90FF", // Dodger Blue
];

function getStableLayerColor(tableName: string) {
  let hash = 0;

  for (const char of tableName) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }

  return LAYER_COLORS[hash % LAYER_COLORS.length];
}