'use client';

import { useState, useEffect } from 'react';
import { Lock, Eye, Search, MapPin, MousePointer, Users, TrendingUp, Clock } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [isDemo, setIsDemo] = useState(false);

  // Check if already authenticated
  useEffect(() => {
    const savedPassword = sessionStorage.getItem('comfrt-admin-password');
    if (savedPassword) {
      setPassword(savedPassword);
      fetchStats(savedPassword);
    }
  }, []);

  const fetchStats = async (pwd) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/analytics', {
        headers: { 'x-admin-password': pwd },
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError('Invalid password');
          sessionStorage.removeItem('comfrt-admin-password');
          setIsAuthenticated(false);
        } else {
          setError('Failed to fetch analytics');
        }
        setLoading(false);
        return;
      }

      const data = await response.json();
      setStats(data.demo ? data.stats : data);
      setIsDemo(data.demo || false);
      setIsAuthenticated(true);
      sessionStorage.setItem('comfrt-admin-password', pwd);
    } catch (err) {
      setError('Failed to connect to server');
    }

    setLoading(false);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    fetchStats(password);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('comfrt-admin-password');
    setIsAuthenticated(false);
    setPassword('');
    setStats(null);
  };

  if (!isAuthenticated) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}>
        <div style={{
          maxWidth: '400px',
          width: '100%',
          backgroundColor: 'white',
          borderRadius: '24px',
          padding: '40px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            margin: '0 auto 24px',
            borderRadius: '50%',
            backgroundColor: '#e8ebe4',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Lock size={28} style={{ color: '#96a87f' }} />
          </div>

          <h1 style={{
            fontSize: '24px',
            fontWeight: '600',
            textAlign: 'center',
            marginBottom: '8px',
            color: '#3d3d3d',
          }}>
            Admin Dashboard
          </h1>

          <p style={{
            fontSize: '14px',
            color: '#6b6b6b',
            textAlign: 'center',
            marginBottom: '32px',
          }}>
            Enter password to view analytics
          </p>

          <form onSubmit={handleLogin}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              style={{
                width: '100%',
                padding: '14px 18px',
                fontSize: '16px',
                border: '2px solid #e8e4dc',
                borderRadius: '12px',
                marginBottom: '16px',
                outline: 'none',
              }}
            />

            {error && (
              <p style={{
                color: '#c95a4a',
                fontSize: '14px',
                marginBottom: '16px',
                textAlign: 'center',
              }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '16px',
                fontWeight: '500',
                backgroundColor: '#96a87f',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: loading ? 'wait' : 'pointer',
                opacity: loading || !password ? 0.6 : 1,
              }}
            >
              {loading ? 'Checking...' : 'Access Dashboard'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px',
      }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '600', color: '#3d3d3d' }}>
            Analytics Dashboard
          </h1>
          <p style={{ fontSize: '14px', color: '#6b6b6b', marginTop: '4px' }}>
            {isDemo ? 'Demo data (Supabase not configured)' : 'Live data'}
          </p>
        </div>

        <button
          onClick={handleLogout}
          style={{
            padding: '10px 20px',
            fontSize: '14px',
            backgroundColor: '#f3f1ed',
            color: '#3d3d3d',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
          }}
        >
          Logout
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#6b6b6b' }}>
          Loading analytics...
        </div>
      ) : stats ? (
        <>
          {/* Today's Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '32px',
          }}>
            <StatCard
              icon={<Eye size={20} />}
              label="Page Views"
              value={stats.today?.page_views || 0}
              color="#96a87f"
            />
            <StatCard
              icon={<Search size={20} />}
              label="Searches"
              value={stats.today?.searches || 0}
              color="#7a9a52"
            />
            <StatCard
              icon={<MousePointer size={20} />}
              label="Venue Clicks"
              value={stats.today?.venue_clicks || 0}
              color="#5a7a52"
            />
            <StatCard
              icon={<MapPin size={20} />}
              label="Map Views"
              value={stats.today?.map_views || 0}
              color="#c9b84a"
            />
            <StatCard
              icon={<Users size={20} />}
              label="Unique Sessions"
              value={stats.today?.unique_sessions || 0}
              color="#527a7a"
            />
          </div>

          {/* Trends Chart */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '20px',
            padding: '24px',
            marginBottom: '24px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: '#3d3d3d' }}>
              <TrendingUp size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              7-Day Trend
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.trends || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8e4dc" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}
                  stroke="#9a9a9a"
                  fontSize={12}
                />
                <YAxis stroke="#9a9a9a" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e8e4dc',
                    borderRadius: '12px',
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="page_views" stroke="#96a87f" strokeWidth={2} name="Page Views" />
                <Line type="monotone" dataKey="searches" stroke="#7a9a52" strokeWidth={2} name="Searches" />
                <Line type="monotone" dataKey="venue_clicks" stroke="#5a7a52" strokeWidth={2} name="Venue Clicks" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Bottom Row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px',
          }}>
            {/* Top Locations */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '20px',
              padding: '24px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: '#3d3d3d' }}>
                <MapPin size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                Top Searched Locations
              </h2>
              {stats.topLocations?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {stats.topLocations.map((loc, idx) => (
                    <div key={idx} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 16px',
                      backgroundColor: '#f6f7f5',
                      borderRadius: '12px',
                    }}>
                      <span style={{ fontWeight: '500', color: '#3d3d3d' }}>{loc.location}</span>
                      <span style={{
                        backgroundColor: '#96a87f',
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '13px',
                        fontWeight: '600',
                      }}>
                        {loc.count}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#9a9a9a', textAlign: 'center', padding: '20px' }}>
                  No search data yet
                </p>
              )}
            </div>

            {/* Hourly Activity */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '20px',
              padding: '24px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: '#3d3d3d' }}>
                <Clock size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                Hourly Activity (Today)
              </h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats.hourlyActivity || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8e4dc" />
                  <XAxis
                    dataKey="hour"
                    tickFormatter={(hour) => `${hour}:00`}
                    stroke="#9a9a9a"
                    fontSize={10}
                    interval={2}
                  />
                  <YAxis stroke="#9a9a9a" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e8e4dc',
                      borderRadius: '12px',
                    }}
                    labelFormatter={(hour) => `${hour}:00`}
                  />
                  <Bar dataKey="count" fill="#96a87f" radius={[4, 4, 0, 0]} name="Events" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      ) : (
        <p style={{ textAlign: 'center', color: '#6b6b6b', padding: '40px' }}>
          No data available
        </p>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '20px',
      padding: '24px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '12px',
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '12px',
          backgroundColor: `${color}20`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: color,
        }}>
          {icon}
        </div>
        <span style={{ fontSize: '14px', color: '#6b6b6b' }}>{label}</span>
      </div>
      <div style={{ fontSize: '32px', fontWeight: '600', color: '#3d3d3d' }}>
        {value.toLocaleString()}
      </div>
    </div>
  );
}
