import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../services/api';

const ShipmentDetailsPage = () => {
  const { id } = useParams();
  const [shipment, setShipment] = useState(null);
  const [events, setEvents] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deliveryProof, setDeliveryProof] = useState(null); // { receiverName, deliveredAt, imageDataUrl }

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [shipmentRes, trackingRes, docsRes] = await Promise.allSettled([
          api.get(`/gateway/shipments/${id}`),
          api.get(`/gateway/tracking/${id}`),
          api.get(`/gateway/tracking/${id}/documents`)
        ]);

        if (shipmentRes.status !== 'fulfilled') {
          setError('Could not load shipment details.');
          setShipment(null);
          setEvents([]);
          setDocuments([]);
          return;
        }

        const shipmentData = shipmentRes.value.data;
        setShipment(shipmentData);
        setEvents(trackingRes.status === 'fulfilled' ? (trackingRes.value.data ?? []) : []);
        setDocuments(docsRes.status === 'fulfilled' ? (docsRes.value.data ?? []) : []);

        // Fetch Proof of Delivery if shipment is Delivered
        if (shipmentData?.status === 'Delivered') {
          try {
            const podRes = await api.get(`/gateway/tracking/${id}/delivery-proof`);
            const pod = podRes.data;
            const imageDataUrl = pod.imageBase64
              ? `data:${pod.contentType};base64,${pod.imageBase64}`
              : null;
            setDeliveryProof({
              receiverName: pod.receiverName,
              deliveredAt: pod.deliveredAtUtc,
              imageDataUrl,
            });
          } catch {
            setDeliveryProof(null);
          }
        } else {
          setDeliveryProof(null);
        }
      } catch {
        setError('Could not load shipment details.');
      } finally {
        setLoading(false);
      }
    };

    if (id) load();
  }, [id]);

  const formatDate = (value) => {
    if (!value) return '-';
    return new Date(value).toLocaleString();
  };



  const handleDownloadInvoice = async () => {
    try {
      const res = await api.get(`/gateway/payments/invoice/${id}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error(err);
      alert('Failed to download invoice. Please try again.');
    }
  };

  if (loading) {
    return (
      <section>
        <h2>Shipment Details</h2>
        <p>Loading shipment...</p>
      </section>
    );
  }

  if (error || !shipment) {
    return (
      <section>
        <h2>Shipment Details</h2>
        <p>{error || 'Shipment not found.'}</p>
        <Link className="button ghost" to="/dashboard">Back to Dashboard</Link>
      </section>
    );
  }

  return (
    <section>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ marginBottom: '0.35rem' }}>Shipment Details</h2>
          <p className="hint" style={{ marginTop: 0 }}>Shipment ID: {shipment.id}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {shipment.status !== 'Draft' && (
            <button
              className="button"
              onClick={handleDownloadInvoice}
              style={{ background: '#6366f1', color: 'white' }}
            >
              📄 Download Invoice
            </button>
          )}
          <Link className="button ghost" to="/dashboard">Back to Dashboard</Link>
        </div>
      </div>

      <div className="card" style={{ marginTop: '1rem' }}>
        <h3 style={{ marginTop: 0 }}>Summary</h3>
        <p><strong>Status:</strong> {shipment.status}</p>
        <p><strong>Created:</strong> {formatDate(shipment.createdAtUtc)}</p>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Sender</h3>
        <p><strong>Name:</strong> {shipment.sender?.name || '-'}</p>
        <p><strong>Address:</strong> {shipment.sender?.address || '-'}</p>
        <p><strong>Phone:</strong> {shipment.sender?.phone || '-'}</p>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Receiver</h3>
        <p><strong>Name:</strong> {shipment.receiver?.name || '-'}</p>
        <p><strong>Address:</strong> {shipment.receiver?.address || '-'}</p>
        <p><strong>Phone:</strong> {shipment.receiver?.phone || '-'}</p>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Package</h3>
        <p><strong>Weight:</strong> {shipment.package?.weightKg ?? '-'} kg</p>
        <p><strong>Dimensions:</strong> {shipment.package ? `${shipment.package.lengthCm} x ${shipment.package.widthCm} x ${shipment.package.heightCm} cm` : '-'}</p>
        <p><strong>Description:</strong> {shipment.package?.description || '-'}</p>
      </div>

      {shipment.pickup && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Pickup Details</h3>
          <p><strong>Date:</strong> {shipment.pickup.date ? new Date(shipment.pickup.date).toLocaleDateString() : '-'}</p>
          <p><strong>Time Slot:</strong> {shipment.pickup.slot || '-'}</p>
          <p><strong>Instructions:</strong> {shipment.pickup.instructions || '-'}</p>
        </div>
      )}

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Documents</h3>

        {documents.length === 0 ? (
          <p>No documents uploaded yet.</p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: '1rem' }}>
            {documents.map((doc) => (
              <li key={doc.id} style={{ marginBottom: '0.55rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{doc.fileName}</strong>
                  <div className="hint">Uploaded {formatDate(doc.uploadedAtUtc)}</div>
                </div>
                <button
                  className="button ghost"
                  style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}
                  onClick={async () => {
                    try {
                      const res = await api.get(`/gateway/tracking/documents/${doc.id}/download`, { responseType: 'blob' });
                      const url = window.URL.createObjectURL(new Blob([res.data]));
                      const link = document.createElement('a');
                      link.href = url;
                      link.setAttribute('download', doc.fileName);
                      document.body.appendChild(link);
                      link.click();
                      link.parentNode.removeChild(link);
                    } catch {
                      alert('Download failed.');
                    }
                  }}
                >
                  Download
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── Delivery Confirmation Card ── */}
      {deliveryProof && (
        <div className="card" style={{
          border: '1px solid rgba(52,211,153,0.35)',
          background: 'rgba(52,211,153,0.05)',
        }}>
          <h3 style={{ marginTop: 0, color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>✅</span> Delivery Confirmation
          </h3>
          <p style={{ margin: '0 0 0.35rem' }}>
            <strong>Signed By:</strong> {deliveryProof.receiverName}
          </p>
          <p style={{ margin: '0 0 1rem' }}>
            <strong>Delivered At:</strong>{' '}
            {deliveryProof.deliveredAt ? formatDate(deliveryProof.deliveredAt) : '—'}
          </p>
          {deliveryProof.imageDataUrl && (
            <img
              src={deliveryProof.imageDataUrl}
              alt="Proof of Delivery"
              style={{
                maxWidth: '100%',
                maxHeight: 320,
                borderRadius: 8,
                border: '1px solid rgba(52,211,153,0.2)',
                objectFit: 'contain',
              }}
            />
          )}
        </div>
      )}

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Tracking History</h3>
        {events.length === 0 ? (
          <p>No tracking events yet.</p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: '1rem' }}>
            {events.map((event) => (
              <li key={event.id} style={{ marginBottom: '0.55rem' }}>
                <strong>{event.status}</strong> at {event.location || '-'}
                <div className="hint">{formatDate(event.timestampUtc)}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};

export default ShipmentDetailsPage;
