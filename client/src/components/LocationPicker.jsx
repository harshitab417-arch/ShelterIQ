import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../services/api';
import { Search, MapPin, Loader2, X, RefreshCw, Map } from 'lucide-react';

function MapComponent({ center, zoom, onClick, markerPosition }) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className="w-full h-[350px] rounded-xl border border-slate-200"
      style={{ zIndex: 1 }}
    >
      <MapEventHandler onClick={onClick} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {markerPosition && (
        <Marker position={markerPosition}>
          <Popup>
            <div className="text-xs font-medium">
              Selected: {markerPosition[0].toFixed(4)}, {markerPosition[1].toFixed(4)}
            </div>
          </Popup>
        </Marker>
      )}
    </MapContainer>
  );
}

function MapEventHandler({ onClick }) {
  useMapEvents({
    click(e) {
      if (onClick) onClick(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

function debounce(fn, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

export default function LocationPicker({ onLocationSelected, initialLocation = null }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(initialLocation);
  const [mapCenter, setMapCenter] = useState(initialLocation ? [initialLocation.latitude, initialLocation.longitude] : [34.15, 77.58]);
  const [mapZoom, setMapZoom] = useState(initialLocation ? 12 : 5);
  const [loading, setLoading] = useState(false);
  const [fetchingWeather, setFetchingWeather] = useState(false);
  const [weatherData, setWeatherData] = useState(null);
  const [error, setError] = useState('');
  const [showResults, setShowResults] = useState(false);
  const searchInputRef = useRef(null);

  const debouncedSearch = useCallback(
    debounce(async (query) => {
      if (query.length < 2) {
        setSearchResults([]);
        return;
      }
      setLoading(true);
      try {
        const res = await api.get('/climate/geocode', { params: { q: query, limit: 8 } });
        setSearchResults(res.data || []);
      } catch (err) {
        console.error('Geocode search failed:', err);
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    debouncedSearch(searchQuery);
  }, [searchQuery, debouncedSearch]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchInputRef.current && !searchInputRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (value.length >= 2) {
      setShowResults(true);
    }
  };

  const handleResultClick = async (place) => {
    const location = {
      latitude: place.latitude,
      longitude: place.longitude,
      displayName: place.displayName,
      address: place.address
    };
    setSelectedLocation(location);
    setSearchQuery(place.displayName);
    setSearchResults([]);
    setShowResults(false);
    setMapCenter([place.latitude, place.longitude]);
    setMapZoom(12);
  };

  const handleMapClick = async (lat, lng) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/climate/reverse-geocode', { params: { lat, lon: lng } });
      const location = {
        latitude: lat,
        longitude: lng,
        displayName: res.data.displayName,
        address: res.data.address
      };
      setSelectedLocation(location);
      setSearchQuery(res.data.displayName);
      setMapCenter([lat, lng]);
    } catch (err) {
      const location = {
        latitude: lat,
        longitude: lng,
        displayName: `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`,
        address: {}
      };
      setSelectedLocation(location);
      setSearchQuery(`Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`);
      setMapCenter([lat, lng]);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchWeather = async () => {
    if (!selectedLocation) return;
    setFetchingWeather(true);
    setError('');
    try {
      const res = await api.post('/climate/import', {
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        days: 7,
        cityName: selectedLocation.displayName
      });
      setWeatherData(res.data);
      onLocationSelected(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch weather data. Please try again.');
    } finally {
      setFetchingWeather(false);
    }
  };

  const handleClear = () => {
    setSelectedLocation(null);
    setSearchQuery('');
    setSearchResults([]);
    setWeatherData(null);
    setError('');
    setMapCenter([34.15, 77.58]);
    setMapZoom(5);
  };

  const hasSelection = !!selectedLocation;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <Map className="w-5 h-5 text-sky-600" /> Select Location for Climate Data
        </h2>
        {hasSelection && (
          <button
            onClick={handleClear}
            className="ml-auto text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
          >
            <X className="w-3 h-3" /> Clear
          </button>
        )}
      </div>
      <p className="text-xs text-slate-500">
        Search for a place or click on the map to select a location, then fetch live weather data from Open-Meteo.
      </p>

      {/* Search Input */}
      <div className="relative" ref={searchInputRef}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchInputChange}
            onFocus={() => setShowResults(true)}
            placeholder="Search for a city, region, or landmark..."
            className="input-clean !pl-10 !pr-10"
            disabled={loading}
          />
          {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-600 animate-spin" />}
        </div>

        {/* Autocomplete Dropdown */}
        {(showResults && searchResults.length > 0) && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden max-h-60 overflow-y-auto">
            {searchResults.map((place, idx) => (
              <button
                key={place.placeId || idx}
                onClick={() => handleResultClick(place)}
                className="w-full px-4 py-2 text-left hover:bg-sky-50 transition-colors border-b last:border-0"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-sky-600 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800 truncate">{place.displayName}</p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {place.address?.city || place.address?.town || place.address?.village || place.address?.county || ''}
                      {place.address?.state ? `, ${place.address.state}` : ''}
                      {place.address?.country ? `, ${place.address.country}` : ''}
                    </p>
                  </div>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                    {place.class}:{place.type}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      <div className="relative">
        <MapComponent
          center={mapCenter}
          zoom={mapZoom}
          onClick={handleMapClick}
          markerPosition={selectedLocation ? [selectedLocation.latitude, selectedLocation.longitude] : null}
        />
        <div className="absolute bottom-3 left-3 right-3 text-center">
          <p className="text-[11px] text-slate-600 bg-white/90 px-3 py-1.5 rounded-lg inline-block shadow-sm">
            Click on map to select location
          </p>
        </div>
      </div>

      {/* Selected Location Preview */}
      {hasSelection && (
        <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl space-y-2">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-sky-600" />
            <span className="text-sm font-semibold text-slate-800">{selectedLocation.displayName}</span>
          </div>
          <div className="flex gap-4 text-xs text-slate-600">
            <span>Lat: {selectedLocation.latitude.toFixed(4)}</span>
            <span>Lng: {selectedLocation.longitude.toFixed(4)}</span>
          </div>
          <button
            onClick={handleFetchWeather}
            disabled={fetchingWeather}
            className="btn-primary w-full py-2.5 text-sm flex items-center justify-center gap-2"
          >
            {fetchingWeather ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Fetching Weather Data...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Fetch Weather Data (7-day forecast)
              </>
            )}
          </button>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
          <span className="flex-shrink-0">!</span>
          {error}
        </div>
      )}

      {weatherData && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-emerald-800">
            <span className="text-lg">✓</span>
            <span className="font-semibold">Weather data fetched successfully!</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs text-slate-700">
            <div className="bg-white p-2 rounded border border-slate-200">
              <p className="font-semibold text-emerald-700">{weatherData.dataPoints?.length || 0} hours</p>
              <p className="text-slate-500">Data Points</p>
            </div>
            <div className="bg-white p-2 rounded border border-slate-200">
              <p className="font-semibold text-emerald-700">
                {weatherData.dataPoints?.reduce((min, p) => Math.min(min, p.ambientTemperature), Infinity).toFixed(1) || 'N/A'}°C
              </p>
              <p className="text-slate-500">Min Temp</p>
            </div>
            <div className="bg-white p-2 rounded border border-slate-200">
              <p className="font-semibold text-emerald-700">
                {weatherData.dataPoints?.reduce((max, p) => Math.max(max, p.ambientTemperature), -Infinity).toFixed(1) || 'N/A'}°C
              </p>
              <p className="text-slate-500">Max Temp</p>
            </div>
          </div>
          <p className="text-xs text-slate-500">This dataset will be used for the thermal simulation.</p>
        </div>
      )}
    </div>
  );
}