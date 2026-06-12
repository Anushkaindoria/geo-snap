import { X } from "lucide-react";
import type { GisLayerSummary } from "../types/gis";
import "./ShapefileLayerPanel.css";

type ShapefileLayerPanelProps = {
  layers: GisLayerSummary[];
  visibleLayerIds: string[];
  onLayerToggle: (layerId: string) => void;
  onClose: () => void;
};

// Right-side map control for turning dynamic PostGIS GeoJSON layers on and off.
export function ShapefileLayerPanel({
  layers,
  visibleLayerIds,
  onLayerToggle,
  onClose,
}: ShapefileLayerPanelProps) {
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
