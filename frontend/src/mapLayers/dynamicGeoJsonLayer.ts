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
  "#E53935", // Red
  "#1E88E5", // Blue
  "#43A047", // Green
  "#FB8C00", // Orange
  "#8E24AA", // Purple
  "#00897B", // Teal
  "#6D4C41", // Brown
  "#FDD835", // Yellow
  "#546E7A", // Blue Grey
  "#7CB342", // Lime Green
  "#660000", // brown
  "#5E35B1", // Deep Purple
  "#EF6C00", // Deep Orange
  "#2E7D32", // Dark Green
  "#795548", // Coffee Brown
  "#9E9D24", // Olive
  "#00ACC1", // Cyan
  "#00CCCC", // Golden
  "#4E342E", // Dark Brown
  "#7B1FA2", // Violet
];

function getStableLayerColor(tableName: string) {
  let hash = 0;

  for (const char of tableName) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }

  return LAYER_COLORS[hash % LAYER_COLORS.length];
}