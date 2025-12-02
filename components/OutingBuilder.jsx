'use client';

import { useState } from 'react';
import { Plus, X, Clock, MapPin, Star, GripVertical, Trash2, Coffee, Utensils, Wine, ShoppingBag, Sparkles } from 'lucide-react';
import { calculateOutingComfort, formatDuration, calculateTotalDuration, getSuggestedStopTypes } from '@/lib/outings';

const STOP_ICONS = {
  coffee: Coffee,
  lunch: Utensils,
  dinner: Utensils,
  drinks: Wine,
  shopping: ShoppingBag,
  activity: Sparkles,
  default: MapPin
};

export default function OutingBuilder({ stops = [], onStopsChange, savedVenues = [] }) {
  const [showAddStop, setShowAddStop] = useState(false);

  const totalComfort = calculateOutingComfort(stops);
  const totalDuration = calculateTotalDuration(stops);
  const suggestedTypes = getSuggestedStopTypes(stops);

  const handleAddStop = (venue, type = 'activity') => {
    const newStop = {
      id: `stop-${Date.now()}`,
      venue,
      venueId: venue.id,
      type,
      time: getNextStopTime(stops),
      duration: 60,
      comfort_score: venue.comfort_score || 60
    };

    onStopsChange([...stops, newStop]);
    setShowAddStop(false);
  };

  const handleRemoveStop = (stopId) => {
    onStopsChange(stops.filter(s => s.id !== stopId));
  };

  const handleUpdateStop = (stopId, updates) => {
    onStopsChange(stops.map(s =>
      s.id === stopId ? { ...s, ...updates } : s
    ));
  };

  const handleMoveStop = (fromIndex, toIndex) => {
    const newStops = [...stops];
    const [moved] = newStops.splice(fromIndex, 1);
    newStops.splice(toIndex, 0, moved);
    onStopsChange(newStops);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Summary Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        backgroundColor: '#f6f7f5',
        borderRadius: '16px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <p style={{ fontSize: '14px', color: '#6b6b6b', margin: 0 }}>
            {stops.length} stop{stops.length !== 1 ? 's' : ''} planned
          </p>
          <p style={{ fontSize: '12px', color: '#9a9a9a', margin: '4px 0 0 0' }}>
            Total: {formatDuration(totalDuration)}
          </p>
        </div>

        {/* Comfort Score */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          backgroundColor: getScoreColor(totalComfort),
          borderRadius: '9999px'
        }}>
          <span style={{ color: 'white', fontSize: '18px', fontWeight: '700' }}>
            {totalComfort || '—'}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '12px' }}>
            avg comfort
          </span>
        </div>
      </div>

      {/* Stops List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {stops.map((stop, index) => (
          <StopCard
            key={stop.id}
            stop={stop}
            index={index}
            totalStops={stops.length}
            onUpdate={(updates) => handleUpdateStop(stop.id, updates)}
            onRemove={() => handleRemoveStop(stop.id)}
            onMoveUp={() => index > 0 && handleMoveStop(index, index - 1)}
            onMoveDown={() => index < stops.length - 1 && handleMoveStop(index, index + 1)}
          />
        ))}
      </div>

      {/* Add Stop Section */}
      {!showAddStop ? (
        <button
          onClick={() => setShowAddStop(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '16px',
            borderRadius: '16px',
            border: '2px dashed #e8e4dc',
            backgroundColor: 'transparent',
            color: '#6b6b6b',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: '500'
          }}
        >
          <Plus size={20} />
          Add a Stop
        </button>
      ) : (
        <AddStopPanel
          savedVenues={savedVenues}
          suggestedTypes={suggestedTypes}
          onAddStop={handleAddStop}
          onClose={() => setShowAddStop(false)}
        />
      )}

      {/* Tips */}
      {stops.length === 0 && (
        <div style={{
          padding: '20px',
          backgroundColor: 'rgba(150, 168, 127, 0.1)',
          borderRadius: '16px',
          textAlign: 'center'
        }}>
          <Sparkles size={24} style={{ color: '#96a87f', marginBottom: '12px' }} />
          <p style={{ fontSize: '15px', color: '#3d3d3d', fontWeight: '500', margin: '0 0 8px 0' }}>
            Plan Your Perfect Outing
          </p>
          <p style={{ fontSize: '14px', color: '#6b6b6b', margin: 0 }}>
            Add stops from your saved venues to create a comfortable day out.
            Each stop shows its comfort score so you can plan accordingly.
          </p>
        </div>
      )}
    </div>
  );
}

