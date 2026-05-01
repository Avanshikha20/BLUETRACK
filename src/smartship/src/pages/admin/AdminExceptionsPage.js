import React, { useEffect, useState } from 'react';
import api from '../../services/api';

// Full shipment lifecycle pipeline
const STATUSES = [
  { value: 'Packed',         label: '📦 Packed',              hint: 'Package has been packed and is ready' },
  { value: 'PickedUp',       label: '🚐 Picked Up',           hint: 'Picked up from sender' },
  { value: 'AtHub',          label: '🏭 At Sorting Hub',      hint: 'Package reached a sorting/hub facility' },
  { value: 'InTransit',      label: '🚚 In Transit',          hint: 'Package is on the way' },
  { value: 'OutForDelivery', label: '🛵 Out for Delivery',    hint: 'Last-mile delivery in progress' },
  { value: 'Delivered',      label: '✅ Delivered',            hint: 'Successfully delivered to recipient' },
  { value: 'Delayed',        label: '⏰ Delayed',              hint: 'Package is facing a delay' },
  { value: 'Exception',      label: '⚠️ Exception',            hint: 'There is an issue that needs attention' },
];

const STATUS_CLASS = {
  Delivered: 'delivered', InTransit: 'intransit', Delayed: 'delayed',
  Booked: 'booked', Exception: 'exception', Draft: 'booked',
};

/**
 * AdminExceptionsPage — admin can force-update a shipment status AND push a
 * tracking event (with location) so the user's tracking timeline updates live.
 *
 * API flow:
 *  1. PUT /gateway/admin/resolve-exception  — updates shipment status
 *  2. POST /gateway/tracking/update         — pushes a new tracking timeline event
 */
