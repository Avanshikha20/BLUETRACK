const CACHE_KEY = 'smartship_geocode_cache_v2';
const geocodePromises = new Map();

const INDIA_GATEWAY_CITIES = [
  'delhi',
  'new delhi',
  'mumbai',
  'chennai',
  'kolkata',
  'bengaluru',
  'bangalore',
  'hyderabad',
  'ahmedabad',
  'kochi',
];

const COUNTRY_CAPITALS = {
  ru: 'Moscow',
  us: 'Washington, D.C.',
  gb: 'London',
  ae: 'Abu Dhabi',
  sg: 'Singapore',
  ca: 'Ottawa',
  au: 'Canberra',
  de: 'Berlin',
  fr: 'Paris',
  it: 'Rome',
  es: 'Madrid',
  nl: 'Amsterdam',
  jp: 'Tokyo',
  cn: 'Beijing',
  kr: 'Seoul',
  br: 'Brasilia',
  za: 'Pretoria',
};

export const DEFAULT_ROUTE_HUBS = [
  { id: 'virtual-in-patna', name: 'Patna Regional Hub', location: 'Patna, Bihar, India', isVirtual: true, isActive: true },
  { id: 'virtual-in-delhi', name: 'Delhi International Gateway', location: 'New Delhi, India', isVirtual: true, isActive: true },
  { id: 'virtual-in-mumbai', name: 'Mumbai International Gateway', location: 'Mumbai, Maharashtra, India', isVirtual: true, isActive: true },
  { id: 'virtual-in-kolkata', name: 'Kolkata International Gateway', location: 'Kolkata, West Bengal, India', isVirtual: true, isActive: true },
  { id: 'virtual-in-chennai', name: 'Chennai International Gateway', location: 'Chennai, Tamil Nadu, India', isVirtual: true, isActive: true },
  { id: 'virtual-in-bengaluru', name: 'Bengaluru International Gateway', location: 'Bengaluru, Karnataka, India', isVirtual: true, isActive: true },
  { id: 'virtual-ca-ottawa', name: 'Ottawa Capital Hub', location: 'Ottawa, Ontario, Canada', isVirtual: true, isActive: true },
  { id: 'virtual-ca-toronto', name: 'Toronto Gateway Hub', location: 'Toronto, Ontario, Canada', isVirtual: true, isActive: true },
  { id: 'virtual-ru-moscow', name: 'Moscow Capital Hub', location: 'Moscow, Russia', isVirtual: true, isActive: true },
  { id: 'virtual-ru-spb', name: 'Saint Petersburg Hub', location: 'Saint Petersburg, Russia', isVirtual: true, isActive: true },
  { id: 'virtual-ae-dubai', name: 'Dubai Gateway Hub', location: 'Dubai, United Arab Emirates', isVirtual: true, isActive: true },
  { id: 'virtual-sg-singapore', name: 'Singapore Gateway Hub', location: 'Singapore', isVirtual: true, isActive: true },
  { id: 'virtual-gb-london', name: 'London Capital Hub', location: 'London, United Kingdom', isVirtual: true, isActive: true },
  { id: 'virtual-us-nyc', name: 'New York Gateway Hub', location: 'New York, United States', isVirtual: true, isActive: true },
];

