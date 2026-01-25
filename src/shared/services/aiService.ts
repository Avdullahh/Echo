/**
 * Privacy Footprint Analysis Service
 *
 * NOW USING LOCAL ANALYSIS - No external API calls!
 * All processing happens locally in your browser for maximum privacy.
 *
 * Previous version used Google Generative AI API (removed due to privacy concerns)
 */

import { analyzeDigitalProfile } from './profileAnalyzer';

/**
 * Analyze user's privacy footprint based on blocked trackers
 * @param topCompanies - Top tracking companies by frequency
 * @param categories - Tracker categories with percentages
 * @param recentActivity - Recent tracker events (not used in local analysis)
 * @returns Formatted markdown string with digital profile analysis
 */
export const analyzePrivacyFootprint = async (
  topCompanies: { name: string; count: number }[],
  categories: { label: string; percent: number }[],
  recentActivity: any[]
): Promise<string> => {

  // Validate input data
  if (!topCompanies || topCompanies.length === 0) {
    return `**No Tracking Data Yet**\n\nBrowse the web with Echo protection enabled to start building your privacy profile.\n\n*All analysis is performed locally—your data never leaves your device.*`;
  }

  if (!categories || categories.length === 0) {
    return `**Insufficient Data**\n\nMore browsing data is needed to generate an accurate profile.\n\n*Keep Echo running to collect tracking insights.*`;
  }

  try {
    // Use local profile analyzer (no external API calls)
    const profileAnalysis = analyzeDigitalProfile(topCompanies, categories);
    return profileAnalysis;
  } catch (error: any) {
    console.error("Profile Analysis Error:", error);
    return `**Analysis Error**\n\nUnable to generate profile: ${error.message || "Unknown error"}.\n\n*Please try again or check the console for details.*`;
  }
};