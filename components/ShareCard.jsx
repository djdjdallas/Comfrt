'use client';

import { forwardRef } from 'react';
import { Star, MapPin, Volume2, Users, Sparkles } from 'lucide-react';

/**
 * ShareCard - A beautiful card designed for social sharing
 * Dimensions: 1200x630 (optimal for social media)
 */
const ShareCard = forwardRef(function ShareCard({ venue, size = 'large' }, ref) {
  const score = venue?.comfort_score || 75;
  const isLarge = size === 'large';

  const dimensions = isLarge
    ? { width: '600px', height: '315px' }
    : { width: '320px', height: '168px' };

  const fontSize = isLarge
    ? { title: '24px', subtitle: '14px', score: '36px', small: '12px' }
    : { title: '16px', subtitle: '11px', score: '24px', small: '10px' };

  return (
    <div
      ref={ref}
      style={{
        ...dimensions,
        background: 'linear-gradient(135deg, #faf9f7 0%, #f3f1ed 100%)',
        borderRadius: isLarge ? '24px' : '16px',
        overflow: 'hidden',
        display: 'flex',
        fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif',
        position: 'relative',
      }}
    >
      {/* Left: Image */}
      <div style={{
        width: '40%',
        position: 'relative',
        backgroundColor: '#e8e4dc'
      }}>
        {venue?.image_url && (
          <img
            src={venue.image_url}
            alt={venue?.name || 'Venue'}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
            crossOrigin="anonymous"
          />
        )}
        {/* Gradient overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to right, transparent 60%, rgba(250, 249, 247, 1))'
        }} />
      </div>

      {/* Right: Content */}
      <div style={{
        flex: 1,
        padding: isLarge ? '28px' : '16px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative'
      }}>
        {/* Top: Venue Info */}
        <div>
          {/* Comfort Score Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: isLarge ? '8px 14px' : '5px 10px',
            backgroundColor: getScoreColor(score),
            borderRadius: '9999px',
            marginBottom: isLarge ? '16px' : '10px'
          }}>
            <span style={{
              color: 'white',
              fontSize: fontSize.score,
              fontWeight: '700'
            }}>
              {score}
            </span>
            <span style={{
              color: 'rgba(255,255,255,0.9)',
              fontSize: fontSize.small,
              fontWeight: '500',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Comfort
            </span>
          </div>

          {/* Venue Name */}
          <h2 style={{
            fontSize: fontSize.title,
            fontWeight: '700',
            color: '#3d3d3d',
            margin: '0 0 8px 0',
            lineHeight: '1.2'
          }}>
            {venue?.name || 'Venue Name'}
          </h2>

          {/* Category */}
          <p style={{
            fontSize: fontSize.subtitle,
            color: '#6b6b6b',
            margin: 0
          }}>
            {venue?.categories?.map(c => c.title).join(' • ') || 'Restaurant'}
          </p>

          {/* Rating & Location */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: isLarge ? '16px' : '10px',
            marginTop: isLarge ? '12px' : '8px'
          }}>
            {venue?.rating && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Star
                  size={isLarge ? 16 : 12}
                  style={{ fill: '#fbbf24', color: '#fbbf24' }}
                />
                <span style={{ fontSize: fontSize.subtitle, fontWeight: '500', color: '#3d3d3d' }}>
                  {venue.rating}
                </span>
              </div>
            )}
            {venue?.location?.city && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={isLarge ? 14 : 10} style={{ color: '#96a87f' }} />
                <span style={{ fontSize: fontSize.subtitle, color: '#6b6b6b' }}>
                  {venue.location.city}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom: Attributes & Branding */}
        <div>
          {/* Comfort Attributes */}
          <div style={{
            display: 'flex',
            gap: isLarge ? '8px' : '6px',
            marginBottom: isLarge ? '16px' : '10px',
            flexWrap: 'wrap'
          }}>
            {getTopAttributes(venue).map((attr, idx) => (
              <span
                key={idx}
                style={{
                  padding: isLarge ? '5px 10px' : '3px 7px',
                  fontSize: fontSize.small,
                  fontWeight: '500',
                  backgroundColor: 'rgba(150, 168, 127, 0.15)',
                  color: '#617349',
                  borderRadius: '9999px'
                }}
              >
                {attr}
              </span>
            ))}
          </div>

          {/* Branding */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <Sparkles size={isLarge ? 16 : 12} style={{ color: '#96a87f' }} />
            <span style={{
              fontSize: fontSize.subtitle,
              fontWeight: '600',
              color: '#96a87f'
            }}>
              comfrt
            </span>
            <span style={{
              fontSize: fontSize.small,
              color: '#9a9a9a',
              marginLeft: '4px'
            }}>
              Find your calm space
            </span>
          </div>
        </div>
      </div>

      {/* Decorative elements */}
      <div style={{
        position: 'absolute',
        top: '-50px',
        right: '-50px',
        width: '150px',
        height: '150px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(150, 168, 127, 0.1) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />
    </div>
  );
});

function getScoreColor(score) {
  if (score >= 80) return '#5a7a52';
  if (score >= 65) return '#7a9a52';
  if (score >= 50) return '#9a9a52';
  return '#9a7a52';
}

function getTopAttributes(venue) {
  const attrs = [];

  if (venue?.noise_level === 'quiet') attrs.push('Quiet');
  else if (venue?.noise_level === 'average') attrs.push('Moderate');

  if (venue?.ambiance?.includes('intimate')) attrs.push('Intimate');
  if (venue?.ambiance?.includes('cozy')) attrs.push('Cozy');

  if (venue?.price === '$$$' || venue?.price === '$$$$') attrs.push('Upscale');

  // Limit to 3 attributes
  return attrs.slice(0, 3);
}

export default ShareCard;
