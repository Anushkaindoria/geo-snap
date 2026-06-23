import { useState } from "react";
import { Menu, SendHorizontal, Sparkles, Upload } from "lucide-react";
import { PhotoListOverlay } from "./PhotoListOverlay";
import { ProjectBanner } from "./ProjectBanner";
import { ShapefileLayerPanel } from "./ShapefileLayerPanel";
import { API_BASE_URL } from "../config/api";
import type { PhotoPoint } from "../types";
import type { GisLayerSummary } from "../types/gis";
import "./ImageModal.css";
import "./MapView.css";

type MapViewProps = {
  mapContainerRef: React.RefObject<HTMLDivElement | null>;
  photos: PhotoPoint[];
  selectedPhotoId: string | null;
  gisLayers: GisLayerSummary[];
  visibleLayerIds: string[];
  isLayerPanelOpen: boolean;
  isPhotoListOpen: boolean;
  isImageModalOpen: boolean;
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
  isImageModalOpen,
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
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const selectedPhoto = selectedPhotoId
    ? photos.find((photo) => photo.id === selectedPhotoId)
    : null;

  async function askAI() {
    if (!question.trim()) {
      return;
    }

    if (!selectedPhoto) {
      setAnswer("Select a photo marker first, then ask AI about that image.");
      return;
    }

    try {
      setLoading(true);
      setAnswer("");

      const response = await fetch(`${API_BASE_URL}/api/vision/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageUrl: selectedPhoto.url,
          question,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setAnswer(getFriendlyAiErrorMessage(data));
        return;
      }

      setAnswer(data.answer || "No answer received");
    } catch (error) {
      console.error("AI ERROR:", error);
      setAnswer("Failed to get AI response");
    } finally {
      setLoading(false);
    }
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
              placeholder="Ask a question..."
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
              disabled={loading}
              aria-label="Send AI question"
            >
              <SendHorizontal size={18} />
            </button>
          </div>

          {answer && (
            <div className="ai-answer">
              <strong>AI Answer:</strong>
              <p>{answer}</p>
            </div>
          )}

          {loading && (
            <div className="ai-loading" role="status" aria-live="polite">
              <span className="ai-loading__icon">...</span>
              <span>Analyzing image...</span>
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

type AiErrorResponse = {
  type?: string;
  message?: string;
  retryAfter?: number;
};

function getFriendlyAiErrorMessage(errorData: AiErrorResponse) {
  if (errorData.type === "quota_exceeded") {
    if (typeof errorData.retryAfter === "number" && errorData.retryAfter > 0) {
      const minutes = Math.max(1, Math.ceil(errorData.retryAfter / 60));
      return `AI request limit reached.\nTry again after ${minutes} ${
        minutes === 1 ? "minute" : "minutes"
      }.`;
    }

    return "AI request limit reached.\nPlease try again later.";
  }

  if (errorData.type === "service_busy") {
    return "AI service is currently busy.\nPlease try again in a few minutes.";
  }

  return errorData.message || "Failed to get AI response";
}
