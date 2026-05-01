import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { buildRoutePoints, getMapViewport, getVisibleTiles, pointToViewport } from '../utils/routeGeo';

const STATUS_META = {
  Draft:          { icon: '📝', color: '#64748b', label: 'Draft' },
  Booked:         { icon: '📋', color: '#94a3b8', label: 'Booked' },
  Packed:         { icon: '📦', color: '#8b5cf6', label: 'Packed' },
  PickedUp:       { icon: '🚐', color: '#6366f1', label: 'Picked Up' },
  AtHub:          { icon: '🏭', color: '#3b82f6', label: 'At Sorting Hub' },
  InTransit:      { icon: '🚚', color: '#06b6d4', label: 'In Transit' },
  OutForDelivery: { icon: '🛵', color: '#f59e0b', label: 'Out for Delivery' },
  Delivered:      { icon: '✅', color: '#22c55e', label: 'Delivered' },
  Delayed:        { icon: '⏰', color: '#f59e0b', label: 'Delayed' },
  Exception:      { icon: '⚠️', color: '#ef4444', label: 'Exception' },
};

const ShipmentRouteMap = ({ shipment, events }) => {
  const [route, setRoute] = useState({ reached: [], full: [] });

  useEffect(() => {
    let cancelled = false;

    const loadRoute = async () => {
      const nextRoute = await buildRoutePoints(shipment, events);
      if (!cancelled) setRoute(nextRoute);
    };

    loadRoute();
    return () => {
      cancelled = true;
    };
  }, [shipment, events]);

  const points = useMemo(() => route.full, [route]);

  if (!shipment || points.length < 2) {
    return null;
  }

  const width = 900;
  const height = 380;
  const viewport = getMapViewport(points, width, height);
  const tiles = getVisibleTiles(viewport);
  const toSvg = (point) => pointToViewport(point, viewport);
  const routeLine = points.map(toSvg).map((point) => `${point.x},${point.y}`).join(' ');
  const reachedLine = route.reached.map(toSvg).map((point) => `${point.x},${point.y}`).join(' ');
  const latestReached = route.reached[route.reached.length - 1];
  const latestPoint = latestReached ? toSvg(latestReached) : null;

  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #c8d7d3',
      borderRadius: 12,
      padding: 0,
      marginBottom: '1.4rem',
      overflow: 'hidden',
      boxShadow: '0 18px 45px rgba(15, 23, 42, 0.12)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', padding: '0.8rem 1rem', flexWrap: 'wrap' }}>
        <h3 style={{ margin: 0, color: '#1f2a28', fontSize: '1rem' }}>Route Progress</h3>
        <span style={{ color: '#0d9488', fontSize: '0.82rem', fontWeight: 700 }}>
          {latestReached?.location || latestReached?.label || 'Shipment booked'}
        </span>
      </div>
      <div style={{ overflowX: 'auto', background: '#dbeafe' }}>
      <div style={{ position: 'relative', height, width, minWidth: width, background: '#dbeafe' }}>
          {tiles.map((tile) => (
            <img
              key={`${viewport.zoom}-${tile.x}-${tile.y}`}
              src={`https://tile.openstreetmap.org/${viewport.zoom}/${tile.urlX}/${tile.urlY}.png`}
              alt=""
              draggable="false"
              style={{
                position: 'absolute',
                left: tile.left,
                top: tile.top,
                width: 256,
                height: 256,
                userSelect: 'none',
              }}
            />
          ))}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(255,255,255,0.08), rgba(15,23,42,0.08))',
            pointerEvents: 'none',
          }} />
        <svg
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          width="100%"
          height="100%"
          role="img"
          aria-label="Shipment route progress on map"
          style={{ position: 'absolute', inset: 0 }}
        >
          <polyline points={routeLine} fill="none" stroke="rgba(15,23,42,0.45)" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points={routeLine} fill="none" stroke="#ffffff" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="10 10" />
          {reachedLine && (
            <>
              <polyline points={reachedLine} fill="none" stroke="#1d4ed8" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" opacity="0.28" />
              <polyline points={reachedLine} fill="none" stroke="#2563eb" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
            </>
          )}
          {points.map((point, index) => {
            const svgPoint = toSvg(point);
            const isStart = index === 0;
            const isEnd = index === points.length - 1;
            const reached = route.reached.some((reachedPoint) => reachedPoint.lat === point.lat && reachedPoint.lng === point.lng);
            return (
              <g key={`${point.label}-${index}`}>
                <circle
                  cx={svgPoint.x}
                  cy={svgPoint.y}
                  r={isStart || isEnd ? 12 : 9}
                  fill={reached ? '#2563eb' : '#ffffff'}
                  stroke="#ffffff"
                  strokeWidth="4"
                />
                <circle
                  cx={svgPoint.x}
                  cy={svgPoint.y}
                  r={isStart || isEnd ? 7 : 5}
                  fill={isEnd && !reached ? '#ef4444' : reached ? '#ffffff' : '#64748b'}
                />
              </g>
            );
          })}
          {latestPoint && (
            <g>
              <circle cx={latestPoint.x} cy={latestPoint.y} r="20" fill="#2563eb" opacity="0.18" />
              <circle
                cx={latestPoint.x}
                cy={latestPoint.y}
                r="9"
                fill="#2563eb"
                stroke="#ffffff"
                strokeWidth="4"
              />
            </g>
          )}
        </svg>
        {points.map((point, index) => {
          const svgPoint = toSvg(point);
          const isStart = index === 0;
          const isEnd = index === points.length - 1;
          if (!isStart && !isEnd && index !== points.length - 2) return null;
          return (
            <div
              key={`label-${point.label}-${index}`}
              style={{
                position: 'absolute',
                left: Math.max(12, Math.min(width - 170, svgPoint.x - 70)),
                top: Math.max(12, Math.min(height - 44, svgPoint.y + (svgPoint.y < 90 ? 18 : -48))),
                width: 140,
                background: 'rgba(255,255,255,0.92)',
                border: '1px solid rgba(15,23,42,0.12)',
                borderRadius: 8,
                padding: '0.3rem 0.45rem',
                boxShadow: '0 8px 22px rgba(15,23,42,0.16)',
                color: '#1f2937',
                fontWeight: 700,
                fontSize: '0.72rem',
                textAlign: 'center',
              }}
            >
              {isStart ? 'Pickup' : isEnd ? 'Delivery' : point.label}
            </div>
          );
        })}
        <div style={{
          position: 'absolute',
          right: 10,
          bottom: 8,
          background: 'rgba(255,255,255,0.88)',
          borderRadius: 6,
          padding: '0.2rem 0.45rem',
          color: '#475569',
          fontSize: '0.68rem',
        }}>
          Map data © OpenStreetMap contributors
        </div>
      </div>
      </div>
    </div>
  );
};

