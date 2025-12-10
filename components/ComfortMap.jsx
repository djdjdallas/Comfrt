"use client";

import { useState, useCallback, useRef } from "react";
import Map, { Marker, Popup, NavigationControl } from "react-map-gl/mapbox";
import { MapPin, Star, X } from "lucide-react";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

// Color scale for comfort scores
function getMarkerColor(score) {
  if (score >= 80) return "#5a7a52"; // Dark green - very calm
  if (score >= 65) return "#7a9a52"; // Light green - calm
  if (score >= 50) return "#c9b84a"; // Yellow - moderate
  if (score >= 35) return "#c98a4a"; // Orange - lively
  return "#c95a4a"; // Red - very lively
}

function getMarkerSize(score) {
  if (score >= 80) return 40;
  if (score >= 65) return 36;
  if (score >= 50) return 32;
  return 28;
}

export default function ComfortMap({
  venues = [],
  initialCenter,
  onVenueClick,
}) {
  const mapRef = useRef(null);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [viewState, setViewState] = useState({
    longitude: initialCenter?.longitude || -73.985428,
    latitude: initialCenter?.latitude || 40.748817,
    zoom: 13,
  });

  // Fit bounds to show all venues
  const fitBounds = useCallback(() => {
    if (!venues.length || !mapRef.current) return;

    const lngs = venues.map((v) => v.coordinates?.longitude).filter(Boolean);
    const lats = venues.map((v) => v.coordinates?.latitude).filter(Boolean);

    if (lngs.length && lats.length) {
      const bounds = [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ];

      mapRef.current.fitBounds(bounds, {
        padding: 60,
        maxZoom: 15,
      });
    }
  }, [venues]);

  const handleMarkerClick = (venue, e) => {
    e.originalEvent.stopPropagation();
    setSelectedVenue(venue);
  };

  if (!MAPBOX_TOKEN) {
    return (
      <div
        style={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f6f7f5",
          color: "#6b6b6b",
        }}
      >
        <p>
          Map requires Mapbox API key. Add NEXT_PUBLIC_MAPBOX_TOKEN to
          .env.local
        </p>
      </div>
    );
  }

  return (
    <div style={{ height: "100%", position: "relative" }}>
      <Map
        ref={mapRef}
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        onLoad={fitBounds}
        mapStyle="mapbox://styles/mapbox/light-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: "100%", height: "100%" }}
      >
        <NavigationControl position="top-right" />

        {/* Venue Markers */}
        {venues.map((venue) => {
          if (!venue.coordinates?.latitude || !venue.coordinates?.longitude)
            return null;

          const score = venue.comfort_score || 50;
          const color = getMarkerColor(score);
          const size = getMarkerSize(score);

          return (
            <Marker
              key={venue.id}
              longitude={venue.coordinates.longitude}
              latitude={venue.coordinates.latitude}
              anchor="center"
              onClick={(e) => handleMarkerClick(venue, e)}
            >
              <div
                style={{
                  width: `${size}px`,
                  height: `${size}px`,
                  borderRadius: "50%",
                  backgroundColor: color,
                  border: "3px solid white",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "transform 0.2s ease",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.transform = "scale(1.15)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.transform = "scale(1)")
                }
              >
                <span
                  style={{
                    color: "white",
                    fontSize: size > 32 ? "12px" : "10px",
                    fontWeight: "700",
                  }}
                >
                  {score}
                </span>
              </div>
            </Marker>
          );
        })}

        {/* Popup for selected venue */}
        {selectedVenue && selectedVenue.coordinates && (
          <Popup
            longitude={selectedVenue.coordinates.longitude}
            latitude={selectedVenue.coordinates.latitude}
            anchor="bottom"
            onClose={() => setSelectedVenue(null)}
            closeButton={false}
            offset={25}
          >
            <VenuePopup
              venue={selectedVenue}
              onClose={() => setSelectedVenue(null)}
              onViewDetails={onVenueClick}
            />
          </Popup>
        )}
      </Map>

      {/* Legend */}
      <MapLegend />
    </div>
  );
}

