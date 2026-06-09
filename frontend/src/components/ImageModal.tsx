import type { PhotoPoint } from "../types";
import "./ImageModal.css";

type ImageModalProps = {
  photo: PhotoPoint;
  onClose: () => void;
};

// Marker clicks open this full-screen image preview.
export function ImageModal({ photo, onClose }: ImageModalProps) {
  return (
    <div className="image-modal" role="dialog" aria-modal="true">
      <button
        type="button"
        className="modal-close"
        onClick={onClose}
        aria-label="Close image preview"
      >
        x
      </button>

      <figure>
        <img src={photo.url} alt={photo.name} />
        <figcaption>
          <strong>{photo.name}</strong>
          <span>
            {photo.lat.toFixed(6)}, {photo.lng.toFixed(6)}
          </span>
        </figcaption>
      </figure>
    </div>
  );
}
