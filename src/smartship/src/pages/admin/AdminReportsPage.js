import React, { useEffect, useState } from 'react';
import {
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer
} from 'recharts';
import api from '../../services/api';

const AdminReportsPage = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await api.get('/gateway/admin/reports');
        setReportData(res.data);
      } catch (err) {
        console.error('Failed to fetch reports', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const handleExportCSV = () => {
    if (!reportData || !reportData.shipments) return;

    // Build CSV content
    const headers = ['Shipment ID', 'Status', 'Created Date', 'Sender Name', 'Sender Address', 'Receiver Name', 'Receiver Address'];
    const rows = reportData.shipments.map(s => [
      s.id,
      s.status,
      s.createdAtUtc ? new Date(s.createdAtUtc).toLocaleString() : 'N/A',
      s.sender?.name ? `"${s.sender.name.replace(/"/g, '""')}"` : 'N/A',
      s.sender?.address ? `"${s.sender.address.replace(/"/g, '""')}"` : 'N/A',
      s.receiver?.name ? `"${s.receiver.name.replace(/"/g, '""')}"` : 'N/A',
      s.receiver?.address ? `"${s.receiver.address.replace(/"/g, '""')}"` : 'N/A'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    // Trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `SLA_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#64748b', padding: '2rem 0' }}>
        <div className="adm-spinner" /> Loading reports data…
      </div>
    );
  }

  if (!reportData) {
    return <div style={{ color: '#ef4444' }}>Failed to load reports data.</div>;
  }

  const { sla, shipments } = reportData;

  const slaPieData = [
    { name: 'On Time', value: sla.onTime || 0 },
    { name: 'Delayed', value: sla.delayed || 0 }
  ];
  const PIE_COLORS = ['#22c55e', '#ef4444']; // Green for on time, red for delayed

  // Bar chart data for shipments over time (last 7 days could be calculated, or just all time aggregated by date)
  const dateCountsMap = shipments.reduce((acc, s) => {
    if (!s.createdAtUtc) return acc;
    const d = new Date(s.createdAtUtc);
    d.setHours(0, 0, 0, 0);
    const timeStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    acc[timeStr] = (acc[timeStr] || 0) + 1;
    return acc;
  }, {});

  const shipmentsByDate = Object.keys(dateCountsMap).map(date => ({
    date,
    count: dateCountsMap[date]
  }));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#c7d2fe', marginBottom: '0.4rem', fontSize: '1.25rem' }}>
            Performance & SLA Reports
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
            Analyze platform performance and download detailed shipment data.
          </p>
        </div>
        <button 
          onClick={handleExportCSV}
          style={{
            background: '#6366f1', color: '#fff', border: 'none', padding: '0.6rem 1.2rem',
            borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
            transition: 'background 0.2s'
          }}
          onMouseOver={e => e.currentTarget.style.background = '#4f46e5'}
          onMouseOut={e => e.currentTarget.style.background = '#6366f1'}
        >
          📥 Export CSV
        </button>
      </div>

      {/* KPI Cards */}
      <div className="adm-metrics" style={{ marginBottom: '2rem' }}>
        <div className="adm-metric-card" style={{ '--accent': '#6366f1' }}>
          <span className="adm-metric-icon">📦</span>
          <span className="adm-metric-num" style={{ color: '#6366f1' }}>{sla.totalShipments}</span>
          <span className="adm-metric-label">Total Shipments (SLA Scope)</span>
        </div>
        <div className="adm-metric-card" style={{ '--accent': '#22c55e' }}>
          <span className="adm-metric-icon">✅</span>
          <span className="adm-metric-num" style={{ color: '#22c55e' }}>{sla.onTime}</span>
          <span className="adm-metric-label">On-Time Shipments</span>
        </div>
        <div className="adm-metric-card" style={{ '--accent': '#ef4444' }}>
          <span className="adm-metric-icon">⏰</span>
          <span className="adm-metric-num" style={{ color: '#ef4444' }}>{sla.delayed}</span>
          <span className="adm-metric-label">Delayed Shipments</span>
        </div>
        <div className="adm-metric-card" style={{ '--accent': '#10b981' }}>
          <span className="adm-metric-icon">📈</span>
          <span className="adm-metric-num" style={{ color: '#10b981' }}>{sla.compliancePercentage}%</span>
          <span className="adm-metric-label">SLA Compliance Rate</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* SLA Pie Chart */}
        <div className="adm-section" style={{ padding: '1.5rem', borderRadius: '12px', background: 'var(--bg-card)' }}>
          <p className="adm-section-title" style={{ marginBottom: '1rem', color: '#c7d2fe', fontSize: '0.95rem' }}>🎯 SLA Compliance</p>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={slaPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} innerRadius={55} paddingAngle={3} label>
                  {slaPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#f8fafc' }} itemStyle={{ color: '#f8fafc' }} />
                <Legend wrapperStyle={{ fontSize: '0.8rem', color: '#94a3b8' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Volume Over Time Bar Chart */}
        <div className="adm-section" style={{ padding: '1.5rem', borderRadius: '12px', background: 'var(--bg-card)' }}>
          <p className="adm-section-title" style={{ marginBottom: '1rem', color: '#c7d2fe', fontSize: '0.95rem' }}>📊 Processing Volume</p>
          {shipmentsByDate.length > 0 ? (
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <BarChart data={shipmentsByDate} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                  <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#f8fafc' }} itemStyle={{ color: '#f8fafc' }} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Shipments" maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p style={{ color: '#64748b', fontSize: '0.85rem' }}>No date data available.</p>
          )}
        </div>
      </div>

      {/* Detailed Data Table */}
      <div className="adm-section">
        <p className="adm-section-title">📋 Raw Shipment Data (For Export)</p>
        <div style={{ overflowX: 'auto', maxHeight: '400px', overflowY: 'auto' }}>
          <table className="adm-table">
            <thead style={{ position: 'sticky', top: 0, background: '#1e293b', zIndex: 1 }}>
              <tr>
                <th>Shipment ID</th>
                <th>Status</th>
                <th>Created At</th>
                <th>Sender</th>
                <th>Receiver</th>
              </tr>
            </thead>
            <tbody>
              {shipments.map((s) => (
                <tr key={s.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#818cf8' }}>{s.id}</td>
                  <td><span className={`adm-status ${statusClass(s.status)}`}>{s.status}</span></td>
                  <td style={{ color: '#94a3b8', fontSize: '0.82rem' }}>{s.createdAtUtc ? new Date(s.createdAtUtc).toLocaleString() : '—'}</td>
                  <td style={{ color: '#94a3b8', fontSize: '0.82rem', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.sender?.name || '—'}<br/>
                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{s.sender?.address || ''}</span>
                  </td>
                  <td style={{ color: '#94a3b8', fontSize: '0.82rem', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.receiver?.name || '—'}<br/>
                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{s.receiver?.address || ''}</span>
                  </td>
                </tr>
              ))}
              {shipments.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', color: '#64748b', padding: '1rem' }}>No shipment data found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const statusClass = (s) => {
  const map = { Delivered: 'delivered', InTransit: 'intransit', Delayed: 'delayed', Booked: 'booked', Exception: 'exception', Draft: 'booked', Packed: 'booked', AtHub: 'intransit', OutForDelivery: 'intransit', PickedUp: 'delivered' };
  return map[s] || 'booked';
};

export default AdminReportsPage;
