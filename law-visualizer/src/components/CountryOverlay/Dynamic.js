import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';

export function DynamicCountryMap({ countryCode = 'us' }) {
  const [geoJsonData, setGeoJsonData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    async function loadMapData() {
      try {
        // Enforce lowercase to match the npm package directory names
        const code = countryCode.toLowerCase();
        
        // 1. Dynamically target the exact file pathway using template literals
        const mapModule = await import(
          `@highcharts/map-collection/countries/${code}/${code}-all.geo.json`
        );
        
        if (isMounted) {
          // 2. Set the data (the GeoJSON object is stored on the .default property)
          setGeoJsonData(mapModule.default);
          setLoading(false);
        }
      } catch (error) {
        console.error(`Failed to load map path for: ${countryCode}`, error);
        if (isMounted) setLoading(false);
      }
    }

    loadMapData();

    // Cleanup phase to prevent state updates on unmounted components
    return () => { isMounted = false; };
  }, [countryCode]);

  if (loading) return <div>Loading region geometry...</div>;
  if (!geoJsonData) return <div>Map data unavailable.</div>;

  return (
    <div style={{ height: '500px', width: '100%' }}>
      <MapContainer center={[0, 0]} zoom={2} style={{ height: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <GeoJSON 
          key={countryCode} // Force React to swap layers when country changes
          data={geoJsonData} 
          style={{ color: '#2563eb', weight: 1.5, fillOpacity: 0.1 }}
        />
      </MapContainer>
    </div>
  );
}
