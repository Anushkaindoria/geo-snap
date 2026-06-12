import { Pencil, Trash2, X } from "lucide-react";
import type { PhotoPoint } from "../types";
import "./PhotoListOverlay.css";

type PhotoListOverlayProps = {
  photos: PhotoPoint[];
  selectedPhotoId: string | null;
  onPhotoClick: (photo: PhotoPoint) => void;
  onEditPhoto: (photo: PhotoPoint) => void;
  onDeletePhoto: (photo: PhotoPoint) => void;
  onShowAllPhotos: () => void;
  onClosePhotoList: () => void;
  onUploadClick: () => void;
};

// This floating panel lists all submitted photos and lets users jump the map to a marker.
export function PhotoListOverlay({
  photos,
  selectedPhotoId,
  onPhotoClick,
  onEditPhoto,
  onDeletePhoto,
  onShowAllPhotos,
  onClosePhotoList,
  //onUploadClick,
}: PhotoListOverlayProps) {
  // When a marker is selected, show only its matching photo entry.
  const visiblePhotos = selectedPhotoId
    ? photos.filter((photo) => photo.id === selectedPhotoId)
    : photos;

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
  console.log("PHOTO =", photo);
  console.log("PHOTO URL =", photo.url);

  return (
    <article key={photo.id} className="map-list-item">
      <button
        type="button"
        className="map-list-item__content"
        onClick={() => onPhotoClick(photo)}
      >
        <img
          src={photo.url}
          alt={photo.name}
          onError={() => console.log("IMAGE FAILED", photo.url)}
        />

        <span>
          <strong>{photo.name}</strong>
          <small>{photo.description || "No description added"}</small>
        </span>
      </button>

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
