import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

export async function generateTagsFromImage(
  imageUrl: string,
): Promise<string[]> {
  try {
    console.log("Generating tags for:", imageUrl);

    const imageResponse = await fetch(imageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    console.log("Image fetched:", imageResponse.status);
console.log("Image size:", imageBuffer.byteLength);
    
console.log(
  "Mime type:",
  imageResponse.headers.get("content-type")
);
    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: [
        {
          text: `
Analyze this image and return only a comma-separated list of tags.

Return tags only.
          `.trim(),
        },
        {
          inlineData: {
            mimeType:
              imageResponse.headers.get("content-type") ||
              "image/jpeg",
            data: Buffer.from(imageBuffer).toString("base64"),
          },
        },
      ],
    });

    console.log("Gemini raw response:", result.text);

    return result.text
      ?.split(",")
      .map(tag => tag.trim().toLowerCase())
      .filter(Boolean) || [];

  } catch (error) {
    console.error("TAGGING ERROR:", error);
    throw error;
  }
}
