import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AddressAutocomplete from '../components/AddressAutocomplete';
import api from '../services/api';
import { distanceKm as haversineDistanceKm, geocodeAddress } from '../utils/routeGeo';

// ── Distance via OSRM (free, open-source routing, no API key) ─────────────────
const computeOsrmDistance = async (senderLoc, receiverLoc, senderAddress, receiverAddress) => {
  const resolvedSender = senderLoc || await geocodeAddress(senderAddress);
  const resolvedReceiver = receiverLoc || await geocodeAddress(receiverAddress);
  if (!resolvedSender || !resolvedReceiver) return { distance: 0, sender: resolvedSender, receiver: resolvedReceiver };

  try {
    const url =
      `https://router.project-osrm.org/route/v1/driving/${resolvedSender.lng},${resolvedSender.lat};${resolvedReceiver.lng},${resolvedReceiver.lat}?overview=false`;
    const res = await fetch(url);
    const data = await res.json();
    const meters = data?.routes?.[0]?.distance || 0;
    if (meters > 0) {
      return {
        distance: Number((meters / 1000).toFixed(2)),
        sender: resolvedSender,
        receiver: resolvedReceiver,
      };
    }
  } catch {
    // Fall back to straight-line distance below.
  }

  return {
    distance: Number((haversineDistanceKm(resolvedSender, resolvedReceiver) * 1.25).toFixed(2)),
    sender: resolvedSender,
    receiver: resolvedReceiver,
  };
};

const steps = ['Sender', 'Receiver', 'Shipping', 'Package', 'Pickup', 'Documents', 'Pay'];

const loadRazorpayCheckout = () => new Promise((resolve, reject) => {
  if (window.Razorpay) {
    resolve(true);
    return;
  }

  const script = document.createElement('script');
  script.src = 'https://checkout.razorpay.com/v1/checkout.js';
  script.onload = () => resolve(true);
  script.onerror = () => reject(new Error('Unable to load Razorpay Checkout.'));
  document.body.appendChild(script);
});

// ── Pricing matrix ─────────────────────────────────────────────────────────────
const PRICING = {
  Domestic: { Express: { base: 120, perKm: 3.5, perKg: 15 }, Freight: { base: 60, perKm: 1.5, perKg: 8 } },
  International: { Express: { base: 500, perKm: 8.0, perKg: 40 }, Freight: { base: 250, perKm: 4.0, perKg: 20 } },
};

const SHIP_TYPE_INFO = {
  Domestic: { icon: '🏠', label: 'Domestic', hint: 'Within the same country' },
  International: { icon: '🌍', label: 'International', hint: 'Cross-border / overseas' },
};

const SPEED_INFO = {
  Express: { icon: '⚡', label: 'Express Delivery', hint: '1–3 business days, priority handling' },
  Freight: { icon: '🚢', label: 'Freight Shipping', hint: '7–14 business days, cost-effective' },
};

const ShipmentWizardPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const draftIdParam = searchParams.get('draftId');

  const [step, setStep] = useState(0);
  const [senderLoc, setSenderLoc] = useState(null);
  const [receiverLoc, setReceiverLoc] = useState(null);
  const [senderCountry, setSenderCountry] = useState('');
  const [receiverCountry, setReceiverCountry] = useState('');
  const [shipmentId, setShipmentId] = useState(null);
  const [distanceKm, setDistanceKm] = useState(0);
  const [amount, setAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    sender: { name: '', address: '', phone: '' },
    receiver: { name: '', address: '', phone: '' },
    package: { weightKg: 1, lengthCm: 20, widthCm: 20, heightCm: 20, description: '' },
    pickup: { date: '', slot: 'Morning (9 AM - 1 PM)', instructions: '' },
  });
  const [shipType, setShipType] = useState('Domestic');   // Domestic | International
  const [shipSpeed, setShipSpeed] = useState('Express');  // Express  | Freight
  const [autoDetectedType, setAutoDetectedType] = useState(''); // set when both countries known

  // Auto-detect Domestic / International when both addresses have country codes
  useEffect(() => {
    if (senderCountry && receiverCountry) {
      const same = senderCountry.toLowerCase() === receiverCountry.toLowerCase();
      const detected = same ? 'Domestic' : 'International';
      setAutoDetectedType(detected);
      setShipType(detected);
    } else {
      setAutoDetectedType('');
    }
  }, [senderCountry, receiverCountry]);

  // ── Documents state ──
  const [docFiles, setDocFiles] = useState([]);       // files selected for upload
  const [uploadedDocs, setUploadedDocs] = useState([]); // successfully uploaded doc metadata
  const [uploadingDocs, setUploadingDocs] = useState(false);

  useEffect(() => {
    const loadDraft = async () => {
      try {
        if (draftIdParam) {
          const res = await api.get(`/gateway/shipments/${draftIdParam}`);
          populateDraft(res.data);
        } else {
          const res = await api.get('/gateway/shipments/drafts/latest');
          if (res.data && res.data.id) {
            const wantsToResume = window.confirm('You have an unsaved shipment draft. Do you want to resume it?');
            if (wantsToResume) {
              populateDraft(res.data);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load draft:', err);
      }
    };
    loadDraft();
  }, [draftIdParam]);

  const populateDraft = (draft) => {
    setShipmentId(draft.id);
    setForm({
      sender: { name: draft.sender?.name || '', address: draft.sender?.address || '', phone: draft.sender?.phone || '' },
      receiver: { name: draft.receiver?.name || '', address: draft.receiver?.address || '', phone: draft.receiver?.phone || '' },
      package: {
        weightKg: draft.package?.weightKg || 1,
        lengthCm: draft.package?.lengthCm || 20,
        widthCm: draft.package?.widthCm || 20,
        heightCm: draft.package?.heightCm || 20,
        description: draft.package?.description || ''
      },
      pickup: {
        date: draft.pickup?.date ? draft.pickup.date.split('T')[0] : '',
        slot: draft.pickup?.slot || 'Morning (9 AM - 1 PM)',
        instructions: draft.pickup?.instructions || ''
      }
    });
  };

  const saveDraft = async () => {
    setLoading(true);
    try {
      if (shipmentId) {
        await api.put(`/gateway/shipments/${shipmentId}/draft`, form);
        alert('Draft updated successfully.');
      } else {
        const response = await api.post('/gateway/shipments/draft', form);
        setShipmentId(response.data.id);
        alert('Draft saved successfully.');
      }
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      alert('Failed to save draft.');
    } finally {
      setLoading(false);
    }
  };

  const cost = useMemo(() => {
    const p = PRICING[shipType]?.[shipSpeed] || PRICING.Domestic.Freight;
    const distancePart = distanceKm * p.perKm;
    const weightPart = Number(form.package.weightKg || 0) * p.perKg;
    return Number((p.base + distancePart + weightPart).toFixed(2));
  }, [distanceKm, form.package.weightKg, shipType, shipSpeed]);

  const createShipment = async () => {
    setLoading(true);
    try {
      const route = await computeOsrmDistance(senderLoc, receiverLoc, form.sender.address, form.receiver.address);
      setDistanceKm(route.distance);
      if (route.sender) {
        setSenderLoc(route.sender);
        if (route.sender.countryCode) setSenderCountry(route.sender.countryCode);
      }
      if (route.receiver) {
        setReceiverLoc(route.receiver);
        if (route.receiver.countryCode) setReceiverCountry(route.receiver.countryCode);
      }

      let newShipmentId = shipmentId;
      if (!newShipmentId) {
        const response = await api.post('/gateway/shipments', form);
        newShipmentId = response.data.id;
        setShipmentId(newShipmentId);
      } else {
        await api.put(`/gateway/shipments/${newShipmentId}/draft`, form);
      }

      // Go to Documents step (step 5) instead of payment
      setStep(5);
    } finally {
      setLoading(false);
    }
  };

  // ── Document upload helpers ──
  const handleAddFiles = (e) => {
    const newFiles = Array.from(e.target.files || []);
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB limit
    const validFiles = [];
    const errors = [];

    newFiles.forEach(file => {
      if (!allowedTypes.includes(file.type)) {
        errors.push(`"${file.name}" is an unsupported type (PDF/JPG/PNG only).`);
      } else if (file.size > MAX_SIZE) {
        errors.push(`"${file.name}" exceeds the 5MB size limit.`);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      alert("Some files could not be added:\n- " + errors.join('\n- '));
    }

    if (validFiles.length) setDocFiles((prev) => [...prev, ...validFiles]);
    e.target.value = '';
  };

  const removeFile = (index) => {
    setDocFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadAllDocs = async () => {
    if (!shipmentId || docFiles.length === 0) return;
    setUploadingDocs(true);
    const results = [];
    for (const file of docFiles) {
      try {
        const fd = new FormData();
        fd.append('shipmentId', shipmentId);
        fd.append('file', file);
        const res = await api.post('/gateway/tracking/documents/upload', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        results.push(res.data);
      } catch (err) {
        console.error('Upload failed for', file.name, err);
      }
    }
    setUploadedDocs((prev) => [...prev, ...results]);
    setDocFiles([]);
    setUploadingDocs(false);
  };

  const processPayment = async () => {
    if (!shipmentId) {
      alert('Please create the shipment before paying.');
      return;
    }

    setLoading(true);
    try {
      await loadRazorpayCheckout();

      const orderResponse = await api.post('/gateway/payments/orders', {
        shipmentId,
        amount: cost,
      });
      const order = orderResponse.data;
      const orderId = order.orderId || order.OrderId;
      const keyId = order.keyId || order.KeyId;
      const amountInSubunits = order.amountInSubunits || order.AmountInSubunits;
      const currency = order.currency || order.Currency || 'INR';

      const options = {
        key: keyId,
        amount: amountInSubunits,
        currency,
        name: 'SmartShip',
        description: 'Shipment booking payment',
        order_id: orderId,
        prefill: {
          name: form.sender.name,
          contact: form.sender.phone,
        },
        notes: {
          shipmentId,
        },
        handler: async (paymentResponse) => {
          try {
            const verifyResponse = await api.post('/gateway/payments/verify', {
              shipmentId,
              amount: cost,
              razorpayOrderId: paymentResponse.razorpay_order_id,
              razorpayPaymentId: paymentResponse.razorpay_payment_id,
              razorpaySignature: paymentResponse.razorpay_signature,
            });
            setAmount(cost);
            const handleDownload = async () => {
              try {
                const res = await api.get(`/gateway/payments/invoice/${shipmentId}`, { responseType: 'blob' });
                const url = window.URL.createObjectURL(new Blob([res.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `Invoice-${shipmentId}.pdf`);
                document.body.appendChild(link);
                link.click();
                link.parentNode.removeChild(link);
              } catch (err) {
                console.error(err);
                alert('Failed to download invoice.');
              }
            };

            const confirmMsg = verifyResponse.data.message || 'Payment complete. Shipment booked.';
            const wantsToDownload = window.confirm(`${confirmMsg}\n\nWould you like to download your invoice now?`);
            if (wantsToDownload) {
              await handleDownload();
            }
            navigate('/dashboard');
          } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Payment verification failed.');
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
        theme: {
          color: '#6366f1',
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', (response) => {
        console.error('Razorpay payment failed:', response.error);
        alert(response.error?.description || 'Payment failed. Please try again.');
        setLoading(false);
      });
      razorpay.open();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || err.message || 'Payment could not be started.');
      setLoading(false);
    }
  };

  return (
    <section>
      <h2>Shipment Wizard</h2>
      <div className="wizard-steps">
        {steps.map((label, index) => (
          <span key={label} className={index === step ? 'step active' : 'step'}>
            {label}
          </span>
        ))}
      </div>

      {/* ── Step 0 – Sender ── */}
      {step === 0 && (
        <div className="card">
          <h3>Sender Details</h3>
          <input
            className="input"
            placeholder="Full Name"
            value={form.sender.name}
            onChange={(e) => setForm({ ...form, sender: { ...form.sender, name: e.target.value } })}
          />
          <AddressAutocomplete
            value={form.sender.address}
            placeholder="Sender address (type to search…)"
            onChange={(address, location) => {
              setForm({ ...form, sender: { ...form.sender, address } });
              if (location) {
                setSenderLoc(location);
                if (location.countryCode) setSenderCountry(location.countryCode);
              }
            }}
          />
          <input
            className="input"
            placeholder="Phone"
            value={form.sender.phone}
            onChange={(e) => setForm({ ...form, sender: { ...form.sender, phone: e.target.value } })}
          />
          <div className="row gap">
            <button className="button ghost" onClick={saveDraft} disabled={loading}>
              Save as Draft
            </button>
            <button className="button" onClick={() => setStep(1)}>Next →</button>
          </div>
        </div>
      )}

      {/* ── Step 1 – Receiver ── */}
      {step === 1 && (
        <div className="card">
          <h3>Receiver Details</h3>
          <input
            className="input"
            placeholder="Full Name"
            value={form.receiver.name}
            onChange={(e) => setForm({ ...form, receiver: { ...form.receiver, name: e.target.value } })}
          />
          <AddressAutocomplete
            value={form.receiver.address}
            placeholder="Receiver address (type to search…)"
            onChange={(address, location) => {
              setForm({ ...form, receiver: { ...form.receiver, address } });
              if (location) {
                setReceiverLoc(location);
                if (location.countryCode) setReceiverCountry(location.countryCode);
              }
            }}
          />
          <input
            className="input"
            placeholder="Phone"
            value={form.receiver.phone}
            onChange={(e) => setForm({ ...form, receiver: { ...form.receiver, phone: e.target.value } })}
          />
          <div className="row gap">
            <button className="button ghost" onClick={() => setStep(0)}>← Back</button>
            <button className="button ghost" onClick={saveDraft} disabled={loading}>
              Save as Draft
            </button>
            <button className="button" onClick={() => setStep(2)}>Next →</button>
          </div>
        </div>
      )}

      {/* ── Step 2 – Shipping Options ── */}
      {step === 2 && (
        <div className="card">
          <h3>🚀 Shipping Options</h3>
          <p className="hint" style={{ marginTop: 0, marginBottom: '1rem' }}>
            Choose your shipment type and delivery speed. Pricing adjusts automatically.
          </p>

          {/* Auto-detection banner */}
          {autoDetectedType && (
            <div style={{
              background: autoDetectedType === 'International' ? 'rgba(99,102,241,0.08)' : 'rgba(52,211,153,0.08)',
              border: `1px solid ${autoDetectedType === 'International' ? 'rgba(99,102,241,0.3)' : 'rgba(52,211,153,0.3)'}`,
              borderRadius: 8,
              padding: '0.6rem 1rem',
              fontSize: '0.82rem',
              marginBottom: '1rem',
              color: autoDetectedType === 'International' ? '#a5b4fc' : '#34d399',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <span style={{ fontSize: '1rem' }}>{autoDetectedType === 'International' ? '🌍' : '🏠'}</span>
              <span>
                Auto-detected as <strong>{autoDetectedType}</strong> — Sender ({senderCountry.toUpperCase()}) → Receiver ({receiverCountry.toUpperCase()})
              </span>
            </div>
          )}

          {/* Shipment type: Domestic / International */}
          <label style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem', display: 'block' }}>
            Shipment Type
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.2rem' }}>
            {Object.entries(SHIP_TYPE_INFO).map(([key, info]) => (
              <button
                key={key}
                type="button"
                onClick={() => setShipType(key)}
                style={{
                  background: shipType === key ? 'rgba(99,102,241,0.12)' : 'rgba(30,41,59,0.5)',
                  border: shipType === key ? '2px solid #818cf8' : '2px solid rgba(71,85,105,0.3)',
                  borderRadius: 12,
                  padding: '1rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  color: 'inherit',
                }}
              >
                <div style={{ fontSize: '1.4rem', marginBottom: '0.3rem' }}>{info.icon}</div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: shipType === key ? '#a5b4fc' : '#c7d2fe' }}>{info.label}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>{info.hint}</div>
              </button>
            ))}
          </div>

          {/* Delivery speed: Express / Freight */}
          <label style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem', display: 'block' }}>
            Delivery Speed
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.2rem' }}>
            {Object.entries(SPEED_INFO).map(([key, info]) => (
              <button
                key={key}
                type="button"
                onClick={() => setShipSpeed(key)}
                style={{
                  background: shipSpeed === key ? 'rgba(99,102,241,0.12)' : 'rgba(30,41,59,0.5)',
                  border: shipSpeed === key ? '2px solid #818cf8' : '2px solid rgba(71,85,105,0.3)',
                  borderRadius: 12,
                  padding: '1rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  color: 'inherit',
                }}
              >
                <div style={{ fontSize: '1.4rem', marginBottom: '0.3rem' }}>{info.icon}</div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: shipSpeed === key ? '#a5b4fc' : '#c7d2fe' }}>{info.label}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>{info.hint}</div>
              </button>
            ))}
          </div>

          {/* Pricing preview */}
          <div style={{
            background: 'rgba(99,102,241,0.06)',
            border: '1px solid rgba(99,102,241,0.15)',
            borderRadius: 8,
            padding: '0.7rem 1rem',
            fontSize: '0.82rem',
            color: '#94a3b8',
            marginBottom: '0.5rem',
          }}>
            💡 <strong style={{ color: '#a5b4fc' }}>{SHIP_TYPE_INFO[shipType].label} {SPEED_INFO[shipSpeed].label}</strong>
            &nbsp;— Base ₹{PRICING[shipType][shipSpeed].base} + ₹{PRICING[shipType][shipSpeed].perKm}/km + ₹{PRICING[shipType][shipSpeed].perKg}/kg
          </div>

          <div className="row gap">
            <button className="button ghost" onClick={() => setStep(1)}>← Back</button>
            <button className="button" onClick={() => setStep(3)}>Next →</button>
          </div>
        </div>
      )}

      {/* ── Step 3 – Package ── */}
      {step === 3 && (
        <div className="card">
          <h3>Package Details</h3>
          <input
            className="input"
            type="number"
            placeholder="Weight (kg)"
            value={form.package.weightKg}
            onChange={(e) => setForm({ ...form, package: { ...form.package, weightKg: e.target.value } })}
          />
          <input
            className="input"
            type="number"
            placeholder="Length (cm)"
            value={form.package.lengthCm}
            onChange={(e) => setForm({ ...form, package: { ...form.package, lengthCm: e.target.value } })}
          />
          <input
            className="input"
            type="number"
            placeholder="Width (cm)"
            value={form.package.widthCm}
            onChange={(e) => setForm({ ...form, package: { ...form.package, widthCm: e.target.value } })}
          />
          <input
            className="input"
            type="number"
            placeholder="Height (cm)"
            value={form.package.heightCm}
            onChange={(e) => setForm({ ...form, package: { ...form.package, heightCm: e.target.value } })}
          />
          <input
            className="input"
            placeholder="Description"
            value={form.package.description}
            onChange={(e) => setForm({ ...form, package: { ...form.package, description: e.target.value } })}
          />
          <div className="row gap">
            <button className="button ghost" onClick={() => setStep(2)}>← Back</button>
            <button className="button ghost" onClick={saveDraft} disabled={loading}>
              Save as Draft
            </button>
            <button className="button" onClick={() => setStep(4)} disabled={loading}>
              Next →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 4 – Pickup ── */}
      {step === 4 && (
        <div className="card">
          <h3>🚚 Schedule Pickup</h3>
          <p className="hint" style={{ marginTop: 0 }}>
            Select a date and time slot for our agent to pick up your package.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1rem' }}>
            <label style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Pickup Date</label>
            <input
              className="input"
              type="date"
              min={new Date().toISOString().split('T')[0]}
              value={form.pickup.date}
              onChange={(e) => setForm({ ...form, pickup: { ...form.pickup, date: e.target.value } })}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1rem' }}>
            <label style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Time Slot</label>
            <select
              className="input"
              value={form.pickup.slot}
              onChange={(e) => setForm({ ...form, pickup: { ...form.pickup, slot: e.target.value } })}
            >
              <option value="Morning (9 AM - 1 PM)">Morning (9 AM - 1 PM)</option>
              <option value="Afternoon (1 PM - 5 PM)">Afternoon (1 PM - 5 PM)</option>
              <option value="Evening (5 PM - 8 PM)">Evening (5 PM - 8 PM)</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1rem' }}>
            <label style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Special Instructions</label>
            <input
              className="input"
              placeholder="e.g. Call before arriving, leave at reception..."
              value={form.pickup.instructions}
              onChange={(e) => setForm({ ...form, pickup: { ...form.pickup, instructions: e.target.value } })}
            />
          </div>
          <div className="row gap">
            <button className="button ghost" onClick={() => setStep(3)}>← Back</button>
            <button className="button ghost" onClick={saveDraft} disabled={loading}>
              Save as Draft
            </button>
            <button className="button" onClick={createShipment} disabled={loading || !form.pickup.date}>
              {loading ? 'Processing…' : 'Next →'}
            </button>
          </div>
        </div>
      )}

      {/* ── Step 5 – Documents ── */}
      {step === 5 && (
        <div className="card">
          <h3>📎 Attach Documents</h3>
          <p className="hint" style={{ marginTop: 0 }}>
            Upload supporting documents such as invoices, packing slips, customs forms, or shipping labels.
            This step is optional — you can skip it and add documents later.
          </p>

          {/* File picker */}
          <div style={{
            border: '2px dashed rgba(99,102,241,0.3)',
            borderRadius: 10,
            padding: '1.2rem',
            textAlign: 'center',
            marginBottom: '1rem',
            background: 'rgba(99,102,241,0.04)',
          }}>
            <input
              id="doc-file-picker"
              type="file"
              multiple
              accept=".pdf, .jpg, .jpeg, .png"
              className="input"
              style={{ padding: '0.3rem', width: '100%' }}
              onChange={handleAddFiles}
            />
            <p className="hint" style={{ margin: '0.5rem 0 0', fontSize: '0.75rem' }}>
              Select one or more files to attach
            </p>
          </div>

          {/* Queued files list */}
          {docFiles.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <strong style={{ fontSize: '0.82rem' }}>Queued for upload:</strong>
              <ul style={{ margin: '0.4rem 0 0', paddingLeft: '1rem' }}>
                {docFiles.map((f, i) => (
                  <li key={i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    marginBottom: '0.4rem', fontSize: '0.85rem',
                  }}>
                    <span>📄 {f.name} <span className="hint">({(f.size / 1024).toFixed(1)} KB)</span></span>
                    <button
                      className="button ghost"
                      style={{ padding: '0.15rem 0.4rem', fontSize: '0.75rem' }}
                      onClick={() => removeFile(i)}
                    >✕</button>
                  </li>
                ))}
              </ul>
              <button
                className="button"
                style={{ marginTop: '0.5rem' }}
                onClick={uploadAllDocs}
                disabled={uploadingDocs}
              >
                {uploadingDocs ? '⏳ Uploading…' : `📤 Upload ${docFiles.length} file${docFiles.length > 1 ? 's' : ''}`}
              </button>
            </div>
          )}

          {/* Already uploaded */}
          {uploadedDocs.length > 0 && (
            <div style={{
              background: 'rgba(52,211,153,0.06)',
              border: '1px solid rgba(52,211,153,0.25)',
              borderRadius: 8,
              padding: '0.7rem 1rem',
              marginBottom: '1rem',
            }}>
              <strong style={{ fontSize: '0.82rem', color: '#34d399' }}>✅ Uploaded:</strong>
              <ul style={{ margin: '0.3rem 0 0', paddingLeft: '1rem' }}>
                {uploadedDocs.map((doc) => (
                  <li key={doc.id} style={{ fontSize: '0.82rem', marginBottom: '0.25rem' }}>
                    {doc.fileName}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="row gap">
            <button className="button ghost" onClick={() => setStep(4)}>← Back</button>
            <button className="button" onClick={() => setStep(6)}>
              {uploadedDocs.length > 0 || docFiles.length === 0 ? 'Proceed to Payment →' : 'Skip & Pay →'}
            </button>
          </div>
        </div>
      )}

      {/* ── Step 6 – Payment ── */}
      {step === 6 && (
        <div className="card">
          <h3>Payment</h3>
          <p>Type: <strong>{SHIP_TYPE_INFO[shipType].icon} {shipType}</strong> — <strong>{SPEED_INFO[shipSpeed].icon} {shipSpeed}</strong></p>
          <p>Route distance: <strong>{distanceKm} km</strong></p>
          <p>Total cost: <strong>₹{cost}</strong></p>
          <p className="hint">Shipment ID: {shipmentId}</p>
          <button className="button" onClick={processPayment} disabled={loading}>
            {loading ? 'Opening Razorpay...' : 'Pay with Razorpay'}
          </button>
          {amount > 0 && <p className="hint">✅ Paid: ₹{amount}</p>}
        </div>
      )}
    </section>
  );
};

export default ShipmentWizardPage;
