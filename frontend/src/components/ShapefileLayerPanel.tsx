import { X } from "lucide-react";
import { MAP_LAYER_CONFIGS } from "../mapLayers/mapLayerConfig";
import "./ShapefileLayerPanel.css";

type ShapefileLayerPanelProps = {
  visibleLayerIds: string[];
  onLayerToggle: (layerId: string) => void;
  onClose: () => void;
};

// Right-side map control for turning GeoServer shapefile/WMS layers on and off.
export function ShapefileLayerPanel({
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
        {MAP_LAYER_CONFIGS.map((layer) => (
          <label key={layer.id} className="shapefile-option">
            <input
              type="checkbox"
              checked={visibleLayerIds.includes(layer.id)}
              onChange={() => onLayerToggle(layer.id)}
            />
            <span>{layer.label}</span>
          </label>
        ))}
      </div>
    </aside>
  );
}
