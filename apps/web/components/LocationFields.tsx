'use client';
import { useState } from 'react';
export function LocationFields({ initialLatitude, initialLongitude }: { initialLatitude?: number | null; initialLongitude?: number | null }) {
  const [latitude, setLatitude] = useState(initialLatitude?.toString() || '');
  const [longitude, setLongitude] = useState(initialLongitude?.toString() || '');
  const [error, setError] = useState('');
  function locate() {
    setError('');
    if (!navigator.geolocation) { setError('Location is unavailable in this browser. City matching will still work.'); return; }
    navigator.geolocation.getCurrentPosition(position => { setLatitude(position.coords.latitude.toFixed(2)); setLongitude(position.coords.longitude.toFixed(2)); }, () => setError('Location access was declined. City matching will still work.'), { timeout: 10000 });
  }
  return <fieldset><legend>Location (optional)</legend><p className="hint">Share an approximate location to find matches within 50 km. Coordinates are rounded before storage. Without them, matches use your city.</p><div className="field-grid"><label>Latitude<input name="latitude" type="number" step="any" min="-90" max="90" value={latitude} onChange={e => setLatitude(e.target.value)} /></label><label>Longitude<input name="longitude" type="number" step="any" min="-180" max="180" value={longitude} onChange={e => setLongitude(e.target.value)} /></label></div><button className="secondary" type="button" onClick={locate}>Use my current location</button>{error&&<p role="status">{error}</p>}</fieldset>;
}
export function optionalCoordinates(data: FormData) {
  const latitude = String(data.get('latitude') || '').trim();
  const longitude = String(data.get('longitude') || '').trim();
  return { latitude: latitude ? Number(latitude) : null, longitude: longitude ? Number(longitude) : null };
}
