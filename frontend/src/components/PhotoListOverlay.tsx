import { CheckCircle2, Hourglass, Pencil, Trash2, X } from "lucide-react";
import { useState } from "react";
import type { PhotoPoint } from "../types";
import "./PhotoListOverlay.css";

type PhotoListOverlayProps = {
  photos: PhotoPoint[];
  selectedPhotoId: string | null;
  onPhotoClick: (photo: PhotoPoint) => void;
  onEditPhoto: (photo: PhotoPoint) => void;
  onDeletePhoto: (photo: PhotoPoint) => void;
  onGenerateTags: (photo: PhotoPoint) => Promise<void>;
  onShowAllPhotos: () => void;
  onClosePhotoList: () => void;
  onUploadClick: () => void;
};

// This floating panel lists submitted photos and lets users jump to each marker.
export function PhotoListOverlay({
  photos,
  selectedPhotoId,
  onPhotoClick,
  onEditPhoto,
  onDeletePhoto,
  onGenerateTags,
  onShowAllPhotos,
  onClosePhotoList,
  //onUploadClick,
}: PhotoListOverlayProps) {
  const [taggingPhotoId, setTaggingPhotoId] = useState<string | null>(null);
  const [taggingErrorByPhotoId, setTaggingErrorByPhotoId] = useState<Record<string, string>>({});

  // When a marker is selected, show only its matching photo entry.
  const visiblePhotos = selectedPhotoId
    ? photos.filter((photo) => photo.id === selectedPhotoId)
    : photos;

  async function handleGenerateTags(photo: PhotoPoint) {
    setTaggingPhotoId(photo.id);
    setTaggingErrorByPhotoId((currentErrors) => ({
      ...currentErrors,
      [photo.id]: "",
    }));

    try {
      await onGenerateTags(photo);
    } catch (error) {
      setTaggingErrorByPhotoId((currentErrors) => ({
        ...currentErrors,
        [photo.id]:
          error instanceof Error
            ? error.message
            : "AI service is busy. Please try again in a few minutes.",
      }));
    } finally {
      setTaggingPhotoId(null);
    }
  }

  return (
    <aside className="map-photo-list" aria-label="Uploaded photo list">
      <div className="map-list-header">
        <span>Uploaded photos</span>
        <strong>{visiblePhotos.length}</strong>
        <button
          type="button"
          className="map-list-close"
          onClick={onClosePhotoList}
          aria-label="Close uploaded photo list"
          title="Close"
        >
          <X size={17} />
        </button>
      </div>

      <div className="map-list-items">
        {visiblePhotos.map((photo) => {
          const isGeneratingTags = taggingPhotoId === photo.id;
          const taggingError = taggingErrorByPhotoId[photo.id];

          return (
            <article key={photo.id} className="map-list-item">
              <div
                role="button"
                tabIndex={0}
                className="map-list-item__content"
                onClick={() => onPhotoClick(photo)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onPhotoClick(photo);
                  }
                }}
              >
                <img
                  src={photo.url}
                  alt={photo.name}
                  onError={() => console.log("IMAGE FAILED", photo.url)}
                />

                <span>
                  <strong>{photo.name}</strong>
                  <small>{photo.description || "No description added"}</small>
                  <PhotoTagStatus
                    photo={photo}
                    isGeneratingTags={isGeneratingTags}
                    onGenerateTags={() => handleGenerateTags(photo)}
                  />
                  {taggingError && (
                    <small className="map-list-tag-error">{taggingError}</small>
                  )}
                </span>
              </div>

              <div className="map-list-item__actions">
                <button
                  type="button"
                  onClick={() => onEditPhoto(photo)}
                  aria-label={`Edit ${photo.name}`}
                  title="Edit photo"
                >
                  <Pencil size={16} />
                </button>

                <button
                  type="button"
                  onClick={() => onDeletePhoto(photo)}
                  aria-label={`Delete ${photo.name}`}
                  title="Delete photo"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <div className="map-list-actions">
        {selectedPhotoId && (
          <button
            type="button"
            className="map-list-actions__secondary"
            onClick={onShowAllPhotos}
          >
            Show all
          </button>
        )}

        {/* <button type="button" onClick={onUploadClick}>
          Upload
        </button> */}
      </div>
    </aside>
  );
}

type PhotoTagStatusProps = {
  photo: PhotoPoint;
  isGeneratingTags: boolean;
  onGenerateTags: () => void;
};

function PhotoTagStatus({
  photo,
  isGeneratingTags,
  onGenerateTags,
}: PhotoTagStatusProps) {
  if (photo.tagStatus === "completed") {
    return (
      <small className="map-list-tag-status map-list-tag-status--completed">
        <CheckCircle2 size={14} />
        AI Indexed
      </small>
    );
  }

  if (photo.tagStatus === "pending" || isGeneratingTags) {
    return (
      <small className="map-list-tag-status map-list-tag-status--pending">
        <Hourglass size={14} />
        Generating AI Tags...
      </small>
    );
  }

  return (
    <button
      type="button"
      className="map-list-generate-tags"
      onClick={(event) => {
        event.stopPropagation();
        onGenerateTags();
      }}
      disabled={isGeneratingTags}
    >
      Generate Tags
    </button>
  );
}

