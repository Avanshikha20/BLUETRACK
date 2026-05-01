import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const ProfilePage = () => {
  const { user } = useAuth();
  
  const [emailNotif, setEmailNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  useEffect(() => {
    if (user?.email) {
      const storedEmailPrefs = localStorage.getItem(`prefs_email_${user.email}`);
      const storedSmsPrefs = localStorage.getItem(`prefs_sms_${user.email}`);
      
      if (storedEmailPrefs !== null) setEmailNotif(storedEmailPrefs === 'true');
      if (storedSmsPrefs !== null) setSmsNotif(storedSmsPrefs === 'true');
    }
  }, [user]);

  const handleSave = () => {
    if (user?.email) {
      localStorage.setItem(`prefs_email_${user.email}`, emailNotif.toString());
      localStorage.setItem(`prefs_sms_${user.email}`, smsNotif.toString());
      setSaveStatus('Preferences saved successfully!');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  return (
    <section>
      <h2>Profile & Settings</h2>
      <div className="card" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'left' }}>
        <h3>User Information</h3>
        <p><strong>Email:</strong> {user?.email || 'N/A'}</p>
        <p><strong>Role:</strong> {user?.role || 'User'}</p>

        <h3 style={{ marginTop: '2rem' }}>Notification Preferences</h3>
        <p className="hint" style={{ marginTop: 0 }}>
          Choose how you want to be notified about your shipments and updates.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}>
            <div style={{
              width: '40px', height: '22px', borderRadius: '11px', 
              background: emailNotif ? '#22c55e' : '#475569',
              position: 'relative', transition: 'background 0.3s'
            }}>
              <div style={{
                width: '18px', height: '18px', borderRadius: '50%', background: '#fff',
                position: 'absolute', top: '2px', left: emailNotif ? '20px' : '2px',
                transition: 'left 0.3s'
              }}/>
            </div>
            <input 
              type="checkbox" 
              style={{ display: 'none' }}
              checked={emailNotif} 
              onChange={() => setEmailNotif(!emailNotif)} 
            />
            <div>
              <div style={{ fontWeight: 'bold' }}>📧 Email Notifications</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Receive shipment status updates via email.</div>
            </div>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}>
            <div style={{
              width: '40px', height: '22px', borderRadius: '11px', 
              background: smsNotif ? '#22c55e' : '#475569',
              position: 'relative', transition: 'background 0.3s'
            }}>
              <div style={{
                width: '18px', height: '18px', borderRadius: '50%', background: '#fff',
                position: 'absolute', top: '2px', left: smsNotif ? '20px' : '2px',
                transition: 'left 0.3s'
              }}/>
            </div>
            <input 
              type="checkbox" 
              style={{ display: 'none' }}
              checked={smsNotif} 
              onChange={() => setSmsNotif(!smsNotif)} 
            />
            <div>
              <div style={{ fontWeight: 'bold' }}>📱 SMS Notifications</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Get urgent delivery alerts directly to your phone.</div>
            </div>
          </label>
        </div>

        <div style={{ marginTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
          <button className="button" onClick={handleSave}>Save Preferences</button>
          {saveStatus && <span style={{ marginLeft: '1rem', color: '#10b981', fontSize: '0.9rem' }}>{saveStatus}</span>}
        </div>
      </div>
    </section>
  );
};

export default ProfilePage;
