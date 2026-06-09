import type { InvalidPhoto, PhotoPoint } from "../types";
import { ProjectBanner } from "./ProjectBanner";
import "./UploadForm.css";

type UploadFormProps = {
  selectedPhotos: PhotoPoint[];
  invalidPhotos: InvalidPhoto[];
  description: string;
  isReadingMetadata: boolean;
  onPhotoUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDescriptionChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onClearForm: () => void;
  onBackToMap: () => void;
  submitLabel?: string;
};

// This screen collects photos first, then shows extracted GPS values before submit.
export function UploadForm({
  selectedPhotos,
  invalidPhotos,
  description,
  isReadingMetadata,
  onPhotoUpload,
  onDescriptionChange,
  onSubmit,
  onClearForm,
  onBackToMap,
  submitLabel = "Submit",
}: UploadFormProps) {
  const hasFormData = selectedPhotos.length > 0 || invalidPhotos.length > 0;

  return (
    <main className="form-screen">
      <ProjectBanner />

      <form className="upload-form" onSubmit={onSubmit}>
        <div className="form-heading">
          <span>Photo location import</span>
          <h1>Upload photograph</h1>
          <p>
            Choose one or more photos. The app reads GPS metadata and shows
            latitude and longitude before placing them on the map.
          </p>
        </div>

        <label className="file-dropzone">
          <span className="file-icon">+</span>
          <strong>Upload photos here</strong>
          <small>GPS-enabled JPG, JPEG, HEIC, or PNG files</small>
          <input
            type="file"
            accept="image/*"
            //capture="environment"
            onChange={onPhotoUpload}
          />
        </label>

        {isReadingMetadata && (
          <p className="metadata-status">Reading photo metadata...</p>
        )}

        {selectedPhotos.length > 0 && (
          <section className="coordinate-panel">
            <div className="panel-title">
              <h2>Extracted coordinates</h2>
              <span>{selectedPhotos.length} valid</span>
            </div>

            <div className="photo-coordinate-list">
              {selectedPhotos.map((photo) => (
                <article key={photo.id} className="coordinate-card">
                  <img src={photo.url} alt={photo.name} />

                  <div className="coordinate-details">
                    <strong>{photo.name}</strong>

                    <label>
                      Latitude
                      <input value={photo.lat} readOnly />
                    </label>

                    <label>
                      Longitude
                      <input value={photo.lng} readOnly />
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
            disabled={isReadingMetadata || !hasFormData}
          >
            Clear form
          </button>

          <button
            type="submit"
            className="submit-button"
            disabled={selectedPhotos.length === 0 || isReadingMetadata}
          >
            {submitLabel}
          </button>
        </div>
      </form>
    </main>
  );
}
