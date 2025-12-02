'use client';

import { Volume2, Sun, Users, Sparkles, Wind } from 'lucide-react';

const CATEGORIES = [
  { key: 'noise', label: 'Noise Level', icon: Volume2, description: 'How quiet the environment is' },
  { key: 'lighting', label: 'Lighting', icon: Sun, description: 'Brightness and lighting quality' },
  { key: 'space', label: 'Spaciousness', icon: Users, description: 'Room to breathe and move' },
  { key: 'ambiance', label: 'Ambiance', icon: Sparkles, description: 'Overall atmosphere and mood' },
  { key: 'sensory', label: 'Sensory', icon: Wind, description: 'Smells, temperature, ventilation' },
];

const MATCH_LABELS = {
  excellent: { label: 'Excellent Match', color: '#5a7a52', bg: 'rgba(90, 122, 82, 0.1)' },
  good: { label: 'Good Match', color: '#7a9a52', bg: 'rgba(122, 154, 82, 0.1)' },
  moderate: { label: 'Moderate', color: '#9a9a52', bg: 'rgba(154, 154, 82, 0.1)' },
  poor: { label: 'May Not Suit', color: '#9a7a52', bg: 'rgba(154, 122, 82, 0.1)' },
};

/**
 * Calculate detailed sensory match between venue and user preferences
 */
export function calculateSensoryMatch(venue, preferences = {}) {
  const breakdown = {};

  // Noise matching
  const noiseScore = calculateNoiseMatch(venue, preferences);
  breakdown.noise = {
    score: noiseScore,
    userPreference: preferences.noiseSensitivity || 3,
    venueLevel: venue.noise_level || 'average',
    match: getMatchLevel(noiseScore),
    description: getNoiseDescription(venue.noise_level, preferences.noiseSensitivity)
  };

  // Lighting matching (inferred from ambiance)
  const lightingScore = calculateLightingMatch(venue, preferences);
  breakdown.lighting = {
    score: lightingScore,
    userPreference: preferences.lightSensitivity || 3,
    venueLevel: inferLightingLevel(venue),
    match: getMatchLevel(lightingScore),
    description: getLightingDescription(venue, preferences.lightSensitivity)
  };

  // Space matching
  const spaceScore = calculateSpaceMatch(venue, preferences);
  breakdown.space = {
    score: spaceScore,
    userPreference: preferences.spaciousnessPreference || 3,
    venueLevel: inferSpaceLevel(venue),
    match: getMatchLevel(spaceScore),
    description: getSpaceDescription(venue, preferences.spaciousnessPreference)
  };

  // Ambiance matching
  const ambianceScore = calculateAmbianceMatch(venue, preferences);
  breakdown.ambiance = {
    score: ambianceScore,
    userPreference: 3, // General preference
    venueLevel: venue.ambiance?.[0] || 'casual',
    match: getMatchLevel(ambianceScore),
    description: getAmbianceDescription(venue)
  };

  // Sensory matching (from review analysis if available)
  const sensoryScore = venue.reviewAnalysis?.breakdown?.sensory?.score || 60;
  breakdown.sensory = {
    score: sensoryScore,
    userPreference: 3,
    venueLevel: sensoryScore >= 70 ? 'comfortable' : 'standard',
    match: getMatchLevel(sensoryScore),
    description: getSensoryDescription(sensoryScore)
  };

  // Calculate overall weighted score
  const weights = { noise: 0.35, lighting: 0.15, space: 0.25, ambiance: 0.15, sensory: 0.10 };
  const overall = Math.round(
    Object.entries(weights).reduce((sum, [key, weight]) => {
      return sum + (breakdown[key]?.score || 50) * weight;
    }, 0)
  );

  return { overall, breakdown };
}