const STATIC_LOCATIONS = {
  patna: { lat: 25.5941, lng: 85.1376, label: 'Patna', country: 'India', countryCode: 'in', state: 'Bihar' },
  bihar: { lat: 25.5941, lng: 85.1376, label: 'Patna', country: 'India', countryCode: 'in', state: 'Bihar' },
  ottawa: { lat: 45.4215, lng: -75.6972, label: 'Ottawa', country: 'Canada', countryCode: 'ca', state: 'Ontario' },
  toronto: { lat: 43.6532, lng: -79.3832, label: 'Toronto', country: 'Canada', countryCode: 'ca', state: 'Ontario' },
  canada: { lat: 45.4215, lng: -75.6972, label: 'Ottawa', country: 'Canada', countryCode: 'ca', state: 'Ontario' },
  mumbai: { lat: 19.0760, lng: 72.8777, label: 'Mumbai', country: 'India', countryCode: 'in', state: 'Maharashtra' },
  delhi: { lat: 28.6139, lng: 77.2090, label: 'New Delhi', country: 'India', countryCode: 'in', state: 'Delhi' },
  'new delhi': { lat: 28.6139, lng: 77.2090, label: 'New Delhi', country: 'India', countryCode: 'in', state: 'Delhi' },
  kolkata: { lat: 22.5726, lng: 88.3639, label: 'Kolkata', country: 'India', countryCode: 'in', state: 'West Bengal' },
  chennai: { lat: 13.0827, lng: 80.2707, label: 'Chennai', country: 'India', countryCode: 'in', state: 'Tamil Nadu' },
  bengaluru: { lat: 12.9716, lng: 77.5946, label: 'Bengaluru', country: 'India', countryCode: 'in', state: 'Karnataka' },
  bangalore: { lat: 12.9716, lng: 77.5946, label: 'Bengaluru', country: 'India', countryCode: 'in', state: 'Karnataka' },
  hyderabad: { lat: 17.3850, lng: 78.4867, label: 'Hyderabad', country: 'India', countryCode: 'in', state: 'Telangana' },
  nagpur: { lat: 21.1458, lng: 79.0882, label: 'Nagpur', country: 'India', countryCode: 'in', state: 'Maharashtra' },
  moscow: { lat: 55.7558, lng: 37.6173, label: 'Moscow', country: 'Russia', countryCode: 'ru', state: 'Moscow' },
  'saint petersburg': { lat: 59.9311, lng: 30.3609, label: 'Saint Petersburg', country: 'Russia', countryCode: 'ru', state: 'Saint Petersburg' },
  'st petersburg': { lat: 59.9311, lng: 30.3609, label: 'Saint Petersburg', country: 'Russia', countryCode: 'ru', state: 'Saint Petersburg' },
  london: { lat: 51.5072, lng: -0.1276, label: 'London', country: 'United Kingdom', countryCode: 'gb', state: 'England' },
  singapore: { lat: 1.3521, lng: 103.8198, label: 'Singapore', country: 'Singapore', countryCode: 'sg', state: '' },
  dubai: { lat: 25.2048, lng: 55.2708, label: 'Dubai', country: 'United Arab Emirates', countryCode: 'ae', state: 'Dubai' },
};

const readCache = () => {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
  } catch {
    return {};
  }
};

const writeCache = (cache) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore storage limits. Routing still works without cache.
  }
};

const normalizedKey = (text) => String(text || '').trim().toLowerCase();

const staticLocationFor = (text) => {
  const normalized = normalizedKey(text);
  const match = Object.entries(STATIC_LOCATIONS)
    .filter(([name]) => normalized.includes(name))
    .sort((a, b) => b[0].length - a[0].length)[0];
  if (!match) return null;

  return {
    ...match[1],
    displayName: match[1].displayName || `${match[1].label}, ${match[1].country}`,
  };
};

const toLocation = (item, fallbackLabel) => {
  const address = item.address || {};
  return {
    lat: Number(item.lat),
    lng: Number(item.lon),
    label: address.city || address.town || address.village || address.state || address.country || fallbackLabel,
    country: address.country || '',
    countryCode: (address.country_code || '').toLowerCase(),
    state: address.state || '',
    displayName: item.display_name || fallbackLabel,
  };
};

const photonToLocation = (feature, fallbackLabel) => {
  const props = feature.properties || {};
  const [lng, lat] = feature.geometry?.coordinates || [];
  const displayParts = [props.name, props.city, props.state, props.country].filter(Boolean);
  return {
    lat: Number(lat),
    lng: Number(lng),
    label: props.city || props.name || props.state || props.country || fallbackLabel,
    country: props.country || '',
    countryCode: (props.countrycode || '').toLowerCase(),
    state: props.state || '',
    displayName: displayParts.join(', ') || fallbackLabel,
  };
};

