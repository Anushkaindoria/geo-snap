import { useState } from "react";
import { Menu, SendHorizontal, Sparkles, Upload } from "lucide-react";
import { PhotoListOverlay } from "./PhotoListOverlay";
import { ProjectBanner } from "./ProjectBanner";
import { ShapefileLayerPanel } from "./ShapefileLayerPanel";
import type { PhotoPoint } from "../types";
import type { GisLayerSummary } from "../types/gis";
import "./ImageModal.css";
import "./MapView.css";

type MapViewProps = {
  mapContainerRef: React.RefObject<HTMLDivElement | null>;
  photos: PhotoPoint[];
  selectedPhotoId: string | null;
  matchingPhotos: PhotoPoint[];
  isSearchingPhotos: boolean;
  photoSearchError: string;
  indexingInProgress: boolean;
  failedPhotosPendingRetry: number;
  gisLayers: GisLayerSummary[];
  visibleLayerIds: string[];
  isLayerPanelOpen: boolean;
  isPhotoListOpen: boolean;
  isImageModalOpen: boolean;
  onListPhotoClick: (photo: PhotoPoint) => void;
  onEditPhoto: (photo: PhotoPoint) => void;
  onDeletePhoto: (photo: PhotoPoint) => void;
  onGenerateTags: (photo: PhotoPoint) => Promise<void>;
  onLayerToggle: (layerId: string) => void;
  onToggleLayerPanel: () => void;
  onCloseLayerPanel: () => void;
  onShowAllPhotos: () => void;
  onClosePhotoList: () => void;
  onOpenUploadForm: () => void;
  onGeoJsonUploaded: (geojson: any) => void;
  onSearchPhotos: (query: string) => Promise<PhotoPoint[]>;
  onClearPhotoSearch: () => void;
};

// The map screen is shown first and stays full-screen behind the floating photo list.
export function MapView({
  mapContainerRef,
  photos,
  selectedPhotoId,
  matchingPhotos,
  isSearchingPhotos,
  photoSearchError,
  indexingInProgress,
  failedPhotosPendingRetry,
  gisLayers,
  visibleLayerIds,
  isLayerPanelOpen,
  isPhotoListOpen,
  isImageModalOpen,
  onListPhotoClick,
  onEditPhoto,
  onDeletePhoto,
  onGenerateTags,
  onLayerToggle,
  onToggleLayerPanel,
  onCloseLayerPanel,
  onShowAllPhotos,
  onClosePhotoList,
  onOpenUploadForm,
  onGeoJsonUploaded,
  onSearchPhotos,
  onClearPhotoSearch,
}: MapViewProps) {
  const [question, setQuestion] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [showAI, setShowAI] = useState(false);

  async function askAI() {
    const tagQuery = getTagSearchQuery(question);

    if (!tagQuery) {
      return;
    }

    setSubmittedQuery(tagQuery);
    await onSearchPhotos(tagQuery);
  }

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
          onGenerateTags={onGenerateTags}
          onShowAllPhotos={onShowAllPhotos}
          onClosePhotoList={onClosePhotoList}
          onUploadClick={onOpenUploadForm}
        />
      )}

      {!isImageModalOpen && !showAI && (
        <button
          type="button"
          className="ai-fab"
          onClick={() => setShowAI(true)}
          aria-label="Open AI assistant"
        >
          <Sparkles size={22} />
        </button>
      )}

      {!isImageModalOpen && showAI && (
        <div className="ai-drawer">
          <div className="ai-header">
            <h3>Ask AI</h3>

            <button
              type="button"
              className="ai-drawer-close"
              onClick={() => setShowAI(false)}
              aria-label="Close AI assistant"
            >
              x
            </button>
          </div>

          <div className="ai-input-wrapper">
            <input
              type="text"
              placeholder="Find photos by tag..."
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  askAI();
                }
              }}
            />

            <button
              type="button"
              className="ai-send-button"
              onClick={askAI}
              disabled={isSearchingPhotos}
              aria-label="Search uploaded photos"
            >
              <SendHorizontal size={18} />
            </button>
          </div>

          {submittedQuery && !isSearchingPhotos && !photoSearchError && (
            <div className="ai-answer">
              <strong>Photo search</strong>
              <p>
                {matchingPhotos.length} matching {matchingPhotos.length === 1 ? "photo" : "photos"} for "{submittedQuery}".
              </p>
              {matchingPhotos.length > 0 && (
                <ul className="ai-search-results">
                  {matchingPhotos.map((photo) => (
                    <li key={photo.id}>{photo.name}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {!isSearchingPhotos && !photoSearchError &&
            (indexingInProgress || failedPhotosPendingRetry > 0) && (
              <div className="ai-answer ai-indexing-status">
                {indexingInProgress && (
                  <p className="ai-indexing-note">
                    Some photos are still being indexed. Search results may improve automatically.
                  </p>
                )}
                {failedPhotosPendingRetry > 0 && (
                  <small className="ai-indexing-count">
                    {failedPhotosPendingRetry} {failedPhotosPendingRetry === 1 ? "photo" : "photos"} pending indexing.
                  </small>
                )}
              </div>
            )}
          {(submittedQuery || matchingPhotos.length > 0 || photoSearchError || indexingInProgress || failedPhotosPendingRetry > 0) && !isSearchingPhotos && (
            <button
              type="button"
              className="ai-clear-search"
              onClick={() => {
                setQuestion("");
                setSubmittedQuery("");
                onClearPhotoSearch();
              }}
            >
              Clear Search
            </button>
          )}
          {isSearchingPhotos && (
            <div className="ai-loading" role="status" aria-live="polite">
              <span className="ai-loading__icon">...</span>
              <span>Searching uploaded photos...</span>
            </div>
          )}

          {photoSearchError && !isSearchingPhotos && (
            <div className="ai-answer" role="alert">
              <strong>Search unavailable</strong>
              <p>{photoSearchError}</p>
            </div>
          )}
        </div>
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

// Turns natural language requests into the tag phrase expected by /api/photos/search.
function getTagSearchQuery(message: string) {
  const meaningfulWords = message
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => !PHOTO_SEARCH_STOP_WORDS.has(word.replace(/[^a-z0-9-]/g, "")));

  return meaningfulWords.join(" ").replace(/[^a-z0-9 -]/g, "").trim();
}

const PHOTO_SEARCH_STOP_WORDS = new Set([
  "show",
  "find",
  "search",
  "for",
  "photo",
  "photos",
  "image",
  "images",
  "picture",
  "pictures",
  "containing",
  "contain",
  "with",
  "of",
  "the",
  "a",
  "an",
  "all",
]);





