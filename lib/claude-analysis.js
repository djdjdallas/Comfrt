/**
 * Claude-Powered Venue Analysis
 *
 * Uses Claude AI to intelligently analyze venue attributes
 * for comfort signals that matter to sensory-sensitive users.
 */

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

/**
 * Analyze venue using Claude based on Yelp attributes AND real customer reviews
 */
export async function analyzeVenueWithClaude(venue, reviews = []) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return null;
  }

  if (!venue.venueDescription && reviews.length === 0) {
    return null;
  }

  // Build review text section
  let reviewSection = '';
  if (reviews.length > 0) {
    const reviewTexts = reviews
      .slice(0, 8) // Limit to 8 reviews to stay within token limits
      .map((r, i) => `Review ${i + 1} (${r.rating}/5 stars): "${r.text}"`)
      .join('\n\n');
    reviewSection = `

ACTUAL CUSTOMER REVIEWS:
${reviewTexts}`;
  }

  const prompt = `You are helping people with sensory sensitivities (autism, ADHD, migraines, anxiety) find comfortable venues.

Analyze this venue based on its Yelp data${reviews.length > 0 ? ' AND real customer reviews' : ''}:

VENUE INFO:
${venue.venueDescription || 'No description available'}${reviewSection}

Based on ${reviews.length > 0 ? 'the actual reviews and ' : ''}venue attributes, assess the comfort level for sensory-sensitive visitors.

${reviews.length > 0 ? 'Pay special attention to what reviewers say about: noise levels, crowding, atmosphere, lighting, and overall vibe. Direct quotes from reviews are the most valuable data.' : 'Note: No reviews available - base assessment on venue type and attributes only.'}

Respond in JSON format only:
{
  "comfort_score": <0-100, where 100 is extremely calm/quiet - be realistic based on ${reviews.length > 0 ? 'actual reviews' : 'venue type'}>,
  "noise_level": "<quiet|moderate|loud|varies>",
  "lighting": "<dim|natural|bright|unknown>",
  "crowding": "<spacious|moderate|crowded|varies>",
  "best_for": "<working|relaxing|conversation|dates|quick_visit>",
  "best_times": "<morning|afternoon|evening|weekdays|weekends|anytime>",
  "summary": "<1 unique sentence describing the atmosphere, ${reviews.length > 0 ? 'citing specific reviewer observations' : 'based on venue type'}>",
  "confidence": "<low|medium|high>",
  "warnings": "<optional: any sensory concerns mentioned in reviews, or null>"
}

Be specific and unique in your summary - ${reviews.length > 0 ? 'reference what actual customers experienced' : "don't use generic phrases"}.`;

  try {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5-20251101',
        max_tokens: 400,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const content = data.content?.[0]?.text;

    if (!content) {
      return null;
    }

    // Parse JSON from response with proper error handling
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return null;
      }

      const analysis = JSON.parse(jsonMatch[0]);

      // Validate required fields
      if (typeof analysis.comfort_score !== 'number') {
        return null;
      }

      // Ensure comfort_score is in valid range
      analysis.comfort_score = Math.max(0, Math.min(100, Math.round(analysis.comfort_score)));

      return analysis;
    } catch (parseError) {
      return null;
    }

  } catch (error) {
    return null;
  }
}

/**
 * Generate a recommendation reason from Claude analysis
 */
export function getClaudeRecommendation(claudeAnalysis) {
  if (!claudeAnalysis) {
    return null;
  }

  // Use the summary
  if (claudeAnalysis.summary) {
    return claudeAnalysis.summary;
  }

  return null;
}

/**
 * Get comfort attributes from Claude analysis
 */
export function getClaudeAttributes(claudeAnalysis) {
  if (!claudeAnalysis) {
    return [];
  }

  const attributes = [];

  // Noise level
  if (claudeAnalysis.noise_level === 'quiet') {
    attributes.push({ variant: 'quiet', label: 'Quiet' });
  } else if (claudeAnalysis.noise_level === 'moderate') {
    attributes.push({ variant: 'quiet', label: 'Moderate Noise' });
  } else if (claudeAnalysis.noise_level === 'loud') {
    attributes.push({ variant: 'quiet', label: 'Can be loud' });
  }

  // Lighting
  if (claudeAnalysis.lighting === 'dim') {
    attributes.push({ variant: 'dim', label: 'Dim Lighting' });
  } else if (claudeAnalysis.lighting === 'natural') {
    attributes.push({ variant: 'dim', label: 'Natural Light' });
  }

  // Space
  if (claudeAnalysis.crowding === 'spacious') {
    attributes.push({ variant: 'spacious', label: 'Spacious' });
  } else if (claudeAnalysis.crowding === 'crowded') {
    attributes.push({ variant: 'spacious', label: 'Can get crowded' });
  }

  // Best for
  if (claudeAnalysis.best_for === 'working') {
    attributes.push({ variant: 'wifi', label: 'Good for Work' });
  } else if (claudeAnalysis.best_for === 'relaxing') {
    attributes.push({ variant: 'cozy', label: 'Relaxing' });
  } else if (claudeAnalysis.best_for === 'conversation') {
    attributes.push({ variant: 'cozy', label: 'Good for Talking' });
  } else if (claudeAnalysis.best_for === 'dates') {
    attributes.push({ variant: 'cozy', label: 'Date Night' });
  }

  return attributes.slice(0, 4);
}
