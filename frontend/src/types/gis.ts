// Metadata for one PostGIS table exposed by GET /api/layers.
export type GisLayerSummary = {
  tableName: string;
  label: string;
};

// Mapbox accepts standard GeoJSON FeatureCollections for dynamic PostGIS sources.
export type GeoJsonFeatureCollection = GeoJSON.FeatureCollection;
