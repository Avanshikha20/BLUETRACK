import React, { useCallback, useEffect, useRef, useState } from 'react';
import { searchAddresses } from '../utils/routeGeo';

/**
 * AddressAutocomplete — powered by OpenStreetMap Nominatim (free, no API key needed).
 * Calls the public Nominatim search endpoint and renders a dropdown of suggestions.
 */
const AddressAutocomplete = ({ value, onChange, placeholder }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchSuggestions = useCallback((query) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await searchAddresses(query, 6);
        setSuggestions(data);
        setOpen(data.length > 0);
      } catch {
        setSuggestions([]);
        setOpen(false);
      }
    }, 350);
  }, []);

  const handleInput = (e) => {
    const val = e.target.value;
    onChange(val, null);
    fetchSuggestions(val);
  };

  const handleSelect = (item) => {
    const address = item.displayName;
    const location = item.location;
    onChange(address, location);
    setSuggestions([]);
    setOpen(false);
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <input
        className="input"
        value={value}
        onChange={handleInput}
        placeholder={placeholder}
        autoComplete="off"
        onFocus={() => suggestions.length > 0 && setOpen(true)}
      />
      {open && suggestions.length > 0 && (
        <ul className="osm-dropdown">
          {suggestions.map((item) => (
            <li
              key={item.id}
              className="osm-dropdown-item"
              onMouseDown={() => handleSelect(item)}
            >
              <span className="osm-icon">📍</span>
              <span className="osm-label">{item.displayName}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AddressAutocomplete;
