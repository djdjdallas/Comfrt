'use client';

import { useState } from 'react';
import { Clock, Sun, Moon } from 'lucide-react';
import { getHourlyComfort, getBestTimes, getTimeRecommendation, getComfortTimeColor } from '@/lib/time-comfort';

export default function ComfortTimeline({ venue }) {
  const [isWeekend, setIsWeekend] = useState(false);
  const [hoveredHour, setHoveredHour] = useState(null);

  const hourlyData = getHourlyComfort(venue, isWeekend);
  const bestTimes = getBestTimes(venue);
  const recommendation = getTimeRecommendation(venue);

  // Get current hour for highlighting
  const currentHour = new Date().getHours();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header with toggle */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={18} style={{ color: '#96a87f' }} />
          <span style={{ fontSize: '15px', fontWeight: '500', color: '#3d3d3d' }}>
            Predicted Comfort by Time
          </span>
        </div>

        {/* Weekday/Weekend Toggle */}
        <div style={{
          display: 'flex',
          backgroundColor: '#f3f1ed',
          borderRadius: '12px',
          padding: '4px'
        }}>
          <button
            onClick={() => setIsWeekend(false)}
            style={{
              padding: '6px 12px',
              fontSize: '13px',
              fontWeight: '500',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: !isWeekend ? '#ffffff' : 'transparent',
              color: !isWeekend ? '#3d3d3d' : '#6b6b6b',
              boxShadow: !isWeekend ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            Weekday
          </button>
          <button
            onClick={() => setIsWeekend(true)}
            style={{
              padding: '6px 12px',
              fontSize: '13px',
              fontWeight: '500',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: isWeekend ? '#ffffff' : 'transparent',
              color: isWeekend ? '#3d3d3d' : '#6b6b6b',
              boxShadow: isWeekend ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            Weekend
          </button>
        </div>
      </div>

      {/* Timeline visualization */}
      <div style={{ position: 'relative' }}>
        {/* Time labels */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '8px',
          padding: '0 2px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Sun size={12} style={{ color: '#c9b84a' }} />
            <span style={{ fontSize: '11px', color: '#9a9a9a' }}>6am</span>
          </div>
          <span style={{ fontSize: '11px', color: '#9a9a9a' }}>12pm</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Moon size={12} style={{ color: '#6b6b9a' }} />
            <span style={{ fontSize: '11px', color: '#9a9a9a' }}>11pm</span>
          </div>
        </div>

        {/* Bars */}
        <div style={{
          display: 'flex',
          gap: '3px',
          height: '48px',
          alignItems: 'flex-end'
        }}>
          {hourlyData.map((data, idx) => {
            const isCurrentHour = data.hour === currentHour;
            const isHovered = hoveredHour === data.hour;
            const height = Math.max(20, (data.score / 100) * 48);

            return (
              <div
                key={data.hour}
                style={{
                  flex: 1,
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}
                onMouseEnter={() => setHoveredHour(data.hour)}
                onMouseLeave={() => setHoveredHour(null)}
              >
                {/* Bar */}
                <div
                  style={{
                    width: '100%',
                    height: `${height}px`,
                    backgroundColor: getComfortTimeColor(data.level),
                    borderRadius: '4px 4px 2px 2px',
                    opacity: isCurrentHour ? 1 : isHovered ? 0.9 : 0.7,
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                    border: isCurrentHour ? '2px solid #3d3d3d' : 'none',
                    boxSizing: 'border-box'
                  }}
                />

                {/* Tooltip on hover */}
                {isHovered && (
                  <div style={{
                    position: 'absolute',
                    bottom: '56px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: '#3d3d3d',
                    color: 'white',
                    padding: '6px 10px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    whiteSpace: 'nowrap',
                    zIndex: 10,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }}>
                    <div style={{ fontWeight: '600' }}>{data.label}</div>
                    <div style={{ opacity: 0.9, textTransform: 'capitalize' }}>
                      {data.level} ({data.score})
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Current time indicator */}
        {currentHour >= 6 && currentHour <= 23 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            marginTop: '8px'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#3d3d3d'
            }} />
            <span style={{ fontSize: '11px', color: '#3d3d3d', fontWeight: '500' }}>
              Now
            </span>
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex',
        gap: '16px',
        flexWrap: 'wrap'
      }}>
        {[
          { level: 'quiet', label: 'Quiet' },
          { level: 'moderate', label: 'Moderate' },
          { level: 'busy', label: 'Busy' }
        ].map(item => (
          <div key={item.level} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '3px',
              backgroundColor: getComfortTimeColor(item.level)
            }} />
            <span style={{ fontSize: '12px', color: '#6b6b6b' }}>{item.label}</span>
          </div>
        ))}
      </div>

      {/* Best times recommendation */}
      {bestTimes.length > 0 && (
        <div style={{
          padding: '14px 16px',
          backgroundColor: 'rgba(90, 122, 82, 0.08)',
          borderRadius: '12px',
          border: '1px solid rgba(90, 122, 82, 0.15)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px'
          }}>
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '6px',
              backgroundColor: '#5a7a52',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Clock size={14} style={{ color: 'white' }} />
            </div>
            <div>
              <p style={{ fontSize: '13px', fontWeight: '600', color: '#5a7a52', margin: 0 }}>
                Best Time to Visit
              </p>
              <p style={{ fontSize: '14px', color: '#3d3d3d', margin: '4px 0 0 0' }}>
                {recommendation}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <p style={{
        fontSize: '11px',
        color: '#9a9a9a',
        margin: 0
      }}>
        Predictions based on typical patterns for this venue type. Actual conditions may vary.
      </p>
    </div>
  );
}
