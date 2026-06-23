import { Request, Response } from "express";
import { GoogleGenAI } from "@google/genai";

// Create Gemini client using API key stored in .env
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

// Simple test endpoint to verify that the backend
// can successfully communicate with Gemini.
export async function testVision(
  _req: Request,
  res: Response,
) {
  try {
    // Send a basic prompt to Gemini.
    // We are not using image analysis yet.
    
    const result = await ai.models.generateContent({
      model:  "gemini-2.5-flash-lite",
      contents: "Say hello from Gemini Vision API",
    });

    // Return Gemini response to the frontend.
    res.json({
      answer: result.text,
    });
  }catch (error) {
  console.error("TEST ERROR:", error);

  res.status(500).json({
    message:
      error instanceof Error
        ? error.message
        : String(error),
  });
}
}
// Analyze a selected image and answer a user's question
// using Gemini Vision.
export async function askImageQuestion(
  req: Request,
  res: Response,
) {
  try {
    const { imageUrl, question } = req.body;

    if (!imageUrl || !question) {
      return res.status(400).json({
        message: "imageUrl and question are required",
      });
    }

    const imageResponse = await fetch(imageUrl);

const imageBuffer = await imageResponse.arrayBuffer();
console.log("Image fetched:", imageResponse.status);
console.log("Image size:", imageBuffer.byteLength);

const result = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: [
        {
          text: `
You are assisting a GIS/photo field inspection workflow.

Answer the user's question about the image using these strict rules:
- Use maximum 5 bullet points.
- Do not write paragraphs.
- Do not include introductions such as "This image shows".
- Do not include conclusions or summaries.
- Mention only objects, conditions, and features that are actually visible.
- Keep each bullet short and clear.
- If the user asks a counting question, return only the count and a short explanation.
- If the user asks a yes/no question, start with "Yes" or "No" and then give a brief explanation.
- Do not invent details that are not visible in the image.
- Make the answer suitable for field inspection and documentation.

User question:
${question}
          `.trim(),
        },
        {
          inlineData: {
            mimeType: imageResponse.headers.get("content-type") || "image/jpeg",
            data: Buffer.from(imageBuffer).toString("base64"),
          },
        },
      ],
    });

    res.json({
      answer: result.text,
    });
  } catch (error) {

    const geminiError = normalizeGeminiError(error);

    if (geminiError.status === 429) {
      const responseBody: {
        type: "quota_exceeded";
        message: string;
        retryAfter?: number;
      } = {
        type: "quota_exceeded",
        message: geminiError.retryAfter
          ? "AI request limit reached."
          : "AI request limit reached. Please try again later.",
      };

      if (geminiError.retryAfter) {
        responseBody.retryAfter = geminiError.retryAfter;
      }

      res.status(429).json(responseBody);
      return;
    }

    if (geminiError.status === 503) {
      res.status(503).json({
        type: "service_busy",
        message: "AI service is currently busy. Please try again in a few minutes.",
      });
      return;
    }

    res.status(500).json({
      message:
        error instanceof Error
          ? error.message
          : "Failed to analyze image",
    });
  }
}

type NormalizedGeminiError = {
  status?: number;
  retryAfter?: number;
};

function normalizeGeminiError(error: unknown): NormalizedGeminiError {
  const errorRecord = isRecord(error) ? error : {};
  const message = error instanceof Error ? error.message : "";
  const status = getErrorStatus(errorRecord, message);

  return {
    status,
    retryAfter: getRetryAfterSeconds(errorRecord, message),
  };
}

function getErrorStatus(
  errorRecord: Record<string, unknown>,
  message: string,
) {
  const possibleStatus =
    errorRecord.status ?? errorRecord.statusCode ?? errorRecord.code;

  if (typeof possibleStatus === "number") return possibleStatus;

  if (typeof possibleStatus === "string") {
    const parsedStatus = Number(possibleStatus);
    if (Number.isFinite(parsedStatus)) return parsedStatus;
  }

  if (message.includes("429")) return 429;
  if (message.includes("503")) return 503;

  return undefined;
}

function getRetryAfterSeconds(
  errorRecord: Record<string, unknown>,
  message: string,
) {
  const retryAfter = errorRecord.retryAfter ?? errorRecord.retry_after;

  if (typeof retryAfter === "number") return retryAfter;

  if (typeof retryAfter === "string") {
    const parsedRetryAfter = Number(retryAfter);
    if (Number.isFinite(parsedRetryAfter)) return parsedRetryAfter;
  }

  const retryDelayMatch = message.match(/retryDelay["']?\s*:\s*["']?(\d+)s/i);
  if (retryDelayMatch) return Number(retryDelayMatch[1]);

  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
