'use client';

import { MapPin, Star, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import ComfortMeter from './ComfortMeter';
import ComfortChip, { getComfortChips } from './ComfortChip';
import { trackVenueClick } from '@/lib/analytics';

export default function VenueCard({ venue, onClick }) {
  const chips = venue.comfort_attributes || getComfortChips(venue);

  const handleClick = () => {
    trackVenueClick(venue);
    onClick?.(venue);
  };

  return (
    <article
      onClick={handleClick}
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '24px',
        padding: '28px',
        boxShadow: '0 4px 16px rgba(61, 61, 61, 0.06)',
        border: '1px solid #f3f1ed',
        cursor: 'pointer',
        transition: 'all 0.3s ease-out',
      }}
    >
      <div style={{ display: 'flex', gap: '20px' }}>
        {/* Venue Image */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{
            width: '96px',
            height: '96px',
            borderRadius: '16px',
            overflow: 'hidden',
            backgroundColor: '#f3f1ed'
          }}>
            {venue.image_url ? (
              <img
                src={venue.image_url}
                alt={venue.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#a89f8f'
              }}>
                <MapPin size={32} />
              </div>
            )}
          </div>

          {/* Comfort Score overlay */}
          <div style={{
            position: 'absolute',
            bottom: '-8px',
            right: '-8px',
            backgroundColor: '#ffffff',
            borderRadius: '50%',
            padding: '4px',
            boxShadow: '0 4px 16px rgba(61, 61, 61, 0.06)'
          }}>
            <ComfortMeter score={venue.comfort_score || 75} size="small" />
          </div>
        </div>

        {/* Venue Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
            <h3 style={{
              fontWeight: '600',
              fontSize: '18px',
              color: '#3d3d3d',
              margin: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {venue.name}
            </h3>
            {venue.rating && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '14px',
                color: '#6b6b6b',
                flexShrink: 0
              }}>
                <Star size={14} style={{ fill: '#fbbf24', color: '#fbbf24' }} />
                <span>{venue.rating}</span>
              </div>
            )}
          </div>

          <p style={{ fontSize: '14px', color: '#6b6b6b', margin: '4px 0 0 0' }}>
            {venue.categories?.map(c => c.title || c).join(', ') || venue.cuisine}
          </p>

          {venue.location && (
            <p style={{
              fontSize: '14px',
              color: '#9a9a9a',
              margin: '4px 0 0 0',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <MapPin size={12} />
              {venue.location.address1 || venue.location}
            </p>
          )}

          {/* Comfort Chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
            {chips.slice(0, 3).map((chip, idx) => (
              <ComfortChip
                key={idx}
                variant={chip.variant}
                label={chip.label}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Why we recommend */}
      {venue.recommendation_reason && (
        <p style={{
          marginTop: '16px',
          paddingTop: '16px',
          borderTop: '1px solid #f3f1ed',
          fontSize: '14px',
          color: '#6b6b6b',
          fontStyle: 'italic'
        }}>
          &ldquo;{venue.recommendation_reason}&rdquo;
        </p>
      )}

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
        {venue.url && (
          <a
            href={venue.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '500',
              borderRadius: '12px',
              backgroundColor: '#f3f1ed',
              color: '#3d3d3d',
              textDecoration: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <ExternalLink size={14} />
            View on Yelp
          </a>
        )}
        <Link
          href={`/venue/${venue.id}`}
          onClick={(e) => e.stopPropagation()}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: '500',
            borderRadius: '12px',
            backgroundColor: '#96a87f',
            color: '#ffffff',
            textDecoration: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Details
        </Link>
      </div>
    </article>
  );
}

/**
 * Compact venue card for inline display in chat
 */
export function VenueCardCompact({ venue, onClick }) {
  return (
    <button
      onClick={() => onClick?.(venue)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px',
        borderRadius: '12px',
        backgroundColor: '#faf9f7',
        width: '100%',
        textAlign: 'left',
        border: 'none',
        cursor: 'pointer',
      }}
    >
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '8px',
        overflow: 'hidden',
        backgroundColor: '#e8e4dc',
        flexShrink: 0
      }}>
        {venue.image_url ? (
          <img
            src={venue.image_url}
            alt={venue.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#a89f8f'
          }}>
            <MapPin size={20} />
          </div>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontWeight: '500',
          color: '#3d3d3d',
          margin: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>{venue.name}</p>
        <p style={{
          fontSize: '14px',
          color: '#9a9a9a',
          margin: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {venue.categories?.map(c => c.title || c).join(', ')}
        </p>
      </div>
      <ComfortMeter score={venue.comfort_score || 75} size="small" />
    </button>
  );
}
