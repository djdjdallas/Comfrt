'use client';

import { Volume2, Sun, Users, Coffee, Music, Wifi } from 'lucide-react';

const chipStyles = {
  quiet: { backgroundColor: '#e8f0e5', color: '#5a7a52' },
  dim: { backgroundColor: '#f0ece5', color: '#7a6b52' },
  spacious: { backgroundColor: '#e5ecf0', color: '#527a7a' },
  cozy: { backgroundColor: '#f0e8e5', color: '#7a5a52' },
  'no-music': { backgroundColor: '#e5e8f0', color: '#52527a' },
  wifi: { backgroundColor: '#e5f0ec', color: '#527a6b' },
  default: { backgroundColor: '#f3f1ed', color: '#6b6b6b' },
};

const chipIcons = {
  quiet: Volume2,
  dim: Sun,
  spacious: Users,
  cozy: Coffee,
  'no-music': Music,
  wifi: Wifi,
};

export default function ComfortChip({ variant = 'default', label, icon: CustomIcon }) {
  const style = chipStyles[variant] || chipStyles.default;
  const Icon = CustomIcon || chipIcons[variant];

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '8px 14px',
      fontSize: '14px',
      fontWeight: '500',
      borderRadius: '9999px',
      ...style
    }}>
      {Icon && <Icon size={14} strokeWidth={2.5} />}
      {label}
    </span>
  );
}

/**
 * Maps Yelp attributes to comfort chips
 */
export function getComfortChips(venue) {
  const chips = [];

  if (venue.noise_level === 'quiet' || venue.noise_level === 'average') {
    chips.push({ variant: 'quiet', label: venue.noise_level === 'quiet' ? 'Quiet' : 'Moderate' });
  }

  if (venue.ambiance?.includes('intimate') || venue.ambiance?.includes('romantic')) {
    chips.push({ variant: 'dim', label: 'Dim Lighting' });
  }

  if (venue.ambiance?.includes('casual') || venue.ambiance?.includes('cozy')) {
    chips.push({ variant: 'cozy', label: 'Cozy' });
  }

  if (!venue.music || venue.music === 'no') {
    chips.push({ variant: 'no-music', label: 'No Music' });
  }

  if (venue.wifi && venue.wifi !== 'no') {
    chips.push({ variant: 'wifi', label: 'WiFi' });
  }

  if (venue.reservations || venue.is_spacious) {
    chips.push({ variant: 'spacious', label: 'Spacious' });
  }

  return chips;
}
