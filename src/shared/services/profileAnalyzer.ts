/**
 * Local Privacy Profile Analyzer
 * Generates digital persona insights from tracker data WITHOUT external AI APIs
 * Privacy-first: All analysis happens locally, no data leaves the extension
 */

interface TrackerSummary {
  name: string;
  count: number;
}

interface WebsiteData {
  label: string; // Website domain
  percent: number;
}

interface DigitalProfile {
  personaTitle: string;
  whyTargeted: string;
  dataValue: 'Low' | 'Medium' | 'High' | 'Very High';
  trackingIntensity: 'Light' | 'Moderate' | 'Heavy' | 'Extreme';
  topInterests: string[];
  privacyScore: number; // 0-100, lower is better
}

/**
 * Analyze tracker data and generate a digital profile
 */
export function analyzeDigitalProfile(
  topCompanies: TrackerSummary[],
  websites: WebsiteData[]
): string {
  const profile = generateProfile(topCompanies, websites);
  return formatProfileAsMarkdown(profile);
}

/**
 * Generate the digital profile from tracker data
 */
function generateProfile(
  topCompanies: TrackerSummary[],
  websites: WebsiteData[]
): DigitalProfile {
  const totalTrackers = topCompanies.reduce((sum, c) => sum + c.count, 0);
  const uniqueCompanies = topCompanies.length;

  // Analyze websites to determine interests
  const websiteMap = new Map(websites.map(w => [w.label.toLowerCase(), w.percent]));

  // Determine tracking intensity
  const trackingIntensity = calculateTrackingIntensity(totalTrackers, uniqueCompanies);

  // Determine data value
  const dataValue = calculateDataValue(websites, uniqueCompanies, totalTrackers);

  // Generate persona based on browsing patterns
  const persona = generatePersona(websiteMap, topCompanies);

  // Calculate privacy score (0-100, lower is better)
  const privacyScore = calculatePrivacyScore(websites, uniqueCompanies, totalTrackers);

  return {
    personaTitle: persona.title,
    whyTargeted: persona.reason,
    dataValue,
    trackingIntensity,
    topInterests: persona.interests,
    privacyScore
  };
}

/**
 * Calculate tracking intensity based on volume
 */
function calculateTrackingIntensity(
  totalTrackers: number,
  uniqueCompanies: number
): 'Light' | 'Moderate' | 'Heavy' | 'Extreme' {
  if (totalTrackers < 20 || uniqueCompanies < 3) return 'Light';
  if (totalTrackers < 50 || uniqueCompanies < 7) return 'Moderate';
  if (totalTrackers < 150 || uniqueCompanies < 15) return 'Heavy';
  return 'Extreme';
}

/**
 * Calculate estimated data value to advertisers
 */
function calculateDataValue(
  websites: WebsiteData[],
  uniqueCompanies: number,
  totalTrackers: number
): 'Low' | 'Medium' | 'High' | 'Very High' {
  // High-value website types (e-commerce, social media, finance)
  const highValueSites = ['amazon', 'ebay', 'shopify', 'etsy', 'facebook', 'instagram', 'twitter', 'linkedin', 'paypal', 'bank'];
  const hasHighValueBrowsing = websites.some(w =>
    highValueSites.some(hv => w.label.toLowerCase().includes(hv)) && w.percent > 15
  );

  const diversityScore = uniqueCompanies * websites.length;
  const volumeScore = totalTrackers;

  if (hasHighValueBrowsing && diversityScore > 50 && volumeScore > 100) return 'Very High';
  if (diversityScore > 30 || volumeScore > 50) return 'High';
  if (diversityScore > 15 || volumeScore > 20) return 'Medium';
  return 'Low';
}

/**
 * Calculate privacy score (0-100, lower = better privacy)
 */
function calculatePrivacyScore(
  websites: WebsiteData[],
  uniqueCompanies: number,
  totalTrackers: number
): number {
  // Base score from tracker volume (0-40 points)
  const volumeScore = Math.min(40, (totalTrackers / 200) * 40);

  // Diversity penalty (0-30 points)
  const diversityScore = Math.min(30, (uniqueCompanies / 20) * 30);

  // Website risk score (0-30 points) - sites with heavy tracking
  const highTrackingSites = ['facebook', 'google', 'amazon', 'youtube', 'twitter', 'instagram', 'tiktok', 'reddit'];
  const websiteRisk = websites.reduce((score, w) => {
    const isHighTracking = highTrackingSites.some(ht => w.label.toLowerCase().includes(ht));
    return score + (isHighTracking ? (w.percent / 100) * 30 : 0);
  }, 0);

  return Math.round(Math.min(100, volumeScore + diversityScore + websiteRisk));
}

/**
 * Generate persona title and targeting reason based on browsing patterns
 */
