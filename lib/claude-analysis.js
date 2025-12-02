/**
 * Claude-Powered Review Analysis
 *
 * Uses Claude AI to intelligently analyze Yelp reviews
 * for comfort signals that matter to sensory-sensitive users.
 */

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

/**
 * Analyze reviews using Claude for deeper comfort insights
 */
export async function analyzeReviewsWithClaude(venue, reviews) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.log('[Claude] No API key configured, skipping AI analysis');
    return null;
  }

  if (!reviews || reviews.length === 0) {
    return null;
  }

  // Combine review text
  const reviewText = reviews
    .map(r => r.text)
    .filter(Boolean)
    .join('\n---\n')
    .substring(0, 3000); // Limit to ~3000 chars to keep costs down

  if (reviewText.length < 50) {
    return null;
  }

  const prompt = `Analyze these Yelp reviews for "${venue.name}" (${venue.categories?.map(c => c.title).join(', ')}) from the perspective of someone with sensory sensitivities (autism, ADHD, migraines, anxiety).

Reviews:
${reviewText}

Respond in JSON format only:
{
  "comfort_score": <0-100, where 100 is extremely calm/quiet>,
  "noise_level": "<quiet|moderate|loud|varies>",
  "lighting": "<dim|natural|bright|not_mentioned>",
  "crowding": "<spacious|moderate|crowded|varies>",
  "best_for": "<working|relaxing|conversation|dates|quick_visit>",
  "best_times": "<morning|afternoon|evening|weekdays|weekends|anytime>",
  "summary": "<1 sentence unique summary about comfort/atmosphere>",
  "quote": "<best short quote from reviews about atmosphere, or null>",
  "warnings": "<any sensory concerns, or null>",
  "confidence": "<low|medium|high based on how much comfort info was in reviews>"
}`;

  try {
    console.log(`[Claude] Analyzing ${reviews.length} reviews for ${venue.name}...`);

    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 500,
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
      summary: analysis.summary?.substring(0, 50) + '...'
    });

    return analysis;

  } catch (error) {
    console.error('[Claude] Analysis error:', error.message);
    return null;
  }
}

/**
 * Batch analyze multiple venues (more efficient)
 */
export async function batchAnalyzeVenues(venuesWithReviews) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.log('[Claude] No API key configured, skipping batch analysis');
    return venuesWithReviews.map(v => ({ ...v, claudeAnalysis: null }));
  }

  // Analyze in parallel (but limit concurrency)
  const results = await Promise.all(
    venuesWithReviews.map(async (venue) => {
      if (!venue.reviews || venue.reviews.length === 0) {
        return { ...venue, claudeAnalysis: null };
      }

      const analysis = await analyzeReviewsWithClaude(venue, venue.reviews);
      return { ...venue, claudeAnalysis: analysis };
    })
  );

  return results;
}

/**
 * Generate a recommendation reason from Claude analysis
 */
export function getClaudeRecommendation(claudeAnalysis, venue) {
  if (!claudeAnalysis) {
    return null;
  }

  // Use the quote if available
  if (claudeAnalysis.quote && claudeAnalysis.quote !== 'null') {
    return `"${claudeAnalysis.quote}"`;
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
    attributes.push({ variant: 'quiet', label: 'Moderate' });
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
  }

  // Best for
  if (claudeAnalysis.best_for === 'working') {
    attributes.push({ variant: 'wifi', label: 'Good for Work' });
  } else if (claudeAnalysis.best_for === 'relaxing') {
    attributes.push({ variant: 'cozy', label: 'Relaxing' });
  } else if (claudeAnalysis.best_for === 'conversation') {
    attributes.push({ variant: 'cozy', label: 'Good for Talking' });
  }

  return attributes.slice(0, 4);
}
