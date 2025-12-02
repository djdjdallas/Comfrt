'use client';

export default function BackgroundBlobs() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
      {/* Large sage blob - top right */}
      <div
        className="blob blob-sage animate-breathe"
        style={{
          width: '500px',
          height: '500px',
          top: '-100px',
          right: '-100px',
        }}
      />

      {/* Medium warm blob - bottom left */}
      <div
        className="blob blob-warm animate-float"
        style={{
          width: '400px',
          height: '400px',
          bottom: '-50px',
          left: '-100px',
          animationDelay: '2s',
        }}
      />

      {/* Small sage blob - center left */}
      <div
        className="blob blob-sage animate-breathe"
        style={{
          width: '250px',
          height: '250px',
          top: '40%',
          left: '5%',
          animationDelay: '1s',
        }}
      />

      {/* Tiny warm blob - top center */}
      <div
        className="blob blob-warm animate-float"
        style={{
          width: '180px',
          height: '180px',
          top: '20%',
          right: '30%',
          animationDelay: '3s',
        }}
      />
    </div>
  );
}
