'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Calendar, Sparkles, Trash2, Plus } from 'lucide-react';
import OutingBuilder from '@/components/OutingBuilder';
import { getOutings, saveOuting, deleteOuting, calculateOutingComfort, formatDuration, calculateTotalDuration } from '@/lib/outings';

export default function PlannerPage() {
  const router = useRouter();
  const [outings, setOutings] = useState([]);
  const [currentOuting, setCurrentOuting] = useState(null);
  const [outingName, setOutingName] = useState('');
  const [outingDate, setOutingDate] = useState(new Date().toISOString().split('T')[0]);
  const [stops, setStops] = useState([]);
  const [savedVenues, setSavedVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load existing outings and saved venues
  useEffect(() => {
    async function loadData() {
      try {
        const loadedOutings = await getOutings();
        setOutings(loadedOutings);

        // Load venues from session storage (from search results)
        const storedVenues = sessionStorage.getItem('comfrt-map-venues');
        if (storedVenues) {
          setSavedVenues(JSON.parse(storedVenues));
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const handleCreateNew = () => {
    setCurrentOuting(null);
    setOutingName('');
    setOutingDate(new Date().toISOString().split('T')[0]);
    setStops([]);
  };

  const handleEditOuting = (outing) => {
    setCurrentOuting(outing);
    setOutingName(outing.name || '');
    setOutingDate(outing.date || new Date().toISOString().split('T')[0]);
    setStops(outing.stops || []);
  };

  const handleSave = async () => {
    if (stops.length === 0) return;

    setSaving(true);
    try {
      const outing = {
        id: currentOuting?.id,
        name: outingName || 'My Outing',
        date: outingDate,
        stops
      };

      const saved = await saveOuting(outing);
      if (saved) {
        // Refresh outings list
        const loadedOutings = await getOutings();
        setOutings(loadedOutings);

        // Clear the form
        handleCreateNew();
      }
    } catch (error) {
      console.error('Error saving outing:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOuting = async (id) => {
    if (!confirm('Delete this outing?')) return;

    try {
      await deleteOuting(id);
      const loadedOutings = await getOutings();
      setOutings(loadedOutings);

      if (currentOuting?.id === id) {
        handleCreateNew();
      }
    } catch (error) {
      console.error('Error deleting outing:', error);
    }
  };

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
            backgroundColor: '#e8ebe4'
          }} />
          <p style={{ marginTop: '16px', color: '#6b6b6b' }}>Loading planner...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, backgroundColor: '#faf9f7', minHeight: '100vh' }}>
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
              fontSize: '16px'
            }}
          >
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>

          <h1 style={{ fontSize: '18px', fontWeight: '600', color: '#3d3d3d', margin: 0 }}>
            Plan My Outing
          </h1>

          <button
            onClick={handleSave}
            disabled={stops.length === 0 || saving}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '12px',
              backgroundColor: stops.length === 0 ? '#e8e4dc' : '#96a87f',
              color: stops.length === 0 ? '#9a9a9a' : 'white',
              border: 'none',
              cursor: stops.length === 0 ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div style={{
        maxWidth: '768px',
        margin: '0 auto',
        padding: '24px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        {/* Outing Details */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          padding: '24px',
          boxShadow: '0 4px 16px rgba(61, 61, 61, 0.06)',
          border: '1px solid #f3f1ed'
        }}>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {/* Name Input */}
            <div style={{ flex: 2, minWidth: '200px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '500',
                color: '#6b6b6b',
                marginBottom: '8px'
              }}>
                Outing Name
              </label>
              <input
                type="text"
                value={outingName}
                onChange={(e) => setOutingName(e.target.value)}
                placeholder="Saturday Downtown Trip"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '16px',
                  border: '2px solid #e8e4dc',
                  borderRadius: '12px',
                  backgroundColor: '#faf9f7',
                  color: '#3d3d3d'
                }}
              />
            </div>

            {/* Date Input */}
            <div style={{ flex: 1, minWidth: '150px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '500',
                color: '#6b6b6b',
                marginBottom: '8px'
              }}>
                Date
              </label>
              <div style={{ position: 'relative' }}>
                <Calendar
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#9a9a9a'
                  }}
                />
                <input
                  type="date"
                  value={outingDate}
                  onChange={(e) => setOutingDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px 12px 36px',
                    fontSize: '16px',
                    border: '2px solid #e8e4dc',
                    borderRadius: '12px',
                    backgroundColor: '#faf9f7',
                    color: '#3d3d3d'
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Outing Builder */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          padding: '24px',
          boxShadow: '0 4px 16px rgba(61, 61, 61, 0.06)',
          border: '1px solid #f3f1ed'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#3d3d3d', marginBottom: '20px' }}>
            Your Stops
          </h2>
          <OutingBuilder
            stops={stops}
            onStopsChange={setStops}
            savedVenues={savedVenues}
          />
        </div>

        {/* Saved Outings */}
        {outings.length > 0 && (
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            padding: '24px',
            boxShadow: '0 4px 16px rgba(61, 61, 61, 0.06)',
            border: '1px solid #f3f1ed'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px'
            }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#3d3d3d', margin: 0 }}>
                Saved Outings
              </h2>
              <button
                onClick={handleCreateNew}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  fontSize: '13px',
                  fontWeight: '500',
                  borderRadius: '10px',
                  backgroundColor: '#f3f1ed',
                  color: '#3d3d3d',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <Plus size={14} />
                New
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {outings.map((outing) => (
                <div
                  key={outing.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '16px',
                    backgroundColor: currentOuting?.id === outing.id ? 'rgba(150, 168, 127, 0.1)' : '#f6f7f5',
                    borderRadius: '12px',
                    border: currentOuting?.id === outing.id ? '2px solid #96a87f' : '2px solid transparent',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleEditOuting(outing)}
                >
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    backgroundColor: getScoreColor(outing.total_comfort),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: '600',
                    fontSize: '14px'
                  }}>
                    {outing.total_comfort || '—'}
                  </div>

                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '15px', fontWeight: '500', color: '#3d3d3d', margin: 0 }}>
                      {outing.name || 'Untitled Outing'}
                    </p>
                    <p style={{ fontSize: '13px', color: '#6b6b6b', margin: '2px 0 0 0' }}>
                      {outing.stops?.length || 0} stops • {outing.date}
                    </p>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteOuting(outing.id);
                    }}
                    style={{
                      padding: '8px',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      color: '#c95a4a'
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Help Text */}
        <div style={{
          padding: '20px',
          backgroundColor: 'rgba(150, 168, 127, 0.1)',
          borderRadius: '16px',
          textAlign: 'center'
        }}>
          <Sparkles size={24} style={{ color: '#96a87f', marginBottom: '12px' }} />
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#3d3d3d', marginBottom: '8px' }}>
            How It Works
          </h3>
          <ol style={{
            fontSize: '14px',
            color: '#6b6b6b',
            textAlign: 'left',
            margin: 0,
            paddingLeft: '20px'
          }}>
            <li style={{ marginBottom: '6px' }}>Search for venues you&apos;d like to visit</li>
            <li style={{ marginBottom: '6px' }}>Come back here and add them as stops</li>
            <li style={{ marginBottom: '6px' }}>Arrange your stops in order and set times</li>
            <li>Save your outing for future reference</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

function getScoreColor(score) {
  if (!score) return '#9a9a9a';
  if (score >= 80) return '#5a7a52';
  if (score >= 65) return '#7a9a52';
  if (score >= 50) return '#9a9a52';
  return '#9a7a52';
}
