'use client';

import { useState, useRef, useCallback } from 'react';

export default function SoftSlider({
  value = 3,
  onChange,
  min = 1,
  max = 5,
  label,
  leftLabel = 'Low',
  rightLabel = 'High',
  id,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef(null);

  const percentage = ((value - min) / (max - min)) * 100;

  const updateValue = useCallback((clientX) => {
    if (!trackRef.current) return;

    const rect = trackRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const newPercentage = x / rect.width;
    const newValue = Math.round(min + newPercentage * (max - min));

    if (newValue !== value) {
      onChange?.(newValue);
    }
  }, [min, max, value, onChange]);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    updateValue(e.clientX);

    const handleMouseMove = (e) => updateValue(e.clientX);
    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleTouchStart = (e) => {
    setIsDragging(true);
    updateValue(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => {
    if (isDragging) {
      updateValue(e.touches[0].clientX);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleKeyDown = (e) => {
    let newValue = value;

    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      newValue = Math.min(max, value + 1);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      newValue = Math.max(min, value - 1);
    } else if (e.key === 'Home') {
      newValue = min;
    } else if (e.key === 'End') {
      newValue = max;
    }

    if (newValue !== value) {
      onChange?.(newValue);
    }
  };

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id}
          className="block text-base font-medium text-text-primary mb-3"
        >
          {label}
        </label>
      )}

      <div
        ref={trackRef}
        className="relative h-3 cursor-pointer touch-target"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Track background */}
        <div className="absolute top-1/2 -translate-y-1/2 w-full h-2 rounded-full bg-warm-200" />

        {/* Filled portion */}
        <div
          className="absolute top-1/2 -translate-y-1/2 h-2 rounded-full bg-gradient-to-r from-sage-300 to-sage-400 transition-all duration-150"
          style={{ width: `${percentage}%` }}
        />

        {/* Step indicators */}
        <div className="absolute top-1/2 -translate-y-1/2 w-full flex justify-between px-1">
          {Array.from({ length: max - min + 1 }).map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                i + min <= value ? 'bg-sage-500' : 'bg-warm-300'
              }`}
            />
          ))}
        </div>

        {/* Thumb */}
        <div
          role="slider"
          id={id}
          tabIndex={0}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-label={label}
          onKeyDown={handleKeyDown}
          className={`slider-thumb absolute top-1/2 -translate-y-1/2 -translate-x-1/2 focus-soft ${
            isDragging ? 'scale-110' : ''
          }`}
          style={{ left: `${percentage}%` }}
        />
      </div>

      {/* Labels */}
      <div className="flex justify-between mt-2">
        <span className="text-sm text-text-muted">{leftLabel}</span>
        <span className="text-sm font-medium text-sage-500">{value} / {max}</span>
        <span className="text-sm text-text-muted">{rightLabel}</span>
      </div>
    </div>
  );
}
