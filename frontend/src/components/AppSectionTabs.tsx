import { FileText, Images } from "lucide-react";
import "./AppSectionTabs.css";

export type UploadSection = "photos" | "documents";

type AppSectionTabsProps = {
  activeSection: UploadSection;
  onSectionChange: (section: UploadSection) => void;
};

// These tabs switch only the upload form; they are intentionally hidden on the map.
export function AppSectionTabs({
  activeSection,
  onSectionChange,
}: AppSectionTabsProps) {
  return (
    <nav className="app-section-tabs" aria-label="Choose upload type">
      <button
        type="button"
        className={activeSection === "photos" ? "active" : ""}
        onClick={() => onSectionChange("photos")}
      >
        <Images size={17} />
        Photos
      </button>
      <button
        type="button"
        className={activeSection === "documents" ? "active" : ""}
        onClick={() => onSectionChange("documents")}
      >
        <FileText size={17} />
        Documents
      </button>
    </nav>
  );
}
