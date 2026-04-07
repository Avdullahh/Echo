import { buildFullProfile } from './profileAnalyzer';

export const analyzePrivacyFootprint = async (
  topCompanies: { name: string; count: number }[],
  categories: { label: string; percent: number }[],
  recentActivity: any[]
): Promise<string> => {

  if (!topCompanies || topCompanies.length === 0) {
    return `**No Tracking Data Yet**\n\nBrowse the web with Echo protection enabled to start building your privacy profile.\n\n*All analysis is performed locally—your data never leaves your device.*`;
  }

  if (!categories || categories.length === 0) {
    return `**Insufficient Data**\n\nMore browsing data is needed to generate an accurate profile.\n\n*Keep Echo running to collect tracking insights.*`;
  }

  try {
    const profile = buildFullProfile(topCompanies, categories);

    return [
      `**${profile.personaEmoji} ${profile.personaTitle}**`,
      ``,
      profile.whyTargeted,
      ``,
      `**Privacy Risk**: ${profile.riskLevel}`,
      `**Tracking Intensity**: ${profile.trackingIntensity}`,
      `**Your Data Value**: ${profile.dataValue} (Est. ${profile.estimatedAdValue})`,
      `**Profile Confidence**: ${profile.confidenceScore}%`,
      ``,
      profile.dominantCategories.length > 0
        ? `**Dominant Interests**: ${profile.dominantCategories.join(' · ')}`
        : '',
      profile.topInterests.length > 0
        ? `**Sites Identified**: ${profile.topInterests.join(', ')}`
        : '',
      profile.trackerCompanies.length > 0
        ? `**Top Trackers**: ${profile.trackerCompanies.join(', ')}`
        : '',
      ``,
      `**What this means for you:**`,
      ...profile.behavioralInsights.map(i => `• ${i}`),
      ``,
      `*All analysis performed locally — no data leaves your device.*`,
    ].filter(line => line !== '').join('\n');

  } catch (error: any) {
    console.error("Profile Analysis Error:", error);
    return `**Analysis Error**\n\nUnable to generate profile: ${error.message || "Unknown error"}.\n\n*Please try again or check the console for details.*`;
  }
};