function calculateNoiseMatch(venue, preferences) {
  const sensitivity = preferences.noiseSensitivity || 3;
  const noiseLevel = venue.noise_level || 'average';

  const noiseScores = { quiet: 95, average: 60, loud: 30, very_loud: 10 };
  const baseScore = noiseScores[noiseLevel] || 60;

  // Adjust based on sensitivity
  if (sensitivity >= 4 && noiseLevel === 'quiet') return 100;
  if (sensitivity >= 4 && noiseLevel === 'loud') return 20;
  if (sensitivity <= 2 && noiseLevel !== 'quiet') return baseScore + 10;

  return baseScore;
}

function calculateLightingMatch(venue, preferences) {
  const sensitivity = preferences.lightSensitivity || 3;
  const ambiance = venue.ambiance || [];
  const price = venue.price || '';

  // Infer lighting from venue attributes
  let baseScore = 60;
  if (ambiance.includes('intimate') || ambiance.includes('romantic')) baseScore = 90;
  if (ambiance.includes('cozy')) baseScore = 80;
  if (price === '$$$' || price === '$$$$') baseScore = Math.max(baseScore, 75);

  // Adjust for sensitivity
  if (sensitivity >= 4 && baseScore >= 80) return 95;
  if (sensitivity >= 4 && baseScore < 60) return 40;

  return baseScore;
}

function calculateSpaceMatch(venue, preferences) {
  const preference = preferences.spaciousnessPreference || 3;
  const price = venue.price || '';

  let baseScore = 60;
  if (price === '$$$' || price === '$$$$') baseScore = 80;
  if (venue.reservations) baseScore += 10;

  // Adjust for preference
  if (preference >= 4 && baseScore >= 75) return 90;
  if (preference <= 2) return baseScore + 10; // Cozy is fine

  return Math.min(baseScore, 100);
}

function calculateAmbianceMatch(venue, preferences) {
  const ambiance = venue.ambiance || [];

  const ambianceScores = {
    intimate: 90, romantic: 85, cozy: 80,
    casual: 70, upscale: 75, classy: 70,
    trendy: 55, hipster: 55, divey: 45
  };

  let score = 65;
  for (const amb of ambiance) {
    if (ambianceScores[amb]) {
      score = Math.max(score, ambianceScores[amb]);
    }
  }

  return score;
}

function getMatchLevel(score) {
  if (score >= 80) return 'excellent';
  if (score >= 65) return 'good';
  if (score >= 50) return 'moderate';
  return 'poor';
}

function inferLightingLevel(venue) {
  const ambiance = venue.ambiance || [];
  if (ambiance.includes('intimate') || ambiance.includes('romantic')) return 'dim';
  if (ambiance.includes('cozy')) return 'soft';
  if (venue.price === '$$$' || venue.price === '$$$$') return 'ambient';
  return 'standard';
}

function inferSpaceLevel(venue) {
  if (venue.price === '$$$' || venue.price === '$$$$') return 'spacious';
  if (venue.reservations) return 'comfortable';
  return 'standard';
}

function getNoiseDescription(noiseLevel, sensitivity) {
  if (noiseLevel === 'quiet') return 'Known for a peaceful, quiet atmosphere';
  if (noiseLevel === 'average') return 'Moderate noise levels typical for this type of venue';
  if (noiseLevel === 'loud') return 'Can get noisy, especially during peak hours';
  return 'Noise levels vary';
}

function getLightingDescription(venue, sensitivity) {
  const ambiance = venue.ambiance || [];
  if (ambiance.includes('intimate')) return 'Soft, intimate lighting creates a relaxed mood';
  if (ambiance.includes('romantic')) return 'Romantic dim lighting, easy on the eyes';
  if (venue.price === '$$$' || venue.price === '$$$$') return 'Well-designed ambient lighting';
  return 'Standard lighting typical for this venue type';
}

function getSpaceDescription(venue, preference) {
  if (venue.price === '$$$' || venue.price === '$$$$') return 'More spacious layout with room to breathe';
  if (venue.reservations) return 'Takes reservations, reducing crowding';
  return 'Standard seating arrangement';
}

