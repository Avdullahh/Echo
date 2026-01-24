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
    // Use 'gemini-1.5-flash' - it is the current standard for the Free Tier.
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text(); 
  } catch (error: any) {
    console.error("Gemini Error Details:", error);
    
    // Custom Error Message for the 404 issue
    if (error.message && error.message.includes("404")) {
      return `**AI Setup Required**\n\nThe "Generative Language API" is disabled on your Google Account.\n\n1. Go to console.cloud.google.com\n2. Search "Generative Language API"\n3. Click Enable.`;
    }

    return `**AI Analysis Failed**\n\nError: ${error.message || "Unknown Network Error"}.`;
  }
};