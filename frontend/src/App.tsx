import { useEffect, useState } from "react";
import { MapView } from "./components/MapView";
import { UploadForm } from "./components/UploadForm";
import { usePhotoImport } from "./hooks/usePhotoImport";
import { usePhotoMap } from "./hooks/usePhotoMap";
import { API_BASE_URL } from "./config/api";
import type { PhotoPoint } from "./types";
import "./App.css";

const VIEW_STORAGE_KEY = "photo-map-current-view";
const DESCRIPTION_STORAGE_KEY = "photo-map-upload-description";
const VISIBLE_LAYERS_STORAGE_KEY = "photo-map-visible-layer-ids";

function App() {
  // The app starts on the map screen; the upload form opens from the map panel.
  const [isMapVisible, setIsMapVisible] = useState(() => {
    return sessionStorage.getItem(VIEW_STORAGE_KEY) !== "form";
  });
  const [submittedPhotos, setSubmittedPhotos] = useState<PhotoPoint[]>([]);
  const [selectedMapPhotoId, setSelectedMapPhotoId] = useState<string | null>(null);
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);
  const [visibleLayerIds, setVisibleLayerIds] = useState<string[]>(() => {
    const savedLayerIds = sessionStorage.getItem(VISIBLE_LAYERS_STORAGE_KEY);

    if (!savedLayerIds) return [];

    try {
      const parsedLayerIds = JSON.parse(savedLayerIds);
      return Array.isArray(parsedLayerIds) ? parsedLayerIds : [];
    } catch {
      return [];
    }
  });
  const [isLayerPanelOpen, setIsLayerPanelOpen] = useState(false);
  const [isPhotoListOpen, setIsPhotoListOpen] = useState(false);

  const {
    selectedPhotos,
    invalidPhotos,
    description,
    isReadingMetadata,
    handlePhotoUpload,
    setDescription,
    clearFormDraft,
    loadEditDraft,
  } = usePhotoImport();

  const { mapContainerRef, flyToPhoto } = usePhotoMap({
    isMapVisible,
    photos: submittedPhotos,
    focusPhotoId: selectedMapPhotoId,
    visibleLayerIds,
    onMarkerClick: handleMarkerPhotoSelect,
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selectedPhotos.length === 0) return;

    const draftPhoto = selectedPhotos[0];
    const metadata = {
      name: draftPhoto.name,
      lat: draftPhoto.lat,
      lng: draftPhoto.lng,
      capturedAt: draftPhoto.capturedAt,
      description: description.trim(),
    };

    // Edit mode sends metadata only because the saved image file is unchanged.
    if (editingPhotoId) {
      const response = await fetch(`${API_BASE_URL}/api/photos/${editingPhotoId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(metadata),
      });

      if (!response.ok) {
        throw new Error("Update failed");
      }

      const result = await response.json();
      setSubmittedPhotos((currentPhotos) =>
        currentPhotos.map((photo) =>
          photo.id === editingPhotoId ? result.photo : photo,
        ),
      );
      setSelectedMapPhotoId(result.photo.id);
      setIsPhotoListOpen(true);
      setEditingPhotoId(null);
      clearFormDraft();
      setIsMapVisible(true);
      return;
    }

    // A browser File exists only for a newly selected photo.
    if (!draftPhoto.file) return;

    const formData = new FormData();
    formData.append("photos", draftPhoto.file);
    formData.append("metadata", JSON.stringify([metadata]));

    const response = await fetch(`${API_BASE_URL}/api/photos`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Upload failed");
    }

    const result = await response.json();
    setSubmittedPhotos((currentPhotos) => [...currentPhotos, ...result.photos]);
    setSelectedMapPhotoId(result.photos[0]?.id || null);
    setIsPhotoListOpen(true);
    clearFormDraft();
    setIsMapVisible(true);
  }

  function handleClearForm() {
    clearFormDraft();
  }

  function handleOpenUploadForm() {
    clearFormDraft();
    setEditingPhotoId(null);
    setIsMapVisible(false);
  }

  function handleBackToMap() {
    clearFormDraft();
    setEditingPhotoId(null);
    setIsMapVisible(true);
  }

  function handleEditPhoto(photo: PhotoPoint) {
    loadEditDraft(photo);
    setEditingPhotoId(photo.id);
    setSelectedMapPhotoId(photo.id);
    setIsMapVisible(false);
  }

  async function handleDeletePhoto(photo: PhotoPoint) {
    const shouldDelete = window.confirm(
      `Do you want to delete "${photo.name}"?`,
    );

    if (!shouldDelete) return;

    const response = await fetch(`${API_BASE_URL}/api/photos/${photo.id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Delete failed");
    }

    setSubmittedPhotos((currentPhotos) =>
      currentPhotos.filter((currentPhoto) => currentPhoto.id !== photo.id),
    );

    if (selectedMapPhotoId === photo.id) {
      setSelectedMapPhotoId(null);
    }
  }

  function handleLayerToggle(layerId: string) {
    setVisibleLayerIds((currentLayerIds) =>
      currentLayerIds.includes(layerId)
        ? currentLayerIds.filter((currentLayerId) => currentLayerId !== layerId)
        : [...currentLayerIds, layerId],
    );
  }

  function handleMarkerPhotoSelect(photo: PhotoPoint) {
    setSelectedMapPhotoId(photo.id);
    setIsPhotoListOpen(true);
  }

  // useEffect(() => {
  //   async function loadPhotos() {
  //     const response = await fetch(`${API_BASE_URL}/api/photos`);

  //     const data = await response.json();

  //     setSubmittedPhotos(data.photos);
  //   }

  //   loadPhotos();
  // }, []);

  useEffect(() => {
  async function loadPhotos() {
    try {
      alert(`Origin: ${window.location.origin}`);
      alert(`Trying: ${API_BASE_URL}/api/photos`);

      const response = await fetch(`${API_BASE_URL}/api/photos`);

      alert(`Status: ${response.status}`);

      const data = await response.json();

      setSubmittedPhotos(data.photos);
    } catch (error) {
      alert(`ERROR: ${error instanceof Error ? error.message : String(error)}`);
      console.error(error);
    }
  }

  loadPhotos();
}, []);

  useEffect(() => {
    sessionStorage.setItem(VIEW_STORAGE_KEY, isMapVisible ? "map" : "form");
  }, [isMapVisible]);

  useEffect(() => {
    sessionStorage.setItem(DESCRIPTION_STORAGE_KEY, description);
  }, [description]);

  useEffect(() => {
    sessionStorage.setItem(
      VISIBLE_LAYERS_STORAGE_KEY,
      JSON.stringify(visibleLayerIds),
    );
  }, [visibleLayerIds]);

  if (!isMapVisible) {
    return (
      <UploadForm
        selectedPhotos={selectedPhotos}
        invalidPhotos={invalidPhotos}
        description={description}
        isReadingMetadata={isReadingMetadata}
        onPhotoUpload={handlePhotoUpload}
        onDescriptionChange={setDescription}
        onSubmit={handleSubmit}
        onClearForm={handleClearForm}
        onBackToMap={handleBackToMap}
        submitLabel={editingPhotoId ? "Update" : "Submit"}
      />
    );
  }

  return (
    <>
      <MapView
        mapContainerRef={mapContainerRef}
        photos={submittedPhotos}
        selectedPhotoId={selectedMapPhotoId}
        visibleLayerIds={visibleLayerIds}
        isLayerPanelOpen={isLayerPanelOpen}
        isPhotoListOpen={isPhotoListOpen}
        onListPhotoClick={flyToPhoto}
        onEditPhoto={handleEditPhoto}
        onDeletePhoto={handleDeletePhoto}
        onLayerToggle={handleLayerToggle}
        onToggleLayerPanel={() => setIsLayerPanelOpen((isOpen) => !isOpen)}
        onCloseLayerPanel={() => setIsLayerPanelOpen(false)}
        onShowAllPhotos={() => setSelectedMapPhotoId(null)}
        onClosePhotoList={() => setIsPhotoListOpen(false)}
        onOpenUploadForm={handleOpenUploadForm}
      />
    </>
  );
}

export default App;