function getAmbianceDescription(venue) {
  const ambiance = venue.ambiance || [];
  if (ambiance.includes('intimate')) return 'Intimate, quiet atmosphere';
  if (ambiance.includes('cozy')) return 'Cozy, comfortable environment';
  if (ambiance.includes('casual')) return 'Relaxed, casual vibe';
  return 'Pleasant atmosphere';
}

function getSensoryDescription(score) {
  if (score >= 70) return 'Reviews mention comfortable sensory environment';
  if (score >= 50) return 'Standard sensory experience';
  return 'Some sensory concerns noted in reviews';
}

/**
 * SensoryMatch Component - Visual breakdown of venue-user match
 */
export default function SensoryMatch({ venue, preferences = {} }) {
  const { overall, breakdown } = calculateSensoryMatch(venue, preferences);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Overall Match Score */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        padding: '20px',
        backgroundColor: '#f6f7f5',
        borderRadius: '20px'
      }}>
        {/* Circular Score */}
        <div style={{
          position: 'relative',
          width: '100px',
          height: '100px',
          flexShrink: 0
        }}>
          <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="#e8e4dc"
              strokeWidth="8"
            />
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke={getScoreColor(overall)}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${overall * 2.64} 264`}
              style={{ transition: 'stroke-dasharray 1s ease' }}
            />
          </svg>
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <span style={{ fontSize: '28px', fontWeight: '700', color: '#3d3d3d' }}>{overall}</span>
            <span style={{ fontSize: '11px', color: '#6b6b6b', textTransform: 'uppercase' }}>match</span>
          </div>
        </div>

        {/* Match Summary */}
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#3d3d3d', margin: 0 }}>
            {overall >= 80 ? 'Excellent Match!' :
             overall >= 65 ? 'Good Match' :
             overall >= 50 ? 'Moderate Match' : 'May Not Suit You'}
          </h3>
          <p style={{ fontSize: '14px', color: '#6b6b6b', margin: '4px 0 0 0' }}>
            Based on your sensory preferences
          </p>
        </div>
      </div>

      {/* Category Breakdown */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {CATEGORIES.map(({ key, label, icon: Icon }) => {
          const data = breakdown[key];
          if (!data) return null;

          const matchStyle = MATCH_LABELS[data.match];

          return (
            <div
              key={key}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '16px',
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #f3f1ed'
              }}
            >
              {/* Icon */}
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                backgroundColor: matchStyle.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Icon size={20} style={{ color: matchStyle.color }} />
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <span style={{ fontWeight: '500', color: '#3d3d3d' }}>{label}</span>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: '500',
                    padding: '4px 8px',
                    borderRadius: '9999px',
                    backgroundColor: matchStyle.bg,
                    color: matchStyle.color
                  }}>
                    {matchStyle.label}
                  </span>
                </div>

                {/* Progress Bar */}
                <div style={{
                  marginTop: '8px',
                  height: '6px',
                  backgroundColor: '#e8e4dc',
                  borderRadius: '3px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${data.score}%`,
                    height: '100%',
                    backgroundColor: matchStyle.color,
                    borderRadius: '3px',
                    transition: 'width 0.5s ease'
                  }} />
                </div>

                {/* Description */}
                <p style={{ fontSize: '13px', color: '#6b6b6b', margin: '8px 0 0 0' }}>
                  {data.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Personalization Note */}
      <div style={{
        padding: '12px 16px',
        backgroundColor: 'rgba(150, 168, 127, 0.1)',
        borderRadius: '12px',
        border: '1px solid rgba(150, 168, 127, 0.2)'
      }}>
        <p style={{ fontSize: '13px', color: '#617349', margin: 0 }}>
          This match is personalized to your sensory preferences. Update your profile in settings for more accurate recommendations.
        </p>
      </div>
    </div>
  );
}

function getScoreColor(score) {
  if (score >= 80) return '#5a7a52';
  if (score >= 65) return '#7a9a52';
  if (score >= 50) return '#9a9a52';
  return '#9a7a52';
}
