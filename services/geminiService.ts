
import { GoogleGenAI } from "@google/genai";

// Always use the API key directly from process.env as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getGameRecommendations = async (userPreferences: string) => {
  try {
    // Select gemini-3-flash-preview for basic text tasks
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a gaming expert assistant for Hasibul Game Point (HGP). Based on these preferences: "${userPreferences}", recommend 3 popular games and explain why they are great for top-ups at our store. Keep it concise, friendly, and formatted in markdown.`,
    });
    // Correctly access the .text property on GenerateContentResponse
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "I'm having trouble connecting to my gaming wisdom right now. Check back soon!";
  }
};
