/**
 * Outings Management
 *
 * CRUD operations for managing comfort-friendly outings.
 * Uses Supabase if available, falls back to localStorage.
 */

import { supabase, isSupabaseConfigured } from './supabase';

const STORAGE_KEY = 'comfrt-outings';

/**
 * Generate a unique ID
 */
function generateId() {
  return `outing-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get all outings
 */
export async function getOutings() {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('outings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching outings:', error);
      return [];
    }
    return data || [];
  }

  // Fallback to localStorage
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Get a single outing by ID
 */
export async function getOuting(id) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('outings')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching outing:', error);
      return null;
    }
    return data;
  }

  // Fallback to localStorage
  const outings = await getOutings();
  return outings.find(o => o.id === id) || null;
}

/**
 * Save a new outing
 */
export async function saveOuting(outing) {
  const newOuting = {
    id: outing.id || generateId(),
    name: outing.name || 'My Outing',
    date: outing.date || new Date().toISOString().split('T')[0],
    stops: outing.stops || [],
    total_comfort: calculateOutingComfort(outing.stops || []),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('outings')
      .upsert(newOuting)
      .select()
      .single();

    if (error) {
      console.error('Error saving outing:', error);
      return null;
    }
    return data;
  }

  // Fallback to localStorage
  try {
    const outings = await getOutings();
    const existingIndex = outings.findIndex(o => o.id === newOuting.id);

    if (existingIndex >= 0) {
      outings[existingIndex] = newOuting;
    } else {
      outings.unshift(newOuting);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(outings));
    return newOuting;
  } catch (error) {
    console.error('Error saving outing to localStorage:', error);
    return null;
  }
}

/**
 * Delete an outing
 */
export async function deleteOuting(id) {
  if (isSupabaseConfigured()) {
    const { error } = await supabase
      .from('outings')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting outing:', error);
      return false;
    }
    return true;
  }

  // Fallback to localStorage
  try {
    const outings = await getOutings();
    const filtered = outings.filter(o => o.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch {
    return false;
  }
}

/**
 * Calculate the overall comfort score for an outing
 */
export function calculateOutingComfort(stops) {
  if (!stops || stops.length === 0) return 0;

  const scores = stops
    .map(s => s.venue?.comfort_score || s.comfort_score || 0)
    .filter(s => s > 0);

  if (scores.length === 0) return 0;

  return Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length);
}

/**
 * Get suggested stop types based on existing stops
 */
export function getSuggestedStopTypes(existingStops) {
  const types = ['coffee', 'lunch', 'dinner', 'drinks', 'activity', 'shopping'];
  const usedTypes = existingStops.map(s => s.type?.toLowerCase());

  // Suggest types not yet used
  const suggested = types.filter(t => !usedTypes.includes(t));

  // If all types used, suggest common follow-ups
  if (suggested.length === 0) {
    return ['dessert', 'walk', 'second coffee'];
  }

  return suggested.slice(0, 3);
}

/**
 * Format duration for display
 */
export function formatDuration(minutes) {
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
}

/**
 * Calculate total outing duration
 */
export function calculateTotalDuration(stops) {
  return stops.reduce((total, stop) => total + (stop.duration || 60), 0);
}
