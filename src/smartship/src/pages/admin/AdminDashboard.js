import React, { useEffect, useState } from 'react';
import {
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import api from '../../services/api';

/**
 * AdminDashboard — overview metrics.
 * Backend now returns: { TotalShipments, Revenue, ActiveExceptions, InTransit, Delivered, Delayed }
 * We also show a recent-shipments table fetched from /gateway/admin/shipments/all
 */
const AdminDashboard = () => {
  const [metrics, setMetrics]     = useState(null);
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [mRes, sRes] = await Promise.allSettled([
          api.get('/gateway/admin/dashboard-metrics'),
          api.get('/gateway/admin/shipments/all'),
        ]);
        if (mRes.status === 'fulfilled') setMetrics(mRes.value.data);
        if (sRes.status === 'fulfilled') setShipments(sRes.value.data ?? []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Pull from API metrics first; fall back to computing from shipments list
  const total      = metrics?.totalShipments   ?? shipments.length;
  const revenue    = metrics?.revenue          ?? 0;
  const exceptions = metrics?.activeExceptions ?? 0;
  const inTransit  = metrics?.inTransit  ?? shipments.filter((s) => s.status === 'InTransit').length;
  const delivered  = metrics?.delivered  ?? shipments.filter((s) => s.status === 'Delivered').length;
  const delayed    = metrics?.delayed    ?? shipments.filter((s) => s.status === 'Delayed').length;

  const statCards = [
    { icon: '📦', label: 'Total Shipments',   value: total,      accent: '#6366f1' },
    { icon: '💰', label: 'Total Revenue',      value: `₹${Number(revenue).toLocaleString('en-IN')}`, accent: '#10b981' },
    { icon: '🚚', label: 'In Transit',         value: inTransit,  accent: '#3b82f6' },
    { icon: '✅', label: 'Delivered',          value: delivered,  accent: '#22c55e' },
    { icon: '⏰', label: 'Delayed',            value: delayed,    accent: '#f59e0b' },
    { icon: '⚠️', label: 'Active Exceptions',  value: exceptions, accent: '#ef4444' },
  ];

  // --- Data Preparation for Charts ---
  // 1. Status Distribution
  const statusCounts = shipments.reduce((acc, s) => {
    acc[s.status] = (acc[s.status] || 0) + 1;
    return acc;
  }, {});
  const statusPieData = Object.keys(statusCounts).map(key => ({
    name: key,
    value: statusCounts[key]
  }));
  const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6366f1', '#64748b'];

  // 2. Shipments Over Time
  const dateCountsMap = shipments.reduce((acc, s) => {
    if (!s.createdAtUtc) return acc;
    const d = new Date(s.createdAtUtc);
    d.setHours(0,0,0,0);
    const time = d.getTime();
    acc[time] = (acc[time] || 0) + 1;
    return acc;
  }, {});
  const shipmentsByDate = Object.keys(dateCountsMap)
    .sort()
    .map(timeStr => {
      const d = new Date(parseInt(timeStr));
      return {
        date: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
        count: dateCountsMap[timeStr]
      };
    });

  // 3. Weight Distribution
  const weightBuckets = { '0-5kg': 0, '5-10kg': 0, '10-20kg': 0, '20kg+': 0 };
  shipments.forEach(s => {
    const w = s.package?.weightKg || 0;
    if (w < 5) weightBuckets['0-5kg']++;
    else if (w < 10) weightBuckets['5-10kg']++;
    else if (w < 20) weightBuckets['10-20kg']++;
    else weightBuckets['20kg+']++;
  });
  const weightData = Object.keys(weightBuckets).map(key => ({
    bucket: key,
    count: weightBuckets[key]
  }));
  // -----------------------------------

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#64748b', padding: '2rem 0' }}>
        <div className="adm-spinner" /> Loading metrics…
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#c7d2fe', marginBottom: '0.4rem', fontSize: '1.25rem' }}>
        Platform Overview
      </h2>
      <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1.8rem' }}>
        Live snapshot of all shipments across the system.
      </p>

      <div className="adm-metrics">
        {statCards.map((card) => (
          <div className="adm-metric-card" key={card.label} style={{ '--accent': card.accent }}>
            <span className="adm-metric-icon">{card.icon}</span>
            <span className="adm-metric-num" style={{ color: card.accent }}>{card.value}</span>
            <span className="adm-metric-label">{card.label}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
        {/* Pie Chart: Status Distribution */}
        <div className="adm-section" style={{ padding: '1.5rem', borderRadius: '12px', background: 'var(--bg-card)' }}>
          <p className="adm-section-title" style={{ marginBottom: '1rem', color: '#c7d2fe', fontSize: '0.95rem' }}>📊 Status Distribution</p>
          {statusPieData.length > 0 ? (
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={statusPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} innerRadius={55} paddingAngle={3} label>
                    {statusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#f8fafc' }} itemStyle={{ color: '#f8fafc' }} />
                  <Legend wrapperStyle={{ fontSize: '0.8rem', color: '#94a3b8' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p style={{ color: '#64748b', fontSize: '0.85rem' }}>No status data available.</p>
          )}
        </div>

        {/* Line Chart: Shipments over Time */}
        <div className="adm-section" style={{ padding: '1.5rem', borderRadius: '12px', background: 'var(--bg-card)' }}>
          <p className="adm-section-title" style={{ marginBottom: '1rem', color: '#c7d2fe', fontSize: '0.95rem' }}>📈 Shipments Over Time</p>
          {shipmentsByDate.length > 0 ? (
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <LineChart data={shipmentsByDate} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                  <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#f8fafc' }} itemStyle={{ color: '#f8fafc' }} />
                  <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1', strokeWidth: 0 }} activeDot={{ r: 6 }} name="Shipments" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p style={{ color: '#64748b', fontSize: '0.85rem' }}>No date data available.</p>
          )}
        </div>

        {/* Bar Chart: Weight Distribution */}
        <div className="adm-section" style={{ padding: '1.5rem', borderRadius: '12px', background: 'var(--bg-card)' }}>
          <p className="adm-section-title" style={{ marginBottom: '1rem', color: '#c7d2fe', fontSize: '0.95rem' }}>⚖️ Weight Distribution</p>
          {weightData.some(d => d.count > 0) ? (
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <BarChart data={weightData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="bucket" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                  <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#f8fafc' }} itemStyle={{ color: '#f8fafc' }} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                  <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} name="Shipments" maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
             <p style={{ color: '#64748b', fontSize: '0.85rem' }}>No weight data available.</p>
          )}
        </div>
      </div>

      {shipments.length > 0 && (
        <div className="adm-section" style={{ marginTop: '1.5rem' }}>
          <p className="adm-section-title">📋 Recent Shipments (last 5)</p>
          <div style={{ overflowX: 'auto' }}>
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Shipment ID</th><th>Status</th><th>From</th><th>To</th><th>Created</th>
                </tr>
              </thead>
              <tbody>
                {shipments.slice(0, 5).map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#818cf8' }}>{s.id.slice(0, 12)}…</td>
                    <td><span className={`adm-status ${statusClass(s.status)}`}>{s.status}</span></td>
                    <td style={{ color: '#94a3b8', fontSize: '0.82rem', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.sender?.address || '—'}</td>
                    <td style={{ color: '#94a3b8', fontSize: '0.82rem', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.receiver?.address || '—'}</td>
                    <td style={{ color: '#475569', fontSize: '0.78rem' }}>{s.createdAtUtc ? new Date(s.createdAtUtc).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

const statusClass = (s) => {
  const map = { Delivered: 'delivered', InTransit: 'intransit', Delayed: 'delayed', Booked: 'booked', Exception: 'exception', Draft: 'booked', Packed: 'booked', AtHub: 'intransit', OutForDelivery: 'intransit', PickedUp: 'delivered' };
  return map[s] || 'booked';
};

export default AdminDashboard;
