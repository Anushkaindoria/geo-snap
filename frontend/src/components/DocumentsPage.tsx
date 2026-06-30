import { useRef, useState } from "react";
import { FileText, Upload } from "lucide-react";
import { ProjectBanner } from "./ProjectBanner";
import { AppSectionTabs, type UploadSection } from "./AppSectionTabs";
import type { DocumentRecord } from "../types";
import "./UploadForm.css";
import "./DocumentsPage.css";

const SUPPORTED_DOCUMENT_EXTENSIONS = new Set(["pdf", "docx", "xlsx", "csv", "txt"]);

type DocumentUploadFormProps = {
  activeSection: UploadSection;
  onSectionChange: (section: UploadSection) => void;
  onUpload: (file: File) => Promise<DocumentRecord>;
  onBackToMap: () => void;
  onClearForm: () => void;
};

// Document upload mirrors the photo upload shell while keeping document intake simple.
export function DocumentUploadForm({
  activeSection,
  onSectionChange,
  onUpload,
  onBackToMap,
  onClearForm,
}: DocumentUploadFormProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] || null;
    setError("");

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (!SUPPORTED_DOCUMENT_EXTENSIONS.has(getFileExtension(file.name))) {
      setSelectedFile(null);
      event.target.value = "";
      setError("Unsupported file type. Choose a PDF, DOCX, XLSX, CSV, or TXT file.");
      return;
    }

    setSelectedFile(file);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedFile) return;

    setIsUploading(true);
    setError("");

    try {
      await onUpload(selectedFile);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      onBackToMap();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Document could not be uploaded.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <main className="form-screen document-form-screen">
      <ProjectBanner />
      <AppSectionTabs activeSection={activeSection} onSectionChange={onSectionChange} />

      <form className="upload-form document-upload-form" onSubmit={handleSubmit}>
        <div className="form-heading">
          <span>Project document import</span>
          <h1>Upload Documents</h1>
          <p>Choose a project document and store it securely for later access.</p>
        </div>

        <label className="file-dropzone document-dropzone">
          <span className="file-icon"><Upload size={26} /></span>
          <strong>Upload documents here</strong>
          <small>Choose PDF, DOCX, XLSX, CSV or TXT</small>
          <span className="document-choose-button">
            <FileText size={18} />
            Choose Document
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.xlsx,.csv,.txt,application/pdf,text/plain,text/csv,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={handleFileChange}
          />
        </label>

        {selectedFile && (
          <section className="document-selected-file">
            <FileText size={22} />
            <span><strong>{selectedFile.name}</strong><small>{formatFileSize(selectedFile.size)}</small></span>
          </section>
        )}

        {error && <section className="document-error" role="alert">{error}</section>}

        <div className="form-actions document-form-actions">
          <button type="button" className="map-button" onClick={onBackToMap}>Back to map</button>
          <button
    type="button"
    className="clear-button"
    onClick={() => {
      setSelectedFile(null);
      setError("");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      onClearForm();
    }}
    disabled={!selectedFile || isUploading}
  >
    Clear Form
  </button>
          <button type="submit" className="submit-button" disabled={!selectedFile || isUploading}>
            {isUploading ? "Uploading..." : "Upload Document"}
          </button>
        </div>
      </form>
    </main>
  );
}

function getFileExtension(fileName: string) {
  return fileName.split(".").pop()?.toLowerCase() || "";
}

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

