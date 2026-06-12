import { API_BASE_URL } from "../config/api";
import type { GeoJsonFeatureCollection, GisLayerSummary } from "../types/gis";

type RawLayerRow = {
  table_name?: unknown;
  tableName?: unknown;
  name?: unknown;
  label?: unknown;
};

// Loads the list of PostGIS tables exposed by the backend.
export async function fetchGisLayers(): Promise<GisLayerSummary[]> {
  const response = await fetch(`${API_BASE_URL}/api/layers`);

  if (!response.ok) {
    throw new Error("Could not load GIS layers.");
  }

  const data = await response.json();
  const rows: RawLayerRow[] = Array.isArray(data)
    ? data
    : Array.isArray(data.layers)
      ? data.layers
      : [];

  return rows
    .map(normalizeLayerRow)
    .filter((layer: GisLayerSummary | null): layer is GisLayerSummary =>
      Boolean(layer),
    );
}

// Loads GeoJSON for one selected PostGIS table only when the layer is enabled.
export async function fetchGisLayerGeoJson(
  tableName: string,
): Promise<GeoJsonFeatureCollection> {
  const response = await fetch(
    `${API_BASE_URL}/api/layers/${encodeURIComponent(tableName)}`,
  );

  if (!response.ok) {
    throw new Error(`Could not load layer ${tableName}.`);
  }

  const geoJson = await response.json();

  return {
    type: "FeatureCollection",
    features: Array.isArray(geoJson?.features) ? geoJson.features : [],
  };
}

function normalizeLayerRow(row: RawLayerRow): GisLayerSummary | null {
  const tableName = String(row.table_name ?? row.tableName ?? row.name ?? "");

  if (!tableName) return null;

  return {
    tableName,
    label: String(row.label ?? formatLayerLabel(tableName)),
  };
}

function formatLayerLabel(tableName: string) {
  return tableName
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
