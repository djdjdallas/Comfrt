/**
 * Claude-Powered Venue Analysis
 *
 * Uses Claude AI to intelligently analyze venue attributes
 * for comfort signals that matter to sensory-sensitive users.
 */

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

/**
 * Analyze venue using Claude based on Yelp attributes
 * (Used when reviews API is not available)
 */
export async function analyzeVenueWithClaude(venue) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  console.log(`[Claude] Starting analysis for ${venue.name}, API key exists: ${!!apiKey}`);

  if (!apiKey) {
    console.log('[Claude] No ANTHROPIC_API_KEY in env, skipping AI analysis');
    return null;
  }

  if (!venue.venueDescription) {
    console.log(`[Claude] No venue description for ${venue.name}, skipping`);
    return null;
  }

  console.log(`[Claude] ${venue.name}: Analyzing venue attributes`);

  const prompt = `You are helping people with sensory sensitivities (autism, ADHD, migraines, anxiety) find comfortable venues.

Analyze this venue based on its Yelp data:
${venue.venueDescription}

Based on the venue type, price point, and any available attributes, predict the comfort level for sensory-sensitive visitors.

Respond in JSON format only:
{
  "comfort_score": <0-100, where 100 is extremely calm/quiet - be realistic based on venue type>,
  "noise_level": "<quiet|moderate|loud|varies>",
  "lighting": "<dim|natural|bright|unknown>",
  "crowding": "<spacious|moderate|crowded|varies>",
  "best_for": "<working|relaxing|conversation|dates|quick_visit>",
  "best_times": "<morning|afternoon|evening|weekdays|weekends|anytime>",
  "summary": "<1 unique sentence describing the atmosphere for sensory-sensitive visitors>",
  "confidence": "<low|medium|high>"
}

Be specific and unique in your summary - don't use generic phrases. Consider:
- Coffee shops/cafes are usually quieter, good for working
- Fine dining ($$$$) tends to be quieter and more intimate
- Bars and sports venues are typically louder
- Brunch spots can be crowded on weekends
- Japanese restaurants often have calm atmospheres`;

  try {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
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
      const errorText = await response.text();
      console.error('[Claude] API error:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    const content = data.content?.[0]?.text;

    if (!content) {
      console.error('[Claude] No content in response');
      return null;
    }

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[Claude] Could not parse JSON from response:', content);
      return null;
    }

    const analysis = JSON.parse(jsonMatch[0]);

    console.log(`[Claude] ${venue.name} analysis:`, {
      comfort_score: analysis.comfort_score,
      noise_level: analysis.noise_level,
      summary: analysis.summary?.substring(0, 60) + '...'
    });

    return analysis;

  } catch (error) {
    console.error('[Claude] Analysis error:', error.message);
    return null;
  }
}

/**
 * Generate a recommendation reason from Claude analysis
 */
export function getClaudeRecommendation(claudeAnalysis, venue) {
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
