'use client';

import { Volume2, Sun, Users, Heart, Wind, ThumbsUp, AlertCircle, Quote } from 'lucide-react';

const categoryIcons = {
  noise: Volume2,
  lighting: Sun,
  space: Users,
  ambiance: Heart,
  sensory: Wind
};

const categoryLabels = {
  noise: 'Noise Level',
  lighting: 'Lighting',
  space: 'Spaciousness',
  ambiance: 'Ambiance',
  sensory: 'Sensory'
};

export default function ReviewInsights({ analysis, quotes = [] }) {
  if (!analysis || analysis.confidence === 0) {
    return (
      <div style={{
        backgroundColor: '#f6f7f5',
        borderRadius: '16px',
        padding: '20px',
        textAlign: 'center',
        color: '#6b6b6b'
      }}>
        <p style={{ margin: 0 }}>No review data available for comfort analysis.</p>
      </div>
    );
  }

  const { sentimentScore, highlights, concerns, breakdown, confidence } = analysis;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Overall Score */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '16px',
        backgroundColor: '#f6f7f5',
        borderRadius: '16px'
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          backgroundColor: getScoreColor(sentimentScore),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '20px',
          fontWeight: '600'
        }}>
          {sentimentScore}
        </div>
        <div>
          <p style={{ fontWeight: '600', fontSize: '16px', color: '#3d3d3d', margin: 0 }}>
            Review Comfort Score
          </p>
          <p style={{ fontSize: '14px', color: '#6b6b6b', margin: '4px 0 0 0' }}>
            Based on analysis of {analysis.reviewCount} reviews
          </p>
          {confidence < 50 && (
            <p style={{ fontSize: '12px', color: '#9a7a52', margin: '4px 0 0 0' }}>
              Limited data - confidence: {confidence}%
            </p>
          )}
        </div>
      </div>

      {/* Category Breakdown */}
      <div>
        <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#3d3d3d', marginBottom: '12px' }}>
          Comfort Breakdown
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {Object.entries(breakdown).map(([category, data]) => {
            const Icon = categoryIcons[category];
            return (
              <div key={category} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Icon size={16} style={{ color: '#96a87f', flexShrink: 0 }} />
                <span style={{ fontSize: '14px', color: '#6b6b6b', width: '100px' }}>
                  {categoryLabels[category]}
                </span>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    flex: 1,
                    height: '8px',
                    backgroundColor: '#e8e4dc',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${data.score}%`,
                      height: '100%',
                      backgroundColor: getScoreColor(data.score),
                      borderRadius: '4px',
                      transition: 'width 0.5s ease'
                    }} />
                  </div>
                  {data.mentions > 0 && (
                    <span style={{ fontSize: '12px', color: '#9a9a9a', width: '60px', textAlign: 'right' }}>
                      {data.mentions} mention{data.mentions !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Highlights & Concerns */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        {/* Highlights */}
        {highlights.length > 0 && (
          <div style={{ flex: 1, minWidth: '200px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
              <ThumbsUp size={14} style={{ color: '#5a7a52' }} />
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#5a7a52' }}>
                What People Love
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {highlights.map((highlight, idx) => (
                <span
                  key={idx}
                  style={{
                    padding: '6px 12px',
                    fontSize: '13px',
                    backgroundColor: 'rgba(90, 122, 82, 0.1)',
                    color: '#5a7a52',
                    borderRadius: '9999px',
                    fontWeight: '500'
                  }}
                >
                  {highlight.text}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Concerns */}
        {concerns.length > 0 && (
          <div style={{ flex: 1, minWidth: '200px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
              <AlertCircle size={14} style={{ color: '#9a7a52' }} />
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#9a7a52' }}>
                Things to Note
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {concerns.map((concern, idx) => (
                <span
                  key={idx}
                  style={{
                    padding: '6px 12px',
                    fontSize: '13px',
                    backgroundColor: 'rgba(154, 122, 82, 0.1)',
                    color: '#9a7a52',
                    borderRadius: '9999px',
                    fontWeight: '500'
                  }}
                >
                  {concern.text}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quotes */}
      {quotes.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
            <Quote size={14} style={{ color: '#96a87f' }} />
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#3d3d3d' }}>
              What Reviewers Say
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {quotes.slice(0, 3).map((quote, idx) => (
              <div
                key={idx}
                style={{
                  padding: '12px 16px',
                  backgroundColor: quote.sentiment === 'positive' ? 'rgba(90, 122, 82, 0.05)' : 'rgba(154, 122, 82, 0.05)',
                  borderLeft: `3px solid ${quote.sentiment === 'positive' ? '#5a7a52' : '#9a7a52'}`,
                  borderRadius: '0 8px 8px 0'
                }}
              >
                <p style={{ fontSize: '14px', color: '#3d3d3d', margin: 0, fontStyle: 'italic' }}>
                  "{quote.text}"
                </p>
                <p style={{ fontSize: '12px', color: '#9a9a9a', margin: '6px 0 0 0' }}>
                  — {quote.user}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function getScoreColor(score) {
  if (score >= 70) return '#5a7a52';
  if (score >= 50) return '#7a9a52';
  if (score >= 35) return '#9a9a52';
  return '#9a7a52';
}
