import { X } from "lucide-react";
import type { GisLayerSummary } from "../types/gis";
import "./ShapefileLayerPanel.css";
import { useState } from "react";
import { API_BASE_URL } from "../config/api";

type ShapefileLayerPanelProps = {
  layers: GisLayerSummary[];
  visibleLayerIds: string[];
  onLayerToggle: (layerId: string) => void;
  onClose: () => void;
  onGeoJsonUploaded: (geojson: any) => void;
};

// Right-side map control for turning dynamic PostGIS GeoJSON layers on and off.
export function ShapefileLayerPanel({
  layers,
  visibleLayerIds,
  onLayerToggle,
  onClose,
  onGeoJsonUploaded,
}: ShapefileLayerPanelProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  return (
    <aside className="shapefile-panel" aria-label="Shapefile layers">
      <div className="shapefile-panel__header">
        <span>Shapefile layers</span>
        <strong>{visibleLayerIds.length}</strong>
        <button
          type="button"
          className="shapefile-panel__close"
          onClick={onClose}
          aria-label="Close shapefile layers"
          title="Close"
        >
          <X size={17} />
        </button>
      </div>

      <div className="upload-section">
  <input
    className="upload-input"
    type="file"
    accept=".zip"
    onChange={(event) => {
      const file = event.target.files?.[0];

      if (file) {
        setSelectedFile(file);
      }
    }}
  />

  <button
    type="button"
    className="upload-btn"
    onClick={async () => {
      if (!selectedFile) {
        alert("Please select a ZIP file");
        return;
      }

      const formData = new FormData();
      formData.append("shapefile", selectedFile);

      const response = await fetch(
        `${API_BASE_URL}/api/shapefiles/upload`,
        {
          method: "POST",
          body: formData,
        },
      );

      const data = await response.json();

      onGeoJsonUploaded(data.geojson);
      alert("Upload complete");
    }}
  >
    Upload ZIP
  </button>
</div>

      <div className="shapefile-panel__list">
        {layers.length === 0 ? (
          <p className="shapefile-panel__empty">
            No GIS layers found in PostGIS.
          </p>
        ) : (
          layers.map((layer) => (
          <label key={layer.tableName} className="shapefile-option">
            <input
              type="checkbox"
              checked={visibleLayerIds.includes(layer.tableName)}
              onChange={() => onLayerToggle(layer.tableName)}
            />
            <span>{layer.label}</span>
          </label>
          ))
        )}
      </div>
    </aside>
  );
}
