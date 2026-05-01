import React, { useEffect, useState } from 'react';
import api from '../services/api';
import StatusModal from '../components/StatusModal';

const AdminPage = () => {
  const [metrics, setMetrics] = useState(null);
  const [shipments, setShipments] = useState([]);
  const [selected, setSelected] = useState(null);
  const [status, setStatus] = useState('Delayed');

  useEffect(() => {
    const load = async () => {
      const [m, s] = await Promise.all([
        api.get('/gateway/admin/dashboard-metrics'),
        api.get('/gateway/shipments/my'),
      ]);
      setMetrics(m.data);
      setShipments(s.data);
    };

    load().catch(() => {
      setMetrics(null);
      setShipments([]);
    });
  }, []);

  const resolveException = async () => {
    if (!selected) {
      return;
    }

    await api.put('/gateway/admin/resolve-exception', {
      shipmentId: selected.id,
      forceStatus: status,
      notes: 'Manual admin override',
    });

    setSelected(null);
  };

  return (
    <section>
      <h2>Admin Portal</h2>
      <div className="metrics">
        <div className="tile">Total Shipments: {metrics?.totalShipments ?? 0}</div>
        <div className="tile">Revenue: ₹{metrics?.revenue ?? 0}</div>
        <div className="tile">Active Exceptions: {metrics?.activeExceptions ?? 0}</div>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Status</th>
            <th>From</th>
            <th>To</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {shipments.map((item) => (
            <tr key={item.id}>
              <td>{item.id.slice(0, 8)}...</td>
              <td>{item.status}</td>
              <td>{item.sender.address}</td>
              <td>{item.receiver.address}</td>
              <td><button className="button tiny" onClick={() => setSelected(item)}>Change Status</button></td>
            </tr>
          ))}
        </tbody>
      </table>

      <StatusModal
        open={Boolean(selected)}
        shipmentId={selected?.id}
        status={status}
        setStatus={setStatus}
        onClose={() => setSelected(null)}
        onSubmit={resolveException}
      />
    </section>
  );
};

export default AdminPage;
