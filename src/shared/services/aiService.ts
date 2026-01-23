// CHANGE THIS LINE: from "@google/genai" -> "@google/generative-ai"
import { GoogleGenerativeAI } from "@google/generative-ai";

// 1. Get Key Safely
// We cast to 'any' to avoid TypeScript errors without needing extra config files.
const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY || "";

let genAI: GoogleGenerativeAI | null = null;
if (apiKey) {
  genAI = new GoogleGenerativeAI(apiKey);
}

export const analyzePrivacyFootprint = async (
  topCompanies: { name: string; count: number }[],
  categories: { label: string; percent: number }[],
  recentActivity: any[]
): Promise<string> => {
  
  if (!genAI) {
    return "⚠️ AI Configuration Missing.\n\nPlease check your .env.local file has VITE_GEMINI_API_KEY defined.";
  }

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
    // Use the stable model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text() || "Unable to generate analysis.";
  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return "Error connecting to Gemini Intelligence. Please check your internet connection.";
  }
};