const AdminExceptionsPage = () => {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState(null);
  const [form, setForm]           = useState({ status: 'InTransit', location: '', notes: 'Manual admin override' });
  const [podFile, setPodFile]     = useState(null);
  const [podSignedBy, setPodSignedBy] = useState('');
  const [saving, setSaving]       = useState(false);
  const [toast, setToast]         = useState({ msg: '', type: 'ok' });

  const load = async () => {
    setLoading(true);
    await api
      .get('/gateway/admin/shipments/all')
      .then((r) => setShipments(r.data ?? []))
      .catch(() => setShipments([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openModal = (item) => {
    setSelected(item);
    // Pick the closest known pipeline status, or default to InTransit
    const matchedStatus = STATUSES.find((s) => s.value === item.status)?.value || 'InTransit';
    setForm({ status: matchedStatus, location: '', notes: 'Manual admin override' });
    setPodFile(null);
    setPodSignedBy('');
  };

  const showToast = (msg, type = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'ok' }), 4000);
  };

  const applyUpdate = async () => {
    if (!selected) return;

    // Guard: POD fields are mandatory when marking as Delivered
    if (form.status === 'Delivered') {
      if (!podFile) { showToast('❌ Please attach a Proof of Delivery image.', 'err'); return; }
      if (!podSignedBy.trim()) { showToast('❌ Please enter the name of the person who signed.', 'err'); return; }
    }

    setSaving(true);
    try {
      // 1️⃣ If Delivered — upload the Proof of Delivery image first
      if (form.status === 'Delivered') {
        const podForm = new FormData();
        podForm.append('receiverName', podSignedBy.trim());
        podForm.append('signatureImage', podFile);
        await api.post(`/gateway/tracking/${selected.id}/delivery-proof`, podForm, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      // 2️⃣ Update shipment status via admin resolve-exception endpoint
      await api.put('/gateway/admin/resolve-exception', {
        shipmentId: selected.id,
        forceStatus: form.status,
        notes: form.notes || 'Manual admin override',
      });

      // 3️⃣ Push a tracking timeline event so the user can see the update
      await api.post('/gateway/tracking/update', {
        trackingId: selected.id,
        status: form.status,
        location: form.location || 'Unknown location',
      });

      showToast(`✅ Shipment updated to "${form.status}" — tracking event added.`, 'ok');
      setSelected(null);
      await load();
    } catch (err) {
      showToast(`❌ Update failed: ${err?.response?.data || err.message}`, 'err');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#c7d2fe', marginBottom: '0.4rem', fontSize: '1.25rem' }}>
        Shipment Status Management
      </h2>
      <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
        Update shipment status and set the current package location. Changes are reflected immediately in the user's tracking timeline.
      </p>

      {toast.msg && (
        <div style={{
          background: toast.type === 'ok' ? 'rgba(52,211,153,0.1)' : 'rgba(239,68,68,0.1)',
          border: `1px solid ${toast.type === 'ok' ? 'rgba(52,211,153,0.3)' : 'rgba(239,68,68,0.3)'}`,
          borderRadius: 10, padding: '0.7rem 1rem', marginBottom: '1.2rem',
          color: toast.type === 'ok' ? '#34d399' : '#f87171', fontSize: '0.88rem',
        }}>
          {toast.msg}
        </div>
      )}

      <div className="adm-section">
        {loading ? (
          <p style={{ color: '#64748b' }}>Loading shipments…</p>
        ) : shipments.length === 0 ? (
          <div className="adm-empty"><span>📭</span>No shipments in the system yet.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Shipment ID</th>
                  <th>Current Status</th>
                  <th>Sender → Receiver</th>
                  <th>Created</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {shipments.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <code style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#818cf8', background: 'rgba(99,102,241,0.08)', padding: '2px 6px', borderRadius: 4 }}>
                        {item.id.slice(0, 14)}…
                      </code>
                    </td>
                    <td>
                      <span className={`adm-status ${STATUS_CLASS[item.status] || 'booked'}`}>
                        {item.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: '#94a3b8', maxWidth: 220 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.sender?.name || '—'} → {item.receiver?.name || '—'}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.sender?.address?.slice(0, 25)}… → {item.receiver?.address?.slice(0, 25)}…
                      </div>
                    </td>
                    <td style={{ color: '#475569', fontSize: '0.78rem' }}>
                      {item.createdAtUtc ? new Date(item.createdAtUtc).toLocaleDateString() : '—'}
                    </td>
                    <td>
                      <button className="adm-btn adm-btn-primary" onClick={() => openModal(item)}>
                        ✏️ Update Status
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Update Modal ── */}
      {selected && (
        <div className="adm-modal-backdrop">
          <div className="adm-modal" style={{ maxWidth: 520 }}>
            <h3>✏️ Update Shipment Status</h3>

            <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 10, padding: '0.75rem 1rem', fontSize: '0.82rem' }}>
              <div style={{ color: '#94a3b8', marginBottom: '0.25rem' }}>Shipment ID</div>
              <code style={{ color: '#818cf8', fontSize: '0.78rem' }}>{selected.id}</code>
              <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#64748b' }}>
                {selected.sender?.name} → {selected.receiver?.name}
              </div>
            </div>

            {/* Status */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                New Status *
              </label>
              <select
                className="adm-input"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              {STATUSES.find((s) => s.value === form.status) && (
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#475569' }}>
                  ℹ️ {STATUSES.find((s) => s.value === form.status).hint}
                </p>
              )}
            </div>

            {/* Location */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Current Location <span style={{ color: '#475569', textTransform: 'none' }}>(shown in tracking timeline)</span>
              </label>
              <input
                className="adm-input"
                placeholder="e.g. Delhi Sorting Hub, Mumbai Warehouse, Out for Delivery…"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </div>

            {/* ── Proof of Delivery (shown only when status === Delivered) ── */}
            {form.status === 'Delivered' && (
              <div style={{
                background: 'rgba(52,211,153,0.06)',
                border: '1px solid rgba(52,211,153,0.25)',
                borderRadius: 10,
                padding: '0.9rem 1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1rem' }}>📸</span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#34d399' }}>Proof of Delivery Required</span>
                </div>

                {/* Signed-by name */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Signed By <span style={{ color: '#f87171' }}>*</span>
                  </label>
                  <input
                    id="pod-signed-by"
                    className="adm-input"
                    placeholder="Full name of recipient…"
                    value={podSignedBy}
                    onChange={(e) => setPodSignedBy(e.target.value)}
                  />
                </div>

                {/* Signature / photo upload */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Signature / Package Photo <span style={{ color: '#f87171' }}>*</span>
                  </label>
                  <input
                    id="pod-image-upload"
                    type="file"
                    accept="image/*"
                    className="adm-input"
                    style={{ padding: '0.3rem' }}
                    onChange={(e) => setPodFile(e.target.files[0] || null)}
                  />
                  {podFile && (
                    <div style={{ fontSize: '0.75rem', color: '#34d399' }}>
                      ✔ {podFile.name} ({(podFile.size / 1024).toFixed(1)} KB)
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Notes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Admin Notes
              </label>
              <input
                className="adm-input"
                placeholder="Reason for update…"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>

            <div style={{ background: 'rgba(99,102,241,0.06)', borderRadius: 8, padding: '0.6rem 0.8rem', fontSize: '0.8rem', color: '#64748b' }}>
              💡 This will update the shipment status <strong style={{ color: '#818cf8' }}>AND</strong> push a new event to the user's tracking timeline.
            </div>

            <div className="adm-modal-actions">
              <button
                className="adm-btn"
                style={{ background: 'rgba(148,163,184,0.08)', color: '#94a3b8' }}
                onClick={() => setSelected(null)}
                disabled={saving}
              >
                Cancel
              </button>
              <button className="adm-btn adm-btn-primary" onClick={applyUpdate} disabled={saving}>
                {saving ? '⏳ Saving…' : '✅ Apply Update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminExceptionsPage;