const TrackingPage = () => {
  const [shipments, setShipments]     = useState([]);
  const [loadingShips, setLoadingShips] = useState(true);
  const [trackingId, setTrackingId]   = useState('');
  const [events, setEvents]           = useState([]);
  const [fetching, setFetching]       = useState(false);
  const [error, setError]             = useState('');
  const [activeShipment, setActiveShipment] = useState(null);

  // Load the user's own shipments so they can click-to-track
  useEffect(() => {
    api.get('/gateway/shipments/my')
      .then((r) => setShipments(r.data ?? []))
      .catch(() => setShipments([]))
      .finally(() => setLoadingShips(false));
  }, []);

  const fetchTimeline = async (id) => {
    const targetId = id || trackingId;
    if (!targetId) return;
    setFetching(true);
    setError('');
    setEvents([]);
    try {
      const res = await api.get(`/gateway/tracking/${targetId}`);
      setEvents(res.data ?? []);
      if ((res.data ?? []).length === 0) {
        setError('No tracking events yet for this shipment. The admin will push updates as your package moves.');
      }
    } catch {
      setError('Unable to fetch tracking info. Make sure the Shipment ID is correct and try again.');
    } finally {
      setFetching(false);
    }
  };

  const handleShipmentClick = (shipment) => {
    setActiveShipment(shipment);
    setTrackingId(shipment.id);
    setEvents([]);
    setError('');
    fetchTimeline(shipment.id);
  };

  return (
    <section>
      <h2>Track Your Shipment</h2>

      {/* ── Quick-track from your shipments ── */}
      {!loadingShips && shipments.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <p className="hint" style={{ marginBottom: '0.6rem' }}>
            📦 Click any of your shipments below to track it instantly:
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
            {shipments.map((s) => {
              const meta = STATUS_META[s.status] || STATUS_META.Draft;
              const isActive = activeShipment?.id === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => handleShipmentClick(s)}
                  style={{
                    border: isActive ? `2px solid #0d9488` : '1.5px solid #d7d1bb',
                    borderRadius: 12,
                    padding: '0.6rem 1rem',
                    background: isActive ? 'rgba(13,148,136,0.07)' : '#fff',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.18s',
                    minWidth: 200,
                  }}
                >
                  <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#0d9488', marginBottom: 2 }}>
                    {s.id.slice(0, 14)}…
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#374947', fontWeight: 600 }}>
                    {s.sender?.name || '—'} → {s.receiver?.name || '—'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: 4 }}>
                    <span>{meta.icon}</span>
                    <span style={{ fontSize: '0.75rem', color: meta.color, fontWeight: 600 }}>
                      {meta.label}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Manual ID entry ── */}
      <div style={{ marginBottom: '1.5rem' }}>
        <p className="hint" style={{ marginBottom: '0.6rem' }}>Or enter a Shipment ID manually:</p>
        <div className="row gap">
          <input
            className="input"
            style={{ maxWidth: 400 }}
            placeholder="Paste shipment ID here…"
            value={trackingId}
            onChange={(e) => { setTrackingId(e.target.value); setActiveShipment(null); }}
          />
          <button
            className="button"
            onClick={() => fetchTimeline()}
            disabled={fetching || !trackingId}
          >
            {fetching ? 'Tracking…' : 'Track'}
          </button>
        </div>
      </div>

      {/* ── Active shipment summary ── */}
      {activeShipment && (
        <div style={{
          background: 'linear-gradient(135deg, #f0faf8, #fff)',
          border: '1px solid #b0d9cf',
          borderRadius: 14,
          padding: '1rem 1.2rem',
          marginBottom: '1.4rem',
          display: 'flex',
          gap: '1.5rem',
          flexWrap: 'wrap',
        }}>
          <div>
            <div className="hint" style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>From</div>
            <div style={{ fontWeight: 600, color: '#1f2a28' }}>{activeShipment.sender?.name}</div>
            <div className="hint" style={{ fontSize: '0.82rem' }}>{activeShipment.sender?.address}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', color: '#0d9488', fontSize: '1.4rem' }}>→</div>
          <div>
            <div className="hint" style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>To</div>
            <div style={{ fontWeight: 600, color: '#1f2a28' }}>{activeShipment.receiver?.name}</div>
            <div className="hint" style={{ fontSize: '0.82rem' }}>{activeShipment.receiver?.address}</div>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <div className="hint" style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>Status</div>
            {(() => {
              const meta = STATUS_META[activeShipment.status] || STATUS_META.Draft;
              return (
                <span style={{ fontWeight: 700, color: meta.color, fontSize: '0.95rem' }}>
                  {meta.icon} {meta.label}
                </span>
              );
            })()}
          </div>
        </div>
      )}

      {/* ── Error message ── */}
      <ShipmentRouteMap shipment={activeShipment} events={events} />

      {error && (
        <div style={{
          background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.3)',
          borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1rem',
          color: '#92600a', fontSize: '0.88rem',
        }}>
          ℹ️ {error}
        </div>
      )}

      {/* ── Tracking Timeline ── */}
      {events.length > 0 && (
        <div>
          <h3 style={{ marginBottom: '1rem', color: '#1f2a28' }}>Tracking Timeline</h3>
          <div className="timeline">
            {events.map((event, idx) => {
              const meta = STATUS_META[event.status] || STATUS_META.Draft;
              const isLatest = idx === events.length - 1;
              return (
                <div key={event.id} className="timeline-item" style={{ marginBottom: '1.2rem' }}>
                  <div
                    className="dot"
                    style={{
                      background: isLatest ? meta.color : '#b0c4c2',
                      boxShadow: isLatest ? `0 0 0 5px ${meta.color}22` : 'none',
                      width: 14, height: 14, marginTop: 4,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, color: meta.color }}>{meta.icon} {event.status}</span>
                      {isLatest && (
                        <span style={{ fontSize: '0.7rem', background: `${meta.color}20`, color: meta.color, padding: '1px 8px', borderRadius: 999, fontWeight: 600 }}>
                          Latest
                        </span>
                      )}
                    </div>
                    <p style={{ margin: '2px 0', fontWeight: 500, color: '#2d3d3a' }}>
                      📍 {event.location || 'Location not specified'}
                    </p>
                    <p className="hint" style={{ fontSize: '0.8rem' }}>
                      {new Date(event.timestampUtc).toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Empty state when no shipments ── */}
      {!loadingShips && shipments.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#7a8c88' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📦</div>
          <p>You haven't created any shipments yet.</p>
        </div>
      )}
    </section>
  );
};

export default TrackingPage;
