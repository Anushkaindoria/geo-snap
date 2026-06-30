import { Camera, FolderOpen, Image } from "lucide-react";
import type { InvalidPhoto, PhotoPoint } from "../types";
import { ProjectBanner } from "./ProjectBanner";
import { AppSectionTabs, type UploadSection } from "./AppSectionTabs";
import "./UploadForm.css";

type UploadFormProps = {
  selectedPhotos: PhotoPoint[];
  invalidPhotos: InvalidPhoto[];
  description: string;
  isReadingMetadata: boolean;
  onPhotoUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onPhotoCoordinateChange: (
    photoId: string,
    field: "lat" | "lng",
    value: string,
  ) => void;
  onDescriptionChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onClearForm: () => void;
  onBackToMap: () => void;
  submitError?: string;
  submitLabel?: string;
  isSubmitting?: boolean;
  activeSection: UploadSection;
  onSectionChange: (section: UploadSection) => void;
};

// This screen collects photos first, then shows extracted GPS values before submit.
export function UploadForm({
  selectedPhotos,
  invalidPhotos,
  description,
  isReadingMetadata,
  onPhotoUpload,
  onPhotoCoordinateChange,
  onDescriptionChange,
  onSubmit,
  onClearForm,
  onBackToMap,
  submitError,
  submitLabel = "Submit",
  isSubmitting = false,
  activeSection,
  onSectionChange,
}: UploadFormProps) {
  const hasFormData = selectedPhotos.length > 0 || invalidPhotos.length > 0;
  const validCoordinateCount = selectedPhotos.filter((photo) => {
    return Number.isFinite(photo.lat) && Number.isFinite(photo.lng);
  }).length;
  const hasValidCoordinates = validCoordinateCount > 0;

  return (
    <main className="form-screen">
      <ProjectBanner />
      <AppSectionTabs activeSection={activeSection} onSectionChange={onSectionChange} />

      <form className="upload-form" onSubmit={onSubmit}>
        <div className="form-heading">
          <span>Photo location import</span>
          <h1>Upload photograph</h1>
          <p>
            Choose one or more photos. The app reads GPS metadata and shows
            latitude and longitude before placing them on the map.
          </p>
        </div>

        <section className="file-dropzone" aria-label="Choose photo source">
          <span className="file-icon">+</span>
          <strong>Upload photos here</strong>
          <small>Choose camera, gallery, or files</small>

          <div className="upload-source-grid">
            <label className="upload-source-option">
              <Camera size={22} />
              <span>Camera</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={onPhotoUpload}
              />
            </label>

            <label className="upload-source-option">
              <Image size={22} />
              <span>Gallery</span>
              <input
                type="file"
                accept="image/*"
                onChange={onPhotoUpload}
              />
            </label>

            <label className="upload-source-option">
              <FolderOpen size={22} />
              <span>Files</span>
              <input
                type="file"
                accept="image/*,.jpg,.jpeg,.png,.heic,.heif"
                onChange={onPhotoUpload}
              />
            </label>
          </div>
        </section>

        {isReadingMetadata && (
          <p className="metadata-status">Reading photo metadata...</p>
        )}

        {selectedPhotos.length > 0 && (
          <section className="coordinate-panel">
            <div className="panel-title">
              <h2>Photo coordinates</h2>
              <span>{validCoordinateCount} valid</span>
            </div>

            <div className="photo-coordinate-list">
              {selectedPhotos.map((photo) => (
                <article key={photo.id} className="coordinate-card">
                  <img src={photo.url} alt={photo.name} />

                  <div className="coordinate-details">
                    <strong>{photo.name}</strong>

                    <label>
                      Latitude
                      <input
                        type="number"
                        step="any"
                        value={Number.isFinite(photo.lat) ? photo.lat : ""}
                        onChange={(event) =>
                          onPhotoCoordinateChange(
                            photo.id,
                            "lat",
                            event.target.value,
                          )
                        }
                        placeholder="Enter latitude"
                      />
                    </label>

                    <label>
                      Longitude
                      <input
                        type="number"
                        step="any"
                        value={Number.isFinite(photo.lng) ? photo.lng : ""}
                        onChange={(event) =>
                          onPhotoCoordinateChange(
                            photo.id,
                            "lng",
                            event.target.value,
                          )
                        }
                        placeholder="Enter longitude"
                      />
                    </label>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {invalidPhotos.length > 0 && (
          <section className="invalid-panel">
            <strong>Upload a valid image with GPS information.</strong>
            <span>{invalidPhotos.map((photo) => photo.name).join(", ")}</span>
          </section>
        )}

        {submitError && (
          <section className="invalid-panel">
            <strong>Photo submit failed.</strong>
            <span>{submitError}</span>
          </section>
        )}

        <label className="description-field">
          <span>Description</span>
          <textarea
            value={description}
            onChange={(event) => onDescriptionChange(event.target.value)}
            placeholder="Write an optional description for this upload"
            rows={4}
          />
        </label>

        <div className="form-actions">
          <button
            type="button"
            className="map-button"
            onClick={onBackToMap}
          >
            Back to map
          </button>

          <button
            type="button"
            className="clear-button"
            onClick={onClearForm}
            disabled={isReadingMetadata || isSubmitting || !hasFormData}
          >
            Clear form
          </button>

          <button
            type="submit"
            className="submit-button"
            disabled={!hasValidCoordinates || isReadingMetadata || isSubmitting}
          >
            {submitLabel}
          </button>
        </div>
      </form>
    </main>
  );
}