export const searchAddresses = async (text, limit = 6) => {
  const query = String(text || '').trim();
  if (!query || query.length < 3) return [];

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=${limit}&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'en' }, signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      const mapped = data.map((item) => ({
        id: `nominatim-${item.place_id}`,
        source: 'nominatim',
        displayName: item.display_name,
        location: toLocation(item, query),
      }));
      if (mapped.length) return mapped;
    }
  } catch {
    // Fall back to Photon below.
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const url = `https://photon.komoot.io/api/?limit=${limit}&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.features || []).map((feature, index) => {
      const location = photonToLocation(feature, query);
      return {
        id: `photon-${feature.properties?.osm_id || index}`,
        source: 'photon',
        displayName: location.displayName,
        location,
      };
    });
  } catch {
    return [];
  }
};

export const geocodeAddress = async (text) => {
  const query = String(text || '').trim();
  if (!query) return null;

  const key = normalizedKey(query);
  const staticLocation = staticLocationFor(query);
  if (staticLocation) return staticLocation;

  const cache = readCache();
  if (cache[key]) return cache[key];
  if (geocodePromises.has(key)) return geocodePromises.get(key);

  const promise = (async () => {
    const [first] = await searchAddresses(query, 1);
    if (!first?.location) return null;

    const nextCache = readCache();
    nextCache[key] = first.location;
    writeCache(nextCache);
    return first.location;
  })();

  geocodePromises.set(key, promise);
  const result = await promise;
  geocodePromises.delete(key);
  return result;
};

export const distanceKm = (a, b) => {
  if (!a || !b) return Number.POSITIVE_INFINITY;
  const toRad = (v) => (v * Math.PI) / 180;
  const earthKm = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return earthKm * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
};

export const clampLat = (lat) => Math.max(-85.0511, Math.min(85.0511, lat));

export const lonLatToWorld = (coord, zoom) => {
  const scale = 256 * 2 ** zoom;
  const latRad = (clampLat(coord.lat) * Math.PI) / 180;
  return {
    x: ((coord.lng + 180) / 360) * scale,
    y: ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * scale,
  };
};

export const worldToTile = (point) => ({
  x: Math.floor(point.x / 256),
  y: Math.floor(point.y / 256),
});

export const getMapViewport = (points, width = 900, height = 360) => {
  const valid = points.filter(Boolean);
  if (!valid.length) return null;

  const zoomCandidates = [10, 9, 8, 7, 6, 5, 4, 3, 2];
  const padding = 70;
  const zoom = zoomCandidates.find((candidate) => {
    const world = valid.map((point) => lonLatToWorld(point, candidate));
    const xs = world.map((point) => point.x);
    const ys = world.map((point) => point.y);
    return Math.max(...xs) - Math.min(...xs) <= width - padding * 2 &&
      Math.max(...ys) - Math.min(...ys) <= height - padding * 2;
  }) || 2;

  const worldPoints = valid.map((point) => lonLatToWorld(point, zoom));
  const xs = worldPoints.map((point) => point.x);
  const ys = worldPoints.map((point) => point.y);
  const center = {
    x: (Math.min(...xs) + Math.max(...xs)) / 2,
    y: (Math.min(...ys) + Math.max(...ys)) / 2,
  };

  return {
    zoom,
    width,
    height,
    topLeft: {
      x: center.x - width / 2,
      y: center.y - height / 2,
    },
  };
};

export const pointToViewport = (coord, viewport) => {
  const world = lonLatToWorld(coord, viewport.zoom);
  return {
    x: world.x - viewport.topLeft.x,
    y: world.y - viewport.topLeft.y,
  };
};

export const getVisibleTiles = (viewport) => {
  if (!viewport) return [];

  const start = worldToTile(viewport.topLeft);
  const end = worldToTile({
    x: viewport.topLeft.x + viewport.width,
    y: viewport.topLeft.y + viewport.height,
  });
  const maxTile = 2 ** viewport.zoom;
  const tiles = [];

  for (let x = start.x; x <= end.x; x += 1) {
    for (let y = start.y; y <= end.y; y += 1) {
      if (y < 0 || y >= maxTile) continue;
      const wrappedX = ((x % maxTile) + maxTile) % maxTile;
      tiles.push({
        x,
        y,
        urlX: wrappedX,
        urlY: y,
        left: x * 256 - viewport.topLeft.x,
        top: y * 256 - viewport.topLeft.y,
      });
    }
  }

  return tiles;
};

const projection = (start, end, point) => {
  const dx = end.lng - start.lng;
  const dy = end.lat - start.lat;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return { t: 0, coord: start };

  const t = ((point.lng - start.lng) * dx + (point.lat - start.lat) * dy) / lenSq;
  return {
    t,
    coord: {
      lat: start.lat + t * dy,
      lng: start.lng + t * dx,
    },
  };
};

const isIndia = (coord) => coord?.countryCode === 'in';

const isGatewayHub = (hub) => {
  const text = `${hub.name || ''} ${hub.location || ''}`.toLowerCase();
  return INDIA_GATEWAY_CITIES.some((city) => text.includes(city));
};

const gatewayWeight = (hub) => {
  const text = `${hub.name || ''} ${hub.location || ''}`.toLowerCase();
  if (text.includes('mumbai')) return 0.35;
  if (text.includes('delhi') || text.includes('new delhi')) return 0.4;
  if (text.includes('chennai') || text.includes('kolkata')) return 0.55;
  if (text.includes('bengaluru') || text.includes('bangalore') || text.includes('hyderabad')) return 0.75;
  return 0.9;
};

const enrichHub = async (hub) => {
  const coord = await geocodeAddress(`${hub.location || hub.name}`);
  return { ...hub, coord };
};

export const routeAwareHubs = async (shipment, hubs = []) => {
  const hubMap = new Map();
  [...DEFAULT_ROUTE_HUBS, ...hubs].forEach((hub) => {
    hubMap.set(hub.id || `${hub.name}-${hub.location}`, hub);
  });
  const routeHubs = Array.from(hubMap.values()).filter((hub) => hub.isActive !== false);

  const [start, end, enrichedHubs] = await Promise.all([
    geocodeAddress(shipment?.sender?.address),
    geocodeAddress(shipment?.receiver?.address),
    Promise.all(routeHubs.map(enrichHub)),
  ]);

  if (!start || !end) {
    return enrichedHubs.map((hub) => ({
      ...hub,
      onPath: false,
      routeScore: 999999,
      routeHint: 'Address coordinates unavailable',
      routeRole: 'Unranked',
    }));
  }

  const routeDistance = distanceKm(start, end);
  const domestic = start.countryCode && start.countryCode === end.countryCode;
  const indiaInternational = isIndia(start) !== isIndia(end);
  const corridorKm = Math.max(100, Math.min(450, routeDistance * (domestic ? 0.16 : 0.08)));
  const destinationCapital = !domestic && COUNTRY_CAPITALS[end.countryCode]
    ? await geocodeAddress(`${COUNTRY_CAPITALS[end.countryCode]}, ${end.country}`)
    : null;

  const ranked = enrichedHubs
    .map((hub) => {
      if (!hub.coord) {
        return {
          ...hub,
          onPath: false,
          routeScore: 999999,
          routeHint: 'Hub location could not be geocoded',
          routeRole: 'Unranked',
        };
      }

      const projected = projection(start, end, hub.coord);
      const distanceFromRoute = distanceKm(hub.coord, projected.coord);
      const progress = Math.max(0, Math.min(1, projected.t));
      const nearOrigin = distanceKm(start, hub.coord);
      const nearDestination = distanceKm(end, hub.coord);
      const nearCapital = destinationCapital ? distanceKm(destinationCapital, hub.coord) : Number.POSITIVE_INFINITY;
      const gateway = isGatewayHub(hub);

      let routeRole = 'Route hub';
      let routeScore = distanceFromRoute + progress * 20;
      let onPath = projected.t > -0.1 && projected.t < 1.1 && distanceFromRoute <= corridorKm;
      let routeHint = onPath ? `${Math.round(progress * 100)}% along route` : `${Math.round(distanceFromRoute)} km from direct corridor`;

      if (indiaInternational) {
        if (isIndia(start) && isIndia(hub.coord)) {
          routeRole = gateway ? 'India export gateway' : 'Origin-side India hub';
          routeScore = gateway ? nearOrigin * gatewayWeight(hub) : nearOrigin;
          onPath = true;
          routeHint = `${Math.round(nearOrigin)} km from pickup${gateway ? ', international gateway' : ''}`;
        } else if (isIndia(end) && isIndia(hub.coord)) {
          routeRole = gateway ? 'India import gateway' : 'Destination-side India hub';
          routeScore = gateway ? nearDestination * gatewayWeight(hub) : nearDestination;
          onPath = true;
          routeHint = `${Math.round(nearDestination)} km from delivery${gateway ? ', international gateway' : ''}`;
        } else if (!isIndia(hub.coord)) {
          routeRole = nearCapital < nearDestination ? 'Country capital hub' : 'Destination-side hub';
          routeScore = Math.min(nearCapital * 0.65, nearDestination);
          onPath = true;
          routeHint = nearCapital < nearDestination
            ? `${Math.round(nearCapital)} km from ${COUNTRY_CAPITALS[end.countryCode] || 'capital'}`
            : `${Math.round(nearDestination)} km from delivery city`;
        } else {
          routeScore = 50000 + nearDestination;
        }
      }

      return {
        ...hub,
        onPath,
        progress,
        routeScore,
        routeHint,
        routeRole,
      };
    })
    .sort((a, b) => {
      if (a.onPath && !b.onPath) return -1;
      if (!a.onPath && b.onPath) return 1;
      return a.routeScore - b.routeScore;
    });

  if (ranked.some((hub) => hub.onPath)) {
    return ranked;
  }

  return ranked.map((hub, index) => index < 5 ? {
    ...hub,
    onPath: true,
    routeRole: hub.coord ? 'Nearest available hub' : 'Available hub',
    routeHint: hub.coord ? 'fallback suggestion' : 'location pending',
  } : hub);
};

export const buildRoutePoints = async (shipment, events = []) => {
  const eventCoords = await Promise.all(
    events.map(async (event) => {
      const coord = await geocodeAddress(event.location);
      return coord ? { ...coord, status: event.status, location: event.location } : null;
    })
  );

  const [start, end] = await Promise.all([
    geocodeAddress(shipment?.sender?.address),
    geocodeAddress(shipment?.receiver?.address),
  ]);

  const reached = [start, ...eventCoords.filter(Boolean)].filter(Boolean);
  const full = [start, ...eventCoords.filter(Boolean), end].filter(Boolean);

  return { start, end, reached, full };
};
