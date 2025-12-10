'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Map } from 'lucide-react';
import ChatBubble, { TypingIndicator } from './ChatBubble';
import VenueCard, { VenueCardCompact } from './VenueCard';
import { useRouter } from 'next/navigation';
import { trackSearch } from '@/lib/analytics';
import { getPreferences } from '@/lib/preferences';

const FALLBACK_PROMPTS = [
  "Find a quiet Italian restaurant in San Francisco",
  "I need a calm coffee shop to work from in Brooklyn",
  "Peaceful brunch spot in Los Angeles",
  "Cozy dinner spot for a date in Chicago",
];

const getLocationBasedPrompts = (locationName) => [
  `Find a quiet Italian restaurant in ${locationName}`,
  `I need a calm coffee shop to work from in ${locationName}`,
  `Peaceful brunch spot in ${locationName}`,
  `Cozy dinner spot for a date in ${locationName}`,
];

const STORAGE_KEY = 'comfrt-chat-session';

export default function ChatInterface() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatId, setChatId] = useState(null); // Track Yelp AI conversation ID
  const [userLocation, setUserLocation] = useState(null); // User's geolocation
  const [locationName, setLocationName] = useState(null); // User's city/area name
  const [locationLoading, setLocationLoading] = useState(true); // Track if we're still fetching location
  const [isRestored, setIsRestored] = useState(false); // Track if session was restored
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const router = useRouter();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Restore chat session from sessionStorage on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const { messages: savedMessages, chatId: savedChatId } = JSON.parse(saved);
        if (savedMessages?.length > 0) {
          setMessages(savedMessages);
          setChatId(savedChatId);
        }
      }
    } catch {
      // Ignore storage errors
    }
    setIsRestored(true);
  }, []);

  // Save chat session to sessionStorage whenever messages change
  useEffect(() => {
    if (!isRestored) return; // Don't save until we've restored
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ messages, chatId }));
    } catch {
      // Ignore storage errors
    }
  }, [messages, chatId, isRestored]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Get user's location on mount - prefer saved preferences, fall back to geolocation
  useEffect(() => {
    // First, check if user has a saved location from onboarding
    const preferences = getPreferences();
    if (preferences.location) {
      setLocationName(preferences.location);
      setLocationLoading(false);
      return; // Use saved location, no need for geolocation
    }

    // No saved location - try geolocation as fallback
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ latitude, longitude });

          // Reverse geocode to get location name
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
              { headers: { 'User-Agent': 'comfrt-app' } }
            );
            const data = await response.json();
            // Prefer city, then town, then suburb, then county
            const name = data.address?.city ||
                         data.address?.town ||
                         data.address?.suburb ||
                         data.address?.county ||
                         data.address?.state;
            if (name) {
              setLocationName(name);
            }
          } catch {
            // Reverse geocoding failed - continue without location name
            console.log('Reverse geocoding failed');
          } finally {
            setLocationLoading(false);
          }
        },
        () => {
          // User denied location or error - continue without it
          console.log('Location not available');
          setLocationLoading(false);
        }
      );
    } else {
      // Geolocation not supported
      setLocationLoading(false);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      // Get user preferences from localStorage
      const preferences = JSON.parse(localStorage.getItem('comfrt-preferences') || '{}');

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          preferences,
          chatId, // Pass chat_id for multi-turn Yelp AI conversations
          latitude: userLocation?.latitude,
          longitude: userLocation?.longitude,
        }),
      });

      const data = await response.json();

      if (data.error) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.error,
          isError: true,
        }]);
      } else {
        // Store the chat_id for conversation continuity
        if (data.chatId) {
          setChatId(data.chatId);
        }

        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.message,
          venues: data.venues || [],
        }]);

        // Track successful search
        const locationMatch = userMessage.match(/in\s+([^,.\n]+)/i);
        trackSearch(userMessage, locationMatch?.[1] || 'unknown', data.venues?.length || 0);
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please try again in a moment.",
        isError: true,
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExampleClick = (prompt) => {
    setInput(prompt);
    inputRef.current?.focus();
  };

  const handleNewSearch = () => {
    setMessages([]);
    setChatId(null);
    setInput('');
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
  };

  const handleVenueClick = (venue) => {
    router.push(`/venue/${venue.id}`);
  };

  const handleViewOnMap = (venues) => {
    // Store venues in session storage for the map page
    try {
      sessionStorage.setItem('comfrt-map-venues', JSON.stringify(venues));
    } catch {
      // Ignore storage errors
    }
    router.push('/map');
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Messages Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 16px' }}>
        {messages.length === 0 ? (
          <WelcomeScreen onExampleClick={handleExampleClick} locationName={locationName} locationLoading={locationLoading} />
        ) : (
          <div style={{ maxWidth: '672px', margin: '0 auto' }}>
            {/* New Search Button */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              <button
                onClick={handleNewSearch}
                style={{
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: '500',
                  borderRadius: '20px',
                  backgroundColor: '#f3f1ed',
                  color: '#6b6b6b',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                + New Search
              </button>
            </div>
            {messages.map((msg, idx) => (
              <div key={idx}>
                <ChatBubble message={msg.content} isUser={msg.role === 'user'}>
                  {msg.venues && msg.venues.length > 0 && (
                    <div>
                      <p style={{
                        fontSize: '17px',
                        lineHeight: '1.6',
                        whiteSpace: 'pre-wrap',
                        marginBottom: '16px'
                      }}>
                        {msg.content}
                      </p>
                    </div>
                  )}
                </ChatBubble>

                {/* Full venue cards below the message */}
                {msg.venues && msg.venues.length > 0 && (
                  <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {msg.venues.slice(0, 3).map((venue, vIdx) => (
                      <VenueCard
                        key={vIdx}
                        venue={venue}
                        onClick={handleVenueClick}
                      />
                    ))}
                    {/* View on Map Button */}
                    <button
                      onClick={() => handleViewOnMap(msg.venues)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '14px 24px',
                        fontSize: '16px',
                        fontWeight: '500',
                        borderRadius: '16px',
                        backgroundColor: '#f3f1ed',
                        color: '#3d3d3d',
                        border: 'none',
                        cursor: 'pointer',
                        marginTop: '8px'
                      }}
                    >
                      <Map size={18} />
                      View All on Map
                    </button>
                  </div>
                )}
              </div>
            ))}
            {isLoading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div style={{
        borderTop: '1px solid #f3f1ed',
        backgroundColor: 'rgba(253, 252, 250, 0.8)',
        backdropFilter: 'blur(12px)',
        padding: '16px'
      }}>
        <form onSubmit={handleSubmit} style={{ maxWidth: '672px', margin: '0 auto' }}>
          <div style={{ position: 'relative' }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Tell me what kind of place you're looking for..."
              style={{
                width: '100%',
                padding: '16px 56px 16px 20px',
                fontSize: '18px',
                backgroundColor: '#faf9f7',
                border: '2px solid #e8e4dc',
                borderRadius: '16px',
                resize: 'none',
                minHeight: '56px',
                maxHeight: '120px',
                fontFamily: 'inherit',
                color: '#3d3d3d',
              }}
              rows={1}
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                padding: '8px',
                borderRadius: '12px',
                backgroundColor: '#96a87f',
                color: 'white',
                border: 'none',
                cursor: !input.trim() || isLoading ? 'not-allowed' : 'pointer',
                opacity: !input.trim() || isLoading ? 0.4 : 1,
              }}
              aria-label="Send message"
            >
              <Send size={20} />
            </button>
          </div>
          <p style={{
            fontSize: '12px',
            color: '#9a9a9a',
            textAlign: 'center',
            marginTop: '8px'
          }}>
            Press Enter to send, Shift+Enter for new line
          </p>
        </form>
      </div>
    </div>
  );
}

function WelcomeScreen({ onExampleClick, locationName, locationLoading }) {
  // Use location-based prompts when available, otherwise fall back to defaults
  const prompts = locationName
    ? getLocationBasedPrompts(locationName)
    : FALLBACK_PROMPTS;

  return (
    <div style={{ width: '100%', padding: '48px 24px' }}>
      <div style={{ maxWidth: '576px', margin: '0 auto' }}>
        {/* Soft icon */}
        <div style={{
          width: '80px',
          height: '80px',
          margin: '0 auto 32px',
          borderRadius: '50%',
          backgroundColor: '#e8ebe4',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Sparkles style={{ width: '40px', height: '40px', color: '#96a87f' }} />
        </div>

        <h1 style={{
          fontSize: '28px',
          fontWeight: '600',
          color: '#3d3d3d',
          marginBottom: '16px',
          textAlign: 'center'
        }}>
          Find your calm space
        </h1>

        <p style={{
          fontSize: '18px',
          color: '#6b6b6b',
          marginBottom: '40px',
          lineHeight: '1.6',
          textAlign: 'center'
        }}>
          Tell me what you need, and I&apos;ll find quiet, comfortable places
          that match your sensory preferences.
        </p>

        {/* Example prompts */}
        <div>
          <p style={{
            fontSize: '12px',
            fontWeight: '500',
            color: '#9a9a9a',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '16px',
            textAlign: 'center'
          }}>
            Try something like
          </p>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            opacity: locationLoading ? 0.5 : 1,
            transition: 'opacity 0.3s ease'
          }}>
            {prompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => onExampleClick(prompt)}
                disabled={locationLoading}
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  borderRadius: '16px',
                  backgroundColor: '#f3f1ed',
                  color: '#6b6b6b',
                  textAlign: 'left',
                  border: 'none',
                  cursor: locationLoading ? 'wait' : 'pointer',
                  fontSize: '16px',
                }}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
