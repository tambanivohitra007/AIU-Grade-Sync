import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ColumnMapping } from "../types";

export const determineColumnMapping = async (
  headers: string[]
): Promise<ColumnMapping> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING, description: "The header name for Student ID number" },
      firstName: { type: Type.STRING, description: "The header name for First Name" },
      lastName: { type: Type.STRING, description: "The header name for Last Name" },
      daily: { type: Type.STRING, description: "The header name for Daily Total / Coursework Total" },
      midterm: { type: Type.STRING, description: "The header name for Midterm Total" },
      final: { type: Type.STRING, description: "The header name for Final Total" },
    },
    required: ["id", "firstName", "lastName", "daily", "midterm", "final"],
  };

  const prompt = `
    Analyze the following list of CSV headers from a Moodle Gradebook export.
    Identify the most likely column names that correspond to:
    1. Student ID
    2. First Name
    3. Last Name
    4. Daily/Continuous Assessment Total (look for 'Daily total', 'Course total' if daily implies total coursework, or specific 'Real' values)
    5. Midterm Total
    6. Final Total

    Headers: ${JSON.stringify(headers)}

    Return the exact string from the provided list for each category.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as ColumnMapping;
  } catch (error) {
    console.error("Gemini Mapping Error:", error);
    // Fallback: Return empty strings or best guess logic if AI fails, 
    // but here we throw to let the UI handle the error state.
    throw error;
  }
};