function generatePersona(
  websiteMap: Map<string, number>,
  topCompanies: TrackerSummary[]
): { title: string; reason: string; interests: string[] } {
  const interests: string[] = [];
  let title = '';
  let reason = '';

  // Analyze website browsing patterns
  const shopping = getMatchingPercent(websiteMap, ['amazon', 'ebay', 'etsy', 'shopify', 'walmart', 'target', 'shop']);
  const socialMedia = getMatchingPercent(websiteMap, ['facebook', 'instagram', 'twitter', 'tiktok', 'linkedin', 'snapchat', 'reddit']);
  const video = getMatchingPercent(websiteMap, ['youtube', 'netflix', 'twitch', 'vimeo', 'dailymotion']);
  const news = getMatchingPercent(websiteMap, ['news', 'bbc', 'cnn', 'nyt', 'guardian', 'reuters', 'wsj']);
  const tech = getMatchingPercent(websiteMap, ['github', 'stackoverflow', 'dev.to', 'medium', 'hackernews']);
  const finance = getMatchingPercent(websiteMap, ['bank', 'paypal', 'chase', 'wellsfargo', 'investing', 'trading']);
  const gaming = getMatchingPercent(websiteMap, ['steam', 'twitch', 'gaming', 'ign', 'gamespot', 'xbox', 'playstation']);

  // Analyze tracking companies
  const hasGoogleTracking = topCompanies.some(c => c.name.toLowerCase().includes('google'));
  const hasFacebookTracking = topCompanies.some(c => c.name.toLowerCase().includes('facebook') || c.name.toLowerCase().includes('meta'));
  const hasAmazonTracking = topCompanies.some(c => c.name.toLowerCase().includes('amazon'));

  // PERSONA GENERATION LOGIC
  // Based on dominant browsing patterns, assign a persona

  if (shopping > 30) {
    title = 'The Digital Shopper';
    reason = 'Frequent visits to e-commerce sites expose your purchase intent and shopping habits. Retailers and advertisers value this data for targeted product recommendations.';
    interests.push('E-commerce', 'Online Shopping', 'Product Research');
  } else if (socialMedia > 30) {
    title = 'The Social Media Maven';
    reason = 'Heavy social media usage exposes your interests, connections, and engagement patterns. Social platforms monetize this by building detailed behavioral profiles.';
    interests.push('Social Networking', 'Content Sharing', 'Social Engagement');
  } else if (video > 30) {
    title = 'The Content Consumer';
    reason = 'Streaming and video platform usage reveals your entertainment preferences. Media companies use this to optimize recommendations and ad placements.';
    interests.push('Streaming', 'Video Content', 'Entertainment');
  } else if (news > 25) {
    title = 'The Informed Reader';
    reason = 'Regular news consumption indicates interest in current events. News sites track reading patterns to personalize content and deliver targeted advertising.';
    interests.push('News', 'Current Events', 'Information');
  } else if (tech > 25) {
    title = 'The Tech Enthusiast';
    reason = 'Technical site usage suggests developer or tech-savvy interests. Tech companies value this demographic for beta testing and B2B marketing.';
    interests.push('Technology', 'Software Development', 'Tech News');
  } else if (finance > 20) {
    title = 'The Financial Browser';
    reason = 'Financial site visits indicate high-value consumer status. Financial institutions track this to offer targeted services and investment products.';
    interests.push('Finance', 'Banking', 'Investing');
  } else if (gaming > 20) {
    title = 'The Gamer';
    reason = 'Gaming platform usage reveals entertainment preferences and spending habits. Game publishers use this data for targeted promotions and recommendations.';
    interests.push('Gaming', 'Entertainment', 'Digital Content');
  } else if (hasGoogleTracking && hasFacebookTracking) {
    title = 'The Tracked Browser';
    reason = 'Multiple major platforms are tracking your activity across different websites. This creates a comprehensive cross-site profile of your behavior.';
    interests.push('General Browsing', 'Cross-Site Tracking', 'Behavioral Profiling');
  } else {
    title = 'The Privacy-Conscious Browser';
    reason = 'Diverse browsing patterns with limited tracking exposure suggest careful browsing habits or effective privacy protection.';
    interests.push('Privacy', 'Diverse Interests', 'Cautious Browsing');
  }

  // Add top visited sites as interests
  const topSites: string[] = [];
  websiteMap.forEach((percent, website) => {
    if (percent > 10 && website !== 'unknown') {
      const siteName = website.replace(/^www\./, '').split('.')[0];
      const formatted = siteName.charAt(0).toUpperCase() + siteName.slice(1);
      if (!interests.includes(formatted)) {
        topSites.push(formatted);
      }
    }
  });

  interests.push(...topSites.slice(0, 3));

  return {
    title,
    reason,
    interests: interests.slice(0, 5) // Limit to top 5
  };
}

/**
 * Helper to get percentage for matching categories
 */
function getMatchingPercent(map: Map<string, number>, keywords: string[]): number {
  let total = 0;
  map.forEach((percent, category) => {
    if (keywords.some(kw => category.includes(kw))) {
      total += percent;
    }
  });
  return total;
}

/**
 * Format the profile as markdown for display
 */
function formatProfileAsMarkdown(profile: DigitalProfile): string {
  const scoreColor = profile.privacyScore < 30 ? '🟢' : profile.privacyScore < 60 ? '🟡' : '🔴';
  const valueEmoji = profile.dataValue === 'Very High' ? '💎💎💎' :
                     profile.dataValue === 'High' ? '💎💎' :
                     profile.dataValue === 'Medium' ? '💎' : '📊';

  return `**${profile.personaTitle}**

${profile.whyTargeted}

**Data Value**: ${valueEmoji} ${profile.dataValue}
**Tracking Intensity**: ${profile.trackingIntensity}
**Privacy Score**: ${scoreColor} ${profile.privacyScore}/100 ${profile.privacyScore < 30 ? '(Good)' : profile.privacyScore < 60 ? '(Fair)' : '(Poor)'}

**Inferred Interests**: ${profile.topInterests.join(', ')}

*This analysis is based on ${profile.trackingIntensity.toLowerCase()} tracking activity. All analysis performed locally—no data shared with external services.*`;
}
