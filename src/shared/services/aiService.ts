import { GoogleGenerativeAI } from "@google/generative-ai";

// 1. Get Key Safely
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
    return "⚠️ Configuration Error: VITE_GEMINI_API_KEY is missing in .env.local";
  }

  const prompt = `
    Analyze this tracking data to build a "Digital Shadow" of the user.

    Data:
    - Top Trackers: ${topCompanies.map(c => `${c.name} (${c.count})`).join(', ')}
    - Interest Categories: ${categories.map(c => `${c.label}`).join(', ')}

    Task:
    1. Assign a creative "Digital Persona" title (e.g., "The Tech-Savvy Shopper").
    2. Explain *why* advertisers are targeting them.
    3. Estimate their "Data Value" (Low/Med/High).

    Format: Use Markdown. Be concise (under 100 words).
  `;

  try {
    // FIX: Switch to 'gemini-pro' (The standard, most reliable model)
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text(); 
  } catch (error: any) {
    console.error("Gemini Error Details:", error);
    
    return `**AI Analysis Failed**\n\nError: ${error.message || "Unknown Network Error"}.\n\nPlease check the console (F12) for details.`;
  }
};