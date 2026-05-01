import React from 'react';

const StatusModal = ({ open, onClose, onSubmit, shipmentId, status, setStatus }) => {
  if (!open) {
    return null;
  }

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <h3>Force Update Shipment</h3>
        <p>Shipment: {shipmentId}</p>
        <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="Booked">Booked</option>
          <option value="InTransit">InTransit</option>
          <option value="Delayed">Delayed</option>
          <option value="Delivered">Delivered</option>
        </select>
        <div className="row gap">
          <button className="button ghost" onClick={onClose}>Cancel</button>
          <button className="button" onClick={onSubmit}>Apply</button>
        </div>
      </div>
    </div>
  );
};

export default StatusModal;
