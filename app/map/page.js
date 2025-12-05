'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Filter, MapPin, List } from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamic import for map component (requires browser APIs)
const ComfortMap = dynamic(() => import('@/components/ComfortMap'), {
  ssr: false,
  loading: () => (
    <div style={{
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f6f7f5'
    }}>
      <p style={{ color: '#6b6b6b' }}>Loading map...</p>
    </div>
  )
});

function MapPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [minScore, setMinScore] = useState(0);

  // Get venues from URL params or fetch from session storage
  useEffect(() => {
    const venueData = searchParams.get('venues');
    if (venueData) {
      try {
        const parsed = JSON.parse(decodeURIComponent(venueData));
        setVenues(parsed);
      } catch {
        // Fall back to session storage
        loadFromStorage();
      }
    } else {
      loadFromStorage();
    }
    setLoading(false);
  }, [searchParams]);

  const loadFromStorage = () => {
    try {
      const stored = sessionStorage.getItem('comfrt-map-venues');
      if (stored) {
        setVenues(JSON.parse(stored));
      }
    } catch {
      // Ignore errors
    }
  };

  const handleVenueClick = (venue) => {
    router.push(`/venue/${venue.id}`);
  };

  const filteredVenues = venues.filter(v => (v.comfort_score || 0) >= minScore);

  // Calculate center from venues
  const center = venues.length > 0 && venues[0].coordinates
    ? venues[0].coordinates
    : { latitude: 40.748817, longitude: -73.985428 };

  if (loading) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#faf9f7'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '64px',
            height: '64px',
            margin: '0 auto',
            borderRadius: '50%',
            backgroundColor: '#e8ebe4',
            animation: 'pulse 2s infinite'
          }} />
          <p style={{ marginTop: '16px', color: '#6b6b6b' }}>Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 130px)',
      backgroundColor: '#faf9f7'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        backgroundColor: 'rgba(253, 252, 250, 0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #f3f1ed',
        zIndex: 10
      }}>
        <button
          onClick={() => router.back()}
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
            fontSize: '16px',
          }}
        >
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>

        <h1 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: '#3d3d3d',
          margin: 0
        }}>
          Comfort Map
        </h1>

        <button
          onClick={() => setShowFilters(!showFilters)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 12px',
            borderRadius: '12px',
            backgroundColor: showFilters ? '#96a87f' : '#f3f1ed',
            color: showFilters ? 'white' : '#3d3d3d',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          <Filter size={16} />
          Filter
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div style={{
          padding: '16px',
          backgroundColor: 'white',
          borderBottom: '1px solid #f3f1ed'
        }}>
          <div style={{ maxWidth: '400px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#3d3d3d',
              marginBottom: '8px'
            }}>
              Minimum Comfort Score: {minScore}
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={minScore}
              onChange={(e) => setMinScore(parseInt(e.target.value))}
              style={{
                width: '100%',
                accentColor: '#96a87f'
              }}
            />
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '12px',
              color: '#9a9a9a',
              marginTop: '4px'
            }}>
              <span>All venues</span>
              <span>Very calm only</span>
            </div>
          </div>
          <p style={{
            fontSize: '13px',
            color: '#6b6b6b',
            marginTop: '12px'
          }}>
            Showing {filteredVenues.length} of {venues.length} venues
          </p>
        </div>
      )}

      {/* Map */}
      <div style={{ flex: 1, position: 'relative' }}>
        {venues.length === 0 ? (
          <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '32px',
            textAlign: 'center'
          }}>
            <MapPin size={48} style={{ color: '#9a9a9a', marginBottom: '16px' }} />
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#3d3d3d', marginBottom: '8px' }}>
              No venues to display
            </h2>
            <p style={{ color: '#6b6b6b', marginBottom: '24px' }}>
              Search for venues first, then view them on the map.
            </p>
            <button
              onClick={() => router.push('/')}
              style={{
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: '500',
                borderRadius: '16px',
                backgroundColor: '#96a87f',
                color: 'white',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Find Venues
            </button>
          </div>
        ) : (
          <ComfortMap
            venues={filteredVenues}
            initialCenter={center}
            onVenueClick={handleVenueClick}
          />
        )}
      </div>

      {/* Venue Count Badge */}
      {venues.length > 0 && (
        <div style={{
          position: 'absolute',
          bottom: '24px',
          right: '16px',
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '10px 16px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
          zIndex: 5
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <List size={16} style={{ color: '#96a87f' }} />
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#3d3d3d' }}>
              {filteredVenues.length} venue{filteredVenues.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MapPage() {
  return (
    <Suspense fallback={
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#faf9f7'
      }}>
        <p style={{ color: '#6b6b6b' }}>Loading map...</p>
      </div>
    }>
      <MapPageContent />
    </Suspense>
  );
}