function StopCard({ stop, index, totalStops, onUpdate, onRemove, onMoveUp, onMoveDown }) {
  const venue = stop.venue;
  const Icon = STOP_ICONS[stop.type] || STOP_ICONS.default;

  return (
    <div style={{
      display: 'flex',
      gap: '12px',
      padding: '16px',
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      border: '1px solid #f3f1ed',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
    }}>
      {/* Reorder Handle */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        padding: '4px'
      }}>
        <button
          onClick={onMoveUp}
          disabled={index === 0}
          style={{
            padding: '4px',
            border: 'none',
            background: 'none',
            cursor: index === 0 ? 'default' : 'pointer',
            opacity: index === 0 ? 0.3 : 1,
            color: '#9a9a9a'
          }}
        >
          ▲
        </button>
        <GripVertical size={16} style={{ color: '#d1d1d1' }} />
        <button
          onClick={onMoveDown}
          disabled={index === totalStops - 1}
          style={{
            padding: '4px',
            border: 'none',
            background: 'none',
            cursor: index === totalStops - 1 ? 'default' : 'pointer',
            opacity: index === totalStops - 1 ? 0.3 : 1,
            color: '#9a9a9a'
          }}
        >
          ▼
        </button>
      </div>

      {/* Step Number & Icon */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px'
      }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          backgroundColor: '#96a87f',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '14px',
          fontWeight: '600'
        }}>
          {index + 1}
        </div>
        <Icon size={18} style={{ color: '#6b6b6b' }} />
      </div>

      {/* Venue Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#3d3d3d', margin: 0 }}>
              {venue?.name || 'Unknown Venue'}
            </h3>
            <p style={{ fontSize: '13px', color: '#6b6b6b', margin: '2px 0 0 0' }}>
              {venue?.categories?.map(c => c.title).join(', ') || stop.type}
            </p>
          </div>

          {/* Comfort Badge */}
          <div style={{
            padding: '4px 10px',
            borderRadius: '9999px',
            backgroundColor: getScoreColor(stop.comfort_score),
            fontSize: '13px',
            fontWeight: '600',
            color: 'white'
          }}>
            {stop.comfort_score}
          </div>
        </div>

        {/* Time & Duration */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginTop: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={14} style={{ color: '#9a9a9a' }} />
            <input
              type="time"
              value={stop.time || '12:00'}
              onChange={(e) => onUpdate({ time: e.target.value })}
              style={{
                padding: '4px 8px',
                fontSize: '13px',
                border: '1px solid #e8e4dc',
                borderRadius: '8px',
                color: '#3d3d3d'
              }}
            />
          </div>

          <select
            value={stop.duration || 60}
            onChange={(e) => onUpdate({ duration: parseInt(e.target.value) })}
            style={{
              padding: '4px 8px',
              fontSize: '13px',
              border: '1px solid #e8e4dc',
              borderRadius: '8px',
              color: '#3d3d3d',
              backgroundColor: 'white'
            }}
          >
            <option value={30}>30 min</option>
            <option value={45}>45 min</option>
            <option value={60}>1 hour</option>
            <option value={90}>1.5 hours</option>
            <option value={120}>2 hours</option>
            <option value={180}>3 hours</option>
          </select>

          {/* Delete */}
          <button
            onClick={onRemove}
            style={{
              marginLeft: 'auto',
              padding: '6px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: '#c95a4a'
            }}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function AddStopPanel({ savedVenues, suggestedTypes, onAddStop, onClose }) {
  const [selectedType, setSelectedType] = useState(suggestedTypes[0] || 'activity');

  return (
    <div style={{
      padding: '20px',
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      border: '1px solid #f3f1ed'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#3d3d3d', margin: 0 }}>
          Add a Stop
        </h3>
        <button
          onClick={onClose}
          style={{
            padding: '6px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            color: '#6b6b6b'
          }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Stop Type Selection */}
      <div style={{ marginBottom: '16px' }}>
        <p style={{ fontSize: '13px', color: '#6b6b6b', marginBottom: '8px' }}>
          What type of stop?
        </p>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['coffee', 'lunch', 'dinner', 'drinks', 'shopping', 'activity'].map(type => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              style={{
                padding: '8px 14px',
                fontSize: '13px',
                fontWeight: '500',
                borderRadius: '9999px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: selectedType === type ? '#96a87f' : '#f3f1ed',
                color: selectedType === type ? 'white' : '#3d3d3d',
                textTransform: 'capitalize'
              }}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Venue Selection */}
      <div>
        <p style={{ fontSize: '13px', color: '#6b6b6b', marginBottom: '8px' }}>
          Select a venue:
        </p>

        {savedVenues.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
            {savedVenues.map(venue => (
              <button
                key={venue.id}
                onClick={() => onAddStop(venue, selectedType)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  borderRadius: '12px',
                  border: '1px solid #e8e4dc',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                {venue.image_url && (
                  <img
                    src={venue.image_url}
                    alt=""
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '8px',
                      objectFit: 'cover'
                    }}
                  />
                )}
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '14px', fontWeight: '500', color: '#3d3d3d', margin: 0 }}>
                    {venue.name}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                    {venue.rating && (
                      <span style={{ fontSize: '12px', color: '#6b6b6b', display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <Star size={10} style={{ fill: '#fbbf24', color: '#fbbf24' }} />
                        {venue.rating}
                      </span>
                    )}
                    <span style={{
                      fontSize: '11px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: getScoreColor(venue.comfort_score),
                      color: 'white'
                    }}>
                      {venue.comfort_score}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div style={{
            padding: '24px',
            textAlign: 'center',
            backgroundColor: '#f6f7f5',
            borderRadius: '12px'
          }}>
            <p style={{ fontSize: '14px', color: '#6b6b6b', margin: 0 }}>
              No saved venues yet. Search for venues first, then add them to your outing.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function getNextStopTime(stops) {
  if (stops.length === 0) return '10:00';

  const lastStop = stops[stops.length - 1];
  const [hours, mins] = (lastStop.time || '10:00').split(':').map(Number);
  const duration = lastStop.duration || 60;

  const totalMins = hours * 60 + mins + duration;
  const newHours = Math.floor(totalMins / 60) % 24;
  const newMins = totalMins % 60;

  return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
}

function getScoreColor(score) {
  if (!score) return '#9a9a9a';
  if (score >= 80) return '#5a7a52';
  if (score >= 65) return '#7a9a52';
  if (score >= 50) return '#9a9a52';
  return '#9a7a52';
}
