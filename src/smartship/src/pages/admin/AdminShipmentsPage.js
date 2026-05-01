import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { routeAwareHubs } from '../../utils/routeGeo';

const STATUS_CLASS = {
  Delivered: 'delivered',
  InTransit: 'intransit',
  Delayed: 'delayed',
  Booked: 'booked',
  Exception: 'exception',
  Draft: 'booked',
  Packed: 'booked',
  AtHub: 'intransit',
  OutForDelivery: 'intransit',
  PickedUp: 'delivered',
};

const STATUS_OPTIONS = ['Booked', 'PickedUp', 'AtHub', 'InTransit', 'OutForDelivery', 'Delivered', 'Delayed', 'Exception'];

const isGuid = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value || '');

const suggestedStatusForHub = (hub, currentStatus) => {
  if (!hub) return currentStatus || 'InTransit';
  if (hub.routeRole?.includes('Destination-side')) return 'OutForDelivery';
  if (hub.routeRole?.includes('capital')) return 'InTransit';
  if (hub.routeRole?.includes('gateway')) return 'InTransit';
  return 'AtHub';
};

const AdminShipmentsPage = () => {
  const [shipments, setShipments] = useState([]);
  const [hubs, setHubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [rowDrafts, setRowDrafts] = useState({});
  const [rankedHubs, setRankedHubs] = useState({});
  const [ranking, setRanking] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [shipmentsRes, hubsRes] = await Promise.all([
        api.get('/gateway/admin/shipments/all'),
        api.get('/gateway/admin/hubs'),
      ]);
      setShipments(shipmentsRes.data ?? []);
      setHubs((hubsRes.data ?? []).filter((hub) => hub.isActive));
    } catch {
      setShipments([]);
      setHubs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const rankHubs = async () => {
      if (!shipments.length) {
        setRankedHubs({});
        return;
      }

      setRanking(true);
      const entries = await Promise.all(
        shipments.map(async (shipment) => [shipment.id, await routeAwareHubs(shipment, hubs)])
      );

      if (!cancelled) {
        setRankedHubs(Object.fromEntries(entries));
        setRanking(false);
      }
    };

    rankHubs();
    return () => {
      cancelled = true;
    };
  }, [shipments, hubs]);

  const getRowDraft = (shipment, suggestedHubs) => {
    const defaults = {
      status: shipment.status === 'Draft' ? 'Booked' : shipment.status,
      hubId: shipment.assignedHubId || suggestedHubs.find((hub) => hub.onPath)?.id || '',
    };
    const existing = rowDrafts[shipment.id];
    if (existing) return { ...defaults, ...existing };

    return defaults;
  };

  const setRowDraft = (shipmentId, patch) => {
    setRowDrafts((prev) => ({
      ...prev,
      [shipmentId]: {
        ...(prev[shipmentId] || {}),
        ...patch,
      },
    }));
  };

  const handleRouteUpdate = async (shipment, draft) => {
    if (!draft.status) {
      alert('Choose a status first.');
      return;
    }

    const selectedHub = (rankedHubs[shipment.id] || hubs).find((hub) => hub.id === draft.hubId);
    const location = draft.status === 'Delivered'
      ? shipment.receiver?.address
      : draft.status === 'PickedUp'
        ? shipment.sender?.address
        : selectedHub?.location;

    if (!location) {
      alert('Choose a route hub for this status update.');
      return;
    }

    try {
      setUpdatingId(shipment.id);
      await api.put(`/gateway/admin/shipments/${shipment.id}/hub`, { hubId: isGuid(draft.hubId) ? draft.hubId : null });
      await api.put(`/gateway/admin/shipments/${shipment.id}/status`, { status: draft.status });
      await api.post('/gateway/tracking/update', {
        trackingId: shipment.id,
        location,
        status: draft.status,
      });

      setShipments((prev) => prev.map((item) => (
        item.id === shipment.id
          ? { ...item, status: draft.status, assignedHubId: isGuid(draft.hubId) ? draft.hubId : null }
          : item
      )));
    } catch (err) {
      console.error(err);
      alert('Failed to update shipment route status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = shipments.filter(
    (s) =>
      s.id.toLowerCase().includes(filter.toLowerCase()) ||
      s.status.toLowerCase().includes(filter.toLowerCase()) ||
      s.sender?.address?.toLowerCase().includes(filter.toLowerCase()) ||
      s.receiver?.address?.toLowerCase().includes(filter.toLowerCase()) ||
      s.sender?.name?.toLowerCase().includes(filter.toLowerCase()) ||
      s.receiver?.name?.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div>
      <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#c7d2fe', marginBottom: '0.4rem', fontSize: '1.25rem' }}>
        All Shipments
      </h2>
      <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
        Update shipment status at route-aware hubs. Hubs between sender and receiver are suggested first.
      </p>

      <div className="adm-section">
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            className="adm-input"
            style={{ maxWidth: 340 }}
            placeholder="Search by ID, status, name, address..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <span style={{ color: '#475569', fontSize: '0.82rem' }}>
            {filtered.length} shipment{filtered.length !== 1 ? 's' : ''}
          </span>
          <button className="adm-btn" style={{ marginLeft: 'auto' }} onClick={fetchData}>
            Refresh
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', color: '#64748b' }}>
            <div className="adm-spinner" /> Loading shipments...
          </div>
        ) : filtered.length === 0 ? (
          <div className="adm-empty">
            <span>--</span>
            {filter ? 'No shipments matched your search.' : 'No shipments in the system yet.'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto', overflowY: 'hidden', paddingBottom: '0.5rem', maxWidth: '100%' }}>
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Shipment ID</th>
                  <th>Status</th>
                  <th>Sender</th>
                  <th>Receiver</th>
                  <th>From Address</th>
                  <th>To Address</th>
                  <th>Created</th>
                  <th style={{ width: 430, minWidth: 430 }}>Route Update</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const suggestedHubs = rankedHubs[item.id] || [];
                  const routeHubs = suggestedHubs.filter((hub) => hub.onPath);
                  const offRouteHubs = suggestedHubs.filter((hub) => !hub.onPath);
                  const nextSuggestions = routeHubs.slice(0, 5);
                  const draft = getRowDraft(item, suggestedHubs);

                  return (
                    <tr key={item.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#818cf8', minWidth: 120 }}>
                        {item.id.slice(0, 12)}...
                      </td>
                      <td>
                        <span className={`adm-status ${STATUS_CLASS[item.status] || 'booked'}`}>
                          {item.status}
                        </span>
                      </td>
                      <td style={{ color: '#cbd5e1', fontSize: '0.85rem' }}>{item.sender?.name || '-'}</td>
                      <td style={{ color: '#cbd5e1', fontSize: '0.85rem' }}>{item.receiver?.name || '-'}</td>
                      <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#64748b', fontSize: '0.8rem' }}>
                        {item.sender?.address || '-'}
                      </td>
                      <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#64748b', fontSize: '0.8rem' }}>
                        {item.receiver?.address || '-'}
                      </td>
                      <td style={{ color: '#475569', fontSize: '0.78rem' }}>
                        {item.createdAtUtc ? new Date(item.createdAtUtc).toLocaleDateString() : '-'}
                      </td>
                      <td style={{ width: 430, minWidth: 430, maxWidth: 430 }}>
                        <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center', flexWrap: 'wrap' }}>
                          <select
                            className="adm-input"
                            style={{ padding: '0.3rem 0.45rem', fontSize: '0.75rem', height: 36, backgroundColor: '#1e293b', width: 132, minWidth: 132 }}
                            value={draft.status}
                            onChange={(e) => setRowDraft(item.id, { status: e.target.value })}
                          >
                            {STATUS_OPTIONS.map((status) => (
                              <option key={status} value={status}>{status}</option>
                            ))}
                          </select>
                          <select
                            className="adm-input"
                            style={{ padding: '0.3rem 0.45rem', fontSize: '0.75rem', height: 36, backgroundColor: '#1e293b', width: 190, minWidth: 190 }}
                            value={draft.hubId}
                            onChange={(e) => setRowDraft(item.id, { hubId: e.target.value })}
                            disabled={ranking && !suggestedHubs.length}
                          >
                            <option value="">{ranking && !suggestedHubs.length ? 'Finding hubs...' : 'Choose hub'}</option>
                            {routeHubs.length > 0 && (
                              <optgroup label="On this route">
                                {routeHubs.map((hub) => (
                                  <option key={hub.id} value={hub.id}>
                                    {hub.name} - {hub.routeRole}: {hub.routeHint}
                                  </option>
                                ))}
                              </optgroup>
                            )}
                            {offRouteHubs.length > 0 && (
                              <optgroup label="Other hubs">
                                {offRouteHubs.map((hub) => (
                                  <option key={hub.id} value={hub.id}>
                                    {hub.name} - {hub.routeHint}
                                  </option>
                                ))}
                              </optgroup>
                            )}
                          </select>
                          <button
                            className="adm-btn"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.72rem', height: 36 }}
                            disabled={updatingId === item.id || (ranking && !suggestedHubs.length)}
                            onClick={() => handleRouteUpdate(item, draft)}
                          >
                            {updatingId === item.id ? 'Saving...' : 'Update'}
                          </button>
                        </div>
                        <div style={{ marginTop: '0.35rem', color: routeHubs.length ? '#34d399' : '#fbbf24', fontSize: '0.72rem', lineHeight: 1.3 }}>
                          {ranking && !suggestedHubs.length
                            ? 'Calculating route hubs...'
                            : routeHubs.length
                            ? `${routeHubs.length} route hub${routeHubs.length === 1 ? '' : 's'} suggested`
                            : 'No geocoded hub found for this route'}
                        </div>
                        {nextSuggestions.length > 0 && (
                          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.45rem' }}>
                            {nextSuggestions.map((hub, index) => (
                              <button
                                key={hub.id}
                                type="button"
                                className="adm-btn"
                                style={{
                                  background: draft.hubId === hub.id ? 'rgba(52,211,153,0.2)' : 'rgba(99,102,241,0.12)',
                                  color: draft.hubId === hub.id ? '#34d399' : '#c7d2fe',
                                  border: draft.hubId === hub.id ? '1px solid rgba(52,211,153,0.45)' : '1px solid rgba(129,140,248,0.28)',
                                  padding: '0.22rem 0.5rem',
                                  fontSize: '0.68rem',
                                  maxWidth: 180,
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                                onClick={() => setRowDraft(item.id, {
                                  hubId: hub.id,
                                  status: suggestedStatusForHub(hub, draft.status),
                                })}
                                title={`${hub.routeRole}: ${hub.routeHint}`}
                              >
                                {index + 1}. {hub.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminShipmentsPage;