function VenuePopup({ venue, onClose, onViewDetails }) {
  const score = venue.comfort_score || 50;

  return (
    <div
      style={{
        width: "300px",
        padding: "4px",
        fontFamily: "inherit",
        boxSizing: "border-box",
      }}
    >
      {/* Header with close button */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "8px",
        }}
      >
        <h3
          style={{
            fontSize: "16px",
            fontWeight: "600",
            color: "#3d3d3d",
            margin: 0,
            lineHeight: "1.3",
          }}
        >
          {venue.name}
        </h3>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "2px",
            color: "#9a9a9a",
          }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Category */}
      <p style={{ fontSize: "13px", color: "#6b6b6b", margin: "0 0 8px 0" }}>
        {venue.categories?.map((c) => c.title).join(", ")}
      </p>

      {/* Score and Rating Row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "12px",
        }}
      >
        {/* Comfort Score */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "4px 10px",
            backgroundColor: getMarkerColor(score),
            borderRadius: "9999px",
          }}
        >
          <span style={{ color: "white", fontWeight: "600", fontSize: "13px" }}>
            {score}
          </span>
          <span style={{ color: "rgba(255,255,255,0.85)", fontSize: "11px" }}>
            comfort
          </span>
        </div>

        {/* Yelp Rating */}
        {venue.rating && (
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <Star size={14} style={{ fill: "#fbbf24", color: "#fbbf24" }} />
            <span style={{ fontSize: "13px", fontWeight: "500" }}>
              {venue.rating}
            </span>
          </div>
        )}

        {/* Price */}
        {venue.price && (
          <span style={{ fontSize: "13px", color: "#6b6b6b" }}>
            {venue.price}
          </span>
        )}
      </div>

      {/* Address */}
      {venue.location && (
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "6px",
            marginBottom: "12px",
          }}
        >
          <MapPin
            size={14}
            style={{ color: "#96a87f", flexShrink: 0, marginTop: "2px" }}
          />
          <span
            style={{
              fontSize: "12px",
              color: "#6b6b6b",
              wordBreak: "break-word",
            }}
          >
            {venue.location.address1}, {venue.location.city}
          </span>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: "6px", width: "100%" }}>
        <button
          onClick={() => onViewDetails && onViewDetails(venue)}
          style={{
            flex: 1,
            padding: "8px 8px",
            fontSize: "12px",
            fontWeight: "500",
            borderRadius: "8px",
            backgroundColor: "#96a87f",
            color: "white",
            border: "none",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          View Details
        </button>
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${venue.coordinates.latitude},${venue.coordinates.longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            flex: 1,
            padding: "8px 8px",
            fontSize: "12px",
            fontWeight: "500",
            borderRadius: "8px",
            backgroundColor: "#f3f1ed",
            color: "#3d3d3d",
            border: "none",
            cursor: "pointer",
            textDecoration: "none",
            textAlign: "center",
            whiteSpace: "nowrap",
          }}
        >
          Directions
        </a>
      </div>
    </div>
  );
}

function MapLegend() {
  const legendItems = [
    { score: "80+", label: "Very Calm", color: "#5a7a52" },
    { score: "65-79", label: "Calm", color: "#7a9a52" },
    { score: "50-64", label: "Moderate", color: "#c9b84a" },
    { score: "<50", label: "Lively", color: "#c95a4a" },
  ];

  return (
    <div
      style={{
        position: "absolute",
        bottom: "100px",
        left: "16px",
        backgroundColor: "white",
        borderRadius: "16px",
        padding: "14px 18px",
        boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
        zIndex: 1,
      }}
    >
      <p
        style={{
          fontSize: "11px",
          fontWeight: "600",
          color: "#6b6b6b",
          textTransform: "uppercase",
          margin: "0 0 10px 0",
          letterSpacing: "0.05em",
        }}
      >
        Comfort Level
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {legendItems.map((item) => (
          <div
            key={item.score}
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            <div
              style={{
                width: "14px",
                height: "14px",
                borderRadius: "50%",
                backgroundColor: item.color,
              }}
            />
            <span style={{ fontSize: "12px", color: "#3d3d3d" }}>
              {item.score} - {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
