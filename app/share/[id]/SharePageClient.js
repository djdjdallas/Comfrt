'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, Star, ExternalLink, Navigation, Share2, Sparkles } from 'lucide-react';
import ComfortMeter from '@/components/ComfortMeter';
import ComfortChip from '@/components/ComfortChip';
import ShareCard from '@/components/ShareCard';

export default function SharePageClient({ venue, error }) {
  const router = useRouter();

  if (error || !venue) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px',
        backgroundColor: '#faf9f7'
      }}>
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            margin: '0 auto 24px',
            borderRadius: '50%',
            backgroundColor: '#e8ebe4',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Sparkles style={{ width: '40px', height: '40px', color: '#96a87f' }} />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#3d3d3d', marginBottom: '12px' }}>
            Venue Not Found
          </h1>
          <p style={{ color: '#6b6b6b', marginBottom: '24px' }}>
            {error || 'This shared venue could not be found.'}
          </p>
          <button
            onClick={() => router.push('/')}
            style={{
              padding: '14px 28px',
              fontSize: '16px',
              fontWeight: '500',
              borderRadius: '16px',
              backgroundColor: '#96a87f',
              color: 'white',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Find Your Own Spot
          </button>
        </div>
      </div>
    );
  }

  const comfortAttributes = getComfortAttributes(venue);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#faf9f7',
      paddingBottom: '48px'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'rgba(253, 252, 250, 0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #f3f1ed',
        padding: '16px',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <div style={{
          maxWidth: '768px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <button
            onClick={() => router.push('/')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#6b6b6b',
              padding: '8px',
              borderRadius: '12px',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            <ArrowLeft size={20} />
            <span>Find More</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={20} style={{ color: '#96a87f' }} />
            <span style={{ fontSize: '18px', fontWeight: '600', color: '#96a87f' }}>comfrt</span>
          </div>
        </div>
      </div>

      {/* Shared Badge */}
      <div style={{
        maxWidth: '768px',
        margin: '24px auto 0',
        padding: '0 16px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 16px',
          backgroundColor: 'rgba(150, 168, 127, 0.1)',
          borderRadius: '12px',
          border: '1px solid rgba(150, 168, 127, 0.2)'
        }}>
          <Share2 size={16} style={{ color: '#617349' }} />
          <span style={{ fontSize: '14px', color: '#617349' }}>
            Someone shared this calm spot with you
          </span>
        </div>
      </div>

      {/* Share Card Preview */}
      <div style={{
        maxWidth: '768px',
        margin: '24px auto',
        padding: '0 16px',
        display: 'flex',
        justifyContent: 'center'
      }}>
        <ShareCard venue={venue} size="large" />
      </div>

      {/* Venue Details */}
      <div style={{
        maxWidth: '768px',
        margin: '0 auto',
        padding: '0 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        {/* Main Info Card */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          padding: '28px',
          boxShadow: '0 4px 16px rgba(61, 61, 61, 0.06)',
          border: '1px solid #f3f1ed'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '16px'
          }}>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#3d3d3d', margin: 0 }}>
                {venue.name}
              </h1>
              <p style={{ color: '#6b6b6b', marginTop: '4px' }}>
                {venue.categories?.map(c => c.title).join(', ')}
              </p>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                marginTop: '12px'
              }}>
                {venue.rating && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Star size={18} style={{ fill: '#fbbf24', color: '#fbbf24' }} />
                    <span style={{ fontWeight: '500' }}>{venue.rating}</span>
                    {venue.review_count && (
                      <span style={{ color: '#9a9a9a' }}>
                        ({venue.review_count})
                      </span>
                    )}
                  </div>
                )}
                {venue.price && (
                  <span style={{ color: '#6b6b6b' }}>{venue.price}</span>
                )}
              </div>
            </div>

            <ComfortMeter score={venue.comfort_score || 75} size="medium" />
          </div>

          {/* Comfort Chips */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            marginTop: '20px',
            paddingTop: '20px',
            borderTop: '1px solid #f3f1ed'
          }}>
            {comfortAttributes.map((attr, idx) => (
              <ComfortChip key={idx} variant={attr.variant} label={attr.label} />
            ))}
          </div>
        </div>

        {/* Location Card */}
        {venue.location && (
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            padding: '28px',
            boxShadow: '0 4px 16px rgba(61, 61, 61, 0.06)',
            border: '1px solid #f3f1ed'
          }}>
            <h2 style={{ fontWeight: '600', fontSize: '18px', marginBottom: '16px', color: '#3d3d3d' }}>
              Location
            </h2>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '20px' }}>
              <MapPin style={{ color: '#96a87f', flexShrink: 0, marginTop: '2px' }} size={20} />
              <div>
                <p style={{ color: '#3d3d3d', margin: 0 }}>{venue.location.address1}</p>
                <p style={{ color: '#6b6b6b', margin: 0 }}>
                  {venue.location.city}, {venue.location.state} {venue.location.zip_code}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              {venue.url && (
                <a
                  href={venue.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 20px',
                    fontSize: '16px',
                    fontWeight: '500',
                    borderRadius: '16px',
                    backgroundColor: '#96a87f',
                    color: '#ffffff',
                    textDecoration: 'none',
                    flex: 1,
                    justifyContent: 'center'
                  }}
                >
                  <ExternalLink size={18} />
                  View on Yelp
                </a>
              )}

              {venue.coordinates && (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${venue.coordinates.latitude},${venue.coordinates.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 20px',
                    fontSize: '16px',
                    fontWeight: '500',
                    borderRadius: '16px',
                    backgroundColor: '#f3f1ed',
                    color: '#3d3d3d',
                    textDecoration: 'none',
                    flex: 1,
                    justifyContent: 'center'
                  }}
                >
                  <Navigation size={18} />
                  Get Directions
                </a>
              )}
            </div>
          </div>
        )}

        {/* CTA Card */}
        <div style={{
          backgroundColor: '#e8ebe4',
          borderRadius: '24px',
          padding: '28px',
          textAlign: 'center'
        }}>
          <Sparkles size={32} style={{ color: '#96a87f', marginBottom: '16px' }} />
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#3d3d3d', marginBottom: '8px' }}>
            Find Your Own Calm Space
          </h2>
          <p style={{ color: '#6b6b6b', marginBottom: '20px' }}>
            Discover quiet, comfortable venues that match your sensory preferences.
          </p>
          <button
            onClick={() => router.push('/')}
            style={{
              padding: '14px 32px',
              fontSize: '16px',
              fontWeight: '500',
              borderRadius: '16px',
              backgroundColor: '#96a87f',
              color: 'white',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Start Exploring
          </button>
        </div>
      </div>
    </div>
  );
}

function getComfortAttributes(venue) {
  const attributes = [];

  if (venue.noise_level === 'quiet') {
    attributes.push({ variant: 'quiet', label: 'Quiet' });
  } else if (venue.noise_level === 'average') {
    attributes.push({ variant: 'quiet', label: 'Moderate' });
  }

  if (venue.ambiance?.includes('intimate') || venue.ambiance?.includes('romantic')) {
    attributes.push({ variant: 'dim', label: 'Intimate' });
  }

  if (venue.ambiance?.includes('cozy')) {
    attributes.push({ variant: 'cozy', label: 'Cozy' });
  }

  if (venue.price === '$$$' || venue.price === '$$$$') {
    attributes.push({ variant: 'spacious', label: 'Upscale' });
  }

  return attributes;
}
