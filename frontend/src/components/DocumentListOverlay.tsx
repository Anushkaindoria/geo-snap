import { ExternalLink, FileSpreadsheet, FileText, Search, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { DocumentRecord } from "../types";
import "./DocumentListOverlay.css";

type DocumentListOverlayProps = {
  documents: DocumentRecord[];
  isLoading: boolean;
  error: string;
  onDelete: (document: DocumentRecord) => Promise<void>;
  onClose: () => void;
};

// Saved documents are managed on the map, independently from the upload form.
export function DocumentListOverlay({
  documents,
  isLoading,
  error,
  onDelete,
  onClose,
}: DocumentListOverlayProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredDocuments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return documents;
    return documents.filter((document) =>
      document.name.toLowerCase().includes(query) ||
      document.fileType.toLowerCase().includes(query),
    );
  }, [documents, searchQuery]);

  return (
    <aside className="document-list-overlay" aria-label="Uploaded documents">
      <header className="document-list-header">
        <span>Uploaded Documents</span>
        <strong>{filteredDocuments.length}</strong>
        <button type="button" onClick={onClose} aria-label="Close documents" title="Close">
          <X size={17} />
        </button>
      </header>

      <label className="document-list-search">
        <Search size={17} />
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search name or type"
        />
      </label>

      <div className="document-list-items">
        {isLoading && <p className="document-list-message">Loading documents...</p>}
        {!isLoading && error && <p className="document-list-message document-list-message--error">{error}</p>}
        {!isLoading && !error && filteredDocuments.length === 0 && (
          <p className="document-list-message">No documents uploaded yet.</p>
        )}

        {filteredDocuments.map((document) => (
          <article key={document.id} className="document-list-item">
            <span className="document-list-icon">
              {document.fileType === "xlsx" || document.fileType === "csv"
                ? <FileSpreadsheet size={23} />
                : <FileText size={23} />}
            </span>
            <span className="document-list-details">
              <strong>{document.name}</strong>
              <small>{formatDate(document.uploadedAt)}</small>
            </span>
            <span className="document-list-actions">
              <a href={document.url} target="_blank" rel="noreferrer" title="Open document" aria-label={`Open ${document.name}`}>
                <ExternalLink size={16} />
              </a>
              <button type="button" onClick={() => onDelete(document)} title="Delete document" aria-label={`Delete ${document.name}`}>
                <Trash2 size={16} />
              </button>
            </span>
          </article>
        ))}
      </div>
    </aside>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Unknown date"
    : date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}
