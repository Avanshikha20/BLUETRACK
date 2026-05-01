import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './DashboardPage.css';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedShipment, setSelectedShipment] = useState(null);

  useEffect(() => {
    const loadShipments = async () => {
      try {
        const response = await api.get('/gateway/shipments/my');
        // Sort shipments by creation date descending (newest first)
        const sorted = (response.data || []).sort((a, b) => 
          new Date(b.createdAtUtc || 0) - new Date(a.createdAtUtc || 0)
        );
        setShipments(sorted);
      } catch (err) {
        console.error('Failed to load shipments:', err);
        setShipments([]);
      } finally {
        setLoading(false);
      }
    };
    loadShipments();
  }, []);

  const openModal = (shipment) => setSelectedShipment(shipment);
  const closeModal = () => setSelectedShipment(null);

  const getStatusClass = (status) => {
    if (!status) return 'status-draft';
    return `status-${status.toLowerCase().replace(/\s+/g, '')}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const handleDownloadInvoice = async (id) => {
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

  return (
    <div className="dash-container">
      <div className="dash-header">
        <h2>My Shipments</h2>
        <p>Track, manage, and view the details of your recent packages.</p>
      </div>

      {loading ? (
        <div className="dash-loader">
          <div className="dash-spinner"></div>
          <p>Loading your shipments...</p>
        </div>
      ) : shipments.length === 0 ? (
        <div className="dash-empty">
          <span>📦</span>
          <h3>No Shipments Yet</h3>
          <p>You haven't created any shipments. Head over to "New Shipment" to get started.</p>
        </div>
      ) : (
        <div className="dash-grid">
          {shipments.map((shipment) => (
            <div className="dash-card" key={shipment.id}>
              <div className="dash-card-header">
                <span className="dash-card-id">#{shipment.id.slice(0, 8)}</span>
                <span className={`dash-status ${getStatusClass(shipment.status)}`}>
                  {shipment.status || 'Draft'}
                </span>
              </div>

              <div className="dash-route">
                <div className="dash-route-point">
                  <div className="dash-route-label">From</div>
                  <div className="dash-route-value" title={shipment.sender?.address}>
                    {shipment.sender?.address?.split(',')[0] || 'Origin'}
                  </div>
                </div>
                
                <div className="dash-route-arrow">→</div>

                <div className="dash-route-point" style={{ textAlign: 'right' }}>
                  <div className="dash-route-label">To</div>
                  <div className="dash-route-value" title={shipment.receiver?.address}>
                    {shipment.receiver?.address?.split(',')[0] || 'Destination'}
                  </div>
                </div>
              </div>

              <div className="dash-card-footer">
                <div className="dash-date">
                  {formatDate(shipment.createdAtUtc).split(',')[0]}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {(!shipment.status || shipment.status.toLowerCase() === 'draft') && (
                    <button 
                      className="button" 
                      style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem' }}
                      onClick={() => navigate(`/wizard?draftId=${shipment.id}`)}
                    >
                      Resume
                    </button>
                  )}
                  <button 
                    className="btn-view-detail" 
                    onClick={() => openModal(shipment)}
                  >
                    View Detail
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal Overlay */}
      {selectedShipment && (
        <div className="dash-modal-backdrop" onClick={closeModal}>
          <div className="dash-modal" onClick={e => e.stopPropagation()}>
            <div className="dash-modal-header">
              <h3 className="dash-modal-title">Shipment Details</h3>
              <button className="dash-modal-close" onClick={closeModal}>✕</button>
            </div>
            
            <div className="dash-modal-content">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.2rem' }}>Tracking ID</div>
                  <code style={{ color: '#6366f1', background: 'rgba(99, 102, 241, 0.1)', padding: '0.3em 0.6em', borderRadius: '6px' }}>
                    {selectedShipment.id}
                  </code>
                </div>
                <span className={`dash-status ${getStatusClass(selectedShipment.status)}`} style={{ fontSize: '0.85rem' }}>
                  {selectedShipment.status || 'Draft'}
                </span>
              </div>

              <div className="dash-detail-section">
                <h4>Route Information</h4>
                <div className="dash-detail-grid">
                  <div className="dash-detail-box">
                    <h5>Sender</h5>
                    <p><strong>{selectedShipment.sender?.name || '—'}</strong></p>
                    <p>{selectedShipment.sender?.address || '—'}</p>
                    <p>{selectedShipment.sender?.phone || '—'}</p>
                  </div>
                  <div className="dash-detail-box">
                    <h5>Receiver</h5>
                    <p><strong>{selectedShipment.receiver?.name || '—'}</strong></p>
                    <p>{selectedShipment.receiver?.address || '—'}</p>
                    <p>{selectedShipment.receiver?.phone || '—'}</p>
                  </div>
                </div>
              </div>

              <div className="dash-detail-section">
                <h4>Package Specifications</h4>
                {selectedShipment.package ? (
                  <div className="dash-pkg-metrics">
                    <span className="dash-pkg-metric">⚖️ Weight: {selectedShipment.package.weightKg} kg</span>
                    <span className="dash-pkg-metric">📏 Dimensions: {selectedShipment.package.lengthCm}x{selectedShipment.package.widthCm}x{selectedShipment.package.heightCm} cm</span>
                  </div>
                ) : (
                  <p style={{ color: '#64748b' }}>No package details provided.</p>
                )}
              </div>

              <div className="dash-detail-section" style={{ marginBottom: 0 }}>
                <h4>Timeline</h4>
                <div style={{ color: '#475569', fontSize: '0.9rem' }}>
                  <p><strong>Created:</strong> {formatDate(selectedShipment.createdAtUtc)}</p>
                </div>
              </div>

              <div style={{ marginTop: '1.2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                {(!selectedShipment.status || selectedShipment.status.toLowerCase() === 'draft') && (
                  <button
                    className="button"
                    onClick={() => {
                      closeModal();
                      navigate(`/wizard?draftId=${selectedShipment.id}`);
                    }}
                  >
                    Resume Draft
                  </button>
                )}
                  <button
                    className="btn-view-detail"
                    onClick={() => navigate(`/shipments/${selectedShipment.id}`)}
                  >
                    Open Full Details
                  </button>
                </div>
                {selectedShipment.status && selectedShipment.status.toLowerCase() !== 'draft' && (
                  <div style={{ marginTop: '0.75rem', textAlign: 'center' }}>
                    <button
                      onClick={() => handleDownloadInvoice(selectedShipment.id)}
                      className="btn-link"
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        fontSize: '0.85rem',
                        color: '#6366f1',
                        cursor: 'pointer',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem'
                      }}
                    >
                      <span>📄</span> Download Invoice PDF
                    </button>
                  </div>
                )}
              </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
