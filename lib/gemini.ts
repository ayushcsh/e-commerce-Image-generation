import { GoogleGenAI } from "@google/genai";

export type ReferenceImage = {
  base64: string;
  mimeType: string;
};

export type GeneratedImage = {
  base64: string;
  mimeType: string;
};

let client: GoogleGenAI | null = null;

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY environment variable.");
  }

  if (!client) {
    client = new GoogleGenAI({ apiKey });
  }

  return client;
}

export async function generateProductImage(
  prompt: string,
  referenceImages: ReferenceImage[]
): Promise<GeneratedImage> {
  const ai = getClient();
  const model = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        role: "user",
        parts: [
          { text: prompt },
          ...referenceImages.map((image) => ({
            inlineData: {
              data: image.base64,
              mimeType: image.mimeType
            }
          }))
        ]
      }
    ]
  });

  const parts = response.candidates?.[0]?.content?.parts ?? [];
  const imagePart = parts.find((part) => part.inlineData?.data);

  if (!imagePart?.inlineData?.data) {
    const textPart = parts.find((part) => part.text)?.text;
    throw new Error(
      textPart ? `Gemini did not return an image: ${textPart}` : "Gemini did not return an image."
    );
  }

  return {
    base64: imagePart.inlineData.data,
    mimeType: imagePart.inlineData.mimeType || "image/png"
  };
}
