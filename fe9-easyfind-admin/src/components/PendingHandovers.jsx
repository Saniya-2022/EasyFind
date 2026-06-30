import { useState, useEffect } from 'react';
import axios from 'axios';

const PendingHandovers = () => {
  const [handovers, setHandovers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedHandover, setSelectedHandover] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);

  useEffect(() => {
    fetchPendingHandovers();
  }, []);

  const fetchPendingHandovers = async () => {
    try {
      const token = localStorage.getItem('adminAuthToken');
      const response = await axios.get('http://localhost:3115/api/qr/pending-handovers', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setHandovers(response.data.handovers || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching handovers:', err);
      setError('Failed to load pending handovers');
      setLoading(false);
    }
  };

  const handleViewQR = (handover) => {
    setSelectedHandover(handover);
    setShowQRModal(true);
  };

  const handleScanQR = (handover) => {
    // Navigate to QR scanner with this handover's token
    window.location.href = `/admin/scan-qr?token=${handover.token}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeRemaining = (expiryTime) => {
    const now = new Date();
    const expiry = new Date(expiryTime);
    const diff = expiry - now;

    if (diff < 0) return 'Expired';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    }
    return `${minutes}m remaining`;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div style={{ fontSize: '18px', color: '#666' }}>Loading pending handovers...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div style={{ fontSize: '18px', color: '#dc2626' }}>{error}</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
          Pending Handovers
        </h1>
        <p style={{ color: '#6b7280' }}>
          Manage approved claims and scan QR codes for item pickup
        </p>
      </div>

      {handovers.length === 0 ? (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '48px',
          textAlign: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>📦</div>
          <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
            No Pending Handovers
          </h3>
          <p style={{ color: '#6b7280' }}>
            All claims have been processed. New handovers will appear here.
          </p>
        </div>
      ) : (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
              <tr>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                  Item Details
                </th>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                  Claimant Info
                </th>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                  QR Status
                </th>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                  Expiry
                </th>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody style={{ divideY: 'divide-gray-200' }}>
              {handovers.map((handover) => (
                <tr key={handover._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '16px 24px' }}>
                    <div>
                      <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>
                        {handover.claimId?.itemName || 'Unknown Item'}
                      </div>
                      <div style={{ fontSize: '14px', color: '#6b7280' }}>
                        {handover.claimId?.category}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        backgroundColor: '#f3f4f6',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        marginTop: '4px',
                        display: 'inline-block'
                      }}>
                        Code: {handover.claimId?.code}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div>
                      <div style={{ fontWeight: '500', color: '#1f2937', marginBottom: '4px' }}>
                        {handover.claimId?.claimerDetails?.name || 'N/A'}
                      </div>
                      <div style={{ fontSize: '14px', color: '#6b7280' }}>
                        {handover.claimId?.claimerDetails?.rollNo || 'N/A'}
                      </div>
                      <div style={{ fontSize: '14px', color: '#6b7280' }}>
                        {handover.claimId?.claimerDetails?.contact || 'N/A'}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      borderRadius: '9999px',
                      fontSize: '14px',
                      fontWeight: '500',
                      backgroundColor: '#d1fae5',
                      color: '#065f46',
                      border: '1px solid #6ee7b7'
                    }}>
                      ACTIVE
                    </span>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div>
                      <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                        {formatDate(handover.expiryTime)}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        fontWeight: '500',
                        color: handover.expiryTime && getTimeRemaining(handover.expiryTime).includes('m remaining')
                          ? '#f59e0b'
                          : '#dc2626'
                      }}>
                        {getTimeRemaining(handover.expiryTime)}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleViewQR(handover)}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        👁️ View QR
                      </button>
                      <button
                        onClick={() => handleScanQR(handover)}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        📷 Scan QR
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && selectedHandover && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
                QR Code Details
              </h2>
              <button
                onClick={() => setShowQRModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <img
                src={`http://localhost:3115/api/qr/${selectedHandover._id}/image`}
                alt="QR Code"
                style={{
                  width: '250px',
                  height: '250px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '8px'
                }}
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/250?text=QR+Not+Available';
                }}
              />
            </div>

            <div style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
              <div style={{ marginBottom: '8px' }}>
                <span style={{ fontWeight: '600', color: '#374151' }}>Item: </span>
                <span style={{ color: '#1f2937' }}>{selectedHandover.claimId?.itemName}</span>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <span style={{ fontWeight: '600', color: '#374151' }}>Code: </span>
                <span style={{ fontFamily: 'monospace', color: '#2563eb' }}>{selectedHandover.claimId?.code}</span>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <span style={{ fontWeight: '600', color: '#374151' }}>Claimant: </span>
                <span style={{ color: '#1f2937' }}>{selectedHandover.claimId?.claimerDetails?.name}</span>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <span style={{ fontWeight: '600', color: '#374151' }}>Contact: </span>
                <span style={{ color: '#1f2937' }}>{selectedHandover.claimId?.claimerDetails?.contact}</span>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <span style={{ fontWeight: '600', color: '#374151' }}>Expires: </span>
                <span style={{ color: '#f59e0b' }}>{formatDate(selectedHandover.expiryTime)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowQRModal(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowQRModal(false);
                  handleScanQR(selectedHandover);
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                📷 Scan Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingHandovers;