'use client';

/**
 * ComfortMeter - A soft, organic visual showing venue comfort level
 * Uses a circular fill rather than a harsh progress bar
 */
export default function ComfortMeter({ score, size = 'medium' }) {
  // Score is 0-100
  const normalizedScore = Math.max(0, Math.min(100, score));

  const sizes = {
    small: { container: 48, stroke: 4, fontSize: 12 },
    medium: { container: 72, stroke: 5, fontSize: 16 },
    large: { container: 96, stroke: 6, fontSize: 20 },
  };

  const { container, stroke, fontSize } = sizes[size];
  const radius = (container - stroke * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (normalizedScore / 100) * circumference;

  // Color based on score
  const getColor = () => {
    if (normalizedScore >= 70) return 'var(--color-comfort-high)';
    if (normalizedScore >= 40) return 'var(--color-comfort-medium)';
    return 'var(--color-comfort-low)';
  };

  const getLabel = () => {
    if (normalizedScore >= 70) return 'Calm';
    if (normalizedScore >= 40) return 'Moderate';
    return 'Lively';
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="relative"
        style={{ width: container, height: container }}
        role="meter"
        aria-valuenow={normalizedScore}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Comfort score: ${normalizedScore}%`}
      >
        {/* Background circle */}
        <svg
          width={container}
          height={container}
          className="transform -rotate-90"
        >
          <circle
            cx={container / 2}
            cy={container / 2}
            r={radius}
            fill="none"
            stroke="var(--color-warm-200)"
            strokeWidth={stroke}
          />
          {/* Animated fill circle */}
          <circle
            cx={container / 2}
            cy={container / 2}
            r={radius}
            fill="none"
            stroke={getColor()}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center content */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ fontSize }}
        >
          <span className="font-semibold text-text-primary">
            {normalizedScore}
          </span>
        </div>
      </div>

      {size !== 'small' && (
        <span className="text-sm font-medium text-text-secondary">
          {getLabel()}
        </span>
      )}
    </div>
  );
}

/**
 * ComfortBar - An alternative linear comfort indicator
 */
export function ComfortBar({ score, showLabel = true }) {
  const normalizedScore = Math.max(0, Math.min(100, score));

  const getColor = () => {
    if (normalizedScore >= 70) return 'bg-comfort-high';
    if (normalizedScore >= 40) return 'bg-comfort-medium';
    return 'bg-comfort-low';
  };

  return (
    <div className="w-full">
      <div className="h-2 rounded-full bg-warm-200 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${getColor()}`}
          style={{ width: `${normalizedScore}%` }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between mt-1">
          <span className="text-xs text-text-muted">Lively</span>
          <span className="text-xs text-text-muted">Calm</span>
        </div>
      )}
    </div>
  );
}
