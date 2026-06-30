import { API_BASE_URL } from "../config/api";
import type { DocumentRecord } from "../types";

type DocumentsResponse = {
  documents?: DocumentRecord[];
  message?: string;
};

type DocumentResponse = {
  document?: DocumentRecord;
  message?: string;
};

export async function fetchDocuments(): Promise<DocumentRecord[]> {
  const response = await fetch(`${API_BASE_URL}/api/documents`);
  const data: DocumentsResponse = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Documents could not be loaded.");
  }

  return Array.isArray(data.documents) ? data.documents : [];
}

export async function uploadDocumentFile(
  file: File,
  description: string,
): Promise<DocumentRecord> {
  const formData = new FormData();
  formData.append("document", file);
  formData.append("description", description);

  const response = await fetch(`${API_BASE_URL}/api/documents`, {
    method: "POST",
    body: formData,
  });

  const data: DocumentResponse = await response.json();

  if (!response.ok || !data.document) {
    throw new Error(data.message || "Document could not be uploaded.");
  }

  return data.document;
}

export async function deleteDocument(documentId: string) {
  const response = await fetch(`${API_BASE_URL}/api/documents/${documentId}`, {
    method: "DELETE",
  });

  const data: { message?: string } = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Document could not be deleted.");
  }
}
