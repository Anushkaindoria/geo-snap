import { useState } from "react";
import { Sparkles, SendHorizontal } from "lucide-react";
import type { PhotoPoint } from "../types";
import { API_BASE_URL } from "../config/api";
import "./ImageModal.css";

type ImageModalProps = {
  photo: PhotoPoint;
  onClose: () => void;
};

// Marker clicks open this full-screen image preview.
export function ImageModal({ photo, onClose }: ImageModalProps) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAI, setShowAI] = useState(false);

    // Send the selected image and user's question to Gemini Vision
  async function askAI() {
    if (!question.trim()) {
      return;
    }

    try {
      setLoading(true);
      setAnswer("");

      const response = await fetch(
        `${API_BASE_URL}/api/vision/ask`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            imageUrl: photo.url,
            question,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setAnswer(getFriendlyAiErrorMessage(data));
        return;
      }

      setAnswer(data.answer || "No answer received");
    } catch (error) {
       console.error("AI ERROR:", error);

      setAnswer("Failed to get AI response");
    } finally {
      setLoading(false);
    }
  }

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
    {!showAI && (
  <button
    type="button"
    className="ai-fab"
    onClick={() => setShowAI(true)}
  >
    <Sparkles size={22} />
  </button>
)}

{showAI && (
  <div className="ai-drawer">
    <div className="ai-header">
  <h3>Ask AI</h3>

  <button
    type="button"
    className="ai-drawer-close"
    onClick={() => setShowAI(false)}
  >
    ×
  </button>
</div>

    <div className="ai-input-wrapper">
  <input
    type="text"
    placeholder="Ask a question..."
    value={question}
    onChange={(event) =>
      setQuestion(event.target.value)
    }
    onKeyDown={(event) => {
      if (event.key === "Enter") {
        askAI();
      }
    }}
  />

  <button
    type="button"
    className="ai-send-button"
    onClick={askAI}
    disabled={loading}
  >
    <SendHorizontal size={18} />
  </button>
</div>

    {answer && (
      <div className="ai-answer">
        <strong>AI Answer:</strong>
        <p>{answer}</p>
      </div>
    )}

    {loading && (
      <div className="ai-loading" role="status" aria-live="polite">
        <span className="ai-loading__icon">🔍</span>
        <span>Analyzing image...</span>
      </div>
    )}
  </div>
)}
    </div>
  );
}

type AiErrorResponse = {
  type?: string;
  message?: string;
  retryAfter?: number;
};

function getFriendlyAiErrorMessage(errorData: AiErrorResponse) {
  if (errorData.type === "quota_exceeded") {
    if (typeof errorData.retryAfter === "number" && errorData.retryAfter > 0) {
      const minutes = Math.max(1, Math.ceil(errorData.retryAfter / 60));
      return `⚠️ AI request limit reached.\nTry again after ${minutes} ${
        minutes === 1 ? "minute" : "minutes"
      }.`;
    }

    return "⚠️ AI request limit reached.\nPlease try again later.";
  }

  if (errorData.type === "service_busy") {
    return "⚠️ AI service is currently busy.\nPlease try again in a few minutes.";
  }

  return errorData.message || "Failed to get AI response";
}
