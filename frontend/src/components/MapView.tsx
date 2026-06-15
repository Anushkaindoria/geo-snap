import { Menu, Upload } from "lucide-react";
import { PhotoListOverlay } from "./PhotoListOverlay";
import { ProjectBanner } from "./ProjectBanner";
import { ShapefileLayerPanel } from "./ShapefileLayerPanel";
import type { PhotoPoint } from "../types";
import type { GisLayerSummary } from "../types/gis";
import "./MapView.css";

type MapViewProps = {
  mapContainerRef: React.RefObject<HTMLDivElement | null>;
  photos: PhotoPoint[];
  selectedPhotoId: string | null;
  gisLayers: GisLayerSummary[];
  visibleLayerIds: string[];
  isLayerPanelOpen: boolean;
  isPhotoListOpen: boolean;
  onListPhotoClick: (photo: PhotoPoint) => void;
  onEditPhoto: (photo: PhotoPoint) => void;
  onDeletePhoto: (photo: PhotoPoint) => void;
  onLayerToggle: (layerId: string) => void;
  onToggleLayerPanel: () => void;
  onCloseLayerPanel: () => void;
  onShowAllPhotos: () => void;
  onClosePhotoList: () => void;
  onOpenUploadForm: () => void;
  onGeoJsonUploaded: (geojson: any) => void;
};

// The map screen is shown first and stays full-screen behind the floating photo list.
export function MapView({
  mapContainerRef,
  photos,
  selectedPhotoId,
  gisLayers,
  visibleLayerIds,
  isLayerPanelOpen,
  isPhotoListOpen,
  onListPhotoClick,
  onEditPhoto,
  onDeletePhoto,
  onLayerToggle,
  onToggleLayerPanel,
  onCloseLayerPanel,
  onShowAllPhotos,
  onClosePhotoList,
  onOpenUploadForm,
  onGeoJsonUploaded,
}: MapViewProps) {
  return (
    <main className="map-screen">
      <div ref={mapContainerRef} className="map-container" />
      <ProjectBanner overlay />

      <button
        type="button"
        className="map-layer-toggle"
        onClick={onToggleLayerPanel}
        aria-label="Open shapefile layers"
      >
        <Menu size={22} />
        <span>{visibleLayerIds.length}</span>
      </button>

      <button
        type="button"
        className="map-upload-fab"
        onClick={onOpenUploadForm}
      >
        <Upload size={18} />
        <span>Upload photo</span>
      </button>

      {isPhotoListOpen && photos.length > 0 && (
        <PhotoListOverlay
          photos={photos}
          selectedPhotoId={selectedPhotoId}
          onPhotoClick={onListPhotoClick}
          onEditPhoto={onEditPhoto}
          onDeletePhoto={onDeletePhoto}
          onShowAllPhotos={onShowAllPhotos}
          onClosePhotoList={onClosePhotoList}
          onUploadClick={onOpenUploadForm}
        />
      )}

      {isLayerPanelOpen && (
        <ShapefileLayerPanel
        layers={gisLayers}
        visibleLayerIds={visibleLayerIds}
        onLayerToggle={onLayerToggle}
        onClose={onCloseLayerPanel}
        onGeoJsonUploaded={onGeoJsonUploaded}
      />
      )}
    </main>
  );
}
