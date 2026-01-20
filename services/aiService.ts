import { GoogleGenAI } from "@google/genai";

// Initialize Gemini with the API key from environment variables
// Note: In a real production extension, this would likely be handled via a backend proxy 
// or user-provided key to keep the key secure.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Uses Gemini to analyze the user's tracking data and generate a privacy report.
 */
export const analyzePrivacyFootprint = async (
  topCompanies: { name: string; count: number }[],
  categories: { label: string; percent: number }[],
  recentActivity: any[]
): Promise<string> => {
  
  // Construct a prompt that contextualizes the raw data
  const prompt = `
    You are Echo, an advanced digital privacy assistant. Analyze the following user data detected from their browser extension:

    1. **Top Tracking Entities**: ${topCompanies.map(c => `${c.name} (${c.count} attempts)`).join(', ')}.
    2. **Tracker Categories**: ${categories.map(c => `${c.label} (${c.percent}%)`).join(', ')}.
    3. **Recent Activity**: ${recentActivity.slice(0, 5).map(a => `${a.site} (Risk: ${a.status})`).join(', ')}.

    Based on this, provide a concise, high-impact privacy insight report (approx 80-100 words).
    
    Structure your response with these headers (using Markdown):
    ### 🕵️ Detected Persona
    (Describe who advertisers think the user is based on the data)

    ### ⚠️ Primary Risk
    (Identify the biggest privacy concern)

    ### 🛡️ Recommendation
    (One specific action to take)

    Tone: Professional, insightful, and protective.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Unable to generate analysis at this time.";
  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return "Error connecting to Gemini Intelligence. Please ensure your API key is configured correctly.";
  }
};
