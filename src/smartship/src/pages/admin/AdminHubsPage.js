import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const AdminHubsPage = () => {
  const [hubs, setHubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: '',
    location: '',
    contactPerson: '',
    phone: '',
    isActive: true
  });
  const [saving, setSaving] = useState(false);

  const seedRouteHubs = async () => {
    const defaults = [
      { name: 'Andhra Pradesh Hub', location: 'Amaravati, Andhra Pradesh, India' },
      { name: 'Arunachal Pradesh Hub', location: 'Itanagar, Arunachal Pradesh, India' },
      { name: 'Assam Hub', location: 'Dispur, Assam, India' },
      { name: 'Bihar Hub', location: 'Patna, Bihar, India' },
      { name: 'Chhattisgarh Hub', location: 'Raipur, Chhattisgarh, India' },
      { name: 'Goa Hub', location: 'Panaji, Goa, India' },
      { name: 'Gujarat Hub', location: 'Gandhinagar, Gujarat, India' },
      { name: 'Haryana Hub', location: 'Chandigarh, Haryana, India' },
      { name: 'Himachal Pradesh Hub', location: 'Shimla, Himachal Pradesh, India' },
      { name: 'Jharkhand Hub', location: 'Ranchi, Jharkhand, India' },
      { name: 'Karnataka Hub', location: 'Bengaluru, Karnataka, India' },
      { name: 'Kerala Hub', location: 'Thiruvananthapuram, Kerala, India' },
      { name: 'Madhya Pradesh Hub', location: 'Bhopal, Madhya Pradesh, India' },
      { name: 'Maharashtra Hub', location: 'Mumbai, Maharashtra, India' },
      { name: 'Manipur Hub', location: 'Imphal, Manipur, India' },
      { name: 'Meghalaya Hub', location: 'Shillong, Meghalaya, India' },
      { name: 'Mizoram Hub', location: 'Aizawl, Mizoram, India' },
      { name: 'Nagaland Hub', location: 'Kohima, Nagaland, India' },
      { name: 'Odisha Hub', location: 'Bhubaneswar, Odisha, India' },
      { name: 'Punjab Hub', location: 'Chandigarh, Punjab, India' },
      { name: 'Rajasthan Hub', location: 'Jaipur, Rajasthan, India' },
      { name: 'Sikkim Hub', location: 'Gangtok, Sikkim, India' },
      { name: 'Tamil Nadu Hub', location: 'Chennai, Tamil Nadu, India' },
      { name: 'Telangana Hub', location: 'Hyderabad, Telangana, India' },
      { name: 'Tripura Hub', location: 'Agartala, Tripura, India' },
      { name: 'Uttar Pradesh Hub', location: 'Lucknow, Uttar Pradesh, India' },
      { name: 'Uttarakhand Hub', location: 'Dehradun, Uttarakhand, India' },
      { name: 'West Bengal Hub', location: 'Kolkata, West Bengal, India' },
      { name: 'Andaman and Nicobar Hub', location: 'Port Blair, Andaman and Nicobar Islands, India' },
      { name: 'Chandigarh Hub', location: 'Chandigarh, India' },
      { name: 'Dadra and Nagar Haveli and Daman and Diu Hub', location: 'Daman, Dadra and Nagar Haveli and Daman and Diu, India' },
      { name: 'Delhi International Gateway', location: 'New Delhi, India' },
      { name: 'Jammu and Kashmir Hub', location: 'Srinagar, Jammu and Kashmir, India' },
      { name: 'Ladakh Hub', location: 'Leh, Ladakh, India' },
      { name: 'Lakshadweep Hub', location: 'Kavaratti, Lakshadweep, India' },
      { name: 'Puducherry Hub', location: 'Puducherry, India' },
      { name: 'Mumbai International Gateway', location: 'Mumbai, Maharashtra, India' },
      { name: 'Chennai International Gateway', location: 'Chennai, Tamil Nadu, India' },
      { name: 'Kolkata International Gateway', location: 'Kolkata, West Bengal, India' },
      { name: 'Bengaluru International Gateway', location: 'Bengaluru, Karnataka, India' },
      { name: 'Hyderabad International Gateway', location: 'Hyderabad, Telangana, India' },
      { name: 'Moscow Capital Hub', location: 'Moscow, Russia' },
      { name: 'Saint Petersburg Hub', location: 'Saint Petersburg, Russia' },
      { name: 'Dubai Gateway Hub', location: 'Dubai, United Arab Emirates' },
      { name: 'Singapore Gateway Hub', location: 'Singapore' },
      { name: 'London Capital Hub', location: 'London, United Kingdom' },
      { name: 'New York Gateway Hub', location: 'New York, United States' },
      { name: 'Toronto Gateway Hub', location: 'Toronto, Canada' },
      { name: 'Sydney Gateway Hub', location: 'Sydney, Australia' },
      { name: 'Tokyo Capital Hub', location: 'Tokyo, Japan' },
      { name: 'Berlin Capital Hub', location: 'Berlin, Germany' },
      { name: 'Paris Capital Hub', location: 'Paris, France' },
    ];

    try {
      setSaving(true);
      const existingNames = new Set(hubs.map((hub) => hub.name.toLowerCase()));
      const toCreate = defaults.filter((hub) => !existingNames.has(hub.name.toLowerCase()));
      await Promise.all(toCreate.map((hub, index) => api.post('/gateway/admin/hubs', {
        ...hub,
        contactPerson: 'Ops Lead',
        phone: `+91 90000${String(index + 1).padStart(5, '0')}`,
        isActive: true,
      })));
      fetchHubs();
      alert(toCreate.length ? 'India and international route hubs added.' : 'Route hubs already exist.');
    } catch (err) {
      console.error(err);
      alert('Failed to add route hubs.');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchHubs();
  }, []);

  const fetchHubs = async () => {
    try {
      setLoading(true);
      const response = await api.get('/gateway/admin/hubs');
      setHubs(response.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to load hubs.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (hub = null) => {
    if (hub) {
      setEditingId(hub.id);
      setForm({
        name: hub.name,
        location: hub.location,
        contactPerson: hub.contactPerson,
        phone: hub.phone,
        isActive: hub.isActive
      });
    } else {
      setEditingId(null);
      setForm({
        name: '',
        location: '',
        contactPerson: '',
        phone: '',
        isActive: true
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!form.name || !form.location) {
      alert('Name and Location are required.');
      return;
    }

    try {
      setSaving(true);
      if (editingId) {
        await api.put(`/gateway/admin/hubs/${editingId}`, form);
      } else {
        await api.post('/gateway/admin/hubs', form);
      }
      handleCloseModal();
      fetchHubs();
    } catch (err) {
      console.error(err);
      alert('Failed to save hub.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this hub?')) return;
    
    try {
      await api.delete(`/gateway/admin/hubs/${id}`);
      fetchHubs();
    } catch (err) {
      console.error(err);
      alert('Failed to delete hub.');
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading hubs...</div>;
  if (error) return <div style={{ padding: '2rem', color: 'red' }}>{error}</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#c7d2fe', marginBottom: '0.4rem', fontSize: '1.25rem' }}>
            Logistics Hubs
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>
            Manage routing centers and service locations.
          </p>
        </div>
        <button className="adm-btn" onClick={() => handleOpenModal()}>
          + Add New Hub
        </button>
        <button className="adm-btn" style={{ background: 'transparent', color: '#34d399' }} onClick={seedRouteHubs} disabled={saving}>
          Add India + Global Hubs
        </button>
      </div>

      <div className="adm-section">
        <table className="adm-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Location</th>
              <th>Contact Person</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {hubs.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  No hubs found. Add one to get started.
                </td>
              </tr>
            ) : (
              hubs.map((hub) => (
                <tr key={hub.id}>
                  <td><strong>{hub.name}</strong></td>
                  <td>{hub.location}</td>
                  <td>{hub.contactPerson || '-'}</td>
                  <td>{hub.phone || '-'}</td>
                  <td>
                    <span className={`adm-status ${hub.isActive ? 'delivered' : 'exception'}`}>
                      {hub.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="adm-btn" style={{ background: 'transparent', color: '#818cf8', padding: '0.25rem 0.5rem' }} onClick={() => handleOpenModal(hub)}>Edit</button>
                      <button className="adm-btn" style={{ background: 'transparent', color: '#ef4444', padding: '0.25rem 0.5rem' }} onClick={() => handleDelete(hub.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="adm-section" style={{ width: '100%', maxWidth: 700, margin: '1rem', position: 'relative' }}>
            <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>{editingId ? 'Edit Hub' : 'Add New Hub'}</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.4rem' }}>Hub Name *</label>
                <input 
                  className="adm-input" 
                  value={form.name} 
                  onChange={(e) => setForm({...form, name: e.target.value})} 
                  placeholder="e.g. North Region Sort Center" 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.4rem' }}>Location *</label>
                <input 
                  className="adm-input" 
                  value={form.location} 
                  onChange={(e) => setForm({...form, location: e.target.value})} 
                  placeholder="e.g. New Delhi, India" 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.4rem' }}>Contact Person</label>
                <input 
                  className="adm-input" 
                  value={form.contactPerson} 
                  onChange={(e) => setForm({...form, contactPerson: e.target.value})} 
                  placeholder="e.g. Jane Doe" 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.4rem' }}>Phone Number</label>
                <input 
                  className="adm-input" 
                  value={form.phone} 
                  onChange={(e) => setForm({...form, phone: e.target.value})} 
                  placeholder="e.g. +91 9876543210" 
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input 
                  type="checkbox" 
                  id="isActive" 
                  checked={form.isActive} 
                  onChange={(e) => setForm({...form, isActive: e.target.checked})} 
                />
                <label htmlFor="isActive" style={{ fontSize: '0.9rem' }}>Active Facility</label>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
              <button className="adm-btn" style={{ background: 'transparent', color: '#94a3b8' }} onClick={handleCloseModal} disabled={saving}>Cancel</button>
              <button className="adm-btn" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Hub'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminHubsPage;
